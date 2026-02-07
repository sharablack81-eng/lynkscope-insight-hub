import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const { platform, niche, clip_id, trend_id, tone } = await req.json();

    if (!platform || !niche) {
      return new Response(
        JSON.stringify({ error: "platform and niche are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const selectedTone = tone || "engaging";

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are a social media marketing expert specializing in ${niche}. Generate captions and hashtags optimized for ${platform}. Tone: ${selectedTone}. Return JSON array with objects having: caption_text, hashtags (array of strings without #), seo_score (0-100).`,
            },
            {
              role: "user",
              content: `Generate 5 ${selectedTone} captions with SEO hashtags for ${platform} in the ${niche} niche. Return ONLY valid JSON array.`,
            },
          ],
          temperature: 0.8,
        }),
      }
    );

    if (!aiResponse.ok) {
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";

    // Parse AI response
    let captions: Array<{
      caption_text: string;
      hashtags: string[];
      seo_score: number;
    }> = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) captions = JSON.parse(jsonMatch[0]);
    } catch {
      captions = [
        {
          caption_text: content.slice(0, 500),
          hashtags: [niche.toLowerCase().replace(/\s+/g, "")],
          seo_score: 50,
        },
      ];
    }

    // Store in DB
    const insertRows = captions.map((c) => ({
      user_id: user.id,
      clip_id: clip_id || null,
      trend_id: trend_id || null,
      platform,
      caption_text: c.caption_text,
      hashtags: c.hashtags,
      tone: selectedTone,
      seo_score: c.seo_score,
    }));

    const { data: saved, error: insertError } = await supabase
      .from("cliplyst_captions")
      .insert(insertRows)
      .select();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, captions: saved }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[cliplyst-generate-captions]", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Internal error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
