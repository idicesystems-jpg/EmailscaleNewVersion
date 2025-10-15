-- Add purchase and expiry date tracking to domains table
ALTER TABLE public.domains
ADD COLUMN IF NOT EXISTS purchase_date DATE,
ADD COLUMN IF NOT EXISTS expiry_date DATE,
ADD COLUMN IF NOT EXISTS registrar TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for expiry date queries
CREATE INDEX IF NOT EXISTS idx_domains_expiry_date ON public.domains(expiry_date);
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON public.domains(user_id);

-- Update existing domains to set expiry date 1 year from creation if not set
UPDATE public.domains
SET 
  purchase_date = created_at::date,
  expiry_date = (created_at + INTERVAL '1 year')::date
WHERE purchase_date IS NULL;