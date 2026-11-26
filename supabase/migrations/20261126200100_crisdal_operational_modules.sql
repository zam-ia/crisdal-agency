-- Requires identity, public inquiries, private deliveries and operational finance.
-- CLI-generated version ordered after the existing 20261126200000 finance migration.
-- Production rollout requires reconciliation and rehearsal against a restored backup.
begin;
-- Preserve the legacy CMS server access on databases without default Data API grants.
grant select,insert on public.landing_content_versions to service_role;
grant usage on sequence public.landing_content_versions_id_seq to service_role;

create table public.crisdal_clients (
 id uuid primary key, name text not null check(length(trim(name)) between 2 and 180),
 phone text not null unique check(phone ~ '^[0-9]{7,15}$'),
 email text not null default '' check(length(email)<=180),
 stage text not null default 'new' check(stage in ('new','contacted','negotiating','active','closed')),
 next_action text not null default '' check(length(next_action)<=240),
 next_action_on date, notes text not null default '' check(length(notes)<=2000),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.crisdal_client_inquiries (
 inquiry_id uuid primary key references public.crisdal_public_date_inquiries(id) on delete restrict,
 client_id uuid not null references public.crisdal_clients(id) on delete restrict
);
create table public.crisdal_quotes (
 id uuid primary key, client_id uuid not null references public.crisdal_clients(id) on delete restrict,
 title text not null check(length(trim(title)) between 2 and 180), event_on date,
 currency text not null check(currency in ('PEN','USD')),
 lines jsonb not null check(jsonb_typeof(lines)='array' and jsonb_array_length(lines) between 1 and 30),
 pricing jsonb not null check(jsonb_typeof(pricing)='object'),
 total_minor bigint not null check(total_minor between 1 and 1000000000000),
 terms text not null check(length(terms) between 1 and 2000),
 expires_on date not null, status text not null default 'draft' check(status in ('draft','sent','accepted','rejected')),
 acceptance_reference text check(length(acceptance_reference) between 3 and 240),
 accepted_at timestamptz, created_at timestamptz not null default now(),
 revision integer not null default 1 check(revision>0),
 check ((status='accepted')=(accepted_at is not null and acceptance_reference is not null))
);
-- Accepted quote is the canonical contract. One receivable and one production project.
alter table public.crisdal_finance_accounts add column quote_id uuid unique references public.crisdal_quotes(id) on delete restrict;
create function public.crisdal_guard_quote_account() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if old.quote_id is not null and
    row(new.quote_id,new.currency,new.total_minor) is distinct from row(old.quote_id,old.currency,old.total_minor)
 then raise exception 'FINANCE_QUOTE_LOCKED'; end if;
 return new;
end $$;
revoke all on function public.crisdal_guard_quote_account() from public,anon,authenticated;
create trigger crisdal_quote_account_immutable before update of quote_id,currency,total_minor
on public.crisdal_finance_accounts for each row execute function public.crisdal_guard_quote_account();

create table public.crisdal_quote_revisions (
 quote_id uuid not null references public.crisdal_quotes(id) on delete restrict,
 revision integer not null check(revision>0),
 snapshot jsonb not null check(jsonb_typeof(snapshot)='object'),
 replaced_by uuid not null references public.crisdal_os_users(id) on delete restrict,
 replaced_at timestamptz not null default now(),
 primary key (quote_id,revision)
);
create index on public.crisdal_quote_revisions(replaced_by);
alter table public.crisdal_quote_revisions enable row level security;
revoke all on public.crisdal_quote_revisions from public,anon,authenticated;
grant select,insert on public.crisdal_quote_revisions to service_role;
create table public.crisdal_production_projects (
 id uuid primary key default gen_random_uuid(), quote_id uuid not null unique references public.crisdal_quotes(id) on delete restrict,
 client_id uuid not null references public.crisdal_clients(id) on delete restrict,
 title text not null check(length(title) between 2 and 180), event_on date,
 due_on date, lead_user_id uuid references public.crisdal_os_users(id) on delete restrict,
 stage text not null default 'planning' check(stage in ('planning','coverage','editing','review','ready','delivered')),
 notes text not null default '' check(length(notes)<=2000),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.crisdal_client_galleries add column project_id uuid references public.crisdal_production_projects(id) on delete restrict;
create index on public.crisdal_client_galleries(project_id);
create function public.crisdal_delivery_project_guard() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if old.status='published' and new.project_id is distinct from old.project_id then raise exception 'OPS_GALLERY_REVOKE_FIRST'; end if;
 return new;
end $$;
revoke all on function public.crisdal_delivery_project_guard() from public,anon,authenticated;
create trigger crisdal_delivery_project_guard before update of project_id on public.crisdal_client_galleries
for each row execute function public.crisdal_delivery_project_guard();
create table public.crisdal_production_tasks (
 id uuid primary key, project_id uuid not null references public.crisdal_production_projects(id) on delete restrict,
 title text not null check(length(trim(title)) between 2 and 180), due_on date,
 assigned_to uuid references public.crisdal_os_users(id) on delete restrict,
 done boolean not null default false, created_at timestamptz not null default now()
);
create index on public.crisdal_clients(stage,next_action_on);
create index on public.crisdal_client_inquiries(client_id,inquiry_id);
create index on public.crisdal_quotes(client_id,created_at desc);
create index on public.crisdal_production_projects(stage,due_on);
create index on public.crisdal_production_projects(client_id);
create index on public.crisdal_production_projects(lead_user_id);
create index on public.crisdal_production_tasks(project_id,done);
create index on public.crisdal_production_tasks(assigned_to);
alter table public.crisdal_clients enable row level security;
alter table public.crisdal_client_inquiries enable row level security;
alter table public.crisdal_quotes enable row level security;
alter table public.crisdal_production_projects enable row level security;
alter table public.crisdal_production_tasks enable row level security;
revoke all on public.crisdal_clients,public.crisdal_client_inquiries,public.crisdal_quotes,public.crisdal_production_projects,public.crisdal_production_tasks from public,anon,authenticated;
grant select,insert,update on public.crisdal_clients,public.crisdal_client_inquiries,public.crisdal_quotes,public.crisdal_production_projects,public.crisdal_production_tasks to service_role;

create function public.crisdal_ops_can(p_actor uuid,p_cap text) returns boolean
language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.crisdal_os_users u join public.crisdal_os_role_capabilities r on r.role_code=u.role_code where u.id=p_actor and u.active and r.capability_code=p_cap)
$$;
revoke all on function public.crisdal_ops_can(uuid,text) from public,anon,authenticated;
grant execute on function public.crisdal_ops_can(uuid,text) to service_role;

create function public.crisdal_ops_write(p_actor uuid,p_request uuid,p_action text,p_payload jsonb,p_ip_hash text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare
 v_id uuid; v_client public.crisdal_clients%rowtype; v_quote public.crisdal_quotes%rowtype;
 v_project public.crisdal_production_projects%rowtype; v_inquiry public.crisdal_public_date_inquiries%rowtype;
 v_cap text; v_stage text; v_user uuid; v_prior public.crisdal_finance_requests%rowtype; v_hash text;
begin
 v_cap:=case when p_action in ('client','client_update','link_inquiry') then 'clients.write'
  when p_action in ('quote','quote_edit','quote_send','quote_reject','quote_accept') then 'quotes.manage'
  when p_action in ('project_update','task','task_done') then 'projects.write' end;
 if v_cap is null or not public.crisdal_ops_can(p_actor,v_cap) then raise exception 'OPS_FORBIDDEN'; end if;
 if p_action='quote_accept' and not public.crisdal_ops_can(p_actor,'finance.write') then raise exception 'OPS_FORBIDDEN'; end if;
 if p_ip_hash !~ '^[a-f0-9]{64}$' then raise exception 'OPS_AUDIT'; end if;
 v_hash:=pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p_payload::text,'UTF8')),'hex');
 insert into public.crisdal_finance_requests(request_id,actor_id,action,payload_hash) values(p_request,p_actor,'ops.'||p_action,v_hash) on conflict do nothing;
 select * into strict v_prior from public.crisdal_finance_requests where request_id=p_request for update;
 if v_prior.actor_id<>p_actor or v_prior.action<>'ops.'||p_action or v_prior.payload_hash<>v_hash then raise exception 'OPS_RETRY'; end if;
 if v_prior.result_id is not null then return v_prior.result_id; end if;
 if p_action='client' then
  insert into public.crisdal_clients(id,name,phone,email,notes) values(p_request,trim(p_payload->>'name'),p_payload->>'phone',coalesce(p_payload->>'email',''),coalesce(p_payload->>'notes','')) returning id into v_id;
 elsif p_action='client_update' then
  update public.crisdal_clients set name=trim(p_payload->>'name'),phone=p_payload->>'phone',email=coalesce(p_payload->>'email',''),notes=coalesce(p_payload->>'notes',''),stage=p_payload->>'stage',next_action=coalesce(p_payload->>'nextAction',''),next_action_on=nullif(p_payload->>'nextActionOn','')::date,updated_at=now() where id=(p_payload->>'id')::uuid returning id into v_id;
 elsif p_action='link_inquiry' then
  select * into strict v_inquiry from public.crisdal_public_date_inquiries where id=(p_payload->>'inquiryId')::uuid and state<>'spam' for update;
  select * into strict v_client from public.crisdal_clients where id=(p_payload->>'clientId')::uuid;
  if exists(select 1 from public.crisdal_client_inquiries where inquiry_id=v_inquiry.id and client_id<>v_client.id) then raise exception 'OPS_INQUIRY_LINKED'; end if;
  insert into public.crisdal_client_inquiries(inquiry_id,client_id) values(v_inquiry.id,v_client.id) on conflict do nothing;
  v_id:=v_client.id;
 elsif p_action in ('quote','quote_edit') then
  select * into strict v_client from public.crisdal_clients where id=(p_payload->>'clientId')::uuid;
  if (p_payload->>'expiresOn')::date < (now() at time zone 'America/Lima')::date then raise exception 'OPS_EXPIRED'; end if;
  if (p_payload->'pricing'->>'totalMinor')::bigint <> (p_payload->>'totalMinor')::bigint or p_payload->'pricing'->>'currency' <> p_payload->>'currency' then raise exception 'OPS_TOTAL'; end if;
  if p_action='quote' then
   insert into public.crisdal_quotes(id,client_id,title,event_on,currency,lines,pricing,total_minor,terms,expires_on)
    values(p_request,v_client.id,trim(p_payload->>'title'),nullif(p_payload->>'eventOn','')::date,p_payload->>'currency',p_payload->'lines',p_payload->'pricing',(p_payload->>'totalMinor')::bigint,p_payload->>'terms',(p_payload->>'expiresOn')::date) returning id into v_id;
  else
   select * into strict v_quote from public.crisdal_quotes where id=(p_payload->>'id')::uuid for update;
   if v_quote.status<>'draft' or v_quote.revision is distinct from (p_payload->>'revision')::integer then raise exception 'OPS_QUOTE_STALE'; end if;
   insert into public.crisdal_quote_revisions(quote_id,revision,snapshot,replaced_by)
    values(v_quote.id,v_quote.revision,to_jsonb(v_quote),p_actor);
   update public.crisdal_quotes set client_id=v_client.id,title=trim(p_payload->>'title'),
    event_on=nullif(p_payload->>'eventOn','')::date,currency=p_payload->>'currency',
    lines=p_payload->'lines',pricing=p_payload->'pricing',total_minor=(p_payload->>'totalMinor')::bigint,
    terms=p_payload->>'terms',expires_on=(p_payload->>'expiresOn')::date,revision=revision+1
    where id=v_quote.id returning id into v_id;
  end if;
 elsif p_action in ('quote_send','quote_reject','quote_accept') then
  select * into strict v_quote from public.crisdal_quotes where id=(p_payload->>'id')::uuid for update;
  if p_action='quote_accept' then
   if v_quote.status<>'sent' or v_quote.expires_on<(now() at time zone 'America/Lima')::date or length(trim(coalesce(p_payload->>'reference','')))<3 then raise exception 'OPS_TRANSITION'; end if;
   select * into strict v_client from public.crisdal_clients where id=v_quote.client_id;
   update public.crisdal_quotes set status='accepted',acceptance_reference=trim(p_payload->>'reference'),accepted_at=now() where id=v_quote.id;
   insert into public.crisdal_finance_accounts(quote_id,title,customer,event_date,contracted_on,currency,total_minor,reference,created_by)
   values(v_quote.id,v_quote.title,v_client.name,v_quote.event_on,(now() at time zone 'America/Lima')::date,v_quote.currency,v_quote.total_minor,'Cotización '||v_quote.id::text,p_actor);
   insert into public.crisdal_production_projects(quote_id,client_id,title,event_on) values(v_quote.id,v_client.id,v_quote.title,v_quote.event_on);
   update public.crisdal_clients set stage='active',updated_at=now() where id=v_client.id;
  elsif p_action='quote_send' then
   if v_quote.status<>'draft' or v_quote.expires_on<(now() at time zone 'America/Lima')::date then raise exception 'OPS_TRANSITION'; end if;
   if v_quote.revision is distinct from (p_payload->>'revision')::integer then raise exception 'OPS_QUOTE_STALE'; end if;
   update public.crisdal_quotes set status='sent' where id=v_quote.id;
  else
   if v_quote.status not in ('draft','sent') then raise exception 'OPS_TRANSITION'; end if;
   update public.crisdal_quotes set status='rejected' where id=v_quote.id;
  end if;
  v_id:=v_quote.id;
 elsif p_action='project_update' then
  select * into strict v_project from public.crisdal_production_projects where id=(p_payload->>'id')::uuid for update;
  v_stage:=p_payload->>'stage'; v_user:=nullif(p_payload->>'leadUserId','')::uuid;
  if v_user is not null and not public.crisdal_ops_can(v_user,'projects.read') then raise exception 'OPS_ASSIGNEE'; end if;
  if v_stage<>v_project.stage and not ((v_project.stage='planning' and v_stage='coverage') or (v_project.stage='coverage' and v_stage='editing') or (v_project.stage='editing' and v_stage='review') or (v_project.stage='review' and v_stage in ('editing','ready')) or (v_project.stage='ready' and v_stage='delivered')) then raise exception 'OPS_TRANSITION'; end if;
  if v_stage='delivered' and exists(select 1 from public.crisdal_production_tasks where project_id=v_project.id and not done) then raise exception 'OPS_TASKS'; end if;
  update public.crisdal_production_projects set stage=v_stage,lead_user_id=v_user,due_on=nullif(p_payload->>'dueOn','')::date,notes=coalesce(p_payload->>'notes',''),updated_at=now() where id=v_project.id returning id into v_id;
 elsif p_action='task' then
  select * into strict v_project from public.crisdal_production_projects where id=(p_payload->>'projectId')::uuid for update;
  if v_project.stage='delivered' then raise exception 'OPS_TRANSITION'; end if;
  v_user:=nullif(p_payload->>'assignedTo','')::uuid;
  if v_user is not null and not public.crisdal_ops_can(v_user,'projects.read') then raise exception 'OPS_ASSIGNEE'; end if;
  insert into public.crisdal_production_tasks(id,project_id,title,due_on,assigned_to) values(p_request,v_project.id,trim(p_payload->>'title'),nullif(p_payload->>'dueOn','')::date,v_user) returning id into v_id;
 elsif p_action='task_done' then
  select p.* into strict v_project from public.crisdal_production_projects p join public.crisdal_production_tasks t on t.project_id=p.id where t.id=(p_payload->>'id')::uuid for update of p;
  if v_project.stage='delivered' then raise exception 'OPS_TRANSITION'; end if;
  update public.crisdal_production_tasks set done=(p_payload->>'done')::boolean where id=(p_payload->>'id')::uuid returning id into v_id;
 end if;
 if v_id is null then raise exception 'OPS_NOT_FOUND'; end if;
 insert into public.crisdal_os_audit_events(actor_user_id,action,entity_type,entity_id,request_id,ip_hash,metadata)
 values(p_actor,'ops.'||p_action,'operations',v_id::text,p_request,p_ip_hash,'{}'::jsonb);
 update public.crisdal_finance_requests set result_id=v_id where request_id=p_request;
 return v_id;
end $$;
revoke all on function public.crisdal_ops_write(uuid,uuid,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.crisdal_ops_write(uuid,uuid,text,jsonb,text) to service_role;
commit;
