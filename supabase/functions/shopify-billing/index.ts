import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('shop_domain, shopify_access_token')
        .eq('user_id', user.id)
        .single();

      if (merchantError || !merchant) {
        console.error('Merchant lookup error:', merchantError);
        return new Response(JSON.stringify({ error: 'Merchant not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!merchant.shop_domain || !merchant.shopify_access_token) {
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
      const chargeResponse = await fetch(
        `https://${merchant.shop_domain}/admin/api/2024-01/recurring_application_charges.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': merchant.shopify_access_token,
          },
          body: JSON.stringify({
            recurring_application_charge: {
              name: 'LynkScope Pro',
              price: 20.0,
              return_url: `${SUPABASE_URL}/functions/v1/shopify-billing?action=confirm-charge&user_id=${user.id}`,
              trial_days: 0, // No additional trial since they already had 14-day free trial
              test: true, // Set to false for production
            },
          }),
        }
      );

      if (!chargeResponse.ok) {
        const errorText = await chargeResponse.text();
        console.error('Shopify charge creation failed:', errorText);
        return new Response(JSON.stringify({ error: 'Failed to create charge' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const chargeData = await chargeResponse.json();
      const confirmationUrl = chargeData.recurring_application_charge.confirmation_url;

      console.log('Created charge for user:', user.id);
      
      return new Response(JSON.stringify({ 
        confirmationUrl,
        message: 'Redirect user to confirm subscription'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('shop_domain, shopify_access_token')
        .eq('user_id', userId)
        .single();

      if (merchantError || !merchant?.shop_domain || !merchant?.shopify_access_token) {
        console.error('Merchant lookup error:', merchantError);
        const appUrl = Deno.env.get('APP_URL') || 'https://your-app.lovable.app';
        return new Response(null, {
          status: 302,
          headers: { 'Location': `${appUrl}/dashboard?error=merchant_not_found` },
        });
      }

      // Activate the charge
      const activateResponse = await fetch(
        `https://${merchant.shop_domain}/admin/api/2024-01/recurring_application_charges/${chargeId}/activate.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': merchant.shopify_access_token,
          },
        }
      );

      if (!activateResponse.ok) {
        const errorText = await activateResponse.text();
        console.error('Charge activation failed:', errorText);
        const appUrl = Deno.env.get('APP_URL') || 'https://your-app.lovable.app';
        return new Response(null, {
          status: 302,
          headers: { 'Location': `${appUrl}/dashboard?error=activation_failed` },
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
      const appUrl = Deno.env.get('APP_URL') || 'https://your-app.lovable.app';
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${appUrl}/dashboard?subscription_activated=true` },
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
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('shop_domain, shopify_access_token, shopify_charge_id')
        .eq('user_id', user.id)
        .single();

      if (merchant?.shop_domain && merchant?.shopify_access_token && merchant?.shopify_charge_id) {
        // Cancel the charge on Shopify
        try {
          await fetch(
            `https://${merchant.shop_domain}/admin/api/2024-01/recurring_application_charges/${merchant.shopify_charge_id}.json`,
            {
              method: 'DELETE',
              headers: {
                'X-Shopify-Access-Token': merchant.shopify_access_token,
              },
            }
          );
          console.log('Shopify charge cancelled');
        } catch (e) {
          console.error('Failed to cancel Shopify charge:', e);
        }
      }

      // Update local status
      const { error: updateError } = await supabase
        .from('merchants')
        .update({ 
          subscription_status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error cancelling subscription:', updateError);
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
