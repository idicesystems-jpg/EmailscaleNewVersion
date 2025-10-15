-- Fix remaining foreign keys to point to profiles table

-- Fix email_sends table
ALTER TABLE public.email_sends
DROP CONSTRAINT email_sends_user_id_fkey;

ALTER TABLE public.email_sends
ADD CONSTRAINT email_sends_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Fix warmup_accounts table
ALTER TABLE public.warmup_accounts
DROP CONSTRAINT warmup_accounts_user_id_fkey;

ALTER TABLE public.warmup_accounts
ADD CONSTRAINT warmup_accounts_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;