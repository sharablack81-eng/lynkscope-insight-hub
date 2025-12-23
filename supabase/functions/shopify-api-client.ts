// Shopify API client with rate limiting and best practices
// Follows Shopify REST API guidelines for rate limit handling and error management

// Shopify API version - use latest stable version
// Update this when Shopify releases new API versions
const SHOPIFY_API_VERSION = '2024-01';

// Rate limit constants from Shopify documentation
// REST API: 40 requests per app per store per 2 seconds (bucket size)
// GraphQL: 1000 points per app per store per 2 seconds
const RATE_LIMIT_BUCKET_SIZE = 40;
const RATE_LIMIT_LEAK_RATE = 2; // requests per second

// Parse Shopify rate limit headers
// Shopify returns rate limit info in response headers
interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number; // Unix timestamp when bucket resets
}

function parseRateLimitHeaders(headers: Headers): RateLimitInfo | null {
  // Shopify REST API rate limit headers
  const limit = headers.get('X-Shopify-Shop-Api-Call-Limit');
  
  if (!limit) {
    return null;
  }

  // Format: "40/40" (used/total)
  const parts = limit.split('/');
  if (parts.length !== 2) {
    return null;
  }

  const used = parseInt(parts[0], 10);
  const total = parseInt(parts[1], 10);
  const remaining = total - used;

  // Calculate reset time (bucket refills every 2 seconds)
  // This is approximate - actual reset depends on Shopify's bucket algorithm
  const resetTime = Date.now() + 2000; // 2 seconds from now

  return {
    limit: total,
    remaining: remaining,
    resetTime: resetTime
  };
}

// Wait for rate limit reset
// Uses exponential backoff with jitter
async function waitForRateLimit(resetTime: number, attempt: number = 1): Promise<void> {
  const now = Date.now();
  const waitTime = Math.max(0, resetTime - now);
  
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 1000; // 0-1 second jitter
  const totalWait = waitTime + jitter;
  
  if (totalWait > 0) {
    console.log(`Rate limit reached, waiting ${Math.ceil(totalWait / 1000)} seconds (attempt ${attempt})`);
    await new Promise(resolve => setTimeout(resolve, totalWait));
  }
}

// Make Shopify API request with rate limit handling
// This function handles rate limits, retries, and error responses
export async function shopifyApiRequest(
  shopDomain: string,
  accessToken: string,
  endpoint: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
    retries?: number;
  } = {}
): Promise<{ data: any; rateLimitInfo: RateLimitInfo | null }> {
  const {
    method = 'GET',
    body,
    headers = {},
    retries = 3
  } = options;

  // Validate inputs
  if (!shopDomain || !accessToken || !endpoint) {
    throw new Error('Missing required parameters: shopDomain, accessToken, or endpoint');
  }

  // Normalize endpoint (remove leading slash if present)
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Build API URL with version
  // Format: https://{shop}.myshopify.com/admin/api/{version}/{endpoint}
  const apiUrl = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/${normalizedEndpoint}`;

  // Default headers for Shopify API
  const defaultHeaders: Record<string, string> = {
    'X-Shopify-Access-Token': accessToken,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Merge headers
  const requestHeaders = { ...defaultHeaders, ...headers };

  // Make request with retry logic
  let lastError: Error | null = null;
  let lastResponse: Response | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Prepare request body
      const requestBody = body ? JSON.stringify(body) : undefined;

      // Make API request
      const response = await fetch(apiUrl, {
        method: method,
        headers: requestHeaders,
        body: requestBody,
      });

      // Parse rate limit info from headers
      const rateLimitInfo = parseRateLimitHeaders(response.headers);

      // Handle rate limiting (429 Too Many Requests)
      if (response.status === 429) {
        // Check for Retry-After header
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 2000;
        
        if (attempt < retries) {
          console.log(`Rate limit exceeded, waiting ${waitTime / 1000} seconds before retry ${attempt + 1}/${retries}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue; // Retry
        } else {
          // Max retries reached
          const errorText = await response.text();
          throw new Error(`Rate limit exceeded after ${retries} attempts: ${errorText}`);
        }
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        // Log error details (server-side only)
        console.error('Shopify API error:', {
          status: response.status,
          statusText: response.statusText,
          endpoint: normalizedEndpoint,
          error: errorData
        });

        // Don't retry on client errors (4xx) except 429
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw new Error(`Shopify API error (${response.status}): ${errorData.errors?.message || errorData.message || 'Unknown error'}`);
        }

        // Retry on server errors (5xx)
        if (response.status >= 500 && attempt < retries) {
          // Exponential backoff for server errors
          const backoffTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`Server error, retrying in ${backoffTime / 1000} seconds (attempt ${attempt + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          continue; // Retry
        }

        // Max retries or non-retryable error
        throw new Error(`Shopify API error (${response.status}): ${errorData.errors?.message || errorData.message || 'Unknown error'}`);
      }

      // Success - parse response
      const responseData = await response.json();
      
      return {
        data: responseData,
        rateLimitInfo: rateLimitInfo
      };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Network errors - retry with exponential backoff
      if (attempt < retries && (lastError.message.includes('fetch') || lastError.message.includes('network'))) {
        const backoffTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`Network error, retrying in ${backoffTime / 1000} seconds (attempt ${attempt + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        continue; // Retry
      }

      // Re-throw if not retrying
      throw lastError;
    }
  }

  // Should not reach here, but TypeScript requires it
  throw lastError || new Error('Request failed after retries');
}

