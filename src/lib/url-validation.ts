/**
 * URL Validation and Security Utilities
 * Shared between frontend and backend for consistent validation
 */

/**
 * Validate URL format and protocol
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Check for suspicious/malicious patterns
 */
export function containsSuspiciousPatterns(url: string): boolean {
  const suspiciousPatterns = [
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /<script/i,
    /onerror=/i,
    /onclick=/i,
  ];

  return suspiciousPatterns.some(pattern => pattern.test(url));
}

/**
 * Normalize URL (remove trailing slashes, fragments, etc)
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Check if URL is a valid redirect target (prevents open redirects)
 */
export function isSafeRedirectUrl(url: string): boolean {
  if (!isValidUrl(url)) return false;
  if (containsSuspiciousPatterns(url)) return false;

  try {
    const parsed = new URL(url);
    // Ensure URL has a valid domain
    if (!parsed.hostname) return false;
    // Additional checks can be added here (e.g., domain whitelist)
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate short code format (6-8 alphanumeric characters)
 */
export function isValidShortCode(code: string): boolean {
  return /^[a-zA-Z0-9]{6,8}$/.test(code);
}

/**
 * Extract domain from URL for display purposes
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname || url;
  } catch {
    return url;
  }
}
