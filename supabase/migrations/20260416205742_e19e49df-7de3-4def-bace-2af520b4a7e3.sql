CREATE OR REPLACE FUNCTION public.is_academic_email(_email TEXT)
RETURNS BOOLEAN
LANGUAGE SQL IMMUTABLE
SET search_path = public
AS $$
  SELECT _email ~* '\.(edu|ac\.[a-z]{2,3}|edu\.[a-z]{2,3})$'
$$;