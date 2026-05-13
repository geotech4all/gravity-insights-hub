CREATE OR REPLACE FUNCTION public.get_org_project_limit(_org_id uuid)
 RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT CASE tier
    WHEN 'free' THEN 5
    WHEN 'standard' THEN 50
    WHEN 'academic' THEN 50
    WHEN 'enterprise' THEN 999999
    ELSE 5
  END FROM public.organizations WHERE id = _org_id
$function$;