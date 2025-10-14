-- Add foreign key constraints to link tables to profiles
-- This fixes the relationship errors we're seeing

-- Add foreign key to domains table
ALTER TABLE public.domains
DROP CONSTRAINT IF EXISTS domains_user_id_fkey,
ADD CONSTRAINT domains_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- Add foreign key to inboxes table
ALTER TABLE public.inboxes
DROP CONSTRAINT IF EXISTS inboxes_user_id_fkey,
ADD CONSTRAINT inboxes_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- Add foreign key from inboxes to domains
ALTER TABLE public.inboxes
DROP CONSTRAINT IF EXISTS inboxes_domain_id_fkey,
ADD CONSTRAINT inboxes_domain_id_fkey 
  FOREIGN KEY (domain_id) 
  REFERENCES public.domains(id) 
  ON DELETE SET NULL;