/**
 * Cliplyst Embed Service
 * Handles JWT token generation and Cliplyst session initiation
 */

const CLIPLYST_API_URL = import.meta.env.VITE_CLIPLYST_API_URL || 'https://cliplyst-content-maker-4qd6.onrender.com';
const BACKEND_URL = import.meta.env.VITE_SUPABASE_URL;

export interface CliplystSessionResponse {
  success: boolean;
  embed_url?: string;
  token?: string;
  error?: string;
  message?: string;
}

/**
 * Request Cliplyst embed session from backend
 * Backend will generate JWT and validate with Cliplyst
 */
export async function requestCliplystSession(accessToken: string): Promise<CliplystSessionResponse> {
  try {
    console.log('[Cliplyst Embed] Requesting session from backend');

    const response = await fetch(`${BACKEND_URL}/functions/v1/cliplyst-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP ${response.status}` };
      }

      console.error('[Cliplyst Embed] Session error:', errorData);
      throw new Error(errorData.error || `Failed to create session: ${response.status}`);
    }

    // Read response as text first to handle empty or invalid JSON bodies
    const text = await response.text();

    if (!text) {
      console.error('[Cliplyst Embed] Empty response body');
      throw new Error(`Empty response body (HTTP ${response.status})`);
    }

    let result: CliplystSessionResponse;
    try {
      result = JSON.parse(text) as CliplystSessionResponse;
    } catch (err) {
      console.error('[Cliplyst Embed] Invalid JSON response:', text);
      throw new Error('Invalid JSON in Cliplyst session response');
    }

    if (!result.success) {
      throw new Error(result.error || 'Failed to create Cliplyst session');
    }

    console.log('[Cliplyst Embed] Session created successfully');
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Cliplyst Embed] Error:', errorMessage);

    return {
      success: false,
      error: errorMessage,
      message: 'Failed to initialize Cliplyst session',
    };
  }
}

/**
 * Check if Cliplyst has been activated for this user
 */
export function isCliplystActivated(): boolean {
  try {
    const activated = localStorage.getItem('cliplyst_activated');
    return activated === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark Cliplyst as activated
 */
export function markCliplystActivated(): void {
  localStorage.setItem('cliplyst_activated', 'true');
  localStorage.setItem('cliplyst_activated_at', new Date().toISOString());
}

/**
 * Get Cliplyst activation status
 */
export function getCliplystStatus() {
  return {
    activated: isCliplystActivated(),
    activatedAt: localStorage.getItem('cliplyst_activated_at'),
  };
}
