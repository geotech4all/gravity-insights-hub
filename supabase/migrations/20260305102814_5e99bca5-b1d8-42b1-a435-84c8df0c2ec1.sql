-- Add subscription tier enum
CREATE TYPE public.subscription_tier AS ENUM ('free', 'standard', 'enterprise');

-- Add tier column to profiles
ALTER TABLE public.profiles
  ADD COLUMN subscription_tier subscription_tier NOT NULL DEFAULT 'free';

-- Add project limit function
CREATE OR REPLACE FUNCTION public.get_project_limit(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE
    WHEN p.subscription_tier = 'free' THEN 5
    WHEN p.subscription_tier = 'standard' THEN 50
    WHEN p.subscription_tier = 'enterprise' THEN 999999
    ELSE 5
  END
  FROM public.profiles p
  WHERE p.user_id = _user_id
$$;

-- Function to get current project count
CREATE OR REPLACE FUNCTION public.get_user_project_count(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COUNT(*)::integer FROM public.projects WHERE user_id = _user_id
$$;