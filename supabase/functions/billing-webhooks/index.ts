// @ts-nocheck
// @deno-types="https://deno.land/std@0.208.0/http/server.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @deno-types="https://esm.sh/@supabase/supabase-js@2/dist/module/index.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');

// Webhook signature verification using Web Crypto API
async function verifyStripeSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigParts = signature.split(',');
    const timestamp = sigParts[0].split('=')[1];
    const receivedSignature = sigParts[1].split('=')[1];

    const signedContent = `${timestamp}.${body}`;
    const signedContentData = encoder.encode(signedContent);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      hexToBuffer(receivedSignature),
      signedContentData
    );

    // Also verify timestamp is within 5 minutes
    const currentTime = Math.floor(Date.now() / 1000);
    const signatureTime = parseInt(timestamp);
    const timeDifference = currentTime - signatureTime;

    return isValid && timeDifference < 300; // 5 minutes
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
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

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature || !STRIPE_WEBHOOK_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify webhook signature
    const isValid = await verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const event = JSON.parse(body);
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle different Stripe events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('id, user_id')
          .eq('stripe_customer_id', session.customer)
          .single();

        if (!subscriptionData) {
          // Create new subscription record
          await supabase.from('subscriptions').insert({
            user_id: session.metadata.user_id,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            plan_type: session.metadata.plan,
            status: 'active',
            created_at: new Date().toISOString(),
          });
        } else {
          // Update existing subscription
          await supabase
            .from('subscriptions')
            .update({
              stripe_subscription_id: session.subscription,
              plan_type: session.metadata.plan,
              status: 'active',
            })
            .eq('id', subscriptionData.id);
        }

        // Update user profile
        await supabase
          .from('profiles')
          .update({
            plan_type: session.metadata.plan,
            subscription_status: 'active',
          })
          .eq('id', session.metadata.user_id);

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;

        // Update subscription record
        await supabase
          .from('subscriptions')
          .update({
            stripe_subscription_id: subscription.id,
            plan_type: subscription.metadata?.plan || 'free',
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq('stripe_subscription_id', subscription.id);

        // Get user ID from subscription record
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (subData) {
          await supabase
            .from('profiles')
            .update({
              plan_type: subscription.metadata?.plan || 'free',
              subscription_status: subscription.status,
            })
            .eq('id', subData.user_id);
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;

        // Update subscription record
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        // Get user ID and downgrade to free
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (subData) {
          await supabase
            .from('profiles')
            .update({
              plan_type: 'free',
              subscription_status: 'canceled',
            })
            .eq('id', subData.user_id);
        }

        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        // Update subscription status to active on successful payment
        if (invoice.subscription) {
          await supabase
            .from('subscriptions')
            .update({ status: 'active' })
            .eq('stripe_subscription_id', invoice.subscription);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        // Optionally mark subscription as at-risk, send email notification
        if (invoice.subscription) {
          console.log(`Payment failed for subscription: ${invoice.subscription}`);
          // Could send notification email here
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
