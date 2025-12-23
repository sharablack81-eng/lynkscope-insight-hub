import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Environment variables - all required for Shopify OAuth
const SHOPIFY_CLIENT_ID = Deno.env.get('SHOPIFY_CLIENT_ID');
const SHOPIFY_CLIENT_SECRET = Deno.env.get('SHOPIFY_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const APP_URL = Deno.env.get('APP_URL') || 'https://your-app.lovable.app';

// CORS headers - restrict to app domain only (not wildcard for security)
const corsHeaders = {
  'Access-Control-Allow-Origin': APP_URL,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Validate environment variables are set
function validateEnv() {
  if (!SHOPIFY_CLIENT_ID || !SHOPIFY_CLIENT_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing required environment variables');
  }
}

// Validate and normalize shop domain
// Shopify domains must end with .myshopify.com
function validateAndNormalizeShopDomain(shopDomain: string): string | null {
  if (!shopDomain || typeof shopDomain !== 'string') {
    return null;
  }

  // Remove protocol and trailing slashes
  let cleaned = shopDomain.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\//, '');
  cleaned = cleaned.replace(/\/$/, '');

  // Validate it's a valid Shopify domain format
  // Must end with .myshopify.com or be a valid myshopify.com domain
  const shopifyDomainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  
  if (!shopifyDomainPattern.test(cleaned)) {
    return null;
  }

  return cleaned;
}

// Generate HMAC signature for verification
// Shopify uses HMAC-SHA256 for OAuth callback verification
async function generateHmac(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

// Verify HMAC signature from Shopify callback
// This is REQUIRED for App Store approval - prevents callback tampering
// Shopify's HMAC verification process:
// 1. Get all query parameters except 'hmac' and 'signature'
// 2. Sort them alphabetically by key
// 3. Create query string: "key1=value1&key2=value2"
// 4. Calculate HMAC-SHA256 using client secret
// 5. Compare with provided hmac (hex format)
async function verifyHmac(url: URL, providedHmac: string): Promise<boolean> {
  if (!SHOPIFY_CLIENT_SECRET || !providedHmac) {
    return false;
  }

  try {
    // Extract all parameters except hmac and signature
    const params: Array<[string, string]> = [];
    for (const [key, value] of url.searchParams.entries()) {
      if (key !== 'hmac' && key !== 'signature') {
        params.push([key, value]);
      }
    }

    // Sort alphabetically by key (Shopify requirement)
    params.sort((a, b) => a[0].localeCompare(b[0]));

    // Reconstruct query string
    const queryString = params.map(([key, value]) => `${key}=${value}`).join('&');

    // Calculate HMAC
    const calculatedHmac = await generateHmac(queryString, SHOPIFY_CLIENT_SECRET!);
    
    // Use constant-time comparison to prevent timing attacks
    if (calculatedHmac.length !== providedHmac.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < calculatedHmac.length; i++) {
      result |= calculatedHmac.charCodeAt(i) ^ providedHmac.charCodeAt(i);
    }
    
    return result === 0;
  } catch (error) {
    console.error('HMAC verification error:', error);
    return false;
  }
}

// Generate secure state parameter
// State must be unique per request and verifiable to prevent CSRF attacks
function generateState(userId: string): string {
  const timestamp = Date.now();
  const random = crypto.getRandomValues(new Uint8Array(16));
  const randomHex = Array.from(random).map(b => b.toString(16).padStart(2, '0')).join('');
  
  const stateData = {
    userId: userId,
    timestamp: timestamp,
    nonce: randomHex
  };
  
  // Base64 encode for URL safety
  return btoa(JSON.stringify(stateData));
}

// Verify and decode state parameter
function verifyState(state: string, maxAge: number = 600000): { userId: string } | null {
  // Max age defaults to 10 minutes (600000ms)
  try {
    const decoded = JSON.parse(atob(state));
    
    if (!decoded.userId || !decoded.timestamp || !decoded.nonce) {
      return null;
    }
    
    // Check state hasn't expired (prevent replay attacks)
    const age = Date.now() - decoded.timestamp;
    if (age > maxAge || age < 0) {
      return null;
    }
    
    return { userId: decoded.userId };
  } catch {
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    validateEnv();
    
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    // Log action only - never log sensitive data
    console.log('Shopify OAuth request:', { action, method: req.method });

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Step 1: Generate install URL for merchant
    // This initiates the OAuth flow
    if (action === 'install') {
      if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing authorization' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !user) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let body;
      try {
        body = await req.json();
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid request body' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const shopDomain = body.shopDomain;
      if (!shopDomain) {
        return new Response(JSON.stringify({ error: 'Shop domain is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Validate and normalize shop domain
      const normalizedShop = validateAndNormalizeShopDomain(shopDomain);
      if (!normalizedShop) {
        return new Response(JSON.stringify({ 
          error: 'Invalid shop domain',
          message: 'Shop domain must be a valid .myshopify.com domain'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Generate secure state parameter
      const state = generateState(user.id);
      
      // Redirect URL must match exactly what's configured in Shopify Partner Dashboard
      const redirectUri = `${SUPABASE_URL}/functions/v1/shopify-oauth?action=callback`;
      
      // Request only the scopes your app actually needs
      // For billing-only apps, you typically don't need product scopes
      // Update these scopes based on your app's actual requirements
      const scopes = 'read_products,write_products';
      
      // Build OAuth authorization URL
      const installUrl = `https://${normalizedShop}/admin/oauth/authorize?` + 
        `client_id=${SHOPIFY_CLIENT_ID}` +
        `&scope=${encodeURIComponent(scopes)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${encodeURIComponent(state)}`;

      // Log shop domain only (not sensitive, but useful for debugging)
      console.log('Generated install URL for shop:', normalizedShop);

      return new Response(JSON.stringify({ 
        installUrl,
        shop: normalizedShop
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Handle OAuth callback from Shopify
    // This is called by Shopify after merchant authorizes the app
    if (action === 'callback') {
      // Extract query parameters
      const code = url.searchParams.get('code');
      const shop = url.searchParams.get('shop');
      const state = url.searchParams.get('state');
      const hmac = url.searchParams.get('hmac');
      const timestamp = url.searchParams.get('timestamp');

      // Validate required parameters
      if (!code || !shop || !state) {
        console.error('OAuth callback missing required parameters');
        return new Response('Missing required parameters', { 
          status: 400,
          headers: corsHeaders 
        });
      }

      // CRITICAL: Verify HMAC signature
      // This prevents callback tampering and is REQUIRED for App Store approval
      if (!hmac || !await verifyHmac(url, hmac)) {
        console.error('OAuth callback HMAC verification failed');
        return new Response('Invalid request signature', { 
          status: 403,
          headers: corsHeaders 
        });
      }

      // Verify timestamp to prevent replay attacks (optional but recommended)
      if (timestamp) {
        const requestTime = parseInt(timestamp, 10);
        const currentTime = Math.floor(Date.now() / 1000);
        const timeDiff = Math.abs(currentTime - requestTime);
        
        // Reject requests older than 5 minutes
        if (timeDiff > 300) {
          console.error('OAuth callback timestamp expired');
          return new Response('Request expired', { 
            status: 400,
            headers: corsHeaders 
          });
        }
      }

      // Validate shop domain
      const normalizedShop = validateAndNormalizeShopDomain(shop);
      if (!normalizedShop) {
        console.error('OAuth callback invalid shop domain:', shop);
        return new Response('Invalid shop domain', { 
          status: 400,
          headers: corsHeaders 
        });
      }

      // Verify and decode state parameter
      const stateData = verifyState(state);
      if (!stateData) {
        console.error('OAuth callback invalid state parameter');
        return new Response('Invalid state parameter', { 
          status: 400,
          headers: corsHeaders 
        });
      }

      const userId = stateData.userId;

      // Exchange authorization code for access token
      // This is the final step of OAuth flow
      const tokenResponse = await fetch(`https://${normalizedShop}/admin/oauth/access_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: SHOPIFY_CLIENT_ID,
          client_secret: SHOPIFY_CLIENT_SECRET,
          code: code,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange failed:', errorText);
        // Don't expose Shopify error details to client
        return new Response('Failed to complete authorization', { 
          status: 500,
          headers: corsHeaders 
        });
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;
      const scope = tokenData.scope || '';

      if (!accessToken) {
        console.error('No access token in response');
        return new Response('Failed to obtain access token', { 
          status: 500,
          headers: corsHeaders 
        });
      }

      // Log success without sensitive data
      console.log('Access token obtained for shop:', normalizedShop);

      // Check if merchant exists to get the primary key for upsert
      const { data: existingMerchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', userId)
        .single();

      // Store shop connection in database using UPSERT
      // Primary key 'id' must be included in upsert payload per Supabase SDK requirements
      // Store scopes and token metadata for validation and management
      const upsertPayload = {
        id: existingMerchant?.id || crypto.randomUUID(),
        user_id: userId,
        shop_domain: normalizedShop,
        shopify_access_token: accessToken,
        shopify_scopes: scope,
        token_status: 'active',
        token_last_validated: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: upsertError } = await supabase
        .from('merchants')
        .upsert(upsertPayload, {
          onConflict: 'user_id'
        });

      if (upsertError) {
        console.error('Failed to save shop connection:', upsertError);
        // Don't expose database error details
        return new Response('Failed to save shop connection', { 
          status: 500,
          headers: corsHeaders 
        });
      }

      console.log('Shop connected successfully for user:', userId);

      // Redirect back to app with success
      // Use query parameter to indicate success (not sensitive data)
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${APP_URL}/settings?shop_connected=true`,
        },
      });
    }

    // Handle reauthorization flow
    // Shopify may require reauthorization if scopes change or token is revoked
    if (action === 'reauthorize') {
      // Similar to install flow but for existing connections
      if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing authorization' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !user) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get existing shop connection
      const { data: merchant } = await supabase
        .from('merchants')
        .select('shop_domain')
        .eq('user_id', user.id)
        .single();

      if (!merchant || !merchant.shop_domain) {
        return new Response(JSON.stringify({ error: 'No shop connected' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const normalizedShop = validateAndNormalizeShopDomain(merchant.shop_domain);
      if (!normalizedShop) {
        return new Response(JSON.stringify({ error: 'Invalid shop domain' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const state = generateState(user.id);
      const redirectUri = `${SUPABASE_URL}/functions/v1/shopify-oauth?action=callback`;
      const scopes = 'read_products,write_products';
      
      const reauthorizeUrl = `https://${normalizedShop}/admin/oauth/authorize?` + 
        `client_id=${SHOPIFY_CLIENT_ID}` +
        `&scope=${encodeURIComponent(scopes)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${encodeURIComponent(state)}`;

      return new Response(JSON.stringify({ 
        installUrl: reauthorizeUrl,
        shop: normalizedShop
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Invalid action
    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    // Log full error server-side but don't expose to client
    console.error('Shopify OAuth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Return generic error to client (don't expose internal details)
    return new Response(JSON.stringify({ error: 'An error occurred during authorization' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
