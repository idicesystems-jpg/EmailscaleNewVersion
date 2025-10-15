-- Create helper functions for admin role checking
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'super_admin', 'admin_editor', 'admin_viewer')
  )
$$;

-- Create a function to get user's highest admin role
CREATE OR REPLACE FUNCTION public.get_admin_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
    AND role IN ('admin', 'super_admin', 'admin_editor', 'admin_viewer')
  ORDER BY CASE role
    WHEN 'super_admin' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'admin_editor' THEN 3
    WHEN 'admin_viewer' THEN 4
  END
  LIMIT 1
$$;