import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Environment variables loaded from supabase/config.toml
const CLIPLYST_API_URL = Deno.env.get('CLIPLYST_API_URL') || 'https://cliplyst-content-maker.onrender.com';
const JWT_SECRET = Deno.env.get('JWT_SECRET');
const LYNKSCOPE_INTERNAL_KEY = Deno.env.get('LYNKSCOPE_INTERNAL_KEY');

// Validate required environment variables
if (!JWT_SECRET) {
  console.error('ERROR: JWT_SECRET environment variable is not configured');
  throw new Error('JWT_SECRET must be set in Supabase Edge Functions environment');
}

if (!LYNKSCOPE_INTERNAL_KEY) {
  console.error('ERROR: LYNKSCOPE_INTERNAL_KEY environment variable is not configured');
  throw new Error('LYNKSCOPE_INTERNAL_KEY must be set in Supabase Edge Functions environment');
}

// Simple JWT creation (production should use a proper JWT library)
async function createJWT(payload: Record<string, string | number>) {
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
      encoder.encode(JWT_SECRET),
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

    // Get user's business profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('business_name, niche')
      .eq('id', user.id)
      .single();

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
      niche: profile?.niche || 'General',
    });

    console.log('[Cliplyst Session] Created JWT for user:', user.id);

    // Request embed URL from Cliplyst
    const cliplystResponse = await fetch(`${CLIPLYST_API_URL}/api/auth/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: jwtToken,
      }),
    });

    if (!cliplystResponse.ok) {
      let cliplystError;
      try {
        cliplystError = await cliplystResponse.json();
      } catch {
        cliplystError = { error: `HTTP ${cliplystResponse.status}` };
      }

      console.error('[Cliplyst Session] Cliplyst error:', cliplystError);
      throw new Error(cliplystError.error || `Cliplyst API error: ${cliplystResponse.status}`);
    }

    const cliplystData = await cliplystResponse.json();

    console.log('[Cliplyst Session] Received embed URL from Cliplyst');

    return new Response(
      JSON.stringify({
        success: true,
        embed_url: cliplystData.embed_url || CLIPLYST_API_URL,
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
