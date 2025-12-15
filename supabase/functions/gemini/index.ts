// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js@2";

type GeminiAction =
  | "analyzeFeedbackBatch"
  | "generateStrategicAdvice"
  | "generateProductRecommendations"
  | "generateMarketResearch"
  | "translateText";

type JsonRecord = Record<string, unknown>;

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(status: number, body: JsonRecord) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function stripCodeFences(text: string): string {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return "";

  // ```json ... ``` or ``` ... ```
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch?.[1]) return fenceMatch[1].trim();

  return trimmed;
}

async function requireUser(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const authHeader = req.headers.get("Authorization") ?? "";

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in Edge Function env.");
  }

  if (!authHeader) {
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

async function geminiGenerateText(params: {
  apiKey: string;
  model: string;
  parts: string[];
}): Promise<string> {
  const { apiKey, model, parts } = params;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    contents: [
      {
        role: "user",
        parts: parts.map((text) => ({ text })),
      },
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => null)) as any;
  if (!res.ok) {
    const details = json ? JSON.stringify(json) : "(no response body)";
    throw new Error(`Gemini API error (${res.status}): ${details}`);
  }

  const text =
    json?.candidates?.[0]?.content?.parts
      ?.map((p: any) => (typeof p?.text === "string" ? p.text : ""))
      .join("") ??
    "";

  return text;
}

