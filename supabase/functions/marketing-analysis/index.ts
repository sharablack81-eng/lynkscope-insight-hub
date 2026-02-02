// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyticsData {
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

interface AnalysisResult {
  summary: string;
  platformRanking: Array<{
    platform: string;
    score: number;
    clicks: number;
    performance: 'excellent' | 'good' | 'fair' | 'poor';
    recommendation: string;
  }>;
  keyInsights: {
    topPerformingContent: string;
    underperformingAreas: string;
    suggestions: string[];
  };
  nextSteps: string;
}
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateFallbackAnalysis(analyticsData: AnalyticsData): Promise<AnalysisResult> {
  // Generate analysis based on data patterns without AI
  const platformEntries = Object.entries(analyticsData.platformBreakdown)
    .sort((a, b) => b[1].clicks - a[1].clicks);
  
  const platformRanking = platformEntries.map(([platform, data]) => {
    const score = Math.min(100, Math.max(0, Math.round((data.clicks / (analyticsData.totalClicks || 1)) * 150)));
    let performance: 'excellent' | 'good' | 'fair' | 'poor' = 'fair';
    if (score >= 80) performance = 'excellent';
    else if (score >= 60) performance = 'good';
    else if (score >= 40) performance = 'fair';
    else performance = 'poor';
    
    const recommendation = 
      performance === 'excellent' ? `Continue leveraging ${platform} - it's your strongest platform`
      : performance === 'good' ? `${platform} is performing well - consider optimizing further`
      : performance === 'fair' ? `${platform} needs more attention - try new content types`
      : `${platform} needs a strategy overhaul - experiment with different content`;
    
    return { platform, score, clicks: data.clicks, performance, recommendation };
  });

  const summary = analyticsData.totalClicks > 0 
    ? `Your marketing performance shows ${analyticsData.totalClicks} total clicks across ${analyticsData.totalLinks} links. ${platformRanking[0]?.platform || 'Unknown'} is your top performer with ${platformRanking[0]?.clicks || 0} clicks.`
    : 'You have no clicks yet. Start by creating links and sharing them to generate engagement data.';

  const topPerformingContent = analyticsData.topPerformers.length > 0
    ? `"${analyticsData.topPerformers[0].title}" on ${analyticsData.topPerformers[0].platform} with ${analyticsData.topPerformers[0].clicks} clicks`
    : 'No data available yet';

  const underperformingAreas = analyticsData.underperformers.length > 0
    ? `Focus on underperforming links: ${analyticsData.underperformers.map(u => `"${u.title}"`).join(', ')}`
    : 'All your content is performing well!';

  const suggestions = [
    'Test new content types on your top platform',
    'Analyze what makes your top content successful',
    'Experiment with posting times and frequency',
    'Get feedback from your audience'
  ];

  const nextSteps = `1. Promote your top-performing links more\n2. Revise content strategy for underperformers\n3. Expand what's working on ${platformRanking[0]?.platform || 'your best platform'}\n4. Monitor trends and adjust accordingly`;

  return {
    summary,
    platformRanking,
    keyInsights: {
      topPerformingContent,
      underperformingAreas,
      suggestions
    },
    nextSteps
  };
}

async function callOpenAIAPI(analyticsData: AnalyticsData): Promise<AnalysisResult> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    console.warn('OPENAI_API_KEY not configured - using fallback analysis');
    return generateFallbackAnalysis(analyticsData);
  }

  const prompt = `Analyze this marketing data and respond with ONLY valid JSON, no other text.

Business: ${analyticsData.businessName} (${analyticsData.businessNiche})
Links: ${analyticsData.totalLinks} | Clicks: ${analyticsData.totalClicks} | CTR: ${(analyticsData.averageCtr * 100).toFixed(1)}%

Platforms: ${Object.entries(analyticsData.platformBreakdown)
  .map(([p, d]) => `${p}(${d.clicks}c)`)
  .join(', ')}

Top: ${analyticsData.topPerformers.slice(0, 2).map(p => p.title).join(', ') || 'None'}
Low: ${analyticsData.underperformers.slice(0, 2).map(p => p.title).join(', ') || 'None'}

Output JSON:
{
  "summary": "2-3 sentence executive summary",
  "platformRanking": [{"platform": "name", "score": 0-100, "clicks": number, "performance": "excellent|good|fair|poor", "recommendation": "brief advice"}],
  "keyInsights": {"topPerformingContent": "what works", "underperformingAreas": "what doesn't", "suggestions": ["tip1", "tip2"]},
  "nextSteps": "action items"
}`;

  let lastError: Error | null = null;
  const maxRetries = 3;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Output only valid JSON.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 800,
          temperature: 0.1,
        }),
      });

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('retry-after') || '60', 10);
        const waitTime = Math.min(retryAfter * 1000, (attempt + 1) * 2000);
        console.warn(`Rate limited. Retry attempt ${attempt + 1}/${maxRetries}. Waiting ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }

      if (!res.ok) {
        const err = await res.text();
        console.error('OpenAI API error:', err);
        throw new Error(`OpenAI API failed: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || '';

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Failed to parse response as JSON');

      return JSON.parse(jsonMatch[0]);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries - 1) {
        const backoffMs = (attempt + 1) * 1000;
        console.warn(`Attempt ${attempt + 1}/${maxRetries} failed. Retrying in ${backoffMs}ms...`);
        await sleep(backoffMs);
      }
    }
  }

  // If all OpenAI retries failed, fall back to local analysis
  console.warn('OpenAI API failed after retries, using fallback analysis:', lastError?.message);
  return generateFallbackAnalysis(analyticsData);
}

serve(async (req: Request) => {
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

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const analyticsData: AnalyticsData = await req.json();

    console.log('Analyzing marketing data for:', analyticsData.businessName);

      // Call OpenAI API for analysis
      const analysis = await callOpenAIAPI(analyticsData);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('Analysis error:', err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
