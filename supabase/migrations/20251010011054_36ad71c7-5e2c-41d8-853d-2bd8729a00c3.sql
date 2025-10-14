-- Add email credentials columns to inboxes table
ALTER TABLE public.inboxes 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS imap_username TEXT,
ADD COLUMN IF NOT EXISTS imap_password TEXT,
ADD COLUMN IF NOT EXISTS imap_host TEXT,
ADD COLUMN IF NOT EXISTS imap_port INTEGER,
ADD COLUMN IF NOT EXISTS smtp_username TEXT,
ADD COLUMN IF NOT EXISTS smtp_password TEXT,
ADD COLUMN IF NOT EXISTS smtp_host TEXT,
ADD COLUMN IF NOT EXISTS smtp_port INTEGER;

-- Add warmup settings to warmup_accounts table
ALTER TABLE public.warmup_accounts
ADD COLUMN IF NOT EXISTS warmup_limit INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS warmup_increment INTEGER DEFAULT 5;