function mapClusterNamesToIds(params: {
  clusterNameList: string[];
  clusters: Array<{ id: string; name: string }>;
}): string[] {
  const { clusterNameList, clusters } = params;

  return (clusterNameList ?? [])
    .map((name) => {
      if (!name) return "";
      const lowered = name.toLowerCase();
      return (
        clusters.find((c) => c.name.toLowerCase().includes(lowered))?.id ?? ""
      );
    })
    .filter(Boolean);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    const user = await requireUser(req);
    if (!user) {
      return jsonResponse(401, { error: "Unauthorized" });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY") ?? "";
    if (!apiKey) {
      return jsonResponse(500, { error: "Missing GEMINI_API_KEY secret" });
    }

    const body = (await req.json().catch(() => null)) as any;
    const action = body?.action as GeminiAction | undefined;

    if (!action) {
      return jsonResponse(400, { error: "Missing action" });
    }

    const model = (body?.model as string | undefined) ?? "gemini-2.5-flash";

    if (action === "analyzeFeedbackBatch") {
      const feedbackItems = (body?.feedbackItems as string[] | undefined) ?? [];
      const context = (body?.context as string | undefined) ?? undefined;

      const slicedItems = feedbackItems.slice(0, 500);
      const feedbackText = slicedItems
        .map((item, i) => `[ID: ${i}] ${item}`)
        .join("\n");

      const prompt = `
You are a world-class Voice-of-Customer analyst.
Analyze the following list of customer feedback items.
${context ? `\nPRODUCT/COMPANY CONTEXT:\n${context}\n` : ""}

Tasks:
1. Group the feedback into stable, distinct taxonomic clusters based on semantic meaning.
2. IMPORTANT: For each cluster, you MUST list the "itemIds" (the integers provided in the input) of the specific feedback items that belong to it.
3. Analyze the sentiment of each cluster (-1.0 to 1.0).
4. Assign a priority score (1-10) based on urgency, severity, and frequency.
5. Detect if a theme is "emerging" (new, rapid growth, or acute recent pain point).
6. Provide a high-level executive summary of the entire dataset.
7. Extract the top 3-5 distinct actionable priorities.

Return ONLY valid JSON with this shape:
{
  "summary": string,
  "overallSentiment": number,
  "topPriorities": string[],
  "clusters": [
    {
      "name": string,
      "description": string,
      "sentimentScore": number,
      "priorityScore": number,
      "itemIds": number[],
      "isEmerging": boolean,
      "keyInsights": string[]
    }
  ]
}
`;

      const text = await geminiGenerateText({
        apiKey,
        model,
        parts: [prompt, `FEEDBACK DATA LIST:\n${feedbackText}`],
      });

      const jsonText = stripCodeFences(text);
      const data = JSON.parse(jsonText);

      const clusters = (data.clusters ?? []).map((c: any, index: number) => ({
        id: `cluster-${index}-${Date.now()}`,
        name: c.name,
        description: c.description,
        sentimentScore: c.sentimentScore,
        priorityScore: c.priorityScore,
        itemCount: Array.isArray(c.itemIds) ? c.itemIds.length : 0,
        itemIndices: c.itemIds || [],
        isEmerging: c.isEmerging,
        keyInsights: c.keyInsights || [],
      }));

      return jsonResponse(200, {
        summary: data.summary,
        overallSentiment: data.overallSentiment,
        clusters,
        topPriorities: data.topPriorities,
        totalItemsProcessed: slicedItems.length,
      });
    }

    if (action === "generateStrategicAdvice") {
      const clusterName = (body?.clusterName as string | undefined) ?? "";
      const feedbackItems = (body?.feedbackItems as string[] | undefined) ?? [];
      const context = (body?.context as string | undefined) ?? undefined;

      const itemsText = feedbackItems
        .slice(0, 50)
        .map((i) => `- ${i}`)
        .join("\n");

      const prompt = `
You are a specialized Product Strategy Consultant.
Focus Topic: "${clusterName}"
${context ? `Product Context: ${context}` : ""}

Analyze the raw feedback items below related to this topic.
Provide a concise, high-impact strategic implementation plan.

Structure your response in Markdown:
1. **Root Cause Diagnosis**: What is really happening?
2. **Strategic Recommendation**: What should be done? (Short term & Long term)
3. **Expected Impact**: Why does this matter?

Keep it professional, direct, and actionable. No fluff.

Feedback Items:
${itemsText}
`;

      const text = await geminiGenerateText({ apiKey, model, parts: [prompt] });
      return jsonResponse(200, { advice: text || "Could not generate advice." });
    }

    if (action === "generateProductRecommendations") {
      const clusters = (body?.clusters as any[] | undefined) ?? [];
      const feedbackItems = (body?.feedbackItems as string[] | undefined) ?? [];
      const context = (body?.context as string | undefined) ?? undefined;

      const clustersText = clusters
        .map(
          (c) =>
            `- ${c.name} (Priority: ${c.priorityScore}/10, Sentiment: ${Number(
              c.sentimentScore
            ).toFixed(2)}, Volume: ${c.itemCount})\n  ${c.description}`
        )
        .join("\n");

      const prompt = `
You are a Product Manager analyzing customer feedback to generate actionable product recommendations.
${context ? `Product Context: ${context}` : ""}

Based on the following feedback themes and clusters, generate 5-8 specific, actionable product recommendations.

Clusters:
${clustersText}

Return ONLY valid JSON with this shape:
{
  "recommendations": [
    {
      "title": string,
      "description": string,
      "category": "feature" | "improvement" | "fix" | "enhancement",
      "priority": "high" | "medium" | "low",
      "effort": "low" | "medium" | "high",
      "impact": string,
      "relatedClusterNames": string[]
    }
  ]
}
`;

      const text = await geminiGenerateText({ apiKey, model, parts: [prompt] });
      const jsonText = stripCodeFences(text);
      const data = JSON.parse(jsonText);

      const recommendations = (data.recommendations ?? []).map(
        (rec: any, index: number) => ({
          id: `rec-${index}-${Date.now()}`,
          title: rec.title,
          description: rec.description,
          category: rec.category,
          priority: rec.priority,
          effort: rec.effort,
          impact: rec.impact,
          relatedClusters: mapClusterNamesToIds({
            clusterNameList: rec.relatedClusterNames ?? [],
            clusters,
          }),
        })
      );

      return jsonResponse(200, { recommendations });
    }

    if (action === "generateMarketResearch") {
      const category = (body?.category as string | undefined) ?? "other";
      const query = (body?.query as string | undefined) ?? "";
      const context = (body?.context as string | undefined) ?? undefined;

      const prompt = `
You are a product research assistant.

Goal: Help the user produce a high-signal research brief for "${category}".

Important constraints:
- You DO NOT have live browsing in this environment.
- Do not claim you visited websites or verified real-time pricing.
- Instead: provide hypotheses, what to verify, how to verify, and a structured brief.

${context ? `Product/Company Context:\n${context}\n` : ""}

User research request:
${query}

Output Markdown with these sections:
1) Executive Summary (5-8 bullets)
2) Key Hypotheses (what you suspect is true and why)
3) What to Verify (specific questions and data points)
4) Deep Search Plan (where to look + exact search queries to use)
5) Competitive/Market Landscape (entities to compare; what dimensions)
6) Pricing Considerations (if relevant: packaging, tiers, willingness-to-pay angles)
7) Risks & Unknowns
8) Recommended Next Actions (7-day plan)
`;

      const text = await geminiGenerateText({ apiKey, model, parts: [prompt] });
      return jsonResponse(200, { markdown: text || "Could not generate research." });
    }

    if (action === "translateText") {
      const text = (body?.text as string | undefined) ?? "";
      const targetLanguage = (body?.targetLanguage as string | undefined) ?? "English";

      const prompt = `Translate the following text to ${targetLanguage}. Provide only the translation, no explanations or additional text:\n\n${text}`;
      const translated = await geminiGenerateText({ apiKey, model, parts: [prompt] });
      return jsonResponse(200, { translation: translated || text });
    }

    return jsonResponse(400, { error: `Unknown action: ${String(action)}` });
  } catch (e) {
    console.error("Edge Gemini error:", e);
    return jsonResponse(500, { error: (e as Error)?.message ?? "Unknown error" });
  }
});
