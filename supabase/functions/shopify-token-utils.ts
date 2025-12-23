// Token validation and management utilities for Shopify access tokens
// These functions ensure tokens are valid before use and handle token lifecycle

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getShopInfo } from "./shopify-api-client.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Validate a Shopify access token by making a lightweight API call
// This checks if the token is still valid and not revoked
// Uses rate-limit-safe API client with retry logic
export async function validateShopifyToken(
  shopDomain: string,
  accessToken: string
): Promise<{ valid: boolean; error?: string }> {
  if (!shopDomain || !accessToken) {
    return { valid: false, error: 'Missing shop domain or access token' };
  }

  try {
    // Use a lightweight API endpoint to validate token
    // shop.json is a minimal endpoint that requires authentication
    // Uses rate-limit-safe API client
    await getShopInfo(shopDomain, accessToken);
    
    // If we get here, token is valid
    return { valid: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check if it's an authentication error
    if (errorMessage.includes('401') || errorMessage.includes('403') || 
        errorMessage.includes('invalid') || errorMessage.includes('revoked')) {
      return { valid: false, error: 'Token invalid or revoked' };
    }

    // Network or other errors - don't assume token is invalid
    // This prevents false negatives from temporary network issues
    console.error('Token validation error (non-auth):', errorMessage);
    return { valid: true }; // Assume valid on non-auth errors
  }
}

// Get and validate merchant's Shopify token
// Returns token if valid, null if invalid or missing
export async function getValidShopifyToken(
  userId: string
): Promise<{ shopDomain: string; accessToken: string } | null> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase configuration');
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Get merchant's shop data
  // CRITICAL: Only select token server-side, never expose to client
  const { data: merchant, error } = await supabase
    .from('merchants')
    .select('shop_domain, shopify_access_token, token_status')
    .eq('user_id', userId)
    .single();

  if (error || !merchant) {
    return null;
  }

  // Check if token exists and is active
  if (
    !merchant.shop_domain ||
    !merchant.shopify_access_token ||
    merchant.token_status !== 'active'
  ) {
    return null;
  }

  // Validate token with Shopify (optional - can be expensive)
  // For production, you might want to cache validation results
  const validation = await validateShopifyToken(
    merchant.shop_domain,
    merchant.shopify_access_token
  );

  if (!validation.valid) {
    // Token is invalid - mark as invalid in database
    await supabase
      .from('merchants')
      .update({
        token_status: 'invalid',
        token_last_validated: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    return null;
  }

  // Update last validated timestamp
  await supabase
    .from('merchants')
    .update({
      token_last_validated: new Date().toISOString()
    })
    .eq('user_id', userId);

  return {
    shopDomain: merchant.shop_domain,
    accessToken: merchant.shopify_access_token
  };
}

// Mark token as revoked (called on uninstall or manual revocation)
export async function revokeShopifyToken(
  shopDomain: string
): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase configuration');
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { error } = await supabase
    .from('merchants')
    .update({
      shopify_access_token: null,
      token_status: 'revoked',
      token_last_validated: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('shop_domain', shopDomain)
    .eq('token_status', 'active');

  if (error) {
    console.error('Failed to revoke token:', error);
    throw error;
  }
}

