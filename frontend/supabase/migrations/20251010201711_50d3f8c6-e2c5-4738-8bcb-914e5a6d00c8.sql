-- Create warmup pool table for admin-managed accounts
CREATE TABLE public.warmup_pool (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_address TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'aol', 'yahoo', 'microsoft', 'other')),
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_username TEXT,
  smtp_password TEXT,
  imap_host TEXT,
  imap_port INTEGER,
  imap_username TEXT,
  imap_password TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  daily_sends INTEGER DEFAULT 0,
  total_sends INTEGER DEFAULT 0,
  last_send_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.warmup_pool ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage warmup pool
CREATE POLICY "Admins can view warmup pool"
  ON public.warmup_pool
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage warmup pool"
  ON public.warmup_pool
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_warmup_pool_updated_at
  BEFORE UPDATE ON public.warmup_pool
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create index for faster lookups
CREATE INDEX idx_warmup_pool_provider ON public.warmup_pool(provider);
CREATE INDEX idx_warmup_pool_status ON public.warmup_pool(status);