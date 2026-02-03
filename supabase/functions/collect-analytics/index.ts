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

    // Fetch business profile - use maybeSingle to handle missing profiles gracefully
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('business_name, business_niche')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.warn('Profile fetch error (may not exist yet):', profileError.message);
    }

    // Fetch user's links
    const { data: links, error: linksError } = await supabase
      .from('links')
      .select('id, title, url, platform, created_at')
      .eq('user_id', userId);

    if (linksError) throw linksError;

    // Get user's link IDs for filtering clicks
    const userLinkIds = (links || []).map(link => link.id);

    // Get clicks only for user's links from smart_link_clicks (single source of truth)
    // Filter to last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let allClicks: any[] = [];
    if (userLinkIds.length > 0) {
      const { data: clicksData, error: clicksError } = await supabase
        .from('smart_link_clicks')
        .select('id, link_id, clicked_at, destination_url, browser, device_type, country, continent')
        .in('link_id', userLinkIds)
        .gte('clicked_at', thirtyDaysAgo.toISOString());

      if (clicksError) throw clicksError;
      allClicks = clicksData || [];
    }

    // Aggregate analytics by link_id
    const linkClicksMap: Record<string, any[]> = {};
    let totalClicks = 0;

    if (allClicks.length > 0) {
      totalClicks = allClicks.length;
      for (const click of allClicks) {
        if (click.link_id) {
          if (!linkClicksMap[click.link_id]) {
            linkClicksMap[click.link_id] = [];
          }
          linkClicksMap[click.link_id].push(click);
        }
      }
    }

    // Build platform breakdown and link performance
    const platformBreakdown: Record<string, { clicks: number; links: number; ctr: number }> = {};
    const linkPerformance = (links || []).map(link => {
      const linkClicks = linkClicksMap[link.id] || [];
      const platform = link.platform || 'Other';
      
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

    const totalLinks = links?.length || 0;

    // Calculate CTR for each platform
    Object.values(platformBreakdown).forEach(data => {
      data.ctr = data.links > 0 ? (data.clicks / data.links) : 0;
    });

    // Find top and underperformers
    linkPerformance.sort((a, b) => b.clicks - a.clicks);

    const topPerformers = linkPerformance.slice(0, 5);
    const underperformers = linkPerformance.slice(-5).reverse().filter(p => p.clicks < (topPerformers[0]?.clicks || 1) / 2);

    const averageCtr = totalLinks > 0 ? (totalClicks / totalLinks) : 0;

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
