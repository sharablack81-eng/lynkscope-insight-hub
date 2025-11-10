import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Parse user agent to extract browser and device info
const parseUserAgent = (userAgent: string | null): { browser: string; deviceType: string } => {
  if (!userAgent) return { browser: 'Unknown', deviceType: 'Unknown' };
  
  const ua = userAgent.toLowerCase();
  
  // Detect browser
  let browser = 'Other';
  if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';
  
  // Detect device type
  let deviceType = 'Desktop';
  if (ua.includes('mobile')) deviceType = 'Mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) deviceType = 'Tablet';
  
  return { browser, deviceType };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shortCode } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the link
    const { data: link, error: linkError } = await supabaseClient
      .from('links')
      .select('*')
      .eq('short_code', shortCode)
      .single();

    if (linkError || !link) {
      return new Response(
        JSON.stringify({ error: 'Link not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse user agent
    const userAgent = req.headers.get('user-agent');
    const { browser, deviceType } = parseUserAgent(userAgent);

    // Track the click
    const { error: clickError } = await supabaseClient
      .from('link_clicks')
      .insert({
        link_id: link.id,
        referrer: req.headers.get('referer'),
        user_agent: userAgent,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        browser,
        device_type: deviceType,
      });

    if (clickError) {
      console.error('Error tracking click:', clickError);
    }

    return new Response(
      JSON.stringify({ url: link.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});