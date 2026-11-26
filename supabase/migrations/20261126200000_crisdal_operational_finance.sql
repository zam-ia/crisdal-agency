-- Internal operational ledger, NOT an electronic invoicing or tax reporting system.
-- Requires crisdal_os_identity. Never apply to production without isolated replay.
begin;
create table public.crisdal_finance_accounts (
 id uuid primary key default gen_random_uuid(),
 title text not null check (char_length(trim(title)) between 1 and 160),
 customer text not null check (char_length(trim(customer)) between 1 and 160),
 event_date date,
 contracted_on date not null,
 currency text not null check (currency in ('PEN','USD')),
 total_minor bigint not null check (total_minor between 1 and 1000000000000),
 reference text check (char_length(reference)<=160),
 created_by uuid not null references public.crisdal_os_users(id),
 created_at timestamptz not null default now()
);
create table public.crisdal_finance_movements (
 id uuid primary key default gen_random_uuid(),
 account_id uuid references public.crisdal_finance_accounts(id) on delete restrict,
 kind text not null check (kind in ('receipt','refund','expense')),
 currency text not null check (currency in ('PEN','USD')),
 amount_minor bigint not null check (amount_minor between 1 and 1000000000000),
 occurred_on date not null,
 method text not null check (method in ('cash','transfer','yape','plin','card','other')),
 expense_class text check (expense_class in ('direct','fixed','other')),
 description text not null check (char_length(trim(description)) between 1 and 240),
 reference text check (char_length(reference)<=160),
 status text not null default 'posted' check (status in ('posted','voided')),
 void_reason text check (char_length(void_reason) between 3 and 240),
 created_by uuid not null references public.crisdal_os_users(id),
 created_at timestamptz not null default now(),
 constraint finance_movement_shape check (
   (kind in ('receipt','refund') and account_id is not null and expense_class is null)
   or (kind='expense' and expense_class is not null and
       ((expense_class='direct' and account_id is not null) or
        (expense_class<>'direct' and account_id is null)))
 ),
 check ((status='voided')=(void_reason is not null))
);
create table public.crisdal_finance_vouchers (
 id uuid primary key default gen_random_uuid(),
 account_id uuid references public.crisdal_finance_accounts(id) on delete restrict,
 receipt_id uuid references public.crisdal_finance_movements(id) on delete restrict,
 issuer_ruc text not null check (issuer_ruc ~ '^[0-9]{11}$'),
 series text not null check (series ~ '^[A-Z0-9]{4}$'),
 number text not null check (number ~ '^[1-9][0-9]{0,7}$'),
 issued_on date not null,
 currency text not null check (currency in ('PEN','USD')),
 total_minor bigint not null check (total_minor between 1 and 1000000000000),
 igv_minor bigint check (igv_minor between 0 and total_minor),
 discount_minor bigint check (discount_minor between 0 and 1000000000000),
 source_kind text not null default 'manual_reference' check (source_kind in ('sunat_original','commercial_summary','manual_reference')),
 items jsonb not null default '[]'::jsonb check (jsonb_typeof(items)='array' and jsonb_array_length(items)<=20),
 customer text not null default '' check (char_length(customer)<=160),
 document_type text check (document_type in ('DNI','RUC','CE','PASSPORT','OTHER')),
 document_number text check (char_length(document_number) between 1 and 30),
 description text not null check (char_length(trim(description)) between 1 and 240),
 status text not null default 'recorded' check (status in ('recorded','corrected','external_void')),
 correction_reason text check (char_length(correction_reason) between 3 and 240),
 created_by uuid not null references public.crisdal_os_users(id),
 created_at timestamptz not null default now(),
 unique(issuer_ruc,series,number),
 check ((document_type is null)=(document_number is null)),
 check (receipt_id is null or account_id is not null),
 check (status='recorded' or correction_reason is not null)
);
create table public.crisdal_finance_requests (
 request_id uuid primary key,
 actor_id uuid not null references public.crisdal_os_users(id),
 action text not null,
 payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
 result_id uuid,
 created_at timestamptz not null default now()
);
create index finance_movements_account_idx on public.crisdal_finance_movements(account_id,status,kind);
create index finance_movements_period_idx on public.crisdal_finance_movements(currency,occurred_on);
create index finance_vouchers_period_idx on public.crisdal_finance_vouchers(currency,issued_on);
create index finance_accounts_currency_idx on public.crisdal_finance_accounts(currency,contracted_on);
alter table public.crisdal_finance_accounts enable row level security;
alter table public.crisdal_finance_movements enable row level security;
alter table public.crisdal_finance_vouchers enable row level security;
alter table public.crisdal_finance_requests enable row level security;
revoke all on public.crisdal_finance_accounts, public.crisdal_finance_movements, public.crisdal_finance_vouchers, public.crisdal_finance_requests from anon,authenticated;
grant select,insert,update on public.crisdal_finance_accounts, public.crisdal_finance_movements, public.crisdal_finance_vouchers, public.crisdal_finance_requests to service_role;

