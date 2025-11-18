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

// Get location from IP address using ip-api.com (free service)
const getLocationFromIP = async (ip: string | null): Promise<{ country: string; continent: string }> => {
  // Default to North America for local/development IPs
  const defaultLocation = { country: 'United States', continent: 'North America' };
  
  if (!ip || ip === '::1' || ip === '127.0.0.1') {
    console.log('Localhost IP detected, using default location:', defaultLocation);
    return defaultLocation;
  }
  
  // Extract the real public IP from comma-separated list (handles proxy forwarding)
  // The x-forwarded-for header often contains: "client, proxy1, proxy2"
  // We want the first public IP in the chain
  const publicIP = ip.split(',').map(i => i.trim()).find(i => 
    !i.startsWith('172.') && 
    !i.startsWith('192.168.') && 
    !i.startsWith('10.') &&
    i !== '::1' &&
    i !== '127.0.0.1'
  );

  if (!publicIP) {
    console.log('No public IP found in:', ip, 'using default location:', defaultLocation);
    return defaultLocation;
  }
  
  try {
    console.log('Fetching location for IP:', publicIP);
    const response = await fetch(`http://ip-api.com/json/${publicIP}`);
    const data = await response.json();
    
    console.log('Location API response:', data);
    
    if (data.status === 'success') {
      return {
        country: data.country || defaultLocation.country,
        continent: data.continent || defaultLocation.continent
      };
    } else {
      console.log('Location API failed:', data.message, 'using default location');
    }
  } catch (error) {
    console.error('Error fetching location:', error, 'using default location');
  }
  
  return defaultLocation;
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

    // Check if link has expiry settings
    const { data: expireLink } = await supabaseClient
      .from('expire_links')
      .select('*')
      .eq('link_id', link.id)
      .single();

    // If link has expiry settings, check if it's expired or inactive
    if (expireLink) {
      // Check if link is toggled off
      if (!expireLink.is_active) {
        return new Response(
          JSON.stringify({ error: 'Link is inactive' }),
          { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check time-based or day-based expiry
      if ((expireLink.expire_type === 'time-based' || expireLink.expire_type === 'day-based') && expireLink.expires_at) {
        if (new Date(expireLink.expires_at) < new Date()) {
          return new Response(
            JSON.stringify({ error: 'Link has expired' }),
            { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Check click-based expiry
      if (expireLink.expire_type === 'click-based' && expireLink.max_clicks) {
        const { count } = await supabaseClient
          .from('link_clicks')
          .select('*', { count: 'exact', head: true })
          .eq('link_id', link.id);

        if (count && count >= expireLink.max_clicks) {
          return new Response(
            JSON.stringify({ error: 'Link has reached maximum clicks' }),
            { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Parse user agent
    const userAgent = req.headers.get('user-agent');
    const { browser, deviceType } = parseUserAgent(userAgent);

    // Get IP address and location
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
    const { country, continent } = await getLocationFromIP(ipAddress);

    // Track the click
    const { error: clickError } = await supabaseClient
      .from('link_clicks')
      .insert({
        link_id: link.id,
        referrer: req.headers.get('referer'),
        user_agent: userAgent,
        ip_address: ipAddress,
        browser,
        device_type: deviceType,
        country,
        continent,
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