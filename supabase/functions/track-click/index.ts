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

// Map country codes to continents
const countryToContinent: Record<string, { country: string; continent: string }> = {
  'US': { country: 'United States', continent: 'North America' },
  'CA': { country: 'Canada', continent: 'North America' },
  'MX': { country: 'Mexico', continent: 'North America' },
  'GB': { country: 'United Kingdom', continent: 'Europe' },
  'UK': { country: 'United Kingdom', continent: 'Europe' },
  'FR': { country: 'France', continent: 'Europe' },
  'DE': { country: 'Germany', continent: 'Europe' },
  'ES': { country: 'Spain', continent: 'Europe' },
  'IT': { country: 'Italy', continent: 'Europe' },
  'PT': { country: 'Portugal', continent: 'Europe' },
  'NL': { country: 'Netherlands', continent: 'Europe' },
  'BR': { country: 'Brazil', continent: 'South America' },
  'AR': { country: 'Argentina', continent: 'South America' },
  'CL': { country: 'Chile', continent: 'South America' },
  'CO': { country: 'Colombia', continent: 'South America' },
  'PE': { country: 'Peru', continent: 'South America' },
  'CN': { country: 'China', continent: 'Asia' },
  'JP': { country: 'Japan', continent: 'Asia' },
  'IN': { country: 'India', continent: 'Asia' },
  'KR': { country: 'South Korea', continent: 'Asia' },
  'TH': { country: 'Thailand', continent: 'Asia' },
  'SG': { country: 'Singapore', continent: 'Asia' },
  'AU': { country: 'Australia', continent: 'Oceania' },
  'NZ': { country: 'New Zealand', continent: 'Oceania' },
  'ZA': { country: 'South Africa', continent: 'Africa' },
  'EG': { country: 'Egypt', continent: 'Africa' },
  'NG': { country: 'Nigeria', continent: 'Africa' },
  'KE': { country: 'Kenya', continent: 'Africa' },
};

// Get location from browser language settings
const getLocationFromLanguage = (acceptLanguage: string | null): { country: string; continent: string } => {
  const defaultLocation = { country: 'United States', continent: 'North America' };
  
  if (!acceptLanguage) {
    console.log('No Accept-Language header, using default location');
    return defaultLocation;
  }
  
  console.log('Accept-Language header:', acceptLanguage);
  
  // Parse Accept-Language header (e.g., "en-US,en;q=0.9" or "es-MX")
  const languages = acceptLanguage.split(',').map(l => l.split(';')[0].trim());
  
  for (const lang of languages) {
    // Extract country code (e.g., "en-US" -> "US", "es-MX" -> "MX")
    const parts = lang.split('-');
    if (parts.length === 2) {
      const countryCode = parts[1].toUpperCase();
      console.log('Checking country code:', countryCode);
      if (countryToContinent[countryCode]) {
        console.log('Found location:', countryToContinent[countryCode]);
        return countryToContinent[countryCode];
      }
    }
  }
  
  console.log('No matching country code found, using default location');
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

    // Get location from browser language
    const acceptLanguage = req.headers.get('accept-language');
    const { country, continent } = getLocationFromLanguage(acceptLanguage);
    
    // Keep IP for logging purposes but don't use for geolocation
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');

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