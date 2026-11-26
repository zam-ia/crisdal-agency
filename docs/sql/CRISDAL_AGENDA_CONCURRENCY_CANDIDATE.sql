-- CANDIDATE: validate in restored isolated PostgreSQL first. Not a production migration.
-- Preserve existing single-resource policy: all non-cancelled calendar activities conflict.
-- If business permits multiple teams, replace this with a per-resource constraint instead.
BEGIN;
LOCK TABLE public.calendar_activities IN SHARE ROW EXCLUSIVE MODE;
DO $$
BEGIN
 IF EXISTS (SELECT 1 FROM public.calendar_activities a JOIN public.calendar_activities b
 ON a.id < b.id AND a.status <> 'cancelled' AND b.status <> 'cancelled'
 AND tstzrange(a.starts_at,a.ends_at,'[)') && tstzrange(b.starts_at,b.ends_at,'[)'))
 THEN RAISE EXCEPTION 'Existing overlapping activities: reconcile manually before installing constraint'; END IF;
END $$;
ALTER TABLE public.calendar_activities ADD CONSTRAINT calendar_activities_no_active_overlap
 EXCLUDE USING gist (tstzrange(starts_at,ends_at,'[)') WITH &&)
 WHERE (status <> 'cancelled');
COMMIT;
-- Verify in two independent sessions: overlapping inserts/updates must fail with 23P01;
-- adjacent intervals and cancelled activities must be accepted. Test role grants and restore.
