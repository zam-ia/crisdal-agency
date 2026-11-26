-- Isolated intake + privacy-safe public date projection.
-- Depends on 20261125120000_crisdal_os_identity.sql for the audit table/user FK.
-- Do NOT execute remotely until signed off and tested in an isolated database.
begin;
create extension if not exists pgcrypto;

create table if not exists public.crisdal_public_availability_days (
  service_key text not null default 'events' check (service_key = 'events'),
  day date not null,
  status text not null check (status in ('available', 'unavailable')),
  verified_until timestamptz not null,
  verified_at timestamptz not null default now(),
  constraint verified_fresh_window check (verified_until > verified_at and verified_until <= verified_at + interval '12 hours'),
  source text not null check (source in ('agenda-verified','manual-verified')),
  updated_at timestamptz not null default now(),
  primary key (service_key,day)
);
-- No seed, no fabricated availability. The agenda adapter must publish verified aggregates.

create table if not exists public.crisdal_public_date_inquiries (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (char_length(event_type) between 2 and 80),
  requested_day date not null,
  contact_name text not null check (char_length(contact_name) between 2 and 120),
  contact_phone text not null check (char_length(contact_phone) between 7 and 32),
  city text not null check (char_length(city) between 2 and 120),
  message text not null default '' check (char_length(message) <= 1000),
  state text not null default 'new' check (state in ('new','contacted','closed','spam')),
  ip_hash text not null check (char_length(ip_hash) = 64),
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists crisdal_date_inquiries_state_created on public.crisdal_public_date_inquiries(state,created_at desc);
create index if not exists crisdal_date_inquiries_ip_throttle on public.crisdal_public_date_inquiries(ip_hash,created_at desc);
create index if not exists crisdal_date_inquiries_requested_day on public.crisdal_public_date_inquiries(requested_day);

alter table public.crisdal_public_availability_days enable row level security;
alter table public.crisdal_public_date_inquiries enable row level security;
revoke all on public.crisdal_public_availability_days,public.crisdal_public_date_inquiries from anon,authenticated;
grant all on public.crisdal_public_availability_days,public.crisdal_public_date_inquiries to service_role;

create or replace function public.crisdal_submit_public_date_inquiry(
  p_event_type text, p_requested_day date, p_contact_name text,
  p_contact_phone text, p_city text, p_message text, p_ip_hash text
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare v_id uuid;
begin
  if length(p_ip_hash) <> 64 then raise exception 'INVALID_HASH'; end if;
  -- Serialize anonymous submissions from the same hashed IP; no in-memory rate limit.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_ip_hash, 0));
  if (select count(*) from public.crisdal_public_date_inquiries
      where ip_hash=p_ip_hash and created_at > now() - interval '1 hour') >= 4 then
    raise exception 'CRISDAL_RATE_LIMIT' using errcode='P0001';
  end if;
  insert into public.crisdal_public_date_inquiries
    (event_type,requested_day,contact_name,contact_phone,city,message,ip_hash)
    values (p_event_type,p_requested_day,p_contact_name,p_contact_phone,p_city,p_message,p_ip_hash)
    returning id into v_id;
  return v_id;
end $$;

create or replace function public.crisdal_set_public_date_inquiry_state(
  p_inquiry_id uuid, p_state text, p_actor_id uuid, p_ip_hash text
) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare v_count int;
begin
  if p_state not in ('new','contacted','closed','spam') or length(p_ip_hash) <> 64 then
    return false;
  end if;
  update public.crisdal_public_date_inquiries set state=p_state,updated_at=now()
    where id=p_inquiry_id;
  get diagnostics v_count = row_count;
  if v_count <> 1 then return false; end if;
  insert into public.crisdal_os_audit_events
    (actor_user_id,action,entity_type,entity_id,request_id,ip_hash,metadata)
    values (p_actor_id,'date_inquiry.status.changed','date_inquiry',p_inquiry_id::text,
            gen_random_uuid(),p_ip_hash,pg_catalog.jsonb_build_object('new_state',p_state));
  return true;
end $$;

create or replace function public.crisdal_set_public_availability_day(
  p_day date, p_status text, p_actor_id uuid, p_ip_hash text
) returns boolean
language plpgsql security invoker set search_path = '' as $$
begin
  if p_status not in ('available','unavailable','clear') or length(p_ip_hash) <> 64
     or p_day < (now() at time zone 'America/Lima')::date
     or p_day > ((now() at time zone 'America/Lima')::date + interval '12 months')::date then
    return false;
  end if;
  if p_status='clear' then
    delete from public.crisdal_public_availability_days where service_key='events' and day=p_day;
  else
    insert into public.crisdal_public_availability_days (service_key,day,status,verified_at,verified_until,source,updated_at)
      values ('events',p_day,p_status,now(),now()+interval '12 hours','manual-verified',now())
    on conflict(service_key,day) do update set status=excluded.status,
      verified_at=excluded.verified_at,verified_until=excluded.verified_until,
      source=excluded.source,updated_at=excluded.updated_at;
  end if;
  insert into public.crisdal_os_audit_events
    (actor_user_id,action,entity_type,entity_id,request_id,ip_hash,metadata)
    values (p_actor_id,'availability.public.status.changed','availability_day',p_day::text,
            gen_random_uuid(),p_ip_hash,pg_catalog.jsonb_build_object('status',p_status));
  return true;
end $$;

revoke all on function public.crisdal_submit_public_date_inquiry(text,date,text,text,text,text,text) from public,anon,authenticated;
revoke all on function public.crisdal_set_public_date_inquiry_state(uuid,text,uuid,text) from public,anon,authenticated;
grant execute on function public.crisdal_submit_public_date_inquiry(text,date,text,text,text,text,text) to service_role;
grant execute on function public.crisdal_set_public_date_inquiry_state(uuid,text,uuid,text) to service_role;
revoke all on function public.crisdal_set_public_availability_day(date,text,uuid,text) from public,anon,authenticated;
grant execute on function public.crisdal_set_public_availability_day(date,text,uuid,text) to service_role;
commit;
