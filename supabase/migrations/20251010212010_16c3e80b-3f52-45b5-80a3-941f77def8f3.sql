-- Fix foreign keys to point to profiles table instead of auth.users

-- Drop existing foreign keys that point to auth.users
ALTER TABLE public.support_tickets
DROP CONSTRAINT support_tickets_user_id_fkey,
DROP CONSTRAINT support_tickets_assigned_to_fkey;

ALTER TABLE public.user_roles
DROP CONSTRAINT user_roles_user_id_fkey;

-- Add new foreign keys pointing to profiles table
ALTER TABLE public.support_tickets
ADD CONSTRAINT support_tickets_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.support_tickets
ADD CONSTRAINT support_tickets_assigned_to_fkey
FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add missing foreign key for ticket_notes.admin_id
ALTER TABLE public.ticket_notes
ADD CONSTRAINT ticket_notes_admin_id_fkey
FOREIGN KEY (admin_id) REFERENCES public.profiles(id) ON DELETE CASCADE;