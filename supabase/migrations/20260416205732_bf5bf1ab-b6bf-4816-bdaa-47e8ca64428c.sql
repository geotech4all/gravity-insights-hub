
-- ============================================================
-- 1. ENUMS
-- ============================================================
CREATE TYPE public.org_type AS ENUM ('company', 'institution');
CREATE TYPE public.org_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
ALTER TYPE public.subscription_tier ADD VALUE IF NOT EXISTS 'academic';

-- ============================================================
-- 2. ORGANIZATIONS TABLE
-- ============================================================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type public.org_type NOT NULL DEFAULT 'company',
  tier public.subscription_tier NOT NULL DEFAULT 'free',
  country TEXT,
  email_domain TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  logo_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_organizations_type ON public.organizations(type);
CREATE INDEX idx_organizations_email_domain ON public.organizations(email_domain);

-- ============================================================
-- 3. ORGANIZATION MEMBERS TABLE
-- ============================================================
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role public.org_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);

CREATE INDEX idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX idx_org_members_org ON public.organization_members(org_id);

-- ============================================================
-- 4. ORGANIZATION INVITES TABLE
-- ============================================================
CREATE TABLE public.organization_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.org_role NOT NULL DEFAULT 'viewer',
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  invited_by UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_org_invites_email ON public.organization_invites(email);
CREATE INDEX idx_org_invites_token ON public.organization_invites(token);

-- ============================================================
-- 5. ADD org_id TO PROJECTS
-- ============================================================
ALTER TABLE public.projects ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX idx_projects_org_id ON public.projects(org_id);

-- ============================================================
-- 6. SECURITY DEFINER HELPER FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND org_id = _org_id
  )
$$;

CREATE OR REPLACE FUNCTION public.get_org_role(_user_id UUID, _org_id UUID)
RETURNS public.org_role
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.organization_members
  WHERE user_id = _user_id AND org_id = _org_id
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.has_org_permission(_user_id UUID, _org_id UUID, _min_role public.org_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND org_id = _org_id
      AND CASE _min_role
        WHEN 'viewer' THEN role IN ('viewer','editor','admin','owner')
        WHEN 'editor' THEN role IN ('editor','admin','owner')
        WHEN 'admin'  THEN role IN ('admin','owner')
        WHEN 'owner'  THEN role = 'owner'
      END
  )
$$;

CREATE OR REPLACE FUNCTION public.is_academic_email(_email TEXT)
RETURNS BOOLEAN
LANGUAGE SQL IMMUTABLE
AS $$
  SELECT _email ~* '\.(edu|ac\.[a-z]{2,3}|edu\.[a-z]{2,3})$'
$$;

-- ============================================================
-- 7. ENABLE RLS
-- ============================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. RLS POLICIES — organizations
-- ============================================================
CREATE POLICY "Members can view their orgs"
ON public.organizations FOR SELECT TO authenticated
USING (public.is_org_member(auth.uid(), id));

CREATE POLICY "Authenticated can create orgs"
ON public.organizations FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update org"
ON public.organizations FOR UPDATE TO authenticated
USING (public.has_org_permission(auth.uid(), id, 'admin'));

CREATE POLICY "Owners can delete org"
ON public.organizations FOR DELETE TO authenticated
USING (public.has_org_permission(auth.uid(), id, 'owner'));

-- ============================================================
-- 9. RLS POLICIES — organization_members
-- ============================================================
CREATE POLICY "Members can view members of their orgs"
ON public.organization_members FOR SELECT TO authenticated
USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Admins can add members"
ON public.organization_members FOR INSERT TO authenticated
WITH CHECK (
  public.has_org_permission(auth.uid(), org_id, 'admin')
  OR user_id = auth.uid()
);

CREATE POLICY "Admins can update members"
ON public.organization_members FOR UPDATE TO authenticated
USING (public.has_org_permission(auth.uid(), org_id, 'admin'));

CREATE POLICY "Admins can remove members"
ON public.organization_members FOR DELETE TO authenticated
USING (
  public.has_org_permission(auth.uid(), org_id, 'admin')
  OR user_id = auth.uid()
);

-- ============================================================
-- 10. RLS POLICIES — organization_invites
-- ============================================================
CREATE POLICY "Org admins can view invites"
ON public.organization_invites FOR SELECT TO authenticated
USING (public.has_org_permission(auth.uid(), org_id, 'admin'));

