-- Create warmup logs table for tracking email warmup activity
CREATE TABLE public.warmup_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warmup_account_id UUID REFERENCES public.warmup_accounts(id) ON DELETE CASCADE,
  pool_account_id UUID REFERENCES public.warmup_pool(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'received', 'replied', 'bounced', 'failed')),
  subject TEXT,
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  landed_in TEXT CHECK (landed_in IN ('inbox', 'spam', 'promotions', 'updates', 'social', 'unknown')),
  message_id TEXT,
  thread_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.warmup_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all warmup logs
CREATE POLICY "Admins can view warmup logs"
  ON public.warmup_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage warmup logs
CREATE POLICY "Admins can manage warmup logs"
  ON public.warmup_logs
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own warmup logs
CREATE POLICY "Users can view their own warmup logs"
  ON public.warmup_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.warmup_accounts
      WHERE warmup_accounts.id = warmup_logs.warmup_account_id
      AND warmup_accounts.user_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_warmup_logs_updated_at
  BEFORE UPDATE ON public.warmup_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create indexes for faster queries
CREATE INDEX idx_warmup_logs_warmup_account ON public.warmup_logs(warmup_account_id);
CREATE INDEX idx_warmup_logs_status ON public.warmup_logs(status);
CREATE INDEX idx_warmup_logs_sent_at ON public.warmup_logs(sent_at);
CREATE INDEX idx_warmup_logs_landed_in ON public.warmup_logs(landed_in);