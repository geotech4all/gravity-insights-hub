CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.notify_on_share()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _project_name text;
  _target_user_id uuid;
BEGIN
  SELECT name INTO _project_name FROM public.projects WHERE id = NEW.project_id;

  IF NEW.shared_with_user_id IS NOT NULL THEN
    _target_user_id := NEW.shared_with_user_id;
  ELSE
    SELECT p.user_id INTO _target_user_id
    FROM public.profiles p
    WHERE p.display_name = NEW.shared_with_email
    LIMIT 1;
  END IF;

  IF _target_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, metadata)
    VALUES (
      _target_user_id,
      'Project shared with you',
      format('You have been given %s access to "%s"', NEW.permission, COALESCE(_project_name, 'a project')),
      jsonb_build_object('project_id', NEW.project_id, 'permission', NEW.permission::text)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_project_share_notify
  AFTER INSERT ON public.project_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_share();