-- Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to check IP blacklists every 3 days at 2 AM UTC
SELECT cron.schedule(
  'check-ip-blacklists-every-3-days',
  '0 2 */3 * *', -- At 2:00 AM every 3 days
  $$
  SELECT
    net.http_post(
        url:='https://bffglkyopxhdzvozjwnm.supabase.co/functions/v1/check-ip-blacklists',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZmdsa3lvcHhoZHp2b3pqd25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5OTgxNDEsImV4cCI6MjA3NTU3NDE0MX0.eIQGkHe3Jme5QBstczKhmmFD3QY3_O_upauYleoGMWk"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);