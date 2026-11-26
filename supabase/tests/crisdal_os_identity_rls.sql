begin;
select plan(11);

select has_table('public', 'crisdal_os_users', 'users table exists');
select has_table('public', 'crisdal_os_sessions', 'sessions table exists');
select has_table('public', 'crisdal_os_audit_events', 'audit table exists');
select has_table('public', 'crisdal_os_login_attempts', 'login attempts table exists');
select has_table('public', 'crisdal_os_migration_runs', 'migration runs table exists');
select has_table('public', 'crisdal_os_id_map', 'id map table exists');
select is((select relrowsecurity from pg_class where oid='public.crisdal_os_users'::regclass), true, 'users has RLS');
select is((select relrowsecurity from pg_class where oid='public.crisdal_os_sessions'::regclass), true, 'sessions has RLS');
select is((select has_table_privilege('anon','public.crisdal_os_users','select')), false, 'anon cannot read users');
select is((select has_table_privilege('authenticated','public.crisdal_os_sessions','select')), false, 'authenticated cannot read sessions directly');
select is((select has_table_privilege('authenticated','public.crisdal_os_audit_events','insert')), false, 'authenticated cannot forge audit events');

select * from finish();
rollback;
