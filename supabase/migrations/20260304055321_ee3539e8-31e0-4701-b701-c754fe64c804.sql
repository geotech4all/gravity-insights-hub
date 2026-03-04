
-- ═══════════════════════════════════════════════════════════
-- Phase 5C: Project Sharing
-- ═══════════════════════════════════════════════════════════

-- Share permission enum
CREATE TYPE public.share_permission AS ENUM ('viewer', 'editor');

-- Project shares table
CREATE TABLE public.project_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  shared_with_email TEXT NOT NULL,
  shared_with_user_id UUID,
  permission share_permission NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, shared_with_email)
);

CREATE INDEX idx_project_shares_owner ON public.project_shares(owner_id);
CREATE INDEX idx_project_shares_shared_user ON public.project_shares(shared_with_user_id);
CREATE INDEX idx_project_shares_email ON public.project_shares(shared_with_email);

ALTER TABLE public.project_shares ENABLE ROW LEVEL SECURITY;

-- Owner can manage shares on their projects
CREATE POLICY "Owners can manage shares"
ON public.project_shares FOR ALL TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Shared users can view their shares
CREATE POLICY "Shared users can view their shares"
ON public.project_shares FOR SELECT TO authenticated
USING (shared_with_user_id = auth.uid());

-- Allow shared users to SELECT projects shared with them
CREATE POLICY "Shared users can view shared projects"
ON public.projects FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.project_shares
    WHERE project_shares.project_id = projects.id
    AND project_shares.shared_with_user_id = auth.uid()
  )
);

-- Allow shared editors to UPDATE shared projects
CREATE POLICY "Shared editors can update shared projects"
ON public.projects FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.project_shares
    WHERE project_shares.project_id = projects.id
    AND project_shares.shared_with_user_id = auth.uid()
    AND project_shares.permission = 'editor'
  )
);

-- ═══════════════════════════════════════════════════════════
-- Admin: User roles + activity logging
-- ═══════════════════════════════════════════════════════════

CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Only admins can view roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can manage roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Activity logs (private to admins only)
CREATE TABLE public.user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_logs_user ON public.user_activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON public.user_activity_logs(action);
CREATE INDEX idx_activity_logs_created ON public.user_activity_logs(created_at DESC);

ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view activity logs
CREATE POLICY "Admins can view activity logs"
ON public.user_activity_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Anyone authenticated can insert their own activity (for tracking)
CREATE POLICY "Users can log own activity"
ON public.user_activity_logs FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admin: allow viewing ALL profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin: allow viewing ALL projects
CREATE POLICY "Admins can view all projects"
ON public.projects FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Auto-assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Trigger for logging signups
CREATE OR REPLACE FUNCTION public.log_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_activity_logs (user_id, user_email, action, metadata)
  VALUES (NEW.id, NEW.email, 'signup', jsonb_build_object('provider', COALESCE(NEW.raw_app_meta_data->>'provider', 'email')));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_signup_log
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.log_user_signup();
