-- Run with psql -v ON_ERROR_STOP=1 against an isolated database after applying the RPC.
begin;

insert into auth.users(id) values
 ('31000000-0000-4000-8000-000000000001'), ('31000000-0000-4000-8000-000000000002');
insert into public.crisdal_os_users(id,auth_user_id,email,display_name,role_code) values
 ('31000000-0000-4000-8000-000000000003','31000000-0000-4000-8000-000000000001','finance-qa@example.test','Finance QA','finance'),
 ('31000000-0000-4000-8000-000000000004','31000000-0000-4000-8000-000000000002','production-qa@example.test','Production QA','production');

do $$
declare
 rpc constant text := 'public.crisdal_finance_receipt_with_voucher(uuid,uuid,jsonb,jsonb,text)';
begin
 assert not has_function_privilege('anon',rpc,'execute');
 assert not has_function_privilege('authenticated',rpc,'execute');
 assert has_function_privilege('service_role',rpc,'execute');
 assert not (select prosecdef from pg_proc where oid=rpc::regprocedure);
end;
$$;

set local role service_role;
do $$
declare
 actor constant uuid := '31000000-0000-4000-8000-000000000003';
 viewer constant uuid := '31000000-0000-4000-8000-000000000004';
 request constant uuid := '31000000-0000-4000-8000-000000000005';
 failed_request constant uuid := '31000000-0000-4000-8000-000000000006';
 cash_request constant uuid := '31000000-0000-4000-8000-000000000007';
 audit_hash constant text := repeat('f',64);
 test_account uuid;
 movement_id uuid;
 cash_id uuid;
 receipt jsonb;
 voucher jsonb;
 paid_month jsonb;
 issued_month jsonb;
begin
 test_account := public.crisdal_finance_write(actor,gen_random_uuid(),'account',
   '{"title":"QA","customer":"Cliente QA","currency":"PEN","date":"2025-01-01","amountMinor":30000}',audit_hash);
 receipt := jsonb_build_object('kind','receipt','accountId',test_account,'currency','PEN',
   'amountMinor',5000,'date','2025-02-02','method','yape','description','Cobro QA','reference','YAPE-QA-15');
 voucher := '{"issuerRuc":"10000000001","series":"QA01","number":"1","date":"2025-01-31",
   "amountMinor":7500,"customer":"Comprador QA","documentType":"DNI","documentNumber":"00000001",
   "description":"Boleta QA","igvMinor":null,"discountMinor":null}'::jsonb;
 begin
   perform public.crisdal_finance_receipt_with_voucher(viewer,request,receipt,voucher,audit_hash);
   raise exception 'missing capability gate';
 exception when raise_exception then
   assert sqlerrm='FINANCE_FORBIDDEN', sqlerrm;
 end;
 begin
   perform public.crisdal_finance_receipt_with_voucher(actor,failed_request,receipt,
     voucher || '{"igvMinor":99999}',audit_hash);
   raise exception 'expected invalid voucher to fail';
 exception when check_violation then null;
 end;
 assert not exists(select 1 from public.crisdal_finance_movements where crisdal_finance_movements.account_id=test_account);
 assert not exists(select 1 from public.crisdal_finance_requests
   where request_id=md5('crisdal:receipt+voucher:receipt:'||failed_request::text)::uuid);
 begin
   perform public.crisdal_finance_receipt_with_voucher(actor,failed_request,
     receipt || '{"amountMinor":30001}',voucher,audit_hash);
   raise exception 'expected invalid movement to fail';
 exception when raise_exception then
   assert sqlerrm='FINANCE_BALANCE', sqlerrm;
 end;
 assert not exists(select 1 from public.crisdal_finance_vouchers where series='QA01');

 movement_id := public.crisdal_finance_receipt_with_voucher(actor,request,receipt,voucher,audit_hash);
 assert movement_id=public.crisdal_finance_receipt_with_voucher(actor,request,receipt,voucher,audit_hash);
 assert (select reference='YAPE-QA-15' and amount_minor=5000 and occurred_on='2025-02-02'
   from public.crisdal_finance_movements where id=movement_id);
 assert (select receipt_id=movement_id and total_minor=7500 and issued_on='2025-01-31'
               and igv_minor is null and source_kind='sunat_original'
   from public.crisdal_finance_vouchers where series='QA01' and number='1');
 begin
   perform public.crisdal_finance_receipt_with_voucher(actor,request,receipt,
     voucher || '{"amountMinor":7600}',audit_hash);
   raise exception 'expected the changed voucher payload to fail';
 exception when raise_exception then
   assert sqlerrm='FINANCE_IDEMPOTENCY', sqlerrm;
 end;
 begin
   perform public.crisdal_finance_receipt_with_voucher(actor,failed_request,receipt,voucher,audit_hash);
   raise exception 'expected duplicate voucher to fail';
 exception when unique_violation then null;
 end;
 assert (select count(*)=1 from public.crisdal_finance_movements m where m.account_id=test_account);
 assert (select count(*)=2 from public.crisdal_os_audit_events where request_id in (
   md5('crisdal:receipt+voucher:receipt:'||request::text)::uuid,
   md5('crisdal:receipt+voucher:voucher:'||request::text)::uuid));
 assert not exists(select 1 from public.crisdal_os_audit_events
   where request_id=md5('crisdal:receipt+voucher:receipt:'||failed_request::text)::uuid);
 paid_month := public.crisdal_finance_snapshot(actor,'PEN','2025-02-01');
 issued_month := public.crisdal_finance_snapshot(actor,'PEN','2025-01-01');
 assert (paid_month->'totals'->>'received_minor')::bigint=5000;
 assert (paid_month->'totals'->>'documented_minor')::bigint=0;
 assert (issued_month->'totals'->>'received_minor')::bigint=0;
 assert (issued_month->'totals'->>'documented_minor')::bigint=7500;
 assert jsonb_array_length(paid_month->'movements')=1;
 assert jsonb_array_length(issued_month->'vouchers')=1;

 receipt := receipt || '{"method":"cash","reference":null}';
 voucher := voucher || '{"number":"2","igvMinor":0}';
 cash_id := public.crisdal_finance_receipt_with_voucher(actor,cash_request,receipt,voucher,audit_hash);
 assert cash_id=public.crisdal_finance_receipt_with_voucher(actor,cash_request,receipt,voucher,audit_hash);
 assert (select reference='EF-'||upper(replace(cash_request::text,'-',''))
   from public.crisdal_finance_movements where id=cash_id);
 assert (select igv_minor=0 from public.crisdal_finance_vouchers where receipt_id=cash_id);
end;
$$;
rollback;
