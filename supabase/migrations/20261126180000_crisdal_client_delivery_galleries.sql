-- Crisdal private client delivery galleries (isolated additive migration).
-- Prerequisites: 20261125120000 identity and 20261125200000 private-media bucket.
-- Do not apply to production without a tested snapshot, RLS checks and approval.
begin;

create table if not exists public.crisdal_client_galleries (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 150),
  event_type text not null check (event_type in ('Boda','Quinceaños','Evento corporativo','Celebración','Bautizo','Pedida de mano','Sesión fotográfica','Otro')),
  description text not null default '' check (char_length(description) <= 1800),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  allow_downloads boolean not null default false,
  token_hash text unique check (token_hash is null or char_length(token_hash) = 64),
  expires_at timestamptz,
  published_at timestamptz,
  created_by uuid not null references public.crisdal_os_users(id) on delete restrict,
  updated_by uuid not null references public.crisdal_os_users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gallery_published_has_token check (
    status <> 'published' or (token_hash is not null and expires_at is not null and published_at is not null)
  )
);
create index if not exists crisdal_client_galleries_created_idx
  on public.crisdal_client_galleries(created_at desc);
create index if not exists crisdal_client_galleries_status_idx
  on public.crisdal_client_galleries(status, expires_at);

create table if not exists public.crisdal_client_gallery_assets (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.crisdal_client_galleries(id) on delete cascade,
  kind text not null check (kind in ('image','video')),
  title text not null default '' check (char_length(title) <= 180),
  alt_text text not null default '' check (char_length(alt_text) <= 240),
  original_name text,
  original_path text unique,
  preview_path text unique,
  thumbnail_path text unique,
  external_url text,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes between 1 and 12582912),
  favorite boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint gallery_asset_kind_consistent check (
    (kind='image' and original_path is not null and preview_path is not null and thumbnail_path is not null and external_url is null) or
    (kind='video' and original_path is null and preview_path is null and thumbnail_path is null and external_url is not null)
  )
);
create index if not exists crisdal_delivery_assets_gallery_idx
  on public.crisdal_client_gallery_assets(gallery_id,sort_order,created_at);

create table if not exists public.crisdal_client_gallery_upload_intents (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.crisdal_client_galleries(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null check(char_length(file_name) between 1 and 255),
  mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp','image/avif')),
  size_bytes bigint not null check(size_bytes between 1 and 12582912),
  status text not null default 'signed' check(status in ('signed','confirmed','failed')),
  created_by uuid not null references public.crisdal_os_users(id) on delete restrict,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists crisdal_delivery_intents_gallery_idx
  on public.crisdal_client_gallery_upload_intents(gallery_id,status,expires_at);

alter table public.crisdal_client_galleries enable row level security;
alter table public.crisdal_client_gallery_assets enable row level security;
alter table public.crisdal_client_gallery_upload_intents enable row level security;
revoke all on public.crisdal_client_galleries, public.crisdal_client_gallery_assets,
  public.crisdal_client_gallery_upload_intents from anon, authenticated;
grant all on public.crisdal_client_galleries, public.crisdal_client_gallery_assets,
  public.crisdal_client_gallery_upload_intents to service_role;

-- Private media already lives in crisdal-private-media; no public bucket and no anon SELECT.
commit;
