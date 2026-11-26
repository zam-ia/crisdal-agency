-- Run ONLY on the restored isolated database, after the candidate has been installed.
-- An owner fixture must exist in the isolated database. No real customer data.
-- psql -v ON_ERROR_STOP=1 ... then SET crisdal.qa_isolated='yes' before including this file.
begin;
do $$
declare actor uuid; client uuid; quote uuid; project uuid; request_id uuid; p jsonb; quote_payload jsonb; today date:=(now() at time zone 'America/Lima')::date;
begin
 if current_setting('crisdal.qa_isolated',true) is distinct from 'yes' then raise exception 'ISOLATED QA REQUIRED'; end if;
 select id into actor from public.crisdal_os_users where role_code='owner' and active limit 1;
 if actor is null then raise exception 'Create isolated synthetic owner fixture first'; end if;
 client:=public.crisdal_ops_write(actor,gen_random_uuid(),'client',jsonb_build_object('name','Synthetic QA client','phone','999000777666','email','','notes',''),repeat('a',64));
 quote_payload:=jsonb_build_object('clientId',client,'title','QA test event','currency','PEN','eventOn',today+1,'lines',jsonb_build_array(jsonb_build_object('id','fixture','description','Test service','quantity',1,'unitPriceMinor',50000,'discountBps',0,'taxBps',0)),'pricing',jsonb_build_object('currency','PEN','totalMinor',50000),'totalMinor',50000,'terms','Synthetic acceptance test','expiresOn',today+7);
 quote:=public.crisdal_ops_write(actor,gen_random_uuid(),'quote',quote_payload,repeat('a',64));
 perform public.crisdal_ops_write(actor,gen_random_uuid(),'quote_edit',quote_payload||jsonb_build_object('id',quote,'revision',1,'title','QA revised event'),repeat('a',64));
 if not exists(select 1 from public.crisdal_quote_revisions where quote_id=quote and revision=1 and snapshot->>'title'='QA test event') then raise exception 'Original quote revision missing'; end if;
 begin
  perform public.crisdal_ops_write(actor,gen_random_uuid(),'quote_send',jsonb_build_object('id',quote,'revision',1),repeat('a',64));
  raise exception 'Stale proposal was sent';
 exception when raise_exception then
  if sqlerrm<>'OPS_QUOTE_STALE' then raise; end if;
 end;
 perform public.crisdal_ops_write(actor,gen_random_uuid(),'quote_send',jsonb_build_object('id',quote,'revision',2),repeat('a',64));
 request_id:=gen_random_uuid(); p:=jsonb_build_object('id',quote,'reference','Synthetic acceptance');
 perform public.crisdal_ops_write(actor,request_id,'quote_accept',p,repeat('a',64));
 perform public.crisdal_ops_write(actor,request_id,'quote_accept',p,repeat('a',64));
 if (select count(*) from public.crisdal_finance_accounts where quote_id=quote)<>1 then raise exception 'Duplicate receivable'; end if;
 if (select count(*) from public.crisdal_production_projects where quote_id=quote)<>1 then raise exception 'Duplicate project'; end if;
 if exists(select 1 from public.crisdal_finance_movements m join public.crisdal_finance_accounts a on a.id=m.account_id where a.quote_id=quote) then raise exception 'Acceptance created cash'; end if;
 begin
  update public.crisdal_finance_accounts set total_minor=50100 where quote_id=quote;
  raise exception 'Accepted amount was overwritten';
 exception when raise_exception then
  if sqlerrm<>'FINANCE_QUOTE_LOCKED' then raise; end if;
 end;
 select id into project from public.crisdal_production_projects where quote_id=quote;
 perform public.crisdal_ops_write(actor,gen_random_uuid(),'task',jsonb_build_object('projectId',project,'title','Synthetic task','dueOn',today+2,'assignedTo',null),repeat('a',64));
 if (select count(*) from public.crisdal_production_tasks where project_id=project)<>1 then raise exception 'Task missing'; end if;
end $$;
rollback;
