// @ts-nocheck
// @deno-types="https://deno.land/std@0.208.0/http/server.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @deno-types="https://esm.sh/@supabase/supabase-js@2/dist/module/index.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
async function callOpenAIAPI(analyticsData: AnalyticsData): Promise<AnalysisResult> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const prompt = `You are a marketing analytics expert. Analyze the following marketing data and provide actionable insights.

Business: ${analyticsData.businessName}
Niche: ${analyticsData.businessNiche}

Marketing Performance Data:
- Total Links: ${analyticsData.totalLinks}
- Total Clicks: ${analyticsData.totalClicks}
- Average CTR: ${(analyticsData.averageCtr * 100).toFixed(2)}%
- Time Range: ${analyticsData.timeRange}

Platform Breakdown:
${Object.entries(analyticsData.platformBreakdown)
  .map(([platform, data]) => `- ${platform}: ${data.clicks} clicks from ${data.links} links (CTR: ${(data.ctr * 100).toFixed(2)}%)`)
  .join('\n')}

Top Performers:
${analyticsData.topPerformers.map(p => `- "${p.title}" on ${p.platform}: ${p.clicks} clicks`).join('\n') || 'No data yet'}

Underperformers:
${analyticsData.underperformers.map(p => `- "${p.title}" on ${p.platform}: ${p.clicks} clicks`).join('\n') || 'No data yet'}

Please provide:
1. A brief executive summary (2-3 sentences)
2. A ranking of platforms from worst to best performer with scores
3. Key insights about what's working and what isn't
4. Specific, actionable suggestions for improvement

Format your response as valid JSON with these exact fields:
{
  "summary": "...",
  "platformRanking": [
    {
      "platform": "...",
      "score": <0-100>,
      "clicks": <number>,
      "performance": "excellent|good|fair|poor",
      "recommendation": "..."
    }
  ],
  "keyInsights": {
    "topPerformingContent": "...",
    "underperformingAreas": "...",
    "suggestions": ["...", "..."]
  },
  "nextSteps": "..."
}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that outputs structured JSON.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1200,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('OpenAI API error:', err);
    throw new Error(`OpenAI API failed: ${res.statusText}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '';

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse OpenAI response as JSON');

  return JSON.parse(jsonMatch[0]);
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
