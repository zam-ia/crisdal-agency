begin;

create table if not exists public.portfolio_categories (
  id uuid primary key default gen_random_uuid(), slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 120), active boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(), kind text not null check (kind in ('image','video')),
  provider text not null check (provider in ('supabase','external')), storage_bucket text, storage_path text,
  public_url text not null, poster_url text, alt_text text not null default '', orientation text not null check (orientation in ('portrait','landscape','square')),
  mime_type text not null, size_bytes bigint check (size_bytes is null or size_bytes >= 0), width integer, height integer,
  sha256 text unique check (sha256 is null or char_length(sha256)=64), publication_authorized boolean not null default false,
  created_by uuid not null references public.crisdal_os_users(id) on delete restrict, created_at timestamptz not null default now(),
  check ((provider='supabase' and storage_bucket is not null and storage_path is not null) or provider='external')
);
create table if not exists public.portfolio_projects (
  id uuid primary key default gen_random_uuid(), slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 3 and 180), category_id uuid not null references public.portfolio_categories(id) on delete restrict,
  client_name text, client_display_authorized boolean not null default false, production_year integer check (production_year between 2000 and 2100),
  description text not null check (char_length(description) between 20 and 4000), objective text not null default '', service_type text not null,
  status text not null default 'draft' check (status in ('draft','published','archived')), featured boolean not null default false,
  cover_asset_id uuid references public.media_assets(id) on delete restrict, published_at timestamptz,
  created_by uuid references public.crisdal_os_users(id) on delete restrict, updated_by uuid references public.crisdal_os_users(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.portfolio_media (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.portfolio_projects(id) on delete cascade,
  media_asset_id uuid not null references public.media_assets(id) on delete restrict, sort_order integer not null default 0 check (sort_order>=0),
  created_at timestamptz not null default now(), unique(project_id,media_asset_id)
);
create table if not exists public.publication_consents (
  id uuid primary key default gen_random_uuid(), project_id uuid not null unique references public.portfolio_projects(id) on delete cascade,
  status text not null default 'missing' check (status in ('missing','pending','verified','revoked')), scope text not null default '',
  evidence_reference text not null default '', authorized_at timestamptz, verified_by uuid references public.crisdal_os_users(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (status <> 'verified' or (char_length(scope)>0 and char_length(evidence_reference)>0 and authorized_at is not null and verified_by is not null))
);

insert into public.portfolio_categories(slug,name,sort_order) values
('reels-contenido','Reels y contenido',10),('fotografia-comercial','Fotografía comercial',20),('producto-gastronomia','Producto y gastronomía',30),
('videos-empresariales','Videos empresariales',40),('bodas','Bodas',50),('quinceanos','Quinceaños',60),('eventos-sociales','Eventos sociales',70),
('eventos-corporativos','Eventos corporativos',80),('behind-the-scenes','Behind the scenes',90)
on conflict(slug) do update set name=excluded.name,sort_order=excluded.sort_order;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('crisdal-public-media','crisdal-public-media',true,12582912,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create index if not exists portfolio_projects_public_idx on public.portfolio_projects(status,published_at desc) where status='published';
create index if not exists portfolio_projects_category_idx on public.portfolio_projects(category_id,status);
create index if not exists portfolio_media_order_idx on public.portfolio_media(project_id,sort_order);
alter table public.portfolio_categories enable row level security; alter table public.media_assets enable row level security;
alter table public.portfolio_projects enable row level security; alter table public.portfolio_media enable row level security; alter table public.publication_consents enable row level security;
revoke all on public.portfolio_categories,public.media_assets,public.portfolio_projects,public.portfolio_media,public.publication_consents from anon,authenticated;
grant all on public.portfolio_categories,public.media_assets,public.portfolio_projects,public.portfolio_media,public.publication_consents to service_role;
commit;
