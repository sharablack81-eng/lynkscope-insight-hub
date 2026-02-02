/**
 * Cliplyst Connector Service
 * Sends content strategy from Lynkscope to Cliplyst for automated content generation
 */

// Cliplyst API endpoints (configurable via environment variables)
const CLIPLYST_BASE_URL = import.meta.env.VITE_CLIPLYST_BASE_URL || 'https://hnkrklkozvgwjfxeearh.supabase.co/functions/v1';
const CLIPLYST_HEALTH_URL = import.meta.env.VITE_CLIPLYST_HEALTH_URL || `${CLIPLYST_BASE_URL}/lynkscope-health`;
const CLIPLYST_CREATE_JOB_URL = import.meta.env.VITE_CLIPLYST_CREATE_JOB_URL || `${CLIPLYST_BASE_URL}/lynkscope-create-job`;
const CLIPLYST_GET_STATUS_URL = import.meta.env.VITE_CLIPLYST_GET_STATUS_URL || `${CLIPLYST_BASE_URL}/lynkscope-job-status`;
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
 * Check Cliplyst service health
 * @returns Promise with health check response
 */
export async function checkCliplystHealth(): Promise<{ healthy: boolean; message: string }> {
  try {
    console.log('[Cliplyst] Checking health...');
    
    const response = await fetch(CLIPLYST_HEALTH_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('[Cliplyst] Health check passed:', result);
    
    return {
      healthy: true,
      message: result.message || 'Cliplyst service is healthy',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Cliplyst] Health check failed:', errorMessage);
    
    return {
      healthy: false,
      message: errorMessage,
    };
  }
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

    console.log('[Cliplyst] Creating job with strategy:', {
      company_name: payload.company_name,
      niche: payload.niche,
      weak_platforms: payload.weak_platforms.length,
      opportunities: payload.top_opportunities.length,
      auto_schedule: payload.auto_schedule,
      posting_frequency: payload.posting_frequency,
    });

    const response = await fetch(CLIPLYST_CREATE_JOB_URL, {
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
        source: 'lynkscope',
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
 * Get job status from Cliplyst
 * @param jobId - Job ID to check status for
 * @returns Promise with job status
 */
export async function getCliplystJobStatus(jobId: string): Promise<CliplystResponse> {
  try {
    if (!jobId) {
      throw new Error('Job ID is required');
    }

    if (!LYNKSCOPE_INTERNAL_KEY) {
      throw new Error('Cliplyst integration not configured. VITE_LYNKSCOPE_INTERNAL_KEY missing.');
    }

    console.log('[Cliplyst] Fetching job status for:', jobId);

    const response = await fetch(`${CLIPLYST_GET_STATUS_URL}?job_id=${encodeURIComponent(jobId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LYNKSCOPE_INTERNAL_KEY}`,
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP ${response.status}` };
      }

      throw new Error(
        errorData.error ||
        errorData.message ||
        `Failed to get status: ${response.status}`
      );
    }

    const result: CliplystResponse = await response.json();

    console.log('[Cliplyst] Job status:', {
      job_id: jobId,
      status: result.status,
      message: result.message,
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('[Cliplyst] Status check error:', errorMessage);

    return {
      success: false,
      message: 'Failed to check job status',
      error: errorMessage,
    };
  }
}

/**
 * Verify Cliplyst connection is available
 * @returns Promise<boolean> - True if connection is configured
 */
export function isCliplystConfigured(): boolean {
  return !!LYNKSCOPE_INTERNAL_KEY;
}

/**
 * Get Cliplyst connection status
 * @returns Object with configuration status
 */
export function getCliplystStatus() {
  return {
    configured: isCliplystConfigured(),
    baseUrl: CLIPLYST_BASE_URL,
    hasApiKey: !!LYNKSCOPE_INTERNAL_KEY,
  };
}
