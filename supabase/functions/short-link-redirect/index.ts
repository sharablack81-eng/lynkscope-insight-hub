// @ts-nocheck
// @deno-types="https://deno.land/std@0.208.0/http/server.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @deno-types="https://esm.sh/@supabase/supabase-js@2/dist/module/index.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  console.log('SHORT LINK REDIRECT - Method:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const shortCode = url.pathname.split('/').pop(); // Extract short code from path

    if (!shortCode) {
      return new Response(
        JSON.stringify({ error: 'Short code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Look up the short link
    const { data: shortLink, error: lookupError } = await supabaseClient
      .from('short_links')
      .select('*')
      .eq('short_code', shortCode)
      .single();

    if (lookupError || !shortLink) {
      console.log('Short link not found:', shortCode);
      return new Response(
        JSON.stringify({ error: 'Short link not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract analytics data from request headers
    const userAgent = req.headers.get('user-agent');
    const referrer = req.headers.get('referer');
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
    const acceptLanguage = req.headers.get('accept-language');

    // Parse user agent for browser and device
    const ua = userAgent?.toLowerCase() || '';
    let browser = 'Other';
    if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('edg')) browser = 'Edge';
    else if (ua.includes('chrome')) browser = 'Chrome';
    else if (ua.includes('safari')) browser = 'Safari';
    else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';

    let deviceType = 'Desktop';
    if (ua.includes('mobile')) deviceType = 'Mobile';
    else if (ua.includes('tablet') || ua.includes('ipad')) deviceType = 'Tablet';

    // Get location from language
    const countryToContinent: Record<string, { country: string; continent: string }> = {
      'US': { country: 'United States', continent: 'North America' },
      'CA': { country: 'Canada', continent: 'North America' },
      'MX': { country: 'Mexico', continent: 'North America' },
      'GB': { country: 'United Kingdom', continent: 'Europe' },
      'FR': { country: 'France', continent: 'Europe' },
      'DE': { country: 'Germany', continent: 'Europe' },
      'BR': { country: 'Brazil', continent: 'South America' },
      'JP': { country: 'Japan', continent: 'Asia' },
      'IN': { country: 'India', continent: 'Asia' },
      'AU': { country: 'Australia', continent: 'Oceania' },
      'ZA': { country: 'South Africa', continent: 'Africa' },
    };

    let country = 'United States';
    let continent = 'North America';

    if (acceptLanguage) {
      const languages = acceptLanguage.split(',').map((l: string) => l.split(';')[0].trim());
      for (const lang of languages) {
        const parts = lang.split('-');
        if (parts.length === 2) {
          const countryCode = parts[1].toUpperCase();
          if (countryToContinent[countryCode]) {
            const loc = countryToContinent[countryCode];
            country = loc.country;
            continent = loc.continent;
            break;
          }
        }
      }
    }

    // Increment click count and update last clicked timestamp
    const { error: updateError } = await supabaseClient
      .from('short_links')
      .update({
        click_count: shortLink.click_count + 1,
        last_clicked_at: new Date().toISOString()
      })
      .eq('id', shortLink.id);

    if (updateError) {
      console.error('Error updating click count:', updateError);
    }

    // Record the click in smart_link_clicks for analytics (with link_id if available)
    const { error: clickError } = await supabaseClient
      .from('smart_link_clicks')
      .insert({
        destination_url: shortLink.original_url,
        link_id: null, // Short links are independent of regular links
        merchant_id: shortLink.user_id,
        referrer: referrer,
        user_agent: userAgent,
        ip_address: ipAddress,
        browser: browser,
        device_type: deviceType,
        country: country,
        continent: continent,
      });

    if (clickError) {
      console.error('Error recording click analytics:', clickError);
    }

    // Return 302 redirect to original URL
    return new Response(null, {
      status: 302,
      headers: {
        'Location': shortLink.original_url,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
