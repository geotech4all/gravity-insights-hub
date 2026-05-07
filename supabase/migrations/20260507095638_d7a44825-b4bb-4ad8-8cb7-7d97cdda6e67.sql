
CREATE OR REPLACE FUNCTION public.get_org_seat_limit(_org_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE tier
    WHEN 'free' THEN 3
    WHEN 'standard' THEN 15
    WHEN 'academic' THEN 999999
    WHEN 'enterprise' THEN 999999
    ELSE 3
  END
  FROM public.organizations WHERE id = _org_id
$$;

CREATE OR REPLACE FUNCTION public.get_org_member_count(_org_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.organization_members WHERE org_id = _org_id
$$;

CREATE OR REPLACE FUNCTION public.get_org_project_limit(_org_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE tier
    WHEN 'free' THEN 5
    WHEN 'standard' THEN 50
    WHEN 'academic' THEN 999999
    WHEN 'enterprise' THEN 999999
    ELSE 5
  END
  FROM public.organizations WHERE id = _org_id
$$;

CREATE OR REPLACE FUNCTION public.get_org_project_count(_org_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.projects WHERE org_id = _org_id
$$;

-- Trigger to enforce seat limits on member additions
CREATE OR REPLACE FUNCTION public.enforce_org_seat_limit()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _limit int;
  _count int;
BEGIN
  _limit := public.get_org_seat_limit(NEW.org_id);
  SELECT COUNT(*) INTO _count FROM public.organization_members WHERE org_id = NEW.org_id;
  IF _count >= _limit THEN
    RAISE EXCEPTION 'Organization has reached its seat limit (%).', _limit
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_org_seat_limit ON public.organization_members;
CREATE TRIGGER trg_enforce_org_seat_limit
BEFORE INSERT ON public.organization_members
FOR EACH ROW EXECUTE FUNCTION public.enforce_org_seat_limit();

-- Update signup handler to skip auto-join when institution is full
CREATE OR REPLACE FUNCTION public.handle_new_user_org()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _workspace_id UUID;
  _institution_id UUID;
  _display_name TEXT;
  _email_domain TEXT;
  _slug TEXT;
  _seat_count int;
  _seat_limit int;
BEGIN
  _display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  _email_domain := lower(split_part(NEW.email, '@', 2));

  _slug := 'ws-' || substr(NEW.id::text, 1, 8);
  INSERT INTO public.organizations (name, slug, type, tier, created_by)
  VALUES (_display_name || '''s Workspace', _slug, 'company', 'free', NEW.id)
  RETURNING id INTO _workspace_id;

  INSERT INTO public.organization_members (org_id, user_id, role)
  VALUES (_workspace_id, NEW.id, 'owner');

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
      _seat_limit := public.get_org_seat_limit(_institution_id);
      SELECT COUNT(*) INTO _seat_count FROM public.organization_members WHERE org_id = _institution_id;
      IF _seat_count < _seat_limit THEN
        INSERT INTO public.organization_members (org_id, user_id, role)
        VALUES (_institution_id, NEW.id, 'editor')
        ON CONFLICT (org_id, user_id) DO NOTHING;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
