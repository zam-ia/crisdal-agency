begin;
select plan(17);

select has_table('public', 'portfolio_categories', 'portfolio categories table exists');
select has_table('public', 'media_assets', 'media assets table exists');
select has_table('public', 'portfolio_projects', 'portfolio projects table exists');
select has_table('public', 'portfolio_media', 'portfolio media table exists');
select has_table('public', 'publication_consents', 'publication consents table exists');
select has_table('public', 'commercial_packages', 'commercial packages table exists');
select has_table('public', 'package_share_links', 'package share links table exists');

select is((select relrowsecurity from pg_class where oid='public.portfolio_projects'::regclass), true, 'projects has RLS');
select is((select relrowsecurity from pg_class where oid='public.media_assets'::regclass), true, 'media assets has RLS');
select is((select relrowsecurity from pg_class where oid='public.publication_consents'::regclass), true, 'consents has RLS');
select is((select relrowsecurity from pg_class where oid='public.commercial_packages'::regclass), true, 'packages has RLS');
select is((select relrowsecurity from pg_class where oid='public.package_share_links'::regclass), true, 'share links has RLS');

select is((select has_table_privilege('anon','public.portfolio_projects','select')), false, 'anon cannot read private project rows');
select is((select has_table_privilege('authenticated','public.portfolio_projects','update')), false, 'authenticated cannot bypass portfolio authorization');
select is((select has_table_privilege('anon','public.commercial_packages','select')), false, 'anon cannot read commercial package internals');
select is((select has_table_privilege('authenticated','public.package_share_links','insert')), false, 'authenticated cannot forge share links');
select is((select has_table_privilege('anon','public.publication_consents','select')), false, 'anon cannot read consent evidence');

select * from finish();
rollback;
