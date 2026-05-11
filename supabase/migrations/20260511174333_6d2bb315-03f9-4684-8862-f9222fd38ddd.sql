-- 1) Tighten org-logos storage: drop broad public SELECT (listing) policy.
-- Public bucket still serves files via direct/public URLs; we just remove list ability.
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND (qual ILIKE '%org-logos%' OR with_check ILIKE '%org-logos%')
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Re-add a scoped SELECT policy: only org members can list logos for their org
CREATE POLICY "Org members can list org logos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'org-logos'
  AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

-- 2) Revoke EXECUTE from anon on all our SECURITY DEFINER helpers; grant to authenticated.
DO $$
DECLARE fn text;
BEGIN
  FOR fn IN
    SELECT format('%I.%I(%s)', n.nspname, p.proname, pg_get_function_identity_arguments(p.oid))
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.proname IN (
        'has_role','has_org_permission','is_org_member','get_org_role',
        'get_org_member_count','get_org_project_count','get_org_project_limit',
        'get_org_seat_limit','get_user_project_count','get_project_limit',
        'enforce_org_seat_limit','handle_new_user','handle_new_user_org',
        'handle_new_user_role','log_user_signup','notify_on_share'
      )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn);
  END LOOP;
END $$;