import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// DNS blacklists to check
const BLACKLISTS = [
  'zen.spamhaus.org',
  'bl.spamcop.net',
  'b.barracudacentral.org',
  'dnsbl.sorbs.net',
  'psbl.surriel.com'
];

async function checkDNSBL(ip: string, blacklist: string): Promise<{ blacklist: string, isListed: boolean, details: string }> {
  try {
    const reversed = ip.split('.').reverse().join('.');
    const query = `${reversed}.${blacklist}`;
    
    // Use DNS-over-HTTPS to check if IP is blacklisted
    const response = await fetch(`https://dns.google/resolve?name=${query}&type=A`);
    const data = await response.json();
    
    const isListed = data.Status === 0 && data.Answer && data.Answer.length > 0;
    
    return {
      blacklist,
      isListed,
      details: isListed ? `Listed with response: ${JSON.stringify(data.Answer)}` : 'Not listed'
    };
  } catch (error) {
    console.error(`Error checking ${blacklist} for ${ip}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      blacklist,
      isListed: false,
      details: `Error checking: ${errorMessage}`
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting IP blacklist check...');

    // Get all active monitored IPs
    const { data: monitoredIPs, error: fetchError } = await supabase
      .from('monitored_ips')
      .select('*')
      .eq('status', 'active');

    if (fetchError) {
      console.error('Error fetching monitored IPs:', fetchError);
      throw fetchError;
    }

    console.log(`Checking ${monitoredIPs?.length || 0} IPs...`);

    const results = [];

    for (const ipRecord of monitoredIPs || []) {
      console.log(`Checking IP: ${ipRecord.ip_address}`);
      
      // Check against all blacklists
      for (const blacklist of BLACKLISTS) {
        const result = await checkDNSBL(ipRecord.ip_address, blacklist);
        
        // Store the result
        const { error: insertError } = await supabase
          .from('ip_blacklist_checks')
          .insert({
            monitored_ip_id: ipRecord.id,
            ip_address: ipRecord.ip_address,
            blacklist_name: result.blacklist,
            is_blacklisted: result.isListed,
            response_details: result.details,
          });

        if (insertError) {
          console.error('Error inserting check result:', insertError);
        }

        results.push({
          ip: ipRecord.ip_address,
          ...result
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const blacklistedCount = results.filter(r => r.isListed).length;
    console.log(`Check complete. ${blacklistedCount} blacklist entries found.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        checked: monitoredIPs?.length || 0,
        blacklisted: blacklistedCount,
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in check-ip-blacklists function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
