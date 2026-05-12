CREATE OR REPLACE FUNCTION public.get_email_send_log(_limit int DEFAULT 200)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  template_name text,
  recipient_email text,
  status text,
  error_message text,
  message_id text,
  metadata jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, created_at, template_name, recipient_email, status, error_message, message_id, metadata
  FROM public.email_send_log
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
  ORDER BY created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 1000))
$$;

GRANT EXECUTE ON FUNCTION public.get_email_send_log(int) TO authenticated;