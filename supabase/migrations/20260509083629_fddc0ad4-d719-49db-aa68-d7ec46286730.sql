
-- Org logos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('org-logos', 'org-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access to org logos
CREATE POLICY "Public can view org logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'org-logos');

-- Org admins can upload/update/delete logos for their org (path: <org_id>/...)
CREATE POLICY "Org admins can upload org logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'org-logos'
  AND public.has_org_permission(auth.uid(), ((storage.foldername(name))[1])::uuid, 'admin'::org_role)
);

CREATE POLICY "Org admins can update org logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'org-logos'
  AND public.has_org_permission(auth.uid(), ((storage.foldername(name))[1])::uuid, 'admin'::org_role)
);

CREATE POLICY "Org admins can delete org logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'org-logos'
  AND public.has_org_permission(auth.uid(), ((storage.foldername(name))[1])::uuid, 'admin'::org_role)
);

-- Per-organization audit log
CREATE TABLE public.org_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_user_id UUID,
  actor_email TEXT,
  action TEXT NOT NULL,
  target_email TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_org_audit_logs_org_created ON public.org_audit_logs(org_id, created_at DESC);

ALTER TABLE public.org_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can view audit log"
ON public.org_audit_logs FOR SELECT
TO authenticated
USING (public.has_org_permission(auth.uid(), org_id, 'admin'::org_role));

CREATE POLICY "Org members can insert audit log"
ON public.org_audit_logs FOR INSERT
TO authenticated
WITH CHECK (
  public.is_org_member(auth.uid(), org_id)
  AND (actor_user_id IS NULL OR actor_user_id = auth.uid())
);
