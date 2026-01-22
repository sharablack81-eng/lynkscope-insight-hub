import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import Shopify API client functions using absolute path for Deno Deploy compatibility
const shopifyApiClientModule = await import('../shopify-api-client.ts');
const createRecurringCharge = shopifyApiClientModule.createRecurringCharge;
const activateRecurringCharge = shopifyApiClientModule.activateRecurringCharge;
const cancelRecurringCharge = shopifyApiClientModule.cancelRecurringCharge;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const APP_URL = Deno.env.get('APP_URL') || 'https://your-app.lovable.app';
const SHOPIFY_TEST_MODE = Deno.env.get('SHOPIFY_TEST_MODE') === 'true';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    console.log('Shopify billing request:', { action });

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    if (action === 'create-charge') {
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
        console.error('User auth error:', userError);
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get merchant's shop data
      // CRITICAL: Only select token server-side, never expose to client
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('shop_domain, shopify_access_token, token_status')
        .eq('user_id', user.id)
        .single();

      // If merchant doesn't exist, they need to connect their shop first
      if (merchantError || !merchant) {
        console.log('Merchant not found for user:', user.id);
        return new Response(JSON.stringify({ 
          error: 'Shop not connected',
          needsConnection: true,
          message: 'Please connect your Shopify store first'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if shop is connected and token is active
      if (
        !merchant.shop_domain ||
        !merchant.shopify_access_token ||
        merchant.token_status !== 'active'
      ) {
        return new Response(JSON.stringify({ 
          error: 'Shop not connected',
          needsConnection: true,
          message: 'Please connect your Shopify store first'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const body = await req.json();
      const returnUrl = body.returnUrl;

      // Create recurring application charge via Shopify Admin API
      // Uses rate-limit-safe API client with retry logic
      try {
        const { confirmationUrl } = await createRecurringCharge(
          merchant.shop_domain,
          merchant.shopify_access_token,
          {
            name: 'LynkScope Pro',
            price: 20.0,
            returnUrl: `${SUPABASE_URL}/functions/v1/shopify-billing?action=confirm-charge&user_id=${user.id}`,
            trialDays: 0, // No additional trial since they already had 14-day free trial
            test: SHOPIFY_TEST_MODE, // Use environment variable for test mode
          }
        );

        console.log('Created charge for user:', user.id);
      
        return new Response(JSON.stringify({ 
          confirmationUrl,
          message: 'Redirect user to confirm subscription'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Shopify charge creation failed:', errorMessage);
        return new Response(JSON.stringify({ 
          error: 'Failed to create charge',
          message: 'Unable to create subscription. Please try again.'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (action === 'confirm-charge') {
      const chargeId = url.searchParams.get('charge_id');
      const userId = url.searchParams.get('user_id');

      console.log('Confirming charge:', { chargeId, userId });

      if (!chargeId || !userId) {
        return new Response('Missing charge_id or user_id', {
          status: 400,
          headers: corsHeaders,
        });
      }

      // Get merchant's shop data
      // CRITICAL: Only select token server-side, never expose to client
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('shop_domain, shopify_access_token, token_status')
        .eq('user_id', userId)
        .single();

      // If merchant doesn't exist, they need to connect their shop first
      if (merchantError || !merchant) {
        console.error('Merchant not found for charge confirmation:', userId);
        return new Response(null, {
          status: 302,
          headers: { 'Location': `${APP_URL}/dashboard?error=shop_not_connected` },
        });
      }

      // Check if shop is connected and token is active
      if (
        !merchant.shop_domain ||
        !merchant.shopify_access_token ||
        merchant.token_status !== 'active'
      ) {
        console.error('Merchant missing shop connection or invalid token:', { 
          shop_domain: merchant.shop_domain, 
          has_token: !!merchant.shopify_access_token,
          token_status: merchant.token_status
        });
        return new Response(null, {
          status: 302,
          headers: { 'Location': `${APP_URL}/dashboard?error=shop_not_connected` },
        });
      }

      // Activate the charge
      // Uses rate-limit-safe API client with retry logic
      try {
        const chargeIdNum = parseInt(chargeId, 10);
        if (isNaN(chargeIdNum)) {
          throw new Error('Invalid charge ID');
        }

        await activateRecurringCharge(
          merchant.shop_domain,
          merchant.shopify_access_token,
          chargeIdNum
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Charge activation failed:', errorMessage);
        return new Response(null, {
          status: 302,
          headers: { 'Location': `${APP_URL}/dashboard?error=activation_failed` },
        });
      }

      // Update merchant subscription status to active
      const { error: updateError } = await supabase
        .from('merchants')
        .update({ 
          subscription_status: 'active',
          shopify_charge_id: chargeId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating merchant:', updateError);
      }

      console.log('Subscription activated for user:', userId);

      // Redirect back to app
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${APP_URL}/dashboard?subscription_activated=true` },
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

      // Get merchant's shop data
      // CRITICAL: Only select token server-side, never expose to client
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('shop_domain, shopify_access_token, shopify_charge_id, subscription_status, token_status')
        .eq('user_id', user.id)
        .single();

      // If merchant doesn't exist, there's nothing to cancel
      if (merchantError || !merchant) {
        console.log('Merchant not found for cancellation:', user.id);
        return new Response(JSON.stringify({ 
          error: 'No subscription found to cancel',
          message: 'No active subscription exists for this account'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // If already cancelled or expired, return success (idempotent)
      if (merchant.subscription_status === 'cancelled' || merchant.subscription_status === 'expired') {
        console.log('Subscription already cancelled for user:', user.id);
        return new Response(JSON.stringify({ 
          success: true,
          message: 'Subscription is already cancelled'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Cancel the charge on Shopify if we have the required data and token is active
      // Uses rate-limit-safe API client with retry logic
      let shopifyCancelled = false;
      if (
        merchant.shop_domain &&
        merchant.shopify_access_token &&
        merchant.shopify_charge_id &&
        merchant.token_status === 'active'
      ) {
        try {
          const chargeIdNum = parseInt(merchant.shopify_charge_id, 10);
          if (!isNaN(chargeIdNum)) {
            await cancelRecurringCharge(
              merchant.shop_domain,
              merchant.shopify_access_token,
              chargeIdNum
            );
            shopifyCancelled = true;
            console.log('Shopify charge cancelled successfully');
          } else {
            console.error('Invalid charge ID format:', merchant.shopify_charge_id);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('Failed to cancel Shopify charge:', errorMessage);
          // Continue to update local status even if Shopify cancellation fails
          // (the charge might already be cancelled or the shop disconnected)
        }
      } else {
        // No Shopify charge to cancel, but we can still update local status
        console.log('No Shopify charge ID found, updating local status only');
      }

      // Update local status to cancelled
      const { error: updateError } = await supabase
        .from('merchants')
        .update({ 
          subscription_status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating subscription status:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to update subscription status' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Subscription cancelled for user:', user.id, { shopifyCancelled });

      return new Response(JSON.stringify({ 
        success: true,
        message: shopifyCancelled 
          ? 'Subscription cancelled successfully' 
          : 'Subscription status updated (Shopify cancellation may have been skipped)'
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
