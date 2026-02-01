/**
 * Cliplyst Connector Service
 * Sends content strategy from Lynkscope to Cliplyst for automated content generation
 */

const CLIPLYST_API_URL = import.meta.env.VITE_CLIPLYST_API_URL || 'https://cliplyst-content-maker.onrender.com';
const LYNKSCOPE_INTERNAL_KEY = import.meta.env.VITE_LYNKSCOPE_INTERNAL_KEY;

export interface CliplystPayload {
  user_id: string;
  company_name: string;
  niche: string;
  weak_platforms: string[];
  top_opportunities: string[];
  auto_schedule: boolean;
  posting_frequency: string;
}

export interface CliplystResponse {
  success: boolean;
  message: string;
  automation_id?: string;
  status?: string;
  error?: string;
}

/**
 * Send content strategy to Cliplyst for automated content generation
 * @param payload - Content strategy data from Lynkscope analysis
 * @returns Promise with Cliplyst response
 */
export async function sendToCliplyst(payload: CliplystPayload): Promise<CliplystResponse> {
  try {
    // Validate API key is configured
    if (!LYNKSCOPE_INTERNAL_KEY) {
      throw new Error('Cliplyst integration not configured. VITE_LYNKSCOPE_INTERNAL_KEY missing.');
    }

    // Validate required fields
    if (!payload.user_id || !payload.company_name || !payload.niche) {
      throw new Error('Missing required fields: user_id, company_name, or niche');
    }

    console.log('[Cliplyst] Sending strategy to:', CLIPLYST_API_URL);
    console.log('[Cliplyst] Payload:', {
      company_name: payload.company_name,
      niche: payload.niche,
      weak_platforms: payload.weak_platforms.length,
      opportunities: payload.top_opportunities.length,
      auto_schedule: payload.auto_schedule,
      posting_frequency: payload.posting_frequency,
    });

    const response = await fetch(`${CLIPLYST_API_URL}/api/automation/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LYNKSCOPE_INTERNAL_KEY}`,
      },
      body: JSON.stringify({
        user_id: payload.user_id,
        company_name: payload.company_name,
        niche: payload.niche,
        weak_platforms: payload.weak_platforms,
        top_opportunities: payload.top_opportunities,
        auto_schedule: payload.auto_schedule,
        posting_frequency: payload.posting_frequency,
        source: 'lynkscope', // Identify request source
        timestamp: new Date().toISOString(),
      }),
    });

    // Handle non-2xx responses
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP ${response.status}` };
      }

      console.error('[Cliplyst] API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });

      throw new Error(
        errorData.error ||
        errorData.message ||
        `Cliplyst API error: ${response.status} ${response.statusText}`
      );
    }

    // Parse successful response
    const result: CliplystResponse = await response.json();

    console.log('[Cliplyst] Success:', {
      message: result.message,
      automation_id: result.automation_id,
      status: result.status,
    });

    return {
      success: true,
      message: result.message || 'Content automation started successfully',
      automation_id: result.automation_id,
      status: result.status || 'processing',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('[Cliplyst] Error:', errorMessage);

    return {
      success: false,
      message: 'Failed to send strategy to Cliplyst',
      error: errorMessage,
    };
  }
}

/**
 * Verify Cliplyst connection is available
 * @returns Promise<boolean> - True if connection is configured
 */
export function isCliplystConfigured(): boolean {
  return !!LYNKSCOPE_INTERNAL_KEY && !!CLIPLYST_API_URL;
}

/**
 * Get Cliplyst connection status
 * @returns Object with configuration status
 */
export function getCliplystStatus() {
  return {
    configured: isCliplystConfigured(),
    apiUrl: CLIPLYST_API_URL,
    hasApiKey: !!LYNKSCOPE_INTERNAL_KEY,
  };
}
