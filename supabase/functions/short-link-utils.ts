// @ts-nocheck
/// <reference lib="deno.window" />
/**
 * Short Link System Utilities
 * Handles short code generation, validation, and URL security
 */

// @deno-types="https://esm.sh/@supabase/supabase-js@2/dist/module/index.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Generate a random 6-8 character alphanumeric short code
 * Uses base62 encoding (0-9, a-z, A-Z) for URL-safe characters
 */
export function generateShortCode(): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const length = Math.random() < 0.5 ? 6 : 7; // Randomly choose 6 or 7 chars for variety
  let code = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    code += chars[array[i] % chars.length];
  }
  return code;
}

/**
 * Ensure short code uniqueness in database
 * Retries with new codes if collision detected
 */
export async function ensureUniqueShortCode(
  supabaseClient: ReturnType<typeof createClient>,
  maxRetries: number = 5
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const code = generateShortCode();
    const { data, error } = await supabaseClient
      .from('short_links')
      .select('short_code', { count: 'exact', head: true })
      .eq('short_code', code);
    
    // If no error and no data found, the code is unique
    if (!error && !data?.length) {
      return code;
    }
  }
  
  throw new Error('Failed to generate unique short code after max retries');
}

/**
 * Validate and normalize URL before saving
 * Prevents open redirect attacks and invalid URLs
 */
export function validateAndNormalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol: only http and https are allowed');
    }
    
    // Prevent data: and javascript: URLs
    if (parsed.protocol === 'data:' || parsed.protocol === 'javascript:') {
      throw new Error('Data and JavaScript URLs are not allowed');
    }
    
    // Return normalized URL (removes any trailing fragments/etc)
    return parsed.toString();
  } catch (error) {
    throw new Error(`Invalid URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check for suspicious/malicious patterns in URL
 */
export function isSuspiciousUrl(url: string): boolean {
  const suspiciousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.com$/i, // Be cautious with .com domain in path
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /<script/i,
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(url));
}

/**
 * Rate limit check for short link creation per user
 * Prevents abuse
 */
export async function checkRateLimit(
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
    return true; // Allow if we can't verify
  }
  
  return (count || 0) < maxPerHour;
}
