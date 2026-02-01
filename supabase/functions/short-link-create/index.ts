// @ts-nocheck
// @deno-types="https://deno.land/std@0.208.0/http/server.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @deno-types="https://esm.sh/@supabase/supabase-js@2/dist/module/index.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @deno-types="https://esm.sh/jwt-decode@4.0.0/index.d.ts"
import { jwtDecode } from "https://esm.sh/jwt-decode@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Generate a random 6-8 character alphanumeric short code
 */
function generateShortCode(): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const length = Math.random() < 0.5 ? 6 : 7;
  let code = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    code += chars[array[i] % chars.length];
  }
  return code;
}

/**
 * Ensure short code uniqueness
 */
async function ensureUniqueShortCode(
  supabaseClient: ReturnType<typeof createClient>,
  maxRetries: number = 5
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const code = generateShortCode();
    const { data, error } = await supabaseClient
      .from('short_links')
      .select('short_code', { count: 'exact', head: true })
      .eq('short_code', code);
    
    if (!error && !data?.length) {
      return code;
    }
  }
  
  throw new Error('Failed to generate unique short code after max retries');
}

/**
 * Validate and normalize URL
 */
function validateAndNormalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol: only http and https are allowed');
    }
    
    return parsed.toString();
  } catch (error) {
    throw new Error(`Invalid URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check for suspicious patterns in URL
 */
function isSuspiciousUrl(url: string): boolean {
  const suspiciousPatterns = [
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /<script/i,
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(url));
}

/**
 * Rate limit check: max 100 short links per hour
 */
async function checkRateLimit(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  maxPerHour: number = 100
): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { count, error } = await supabaseClient
    .from('short_links')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gt('created_at', oneHourAgo);
  
  if (error) {
    console.error('Rate limit check error:', error);
    return true;
  }
  
  return (count || 0) < maxPerHour;
}

serve(async (req: Request) => {
  console.log('SHORT LINK CREATE - Method:', req.method);

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

    const body = await req.json().catch(() => ({}));
    const { originalUrl } = body;

    if (!originalUrl || typeof originalUrl !== 'string') {
      return new Response(
        JSON.stringify({ error: 'originalUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let userId: string;
    try {
      const token = authHeader.replace('Bearer ', '');
      const decoded = jwtDecode<{ sub: string }>(token);
      userId = decoded.sub;
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL
    let normalizedUrl: string;
    try {
      normalizedUrl = validateAndNormalizeUrl(originalUrl);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : 'Invalid URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for suspicious URLs
    if (isSuspiciousUrl(normalizedUrl)) {
      return new Response(
        JSON.stringify({ error: 'Suspicious URL pattern detected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check rate limit
    const withinRateLimit = await checkRateLimit(supabaseClient, userId);
    if (!withinRateLimit) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded: max 100 short links per hour' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique short code
    const shortCode = await ensureUniqueShortCode(supabaseClient);

    // Create short link
    const { data: shortLink, error: insertError } = await supabaseClient
      .from('short_links')
      .insert({
        short_code: shortCode,
        original_url: normalizedUrl,
        user_id: userId,
      })
      .select()
      .single();

    if (insertError || !shortLink) {
      console.error('Error creating short link:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create short link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate short link URL
    const shortLinkUrl = `${new URL(Deno.env.get('SUPABASE_URL') || '').origin}/functions/v1/short-link-redirect/${shortCode}`;

    return new Response(
      JSON.stringify({
        id: shortLink.id,
        short_code: shortLink.short_code,
        short_url: shortLinkUrl,
        original_url: shortLink.original_url,
        created_at: shortLink.created_at,
        click_count: shortLink.click_count,
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