// Helper function to create recurring application charge
// This is a common operation, so we provide a dedicated function
export async function createRecurringCharge(
  shopDomain: string,
  accessToken: string,
  chargeData: {
    name: string;
    price: number;
    returnUrl: string;
    trialDays?: number;
    test?: boolean;
  }
): Promise<{ confirmationUrl: string; chargeId: number }> {
  const response = await shopifyApiRequest(
    shopDomain,
    accessToken,
    'recurring_application_charges.json',
    {
      method: 'POST',
      body: {
        recurring_application_charge: {
          name: chargeData.name,
          price: chargeData.price,
          return_url: chargeData.returnUrl,
          trial_days: chargeData.trialDays || 0,
          test: chargeData.test !== undefined ? chargeData.test : false,
        }
      }
    }
  );

  const charge = response.data.recurring_application_charge;
  
  if (!charge || !charge.confirmation_url || !charge.id) {
    throw new Error('Invalid response from Shopify: missing charge data');
  }

  return {
    confirmationUrl: charge.confirmation_url,
    chargeId: charge.id
  };
}

// Helper function to activate recurring application charge
export async function activateRecurringCharge(
  shopDomain: string,
  accessToken: string,
  chargeId: number
): Promise<void> {
  await shopifyApiRequest(
    shopDomain,
    accessToken,
    `recurring_application_charges/${chargeId}/activate.json`,
    {
      method: 'POST'
    }
  );
}

// Helper function to cancel recurring application charge
export async function cancelRecurringCharge(
  shopDomain: string,
  accessToken: string,
  chargeId: number
): Promise<void> {
  await shopifyApiRequest(
    shopDomain,
    accessToken,
    `recurring_application_charges/${chargeId}.json`,
    {
      method: 'DELETE'
    }
  );
}

// Helper function to get shop information (for token validation)
export async function getShopInfo(
  shopDomain: string,
  accessToken: string
): Promise<{ id: number; name: string; domain: string }> {
  const response = await shopifyApiRequest(
    shopDomain,
    accessToken,
    'shop.json',
    {
      method: 'GET'
    }
  );

  const shop = response.data.shop;
  
  if (!shop || !shop.id || !shop.name || !shop.domain) {
    throw new Error('Invalid response from Shopify: missing shop data');
  }

  return {
    id: shop.id,
    name: shop.name,
    domain: shop.domain
  };
}

