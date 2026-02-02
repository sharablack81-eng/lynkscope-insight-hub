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

async function callOpenAIAPI(analyticsData: AnalyticsData): Promise<AnalysisResult> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    console.error('OPENAI_API_KEY environment variable is not set');
    throw new Error('OpenAI API key is not configured. Please add OPENAI_API_KEY to Supabase function environment variables.');
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

  throw lastError || new Error('Failed to get analysis after multiple attempts');
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