-- Server-only, invoker RPC. All writes, idempotency and audit are atomic.
create function public.crisdal_finance_write(p_actor uuid,p_request uuid,p_action text,p_payload jsonb,p_ip_hash text)
returns uuid language plpgsql security invoker set search_path=pg_catalog,public as $$
declare
 a public.crisdal_finance_accounts%rowtype;
 m public.crisdal_finance_movements%rowtype;
 v public.crisdal_finance_vouchers%rowtype;
 prior public.crisdal_finance_requests%rowtype;
 account_id_value uuid;
 result_value uuid;
 movement_id_value uuid;
 amount_value bigint;
 net_value numeric;
 receipt_sum numeric;
 refund_sum numeric;
 currency_value text;
 day_value date;
 today_value date := (now() at time zone 'America/Lima')::date;
 reason_value text;
 before_value jsonb := '{}'::jsonb;
 voucher_items jsonb;
 voucher_item jsonb;
begin
 if not exists(select 1 from public.crisdal_os_users u join public.crisdal_os_role_capabilities rc on rc.role_code=u.role_code where u.id=p_actor and u.active and rc.capability_code='finance.write') then raise exception 'FINANCE_FORBIDDEN'; end if;
 if p_action not in ('account','adjust_account','movement','void_movement','voucher','correct_voucher','external_void_voucher') then raise exception 'FINANCE_ACTION'; end if;
 if p_ip_hash !~ '^[a-f0-9]{64}$' then raise exception 'FINANCE_AUDIT'; end if;
 insert into public.crisdal_finance_requests(request_id,actor_id,action,payload_hash) values(p_request,p_actor,p_action,encode(sha256(convert_to(p_payload::text,'UTF8')),'hex')) on conflict do nothing;
 select * into strict prior from public.crisdal_finance_requests where request_id=p_request for update;
 if prior.actor_id<>p_actor or prior.action<>p_action or prior.payload_hash<>encode(sha256(convert_to(p_payload::text,'UTF8')),'hex') then raise exception 'FINANCE_IDEMPOTENCY'; end if;
 if prior.result_id is not null then return prior.result_id; end if;
 account_id_value := nullif(p_payload->>'accountId','')::uuid;
 currency_value := p_payload->>'currency';
 amount_value := nullif(p_payload->>'amountMinor','')::bigint;
 reason_value := nullif(trim(p_payload->>'reason'),'');
 if p_action='account' then
   day_value := (p_payload->>'date')::date;
   if day_value>today_value then raise exception 'FINANCE_FUTURE'; end if;
   insert into public.crisdal_finance_accounts(title,customer,event_date,contracted_on,currency,total_minor,reference,created_by)
   values(trim(p_payload->>'title'),trim(p_payload->>'customer'),nullif(p_payload->>'eventDate','')::date,day_value,currency_value,amount_value,nullif(p_payload->>'reference',''),p_actor) returning id into result_value;
 elsif p_action='adjust_account' then
   select * into strict a from public.crisdal_finance_accounts where id=account_id_value for update;
   select coalesce(sum(case when kind='receipt' then amount_minor when kind='refund' then -amount_minor else 0 end),0) into net_value from public.crisdal_finance_movements where account_id=a.id and status='posted';
   if reason_value is null or char_length(reason_value)<3 or amount_value<net_value then raise exception 'FINANCE_BALANCE'; end if;
   before_value:=jsonb_build_object('previous_total_minor',a.total_minor,'reason',reason_value);
   update public.crisdal_finance_accounts set total_minor=amount_value where id=a.id returning id into result_value;
 elsif p_action in ('movement','void_movement') then
   if p_action='void_movement' then
     movement_id_value:=(p_payload->>'id')::uuid;
     select * into strict m from public.crisdal_finance_movements where id=movement_id_value;
     account_id_value:=m.account_id;
   end if;
   if account_id_value is not null then
     select * into strict a from public.crisdal_finance_accounts where id=account_id_value for update;
   end if;
   if p_action='movement' then
     day_value:=(p_payload->>'date')::date;
     if day_value>today_value then raise exception 'FINANCE_FUTURE'; end if;
     if account_id_value is not null and a.currency<>currency_value then raise exception 'FINANCE_CURRENCY'; end if;
     if p_payload->>'kind' in ('receipt','refund') then
       if account_id_value is null then raise exception 'FINANCE_ACCOUNT_REQUIRED'; end if;
       select coalesce(sum(amount_minor) filter(where kind='receipt'),0),coalesce(sum(amount_minor) filter(where kind='refund'),0)
       into receipt_sum,refund_sum from public.crisdal_finance_movements where account_id=a.id and status='posted';
       net_value:=receipt_sum-refund_sum+case when p_payload->>'kind'='receipt' then amount_value else -amount_value end;
       if net_value<0 or net_value>a.total_minor then raise exception 'FINANCE_BALANCE'; end if;
     end if;
     insert into public.crisdal_finance_movements(account_id,kind,currency,amount_minor,occurred_on,method,expense_class,description,reference,created_by)
     values(account_id_value,p_payload->>'kind',currency_value,amount_value,day_value,p_payload->>'method',nullif(p_payload->>'expenseClass',''),trim(p_payload->>'description'),nullif(p_payload->>'reference',''),p_actor) returning id into result_value;
   else
     select * into strict m from public.crisdal_finance_movements where id=movement_id_value for update;
     if m.status<>'posted' or reason_value is null or char_length(reason_value)<3 then raise exception 'FINANCE_VOID'; end if;
     if m.kind in ('receipt','refund') then
       select coalesce(sum(case when kind='receipt' then amount_minor when kind='refund' then -amount_minor else 0 end),0) into net_value
       from public.crisdal_finance_movements where account_id=m.account_id and status='posted' and id<>m.id;
       if net_value<0 or net_value>a.total_minor then raise exception 'FINANCE_BALANCE'; end if;
     end if;
     update public.crisdal_finance_movements set status='voided',void_reason=reason_value where id=m.id returning id into result_value;
     before_value:=jsonb_build_object('reason',reason_value);
   end if;
 elsif p_action in ('voucher','correct_voucher') then
   day_value:=(p_payload->>'date')::date;
   if day_value>today_value then raise exception 'FINANCE_FUTURE'; end if;
   if account_id_value is not null then
     select * into strict a from public.crisdal_finance_accounts where id=account_id_value for update;
     if a.currency<>currency_value then raise exception 'FINANCE_CURRENCY'; end if;
   end if;
   movement_id_value:=nullif(p_payload->>'receiptId','')::uuid;
   if movement_id_value is not null then
     select * into strict m from public.crisdal_finance_movements where id=movement_id_value;
     if m.kind<>'receipt' or m.status<>'posted' or m.account_id is distinct from account_id_value or m.currency<>currency_value then raise exception 'FINANCE_VOUCHER_LINK'; end if;
   end if;
   voucher_items:=coalesce(p_payload->'items','[]'::jsonb);
   if jsonb_typeof(voucher_items)<>'array' then raise exception 'FINANCE_VOUCHER_DETAIL'; end if;
   if jsonb_array_length(voucher_items)>20 then raise exception 'FINANCE_VOUCHER_DETAIL'; end if;
   for voucher_item in select value from jsonb_array_elements(voucher_items) loop
     if jsonb_typeof(voucher_item)<>'object' or coalesce(jsonb_typeof(voucher_item->'quantity'),'')<>'number'
       or coalesce(jsonb_typeof(voucher_item->'unitMinor'),'')<>'number' or coalesce(jsonb_typeof(voucher_item->'lineMinor'),'')<>'number'
       or coalesce(jsonb_typeof(voucher_item->'description'),'')<>'string'
       or coalesce(voucher_item->>'quantity','') !~ '^[1-9][0-9]{0,4}$'
       or (voucher_item->>'quantity')::numeric>10000
       or char_length(trim(voucher_item->>'description')) not between 1 and 240
       or coalesce(voucher_item->>'unitMinor','') !~ '^[0-9]{1,13}$'
       or coalesce(voucher_item->>'lineMinor','') !~ '^[0-9]{1,13}$'
       or (voucher_item->>'unitMinor')::numeric>1000000000000
       or (voucher_item->>'lineMinor')::numeric>1000000000000 then raise exception 'FINANCE_VOUCHER_DETAIL'; end if;
   end loop;
   if p_action='voucher' then
     insert into public.crisdal_finance_vouchers(account_id,receipt_id,issuer_ruc,series,number,issued_on,currency,total_minor,igv_minor,discount_minor,source_kind,items,customer,document_type,document_number,description,created_by)
     values(account_id_value,movement_id_value,p_payload->>'issuerRuc',p_payload->>'series',p_payload->>'number',day_value,currency_value,amount_value,nullif(p_payload->>'igvMinor','')::bigint,nullif(p_payload->>'discountMinor','')::bigint,coalesce(p_payload->>'sourceKind','manual_reference'),voucher_items,coalesce(p_payload->>'customer',''),nullif(p_payload->>'documentType',''),nullif(p_payload->>'documentNumber',''),trim(p_payload->>'description'),p_actor) returning id into result_value;
   else
     select * into strict v from public.crisdal_finance_vouchers where id=(p_payload->>'id')::uuid for update;
     if v.status='external_void' or reason_value is null or char_length(reason_value)<3 then raise exception 'FINANCE_VOUCHER_CORRECTION'; end if;
     before_value:=jsonb_build_object('previous_series',v.series,'previous_number',v.number,'previous_total_minor',v.total_minor,'previous_issued_on',v.issued_on,'reason',reason_value);
     update public.crisdal_finance_vouchers set account_id=account_id_value,receipt_id=movement_id_value,issuer_ruc=p_payload->>'issuerRuc',series=p_payload->>'series',number=p_payload->>'number',issued_on=day_value,currency=currency_value,total_minor=amount_value,igv_minor=nullif(p_payload->>'igvMinor','')::bigint,discount_minor=nullif(p_payload->>'discountMinor','')::bigint,source_kind=coalesce(p_payload->>'sourceKind','manual_reference'),items=voucher_items,customer=coalesce(p_payload->>'customer',''),document_type=nullif(p_payload->>'documentType',''),document_number=nullif(p_payload->>'documentNumber',''),description=trim(p_payload->>'description'),status='corrected',correction_reason=reason_value where id=v.id returning id into result_value;
   end if;
 else
   if reason_value is null or char_length(reason_value)<3 then raise exception 'FINANCE_VOID'; end if;
   update public.crisdal_finance_vouchers set status='external_void',correction_reason=reason_value where id=(p_payload->>'id')::uuid and status<>'external_void' returning id into result_value;
   if result_value is null then raise exception 'FINANCE_VOID'; end if;
   before_value:=jsonb_build_object('external_reference',reason_value);
 end if;
 insert into public.crisdal_os_audit_events(actor_user_id,action,entity_type,entity_id,request_id,ip_hash,metadata)
 values(p_actor,'finance.'||p_action,'finance',result_value::text,p_request,p_ip_hash,before_value);
 -- Keep a canonical payload digest for safe retry without duplicating personal data.
 update public.crisdal_finance_requests set result_id=result_value where request_id=p_request;
 return result_value;
