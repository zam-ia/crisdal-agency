begin;
create table if not exists public.commercial_packages(
 id uuid primary key default gen_random_uuid(),slug text not null unique check(slug~'^[a-z0-9]+(?:-[a-z0-9]+)*$'),line text not null check(line in('content','events')),
 category text not null,name text not null,description text not null,image_url text,price_minor bigint check(price_minor is null or price_minor>=0),currency char(3) not null default 'PEN' check(currency='PEN'),
 price_visibility text not null default 'consult' check(price_visibility in('public','hidden','consult')),deliverables jsonb not null default '[]'::jsonb,deliverables_approved boolean not null default false,
 recommended boolean not null default false,status text not null default 'draft' check(status in('draft','published','archived')),sort_order integer not null default 0 check(sort_order>=0),internal_notes text not null default '',
 created_by uuid references public.crisdal_os_users(id) on delete restrict,updated_by uuid references public.crisdal_os_users(id) on delete restrict,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(price_visibility<>'public' or price_minor is not null)
);
create table if not exists public.package_share_links(
 id uuid primary key default gen_random_uuid(),token_hash text not null unique check(char_length(token_hash)=64),campaign_id uuid not null unique,
 package_ids uuid[] not null check(cardinality(package_ids) between 1 and 20),message text not null check(char_length(message) between 20 and 1200),
 created_by uuid not null references public.crisdal_os_users(id) on delete restrict,created_at timestamptz not null default now(),expires_at timestamptz,revoked_at timestamptz
);
insert into public.commercial_packages(slug,line,category,name,description,price_minor,price_visibility,recommended,status,sort_order) values
('impulso','content','Creación de reels','Impulso','Una entrada profesional para negocios que necesitan empezar a comunicar con una dirección visual clara.',89900,'public',false,'published',10),
('crecimiento','content','Contenido mensual','Crecimiento','La opción recomendada para marcas que buscan sostener una presencia visual más consistente.',119900,'public',true,'published',20),
('dominio-digital','content','Producción puntual','Dominio Digital','Una conversación de mayor alcance para negocios que necesitan una producción audiovisual más completa.',159900,'public',false,'published',30),
('momento','events','Eventos sociales','Momento','Una cobertura esencial cuya disponibilidad, duración y entregables se confirman antes de reservar.',null,'consult',false,'published',40),
('historia','events','Eventos sociales','Historia','Una propuesta narrativa para documentar el evento con mayor amplitud. Alcance sujeto a validación.',null,'consult',true,'published',50),
('cinema','events','Eventos sociales','Cinema','Una propuesta audiovisual de mayor producción. El equipo y los entregables se cotizan según el evento.',null,'consult',false,'published',60)
on conflict(slug) do nothing;
create index if not exists commercial_packages_public_idx on public.commercial_packages(status,line,sort_order) where status='published';
create index if not exists package_share_links_token_idx on public.package_share_links(token_hash) where revoked_at is null;
alter table public.commercial_packages enable row level security;alter table public.package_share_links enable row level security;
revoke all on public.commercial_packages,public.package_share_links from anon,authenticated;grant all on public.commercial_packages,public.package_share_links to service_role;
commit;
