import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHOPIFY_CLIENT_ID = Deno.env.get('SHOPIFY_CLIENT_ID');
const SHOPIFY_CLIENT_SECRET = Deno.env.get('SHOPIFY_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    console.log('Shopify OAuth request:', { action });

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Step 1: Generate install URL for merchant
    if (action === 'install') {
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
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

      const body = await req.json();
      const shopDomain = body.shopDomain;

      if (!shopDomain) {
        return new Response(JSON.stringify({ error: 'Shop domain is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Clean up shop domain
      const cleanShop = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      
      // Generate state token (user_id encoded for callback)
      const state = btoa(JSON.stringify({ userId: user.id, timestamp: Date.now() }));
      
      // Redirect URL - this must match what's configured in your Shopify app
      const redirectUri = `${SUPABASE_URL}/functions/v1/shopify-oauth?action=callback`;
      
      // Scopes needed for billing
      const scopes = 'read_products,write_products';
      
      const installUrl = `https://${cleanShop}/admin/oauth/authorize?` + 
        `client_id=${SHOPIFY_CLIENT_ID}` +
        `&scope=${scopes}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${state}`;

      console.log('Generated install URL for shop:', cleanShop);

      return new Response(JSON.stringify({ 
        installUrl,
        shop: cleanShop
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Handle OAuth callback from Shopify
    if (action === 'callback') {
      const code = url.searchParams.get('code');
      const shop = url.searchParams.get('shop');
      const state = url.searchParams.get('state');

      console.log('OAuth callback received:', { shop, hasCode: !!code });

      if (!code || !shop || !state) {
        return new Response('Missing required parameters', { 
          status: 400,
          headers: corsHeaders 
        });
      }

      // Decode state to get user ID
      let stateData;
      try {
        stateData = JSON.parse(atob(state));
      } catch {
        return new Response('Invalid state parameter', { 
          status: 400,
          headers: corsHeaders 
        });
      }

      const userId = stateData.userId;

      // Exchange code for access token
      const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
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
        return new Response('Failed to exchange token', { 
          status: 500,
          headers: corsHeaders 
        });
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      console.log('Access token obtained for shop:', shop);

      // Store shop connection in database
      const { error: updateError } = await supabase
        .from('merchants')
        .update({ 
          shop_domain: shop,
          shopify_access_token: accessToken,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Failed to save shop connection:', updateError);
        return new Response('Failed to save shop connection', { 
          status: 500,
          headers: corsHeaders 
        });
      }

      console.log('Shop connected successfully:', { shop, userId });

      // Redirect back to app with success
      const appUrl = Deno.env.get('APP_URL') || 'https://your-app.lovable.app';
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${appUrl}/settings?shop_connected=true`,
        },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Shopify OAuth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