CREATE POLICY "Org admins can create invites"
ON public.organization_invites FOR INSERT TO authenticated
WITH CHECK (public.has_org_permission(auth.uid(), org_id, 'admin') AND invited_by = auth.uid());

CREATE POLICY "Org admins can delete invites"
ON public.organization_invites FOR DELETE TO authenticated
USING (public.has_org_permission(auth.uid(), org_id, 'admin'));

-- ============================================================
-- 11. UPDATED PROJECT RLS — org-aware
-- ============================================================
CREATE POLICY "Org members can view org projects"
ON public.projects FOR SELECT TO authenticated
USING (org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org editors can insert org projects"
ON public.projects FOR INSERT TO authenticated
WITH CHECK (
  org_id IS NULL
  OR public.has_org_permission(auth.uid(), org_id, 'editor')
);

CREATE POLICY "Org editors can update org projects"
ON public.projects FOR UPDATE TO authenticated
USING (org_id IS NOT NULL AND public.has_org_permission(auth.uid(), org_id, 'editor'));

CREATE POLICY "Org admins can delete org projects"
ON public.projects FOR DELETE TO authenticated
USING (org_id IS NOT NULL AND public.has_org_permission(auth.uid(), org_id, 'admin'));

-- ============================================================
-- 12. UPDATED-AT TRIGGER for organizations
-- ============================================================
CREATE TRIGGER trg_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 13. AUTO-CREATE WORKSPACE + INSTITUTION ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_org()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _workspace_id UUID;
  _institution_id UUID;
  _display_name TEXT;
  _email_domain TEXT;
  _slug TEXT;
BEGIN
  _display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  _email_domain := lower(split_part(NEW.email, '@', 2));

  -- Personal workspace
  _slug := 'ws-' || substr(NEW.id::text, 1, 8);
  INSERT INTO public.organizations (name, slug, type, tier, created_by)
  VALUES (_display_name || '''s Workspace', _slug, 'company', 'free', NEW.id)
  RETURNING id INTO _workspace_id;

  INSERT INTO public.organization_members (org_id, user_id, role)
  VALUES (_workspace_id, NEW.id, 'owner');

  -- Auto-institution if academic email
  IF public.is_academic_email(NEW.email) THEN
    SELECT id INTO _institution_id FROM public.organizations
    WHERE email_domain = _email_domain AND type = 'institution' LIMIT 1;

    IF _institution_id IS NULL THEN
      _slug := 'inst-' || regexp_replace(_email_domain, '[^a-z0-9]+', '-', 'g');
      INSERT INTO public.organizations (name, slug, type, tier, email_domain, verified, created_by)
      VALUES (initcap(split_part(_email_domain, '.', 1)), _slug, 'institution', 'academic', _email_domain, true, NEW.id)
      RETURNING id INTO _institution_id;

      INSERT INTO public.organization_members (org_id, user_id, role)
      VALUES (_institution_id, NEW.id, 'owner');
    ELSE
      INSERT INTO public.organization_members (org_id, user_id, role)
      VALUES (_institution_id, NEW.id, 'editor')
      ON CONFLICT (org_id, user_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_org
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_org();

-- ============================================================
-- 14. BACKFILL EXISTING USERS
-- ============================================================
DO $$
DECLARE
  _user RECORD;
  _workspace_id UUID;
  _slug TEXT;
  _name TEXT;
BEGIN
  FOR _user IN SELECT id, email FROM auth.users LOOP
    -- Skip if user already has any membership
    IF EXISTS (SELECT 1 FROM public.organization_members WHERE user_id = _user.id) THEN
      CONTINUE;
    END IF;

    SELECT COALESCE(display_name, split_part(_user.email, '@', 1)) INTO _name
    FROM public.profiles WHERE user_id = _user.id LIMIT 1;
    IF _name IS NULL THEN _name := split_part(_user.email, '@', 1); END IF;

    _slug := 'ws-' || substr(_user.id::text, 1, 8);
    INSERT INTO public.organizations (name, slug, type, tier, created_by)
    VALUES (_name || '''s Workspace', _slug, 'company', 'free', _user.id)
    RETURNING id INTO _workspace_id;

    INSERT INTO public.organization_members (org_id, user_id, role)
    VALUES (_workspace_id, _user.id, 'owner');

    -- Move existing projects into this workspace
    UPDATE public.projects SET org_id = _workspace_id
    WHERE user_id = _user.id AND org_id IS NULL;
  END LOOP;
END $$;
