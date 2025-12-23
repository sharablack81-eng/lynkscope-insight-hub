import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Environment variables
const SHOPIFY_CLIENT_SECRET = Deno.env.get('SHOPIFY_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// CORS headers - webhooks should not be called from browser
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'x-shopify-shop-domain, x-shopify-hmac-sha256, x-shopify-topic, x-shopify-api-version, x-shopify-webhook-id, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Validate environment variables
function validateEnv() {
  if (!SHOPIFY_CLIENT_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing required environment variables');
  }
}

// Generate HMAC signature for webhook verification
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

// Verify HMAC signature from Shopify webhook
// Shopify webhooks include HMAC-SHA256 in X-Shopify-Hmac-Sha256 header
// This is REQUIRED for App Store approval - prevents webhook tampering
async function verifyWebhookHmac(body: string, providedHmac: string): Promise<boolean> {
  if (!SHOPIFY_CLIENT_SECRET || !providedHmac) {
    return false;
  }

  try {
    const calculatedHmac = await generateHmac(body, SHOPIFY_CLIENT_SECRET!);
    
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
    console.error('Webhook HMAC verification error:', error);
    return false;
  }
}

// Validate and normalize shop domain
function validateAndNormalizeShopDomain(shopDomain: string): string | null {
  if (!shopDomain || typeof shopDomain !== 'string') {
    return null;
  }

  let cleaned = shopDomain.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\//, '');
  cleaned = cleaned.replace(/\/$/, '');

  const shopifyDomainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  
  if (!shopifyDomainPattern.test(cleaned)) {
    return null;
  }

  return cleaned;
}

// Check if webhook has already been processed (idempotency check)
// Returns true if already processed, false if new
async function isWebhookProcessed(
  supabase: ReturnType<typeof createClient>,
  webhookId: string
): Promise<boolean> {
  if (!webhookId) {
    return false; // No ID means we can't check, treat as new
  }

  const { data, error } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('webhook_id', webhookId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found, which is OK
    console.error('Error checking webhook status:', error);
    // On error, assume not processed to be safe (will be idempotent anyway)
    return false;
  }

  return !!data; // True if found (already processed)
}

// Record webhook event as processed (for idempotency)
async function recordWebhookProcessed(
  supabase: ReturnType<typeof createClient>,
  webhookId: string,
  shopDomain: string,
  topic: string,
  status: 'processed' | 'failed' = 'processed',
  errorMessage?: string
): Promise<void> {
  if (!webhookId) {
    // No webhook ID - can't record, but that's OK
    return;
  }

  const { error } = await supabase
    .from('webhook_events')
    .insert({
      webhook_id: webhookId,
      shop_domain: shopDomain,
      topic: topic,
      status: status,
      error_message: errorMessage || null
    });

  if (error) {
    // If insert fails due to duplicate, that's OK (idempotency working)
    // Only log if it's a different error
    if (error.code !== '23505') { // 23505 = unique violation
      console.error('Error recording webhook event:', error);
    }
  }
}

// Handle app uninstall webhook
// This is REQUIRED for App Store approval - must clean up tokens and data
// This function is IDEMPOTENT - safe to call multiple times with same data
async function handleAppUninstall(
  supabase: ReturnType<typeof createClient>,
  shopDomain: string,
  webhookData: any
): Promise<void> {
  console.log('Processing app uninstall webhook for shop:', shopDomain);

  // Normalize shop domain
  const normalizedShop = validateAndNormalizeShopDomain(shopDomain);
  if (!normalizedShop) {
    throw new Error('Invalid shop domain in webhook');
  }

  // Find merchant by shop domain
  // Check for active OR revoked status (idempotency - already processed is OK)
  const { data: merchant, error: findError } = await supabase
    .from('merchants')
    .select('id, user_id, shop_domain, shopify_access_token, token_status')
    .eq('shop_domain', normalizedShop)
    .single();

  if (findError || !merchant) {
    // Merchant not found or already uninstalled - this is OK (idempotent)
    console.log('Merchant not found or already uninstalled:', normalizedShop);
    return;
  }

  // Check if already revoked (idempotency - safe to process again)
  if (merchant.token_status === 'revoked' && !merchant.shopify_access_token) {
    console.log('Token already revoked for shop:', normalizedShop);
    return; // Already processed - idempotent
  }

  // CRITICAL: Clean up all shop-scoped data before revoking token
  // This ensures complete cleanup on uninstall (required for App Store approval)
  // Use database function for atomic cleanup
  const { error: cleanupError } = await supabase.rpc('cleanup_shop_data', {
    p_shop_domain: normalizedShop
  });

  if (cleanupError) {
    console.error('Failed to cleanup shop data on uninstall:', cleanupError);
    // Continue with token revocation even if cleanup fails
    // (cleanup might have partially succeeded)
  } else {
    console.log('Shop data cleaned up for shop:', normalizedShop);
  }

  // CRITICAL: Clear access token and mark as revoked
  // This ensures the token cannot be used after uninstall
  // Using UPDATE with WHERE clause ensures idempotency
  const { error: updateError } = await supabase
    .from('merchants')
    .update({
      shopify_access_token: null,
      shop_domain: null,
      token_status: 'revoked',
      token_last_validated: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', merchant.id)
    .neq('token_status', 'revoked'); // Only update if not already revoked (idempotency)

  if (updateError) {
    console.error('Failed to clear token on uninstall:', updateError);
    throw updateError;
  }

  console.log('Token cleared and marked as revoked for shop:', normalizedShop);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Track start time for response time monitoring
  const startTime = Date.now();

  try {
    validateEnv();

    // Webhooks must be POST
    if (req.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders,
      });
    }

    // Get webhook headers
    // Shopify provides these headers for all webhooks
    const shopDomain = req.headers.get('x-shopify-shop-domain');
    const hmac = req.headers.get('x-shopify-hmac-sha256');
    const topic = req.headers.get('x-shopify-topic');
    const apiVersion = req.headers.get('x-shopify-api-version');
    const webhookId = req.headers.get('x-shopify-webhook-id'); // For idempotency

    // Validate required headers
    if (!shopDomain || !hmac || !topic) {
      console.error('Missing required webhook headers');
      return new Response('Missing required headers', {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Get request body for HMAC verification
    // Must read body as text first for HMAC verification
    const body = await req.text();
    
    // CRITICAL: Verify HMAC signature BEFORE processing
    // This prevents webhook tampering and is REQUIRED for App Store approval
    // Return 403 immediately if HMAC fails (don't process)
    if (!await verifyWebhookHmac(body, hmac)) {
      console.error('Webhook HMAC verification failed', {
        shop: shopDomain,
        topic: topic,
        hasWebhookId: !!webhookId
      });
      return new Response('Invalid webhook signature', {
        status: 403,
        headers: corsHeaders,
      });
    }

    // Parse webhook data
    let webhookData;
    try {
      webhookData = JSON.parse(body);
    } catch (parseError) {
      console.error('Invalid JSON body in webhook');
      return new Response('Invalid JSON body', {
        status: 400,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Normalize shop domain for idempotency checks
    const normalizedShop = validateAndNormalizeShopDomain(shopDomain);
    if (!normalizedShop) {
      console.error('Invalid shop domain in webhook:', shopDomain);
      return new Response('Invalid shop domain', {
        status: 400,
        headers: corsHeaders,
      });
    }

    // IDEMPOTENCY CHECK: Check if this webhook has already been processed
    // Shopify may deliver the same webhook multiple times
    // We use the webhook ID to prevent duplicate processing
    if (webhookId) {
      const alreadyProcessed = await isWebhookProcessed(supabase, webhookId);
      if (alreadyProcessed) {
        console.log('Webhook already processed (idempotent):', {
          webhookId: webhookId,
          topic: topic,
          shop: normalizedShop
        });
        // Return 200 to acknowledge (already processed)
        return new Response(JSON.stringify({ received: true, note: 'Already processed' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Process webhook based on topic
    let processingError: Error | null = null;
    try {
      if (topic === 'app/uninstalled') {
        await handleAppUninstall(supabase, normalizedShop, webhookData);
      } else {
        // Unknown webhook topic - log but don't fail
        console.log('Unhandled webhook topic:', topic);
      }
    } catch (error) {
      // Capture error for logging and recording
      processingError = error instanceof Error ? error : new Error(String(error));
      console.error('Webhook processing error:', {
        error: processingError.message,
        topic: topic,
        shop: normalizedShop,
        webhookId: webhookId
      });
      
      // Record as failed if we have webhook ID
      if (webhookId) {
        await recordWebhookProcessed(
          supabase,
          webhookId,
          normalizedShop,
          topic,
          'failed',
          processingError.message
        );
      }

      // Return 500 to trigger Shopify retry (up to 19 times over 48 hours)
      // This is the correct behavior per Shopify best practices
      return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Record webhook as successfully processed (for idempotency)
    if (webhookId) {
      await recordWebhookProcessed(
        supabase,
        webhookId,
        normalizedShop,
        topic,
        'processed'
      );
    }

    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    // Log successful processing
    console.log('Webhook processed successfully:', {
      topic: topic,
      shop: normalizedShop,
      webhookId: webhookId,
      processingTimeMs: processingTime
    });

    // Return 200 to acknowledge receipt
    // Shopify expects 200 within 5 seconds to avoid retries
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    // Log full error server-side but don't expose to client
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook handler error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return 500 to trigger Shopify retry
    // This is the correct behavior per Shopify best practices
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
