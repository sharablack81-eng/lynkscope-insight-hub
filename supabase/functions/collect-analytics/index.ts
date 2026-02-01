// @ts-nocheck
// @deno-types="https://deno.land/std@0.208.0/http/server.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @deno-types="https://esm.sh/@supabase/supabase-js@2/dist/module/index.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @deno-types="https://esm.sh/jwt-decode@4.0.0/index.d.ts"
import { jwtDecode } from "https://esm.sh/jwt-decode@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserAnalytics {
  businessName: string;
  businessNiche: string;
  totalLinks: number;
  totalClicks: number;
  platformBreakdown: Record<string, { clicks: number; links: number; ctr: number }>;
  timeRange: string;
  topPerformers: Array<{ title: string; url: string; clicks: number; platform: string }>;
  underperformers: Array<{ title: string; url: string; clicks: number; platform: string }>;
  averageCtr: number;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract JWT token
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwtDecode(token);
    const userId = decoded.sub;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch business profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('business_name, business_niche')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Fetch user's links with click counts
    const { data: links, error: linksError } = await supabase
      .from('links')
      .select(
        `
        id,
        title,
        url,
        platform,
        link_clicks (count)
      `
      )
      .eq('user_id', userId);

    if (linksError) throw linksError;

    // Fetch click analytics
    const { data: clicks, error: clicksError } = await supabase
      .from('link_clicks')
      .select('link_id, clicked_at')
      .in('link_id', (links || []).map(l => l.id));

    if (clicksError) throw clicksError;

    // Aggregate analytics
    const platformBreakdown: Record<string, { clicks: number; links: number; ctr: number }> = {};
    let totalClicks = 0;
    let totalLinks = 0;

    if (links && links.length > 0) {
      totalLinks = links.length;

      for (const link of links) {
        const linkClicks = link.link_clicks?.[0]?.count || 0;
        totalClicks += linkClicks;

        const platform = link.platform || 'Unknown';
        if (!platformBreakdown[platform]) {
          platformBreakdown[platform] = { clicks: 0, links: 0, ctr: 0 };
        }
        platformBreakdown[platform].clicks += linkClicks;
        platformBreakdown[platform].links += 1;
      }
    }

    // Calculate CTR for each platform
    Object.values(platformBreakdown).forEach(data => {
      data.ctr = data.links > 0 ? data.clicks / (data.links * 100) : 0; // Assuming 100 impressions per link as baseline
    });

    // Find top and underperformers
    const linkPerformance = (links || []).map(link => ({
      id: link.id,
      title: link.title,
      url: link.url,
      platform: link.platform,
      clicks: link.link_clicks?.[0]?.count || 0,
    }));

    linkPerformance.sort((a, b) => b.clicks - a.clicks);

    const topPerformers = linkPerformance.slice(0, 5);
    const underperformers = linkPerformance.slice(-5).filter(p => p.clicks === 0 || p.clicks < topPerformers[0]?.clicks / 2);

    const averageCtr = totalLinks > 0 ? totalClicks / (totalLinks * 100) : 0;

    const analytics: UserAnalytics = {
      businessName: profile?.business_name || 'Your Business',
      businessNiche: profile?.business_niche || 'General',
      totalLinks,
      totalClicks,
      platformBreakdown,
      timeRange: 'Last 30 days', // Could be parameterized
      topPerformers,
      underperformers,
      averageCtr,
    };

    return new Response(JSON.stringify(analytics), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('Analytics aggregation error:', err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
