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
  topPlatform: string;
  topPlatformPercentage: number;
}

/**
 * Normalize platform name to canonical form - MUST match src/lib/analytics.ts exactly
 */
function normalizePlatformName(platform: string | null | undefined): string {
  if (!platform) return 'Other';
  const normalized = String(platform).toLowerCase().trim();
  const platformMap: Record<string, string> = {
    'tiktok': 'TikTok',
    'instagram': 'Instagram',
    'youtube': 'YouTube',
    'twitter': 'Twitter',
    'x': 'Twitter',
    'other': 'Other'
  };
  return platformMap[normalized] || platform;
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

    // Fetch business profile - use maybeSingle to handle missing profiles gracefully
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('business_name, business_niche')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.warn('Profile fetch error (may not exist yet):', profileError.message);
    }

    // Fetch user's links - same query as dashboard uses
    const { data: links, error: linksError } = await supabase
      .from('links')
      .select('id, title, url, platform, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (linksError) throw linksError;

    // Get user's link IDs for filtering clicks
    const userLinkIds = (links || []).map(link => link.id);
    const totalLinks = links?.length || 0;

    // Get ALL clicks for user's links from smart_link_clicks (single source of truth)
    // This matches the dashboard's getAggregatedAnalytics() which uses fetchAllClicks()
    let allClicks: any[] = [];
    if (userLinkIds.length > 0) {
      const { data: clicksData, error: clicksError } = await supabase
        .from('smart_link_clicks')
        .select('id, link_id, clicked_at, destination_url, browser, device_type, country, continent')
        .in('link_id', userLinkIds)
        .order('clicked_at', { ascending: false });

      if (clicksError) throw clicksError;
      allClicks = clicksData || [];
    }

    // Total clicks - exact count from all clicks
    const totalClicks = allClicks.length;

    // Build link-to-clicks map
    const linkClicksMap: Record<string, any[]> = {};
    for (const click of allClicks) {
      if (click.link_id) {
        if (!linkClicksMap[click.link_id]) {
          linkClicksMap[click.link_id] = [];
        }
        linkClicksMap[click.link_id].push(click);
      }
    }

    // Platform breakdown - MUST match dashboard aggregation logic exactly
    // Dashboard: iterates links, counts clicks per link, groups by normalized platform
    const platformBreakdown: Record<string, { clicks: number; links: number; ctr: number }> = {};
    
    const linkPerformance = (links || []).map(link => {
      const linkClicks = linkClicksMap[link.id] || [];
      const platform = normalizePlatformName(link.platform);
      
      if (!platformBreakdown[platform]) {
        platformBreakdown[platform] = { clicks: 0, links: 0, ctr: 0 };
      }
      platformBreakdown[platform].clicks += linkClicks.length;
      platformBreakdown[platform].links += 1;

      return {
        id: link.id,
        title: link.title,
        url: link.url,
        platform: platform,
        clicks: linkClicks.length,
      };
    });

    // Calculate CTR for each platform
    Object.values(platformBreakdown).forEach(data => {
      data.ctr = data.links > 0 ? (data.clicks / data.links) : 0;
    });

    // Find top platform - MUST match dashboard logic
    // Dashboard: platformBreakdown.reduce((a, b) => a.value > b.value ? a : b)
    let topPlatform = 'N/A';
    let topPlatformClicks = 0;
    let topPlatformPercentage = 0;
    
    for (const [platform, data] of Object.entries(platformBreakdown)) {
      if (data.clicks > topPlatformClicks) {
        topPlatformClicks = data.clicks;
        topPlatform = platform;
      }
    }
    
    if (totalClicks > 0 && topPlatformClicks > 0) {
      topPlatformPercentage = Math.round((topPlatformClicks / totalClicks) * 100);
    }

    // Sort link performance by clicks descending
    linkPerformance.sort((a, b) => b.clicks - a.clicks);

    // Top performers - top 5 links
    const topPerformers = linkPerformance.slice(0, 5);
    
    // Underperformers - bottom 5 with less than half of top performer's clicks
    const underperformers = linkPerformance
      .slice(-5)
      .reverse()
      .filter(p => p.clicks < (topPerformers[0]?.clicks || 1) / 2);

    const averageCtr = totalLinks > 0 ? (totalClicks / totalLinks) : 0;

    const analytics: UserAnalytics = {
      businessName: profile?.business_name || 'Your Business',
      businessNiche: profile?.business_niche || 'General',
      totalLinks,
      totalClicks,
      platformBreakdown,
      timeRange: 'All time',
      topPerformers,
      underperformers,
      averageCtr,
      topPlatform,
      topPlatformPercentage,
    };

    console.log(`[collect-analytics] User ${userId}: ${totalClicks} clicks, ${totalLinks} links, top platform: ${topPlatform}`);

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
