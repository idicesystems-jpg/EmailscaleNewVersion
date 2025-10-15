-- Create server monitoring tables

-- Table for tracking server IPs
CREATE TABLE public.monitored_ips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL UNIQUE,
  hostname TEXT,
  server_location TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for IP blacklist check results
CREATE TABLE public.ip_blacklist_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  monitored_ip_id UUID REFERENCES public.monitored_ips(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  blacklist_name TEXT NOT NULL,
  is_blacklisted BOOLEAN DEFAULT false,
  response_details TEXT,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for spam complaints
CREATE TABLE public.spam_complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_address TEXT NOT NULL,
  complaint_type TEXT CHECK (complaint_type IN ('spamhaus', 'feedback_loop', 'manual', 'other')),
  complaint_source TEXT,
  complaint_details TEXT,
  ip_address TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.monitored_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_blacklist_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spam_complaints ENABLE ROW LEVEL SECURITY;

-- Admin policies for monitored_ips
CREATE POLICY "Admins can view monitored IPs"
  ON public.monitored_ips FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage monitored IPs"
  ON public.monitored_ips FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin policies for ip_blacklist_checks
CREATE POLICY "Admins can view blacklist checks"
  ON public.ip_blacklist_checks FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage blacklist checks"
  ON public.ip_blacklist_checks FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin policies for spam_complaints
CREATE POLICY "Admins can view spam complaints"
  ON public.spam_complaints FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage spam complaints"
  ON public.spam_complaints FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_monitored_ips_updated_at
  BEFORE UPDATE ON public.monitored_ips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_spam_complaints_updated_at
  BEFORE UPDATE ON public.spam_complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create indexes
CREATE INDEX idx_monitored_ips_status ON public.monitored_ips(status);
CREATE INDEX idx_blacklist_checks_ip ON public.ip_blacklist_checks(ip_address);
CREATE INDEX idx_blacklist_checks_checked_at ON public.ip_blacklist_checks(checked_at);
CREATE INDEX idx_spam_complaints_resolved ON public.spam_complaints(resolved);
CREATE INDEX idx_spam_complaints_created_at ON public.spam_complaints(created_at);