-- Candidate only. Generate the incremental migration using Supabase CLI after local QA.
-- Existing finance write RPCs enforce permissions, balances, audit and per-request idempotency.
-- Both calls execute within ONE database transaction; any exception rolls back both.
begin;
create function public.crisdal_finance_receipt_with_voucher(
 p_actor uuid, p_request uuid, p_receipt jsonb, p_voucher jsonb, p_ip_hash text
)
returns uuid language plpgsql security invoker set search_path=pg_catalog as $$
declare
 receipt_id uuid;
 movement_payload jsonb := p_receipt;
begin
 if p_request is null or jsonb_typeof(p_receipt) is distinct from 'object'
    or jsonb_typeof(p_voucher) is distinct from 'object'
    or p_receipt->>'kind' is distinct from 'receipt' then
   raise exception 'FINANCE_VOUCHER_PAYLOAD';
 end if;
 if nullif(p_receipt->>'accountId','') is null then
   raise exception 'FINANCE_ACCOUNT_REQUIRED';
 end if;
 if p_receipt->>'method' = 'cash' and nullif(btrim(p_receipt->>'reference'),'') is null then
   movement_payload := p_receipt || jsonb_build_object(
     'reference','EF-' || upper(replace(p_request::text,'-',''))
   );
 end if;
 -- Stable child IDs keep the existing write RPC's audit and retry guarantees.
 receipt_id := public.crisdal_finance_write(
   p_actor,md5('crisdal:receipt+voucher:receipt:'||p_request::text)::uuid,
   'movement',movement_payload,p_ip_hash
 );
 perform public.crisdal_finance_write(
   p_actor,md5('crisdal:receipt+voucher:voucher:'||p_request::text)::uuid,'voucher',
   p_voucher || jsonb_build_object(
     'receiptId',receipt_id,'accountId',p_receipt->>'accountId',
     'currency',p_receipt->>'currency','sourceKind','sunat_original'
   ),p_ip_hash
 );
 return receipt_id;
end; $$;
revoke all on function public.crisdal_finance_receipt_with_voucher(uuid,uuid,jsonb,jsonb,text) from public,anon,authenticated;
grant execute on function public.crisdal_finance_receipt_with_voucher(uuid,uuid,jsonb,jsonb,text) to service_role;
commit;
