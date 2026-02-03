// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Environment variables loaded at runtime
const CLIPLYST_API_URL = Deno.env.get('CLIPLYST_API_URL') || 'https://cliplyst-content-maker-4qd6.onrender.com';

// Simple JWT creation (production should use a proper JWT library)
async function createJWT(payload: Record<string, string | number>, jwtSecret: string) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + 3600, // 1 hour expiry
  };

  const encoder = new TextEncoder();
  const headerEncoded = btoa(JSON.stringify(header));
  const payloadEncoded = btoa(JSON.stringify(tokenPayload));

  const signature = await crypto.subtle.sign(
    'HMAC',
    await crypto.subtle.importKey(
      'raw',
      encoder.encode(jwtSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    ),
    encoder.encode(`${headerEncoded}.${payloadEncoded}`)
  );

  const signatureEncoded = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${headerEncoded}.${payloadEncoded}.${signatureEncoded}`;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate required environment variables inside request handler
    const JWT_SECRET = Deno.env.get('JWT_SECRET');
    if (!JWT_SECRET) {
      console.error('ERROR: JWT_SECRET environment variable is not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error: JWT_SECRET not set' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LYNKSCOPE_INTERNAL_KEY = Deno.env.get('LYNKSCOPE_INTERNAL_KEY');
    if (!LYNKSCOPE_INTERNAL_KEY) {
      console.error('ERROR: LYNKSCOPE_INTERNAL_KEY environment variable is not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error: LYNKSCOPE_INTERNAL_KEY not set' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's business profile - use maybeSingle to handle missing profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('business_name, business_niche')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create JWT token with user info
    const jwtToken = await createJWT({
      sub: user.id,
      email: user.email || '',
      user_id: user.id,
      company_name: profile?.business_name || 'Unnamed Business',
      niche: profile?.business_niche || 'General',
    }, JWT_SECRET);

    console.log('[Cliplyst Session] Created JWT for user:', user.id);

    // Try to request embed URL from Cliplyst, with timeout
    let embedUrl = CLIPLYST_API_URL;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const cliplystResponse = await fetch(`${CLIPLYST_API_URL}/api/auth/embed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: jwtToken,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (cliplystResponse.ok) {
        const cliplystData = await cliplystResponse.json();
        if (cliplystData.embed_url) {
          embedUrl = cliplystData.embed_url;
          console.log('[Cliplyst Session] Received embed URL from Cliplyst');
        }
      } else {
        console.warn('[Cliplyst Session] Cliplyst API returned non-ok status:', cliplystResponse.status);
      }
    } catch (fetchError) {
      // If Cliplyst API is unavailable, use fallback URL with token
      console.warn('[Cliplyst Session] Cliplyst API unavailable, using fallback:', fetchError);
      embedUrl = `${CLIPLYST_API_URL}?token=${encodeURIComponent(jwtToken)}`;
    }

    return new Response(
      JSON.stringify({
        success: true,
        embed_url: embedUrl,
        token: jwtToken,
        message: 'Cliplyst session created successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err) {
    console.error('[Cliplyst Session] Error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
