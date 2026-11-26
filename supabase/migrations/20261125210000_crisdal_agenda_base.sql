begin;

create table if not exists public.calendar_activities (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 180),
  category text not null check (category in ('consulta','reunion','produccion','entrega','otro')),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  status text not null default 'inquiry' check (status in ('inquiry','pending','confirmed','cancelled')),
  notes text not null default '' check (char_length(notes) <= 2000),
  project_id uuid references public.portfolio_projects(id) on delete set null,
  created_by uuid not null references public.crisdal_os_users(id) on delete restrict,
  updated_by uuid not null references public.crisdal_os_users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calendar_activities_range_idx on public.calendar_activities(starts_at, ends_at) where status <> 'cancelled';
create index if not exists calendar_activities_project_idx on public.calendar_activities(project_id) where project_id is not null;
alter table public.calendar_activities enable row level security;
revoke all on public.calendar_activities from anon, authenticated;
grant all on public.calendar_activities to service_role;

commit;
