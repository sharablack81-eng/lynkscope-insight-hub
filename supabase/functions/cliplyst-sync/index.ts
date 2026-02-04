import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarketingIntelPayload {
  user_id: string;
  business_name: string;
  niche: string;
  total_clicks: number;
  top_platform: string;
  underperforming_platforms: string[];
  platform_click_breakdown: {
    youtube: number;
    tiktok: number;
    instagram: number;
    twitter: number;
    other: number;
  };
  weak_platforms: string[];
  top_opportunities: string[];
  auto_schedule: boolean;
  posting_frequency: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
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

    // Validate authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get environment variables
    const CLIPLYST_BASE_URL = Deno.env.get('VITE_CLIPLYST_BASE_URL') || 'https://hnkrklkozvgwjfxeearh.supabase.co/functions/v1';
    const CLIPLYST_CREATE_JOB_URL = Deno.env.get('VITE_CLIPLYST_CREATE_JOB') || `${CLIPLYST_BASE_URL}/lynkscope-create-job`;
    const LYNKSCOPE_INTERNAL_KEY = Deno.env.get('LYNKSCOPE_INTERNAL_KEY');

    if (!LYNKSCOPE_INTERNAL_KEY) {
      console.error('LYNKSCOPE_INTERNAL_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Cliplyst integration not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the incoming payload
    const payload: MarketingIntelPayload = await req.json();

    // Validate required fields
    if (!payload.user_id || !payload.business_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id or business_name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Cliplyst Sync] Sending marketing intelligence:', {
      user_id: payload.user_id,
      business_name: payload.business_name,
      niche: payload.niche,
      total_clicks: payload.total_clicks,
      top_platform: payload.top_platform,
      underperforming_count: payload.underperforming_platforms?.length || 0,
    });

    // Prepare the Cliplyst payload
    const cliplystPayload = {
      user_id: payload.user_id,
      company_name: payload.business_name,
      niche: payload.niche || 'General',
      weak_platforms: payload.weak_platforms || payload.underperforming_platforms || [],
      top_opportunities: payload.top_opportunities || [
        `Focus on ${payload.top_platform || 'your best platform'}`,
        'Improve underperforming content',
        'Analyze successful posts',
      ],
      auto_schedule: payload.auto_schedule ?? false,
      posting_frequency: payload.posting_frequency || 'daily',
      platform_click_breakdown: payload.platform_click_breakdown,
      source: 'lynkscope-marketing-analysis',
      timestamp: new Date().toISOString(),
    };

    // Send to Cliplyst with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const cliplystResponse = await fetch(CLIPLYST_CREATE_JOB_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LYNKSCOPE_INTERNAL_KEY}`,
          'x-lynkscope-signature': LYNKSCOPE_INTERNAL_KEY,
        },
        body: JSON.stringify(cliplystPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!cliplystResponse.ok) {
        let errorData;
        try {
          errorData = await cliplystResponse.json();
        } catch {
          errorData = { error: `HTTP ${cliplystResponse.status}` };
        }

        console.warn('[Cliplyst Sync] Cliplyst API returned error:', {
          status: cliplystResponse.status,
          error: errorData,
        });

        // Return success anyway - we don't want to fail the user's analysis
        // just because Cliplyst is unavailable
        return new Response(
          JSON.stringify({
            success: true,
            synced: false,
            message: 'Marketing analysis complete. Cliplyst sync will retry later.',
            cliplyst_status: 'unavailable',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const cliplystResult = await cliplystResponse.json();

      console.log('[Cliplyst Sync] Successfully synced:', {
        automation_id: cliplystResult.automation_id,
        status: cliplystResult.status,
      });

      return new Response(
        JSON.stringify({
          success: true,
          synced: true,
          message: 'Marketing intelligence synced to Cliplyst',
          automation_id: cliplystResult.automation_id,
          cliplyst_status: cliplystResult.status || 'processing',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      
      const isAbortError = fetchError instanceof Error && fetchError.name === 'AbortError';
      if (isAbortError) {
        console.warn('[Cliplyst Sync] Request timed out');
      } else {
        console.warn('[Cliplyst Sync] Network error:', fetchError);
      }

      // Return success anyway - graceful degradation
      return new Response(
        JSON.stringify({
          success: true,
          synced: false,
          message: 'Marketing analysis complete. Cliplyst sync will retry later.',
          cliplyst_status: 'timeout',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (err) {
    console.error('[Cliplyst Sync] Error:', err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
