-- Create ticket_notes table for admin notes on support tickets
CREATE TABLE public.ticket_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ticket_notes
ALTER TABLE public.ticket_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for ticket_notes
CREATE POLICY "Admins can view all ticket notes"
ON public.ticket_notes
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create ticket notes"
ON public.ticket_notes
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ticket notes"
ON public.ticket_notes
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ticket notes"
ON public.ticket_notes
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_ticket_notes_updated_at
BEFORE UPDATE ON public.ticket_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Add assigned_to field to support_tickets
ALTER TABLE public.support_tickets
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;