end; $$;
revoke all on function public.crisdal_finance_write(uuid,uuid,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.crisdal_finance_write(uuid,uuid,text,jsonb,text) to service_role;

create function public.crisdal_finance_snapshot(p_actor uuid,p_currency text,p_month date,p_account_offset integer default 0,p_movement_offset integer default 0,p_voucher_offset integer default 0)
returns jsonb language plpgsql stable security invoker set search_path=pg_catalog,public as $$
declare result_value jsonb;
begin
 if not exists(select 1 from public.crisdal_os_users u join public.crisdal_os_role_capabilities rc on rc.role_code=u.role_code where u.id=p_actor and u.active and rc.capability_code='finance.read') then raise exception 'FINANCE_FORBIDDEN'; end if;
 if p_currency not in ('PEN','USD') or extract(day from p_month)<>1 or least(p_account_offset,p_movement_offset,p_voucher_offset)<0 then raise exception 'FINANCE_FILTER'; end if;
 with periods as (
   select generate_series(p_month-interval '5 months',p_month,interval '1 month')::date as month_start
 ), cash as (
   select date_trunc('month',occurred_on::timestamp)::date as month_start,
   coalesce(sum(amount_minor) filter(where kind='receipt'),0) as received_minor,
   coalesce(sum(amount_minor) filter(where kind='refund'),0) as refunded_minor,
   coalesce(sum(amount_minor) filter(where kind='expense'),0) as expenses_minor,
   coalesce(sum(amount_minor) filter(where kind='expense' and expense_class='fixed'),0) as fixed_minor,
   coalesce(sum(amount_minor) filter(where kind='expense' and expense_class='direct'),0) as direct_minor,
   coalesce(sum(amount_minor) filter(where kind='expense' and expense_class='other'),0) as other_minor
   from public.crisdal_finance_movements where status='posted' and currency=p_currency and occurred_on>=p_month-interval '5 months' and occurred_on<p_month+interval '1 month' group by 1
 ), docs as (
   select date_trunc('month',issued_on::timestamp)::date as month_start,sum(total_minor) as documented_minor,count(*) as voucher_count
   from public.crisdal_finance_vouchers where status<>'external_void' and currency=p_currency and issued_on>=p_month-interval '5 months' and issued_on<p_month+interval '1 month' group by 1
 ), trend as (
   select to_char(p.month_start,'YYYY-MM') as month,
   coalesce(c.received_minor,0) received_minor,coalesce(c.refunded_minor,0) refunded_minor,coalesce(c.expenses_minor,0) expenses_minor,
   coalesce(c.fixed_minor,0) fixed_minor,coalesce(c.direct_minor,0) direct_minor,coalesce(c.other_minor,0) other_minor,
   coalesce(d.documented_minor,0) documented_minor,coalesce(d.voucher_count,0) voucher_count
   from periods p left join cash c using(month_start) left join docs d using(month_start)
 ), sums as (
   select account_id,coalesce(sum(amount_minor) filter(where kind='receipt'),0) received_minor,
   coalesce(sum(amount_minor) filter(where kind='refund'),0) refunded_minor,
   coalesce(sum(amount_minor) filter(where kind='expense' and expense_class='direct'),0) direct_cost_minor
   from public.crisdal_finance_movements where currency=p_currency and status='posted' and account_id is not null group by account_id
 ), balances as (
   select a.id,a.title,a.customer,a.event_date,a.contracted_on,a.currency,a.total_minor,a.reference,
   coalesce(s.received_minor,0) received_minor,coalesce(s.refunded_minor,0) refunded_minor,
   a.total_minor-coalesce(s.received_minor,0)+coalesce(s.refunded_minor,0) pending_minor,coalesce(s.direct_cost_minor,0) direct_cost_minor
   from public.crisdal_finance_accounts a left join sums s on s.account_id=a.id where a.currency=p_currency
 ), month_movements as (
   select id,account_id,kind,currency,amount_minor,occurred_on,method,expense_class,description,reference,status,void_reason
   from public.crisdal_finance_movements where currency=p_currency and occurred_on>=p_month and occurred_on<p_month+interval '1 month'
 ), month_vouchers as (
   select id,account_id,receipt_id,issuer_ruc,series,number,issued_on,currency,total_minor,igv_minor,discount_minor,source_kind,items,customer,document_type,document_number,description,status,correction_reason
   from public.crisdal_finance_vouchers where currency=p_currency and issued_on>=p_month and issued_on<p_month+interval '1 month'
 )
 select jsonb_build_object('currency',p_currency,'month',to_char(p_month,'YYYY-MM'),
   'totals',(select to_jsonb(t) from trend t where t.month=to_char(p_month,'YYYY-MM')),
   'trend',(select jsonb_agg(to_jsonb(t) order by t.month) from trend t),
   'open_balance_minor',(select coalesce(sum(pending_minor),0) from balances),
   'accounts_count',(select count(*) from balances),'movements_count',(select count(*) from month_movements),'vouchers_count',(select count(*) from month_vouchers),
   'accounts',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select * from balances order by (pending_minor>0) desc, contracted_on desc,id limit 50 offset p_account_offset)x),
   'movements',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select * from month_movements order by occurred_on desc,id limit 50 offset p_movement_offset)x),
   'vouchers',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select * from month_vouchers order by issued_on desc,id limit 50 offset p_voucher_offset)x)
 ) into result_value;
 return result_value;
end; $$;
revoke all on function public.crisdal_finance_snapshot(uuid,text,date,integer,integer,integer) from public,anon,authenticated;
grant execute on function public.crisdal_finance_snapshot(uuid,text,date,integer,integer,integer) to service_role;
commit;
