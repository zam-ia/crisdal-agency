begin;

alter table public.portfolio_categories add column if not exists visible boolean not null default true;
insert into public.portfolio_categories(slug,name,sort_order) values
('bodas','Bodas',10),('quinceanos','Quinceaños',20),('eventos-corporativos','Eventos corporativos',30),('celebraciones','Cumpleaños y celebraciones',40),('bautizos','Bautizos',50),('pedidas-de-mano','Pedidas de mano',60),('sesiones-fotograficas','Sesiones fotográficas',70),('behind-the-scenes','Detrás de cámaras',80),('reels-contenido','Contenido para negocios',90)
on conflict(slug) do update set name=excluded.name,sort_order=excluded.sort_order;

alter table public.media_assets add column if not exists external_provider text check(external_provider is null or external_provider in('youtube','vimeo','tiktok','facebook'));
alter table public.media_assets add column if not exists embed_mode text not null default 'embed' check(embed_mode in('embed','external'));
alter table public.media_assets add column if not exists title text;
alter table public.media_assets add column if not exists private_storage_path text;
alter table public.media_assets add column if not exists thumbnail_storage_path text;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('crisdal-private-media','crisdal-private-media',false,12582912,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create table if not exists public.portfolio_upload_intents(
 id uuid primary key default gen_random_uuid(),project_id uuid not null references public.portfolio_projects(id) on delete cascade,
 storage_path text not null unique,mime_type text not null,size_bytes bigint not null check(size_bytes between 1 and 12582912),
 status text not null default 'signed' check(status in('signed','confirmed','failed','expired')),created_by uuid not null references public.crisdal_os_users(id) on delete restrict,
 expires_at timestamptz not null,confirmed_at timestamptz,created_at timestamptz not null default now()
);

create table if not exists public.commercial_promotions(
 id uuid primary key default gen_random_uuid(),internal_name text not null,title text not null,description text not null,image_url text,
 cta_label text not null,destination text not null,pages text[] not null check(cardinality(pages)>0),starts_at timestamptz not null,ends_at timestamptz not null check(ends_at>starts_at),
 status text not null default 'draft' check(status in('draft','active','archived')),priority integer not null default 0 check(priority between 0 and 1000),
 placement text not null default 'banner' check(placement in('modal','banner','card')),show_mobile boolean not null default true,show_desktop boolean not null default true,
 created_by uuid references public.crisdal_os_users(id) on delete restrict,updated_by uuid references public.crisdal_os_users(id) on delete restrict,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index if not exists commercial_promotions_active_idx on public.commercial_promotions(status,starts_at,ends_at,priority desc) where status='active';
create index if not exists portfolio_upload_intents_project_idx on public.portfolio_upload_intents(project_id,status,expires_at);
alter table public.portfolio_upload_intents enable row level security;alter table public.commercial_promotions enable row level security;
revoke all on public.portfolio_upload_intents,public.commercial_promotions from anon,authenticated;
grant all on public.portfolio_upload_intents,public.commercial_promotions to service_role;

commit;
