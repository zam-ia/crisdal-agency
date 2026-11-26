begin;

create extension if not exists pgcrypto;

create table if not exists public.crisdal_os_roles (
  code text primary key,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.crisdal_os_capabilities (
  code text primary key,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.crisdal_os_role_capabilities (
  role_code text not null references public.crisdal_os_roles(code) on delete cascade,
  capability_code text not null references public.crisdal_os_capabilities(code) on delete cascade,
  primary key (role_code, capability_code)
);

create table if not exists public.crisdal_os_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete restrict,
  email text not null unique,
  display_name text not null check (char_length(display_name) between 1 and 120),
  role_code text not null references public.crisdal_os_roles(code) on delete restrict,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crisdal_os_sessions (
  id uuid primary key default gen_random_uuid(),
  provider_session_id uuid not null unique,
  user_id uuid not null references public.crisdal_os_users(id) on delete restrict,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  ip_hash text not null check (char_length(ip_hash) = 64),
  user_agent text not null default '',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.crisdal_os_login_attempts (
  id bigint generated always as identity primary key,
  email_hash text not null check (char_length(email_hash) = 64),
  ip_hash text not null check (char_length(ip_hash) = 64),
  success boolean not null,
  request_id uuid not null,
  user_agent text not null default '',
  attempted_at timestamptz not null default now()
);

create table if not exists public.crisdal_os_audit_events (
  id bigint generated always as identity primary key,
  actor_user_id uuid references public.crisdal_os_users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  request_id uuid not null,
  ip_hash text not null check (char_length(ip_hash) = 64),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table if not exists public.crisdal_os_migration_runs (
  id uuid primary key default gen_random_uuid(),
  source_system text not null,
  source_hash text not null check (char_length(source_hash) = 64),
  status text not null check (status in ('planned', 'validated', 'applied', 'failed')),
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (source_system, source_hash)
);

create table if not exists public.crisdal_os_id_map (
  source_system text not null,
  entity_type text not null,
  legacy_id text not null,
  target_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (source_system, entity_type, legacy_id),
  unique (entity_type, target_id)
);

insert into public.crisdal_os_roles (code, label) values
  ('owner', 'Propietario'), ('administration', 'Administración'),
  ('production', 'Producción'), ('finance', 'Finanzas'), ('commercial', 'Comercial')
on conflict (code) do update set label = excluded.label;

insert into public.crisdal_os_capabilities (code, description) values
  ('clients.read','Leer clientes'), ('clients.write','Administrar clientes'),
  ('calendar.read','Leer calendario'), ('calendar.write','Administrar calendario'),
  ('projects.read','Leer proyectos'), ('projects.write','Administrar proyectos'),
  ('finance.read','Leer finanzas'), ('finance.write','Administrar finanzas'),
  ('packages.read','Leer paquetes'), ('packages.write','Administrar paquetes'),
  ('quotes.manage','Administrar cotizaciones'), ('portfolio.manage','Administrar portafolio'),
  ('site.manage','Administrar sitio'), ('users.manage','Administrar usuarios')
on conflict (code) do update set description = excluded.description;

insert into public.crisdal_os_role_capabilities (role_code, capability_code)
select 'owner', code from public.crisdal_os_capabilities
on conflict do nothing;
insert into public.crisdal_os_role_capabilities values
  ('administration','clients.read'),('administration','clients.write'),('administration','calendar.read'),('administration','calendar.write'),('administration','projects.read'),('administration','projects.write'),('administration','packages.read'),('administration','quotes.manage'),('administration','site.manage'),
  ('production','calendar.read'),('production','projects.read'),('production','projects.write'),('production','packages.read'),
  ('finance','clients.read'),('finance','finance.read'),('finance','finance.write'),('finance','quotes.manage'),
  ('commercial','clients.read'),('commercial','clients.write'),('commercial','calendar.read'),('commercial','packages.read'),('commercial','quotes.manage'),('commercial','portfolio.manage')
on conflict do nothing;

create or replace function public.crisdal_os_set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists crisdal_os_users_updated_at on public.crisdal_os_users;
create trigger crisdal_os_users_updated_at before update on public.crisdal_os_users for each row execute function public.crisdal_os_set_updated_at();

create index if not exists crisdal_os_sessions_user_id_idx on public.crisdal_os_sessions(user_id);
create index if not exists crisdal_os_sessions_active_idx on public.crisdal_os_sessions(provider_session_id, expires_at) where revoked_at is null;
create index if not exists crisdal_os_login_attempts_email_idx on public.crisdal_os_login_attempts(email_hash, attempted_at desc) where success is false;
create index if not exists crisdal_os_login_attempts_ip_idx on public.crisdal_os_login_attempts(ip_hash, attempted_at desc) where success is false;
create index if not exists crisdal_os_audit_actor_idx on public.crisdal_os_audit_events(actor_user_id, occurred_at desc);

alter table public.crisdal_os_roles enable row level security;
alter table public.crisdal_os_capabilities enable row level security;
alter table public.crisdal_os_role_capabilities enable row level security;
alter table public.crisdal_os_users enable row level security;
alter table public.crisdal_os_sessions enable row level security;
alter table public.crisdal_os_login_attempts enable row level security;
alter table public.crisdal_os_audit_events enable row level security;
alter table public.crisdal_os_migration_runs enable row level security;
alter table public.crisdal_os_id_map enable row level security;

revoke all on public.crisdal_os_roles, public.crisdal_os_capabilities, public.crisdal_os_role_capabilities, public.crisdal_os_users, public.crisdal_os_sessions, public.crisdal_os_login_attempts, public.crisdal_os_audit_events, public.crisdal_os_migration_runs, public.crisdal_os_id_map from anon, authenticated;
revoke all on sequence public.crisdal_os_login_attempts_id_seq, public.crisdal_os_audit_events_id_seq from anon, authenticated;
grant all on public.crisdal_os_roles, public.crisdal_os_capabilities, public.crisdal_os_role_capabilities, public.crisdal_os_users, public.crisdal_os_sessions, public.crisdal_os_login_attempts, public.crisdal_os_audit_events, public.crisdal_os_migration_runs, public.crisdal_os_id_map to service_role;
grant usage, select on sequence public.crisdal_os_login_attempts_id_seq, public.crisdal_os_audit_events_id_seq to service_role;

commit;
