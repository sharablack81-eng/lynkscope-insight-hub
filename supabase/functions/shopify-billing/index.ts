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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    console.log('Shopify billing request:', { action, url: req.url });

    // Initialize Supabase client with service role for admin operations
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    if (action === 'create-charge') {
      // Get user from authorization header
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Missing authorization' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify user token
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !user) {
        console.error('User auth error:', userError);
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const body = await req.json();
      const returnUrl = body.returnUrl;

      // For Shopify billing, we need a Shopify store domain
      // Since this is a standalone app, we'll use a simplified approach
      // The user needs to have connected their Shopify store first
      
      // For now, we'll create a confirmation URL that simulates the billing flow
      // In production, this would integrate with actual Shopify OAuth + Billing API
      
      const confirmUrl = `${returnUrl}?charge_id=simulated_${Date.now()}&user_id=${user.id}`;
      
      console.log('Created charge confirmation URL for user:', user.id);
      
      return new Response(JSON.stringify({ 
        confirmationUrl: confirmUrl,
        message: 'Redirect user to confirm subscription'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'confirm-charge') {
      const chargeId = url.searchParams.get('charge_id');
      const userId = url.searchParams.get('user_id');

      if (!chargeId || !userId) {
        return new Response(JSON.stringify({ error: 'Missing charge_id or user_id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Confirming charge:', { chargeId, userId });

      // Update merchant subscription status to active
      const { data, error } = await supabase
        .from('merchants')
        .update({ 
          subscription_status: 'active',
          shopify_charge_id: chargeId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating merchant:', error);
        return new Response(JSON.stringify({ error: 'Failed to activate subscription' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Subscription activated for user:', userId);

      return new Response(JSON.stringify({ 
        success: true,
        message: 'Subscription activated successfully',
        merchant: data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'cancel') {
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

      // Cancel subscription
      const { data, error } = await supabase
        .from('merchants')
        .update({ 
          subscription_status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error cancelling subscription:', error);
        return new Response(JSON.stringify({ error: 'Failed to cancel subscription' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Subscription cancelled for user:', user.id);

      return new Response(JSON.stringify({ 
        success: true,
        message: 'Subscription cancelled'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Shopify billing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
