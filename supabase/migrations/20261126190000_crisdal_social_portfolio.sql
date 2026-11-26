begin;

alter table public.media_assets
  add column if not exists external_content_type text;

alter table public.media_assets
  drop constraint if exists media_assets_kind_check,
  drop constraint if exists media_assets_external_provider_check,
  drop constraint if exists media_assets_external_content_type_check;

alter table public.media_assets
  add constraint media_assets_kind_check
    check (kind in ('image', 'video', 'social')),
  add constraint media_assets_external_provider_check
    check (external_provider is null or external_provider in ('youtube', 'vimeo', 'tiktok', 'facebook', 'instagram')),
  add constraint media_assets_external_content_type_check
    check (external_content_type is null or external_content_type in ('photo', 'carousel', 'post', 'reel', 'video'));

update public.media_assets
set external_content_type = 'video'
where provider = 'external'
  and external_content_type is null;

comment on column public.media_assets.external_content_type is
  'Editorial type inferred from an allow-listed canonical social or video URL; no remote HTML is stored.';

commit;
