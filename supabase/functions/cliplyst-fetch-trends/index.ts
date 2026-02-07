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

    const { niche, platform } = await req.json();
    if (!niche) {
      return new Response(
        JSON.stringify({ error: "niche is required" }),
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

    const targetPlatform = platform || "all platforms";

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
              content: `You are a social media trend analyst. Identify current trending topics for the ${niche} niche on ${targetPlatform}. Return JSON array with objects: title, description, platform (string), source_url (can be empty string), trend_score (0-100).`,
            },
            {
              role: "user",
              content: `Find 8 trending topics right now in the "${niche}" niche for ${targetPlatform}. Return ONLY valid JSON array.`,
            },
          ],
          temperature: 0.7,
        }),
      }
    );

    if (!aiResponse.ok) throw new Error(`AI gateway error: ${aiResponse.status}`);

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";

    let trends: Array<{
      title: string;
      description: string;
      platform: string;
      source_url: string;
      trend_score: number;
    }> = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) trends = JSON.parse(jsonMatch[0]);
    } catch {
      trends = [];
    }

    // Store trends
    const insertRows = trends.map((t) => ({
      user_id: user.id,
      niche,
      platform: t.platform || targetPlatform,
      title: t.title,
      description: t.description || "",
      source_url: t.source_url || "",
      trend_score: t.trend_score || 50,
    }));

    if (insertRows.length > 0) {
      const { error: insertError } = await supabase
        .from("cliplyst_trends")
        .insert(insertRows);
      if (insertError) console.error("Insert error:", insertError);
    }

    // Return all user trends for this niche (including newly added)
    const { data: allTrends } = await supabase
      .from("cliplyst_trends")
      .select("*")
      .eq("user_id", user.id)
      .eq("niche", niche)
      .order("trend_score", { ascending: false })
      .limit(20);

    return new Response(
      JSON.stringify({ success: true, trends: allTrends || [] }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[cliplyst-fetch-trends]", err);
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
