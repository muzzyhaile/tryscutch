// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js@2";

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

function requireEnv(name: string) {
  const v = Deno.env.get(name);
  if (!v) {
    throw new Error(
      `Missing ${name} in Edge Function env. Set it in Supabase Dashboard → Edge Functions → Secrets, or via \
supabase secrets set ${name}=...`
    );
  }
  return v;
}

function createAuthedClient(params: { req: Request }) {
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const supabaseAnonKey = requireEnv("SUPABASE_ANON_KEY");
  const authHeader = params.req.headers.get("Authorization") ?? "";

  return createClient(supabaseUrl, supabaseAnonKey, {
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
}

function createServiceClient() {
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

async function stripeFormRequest(params: { path: string; form: URLSearchParams }) {
  const stripeSecret = requireEnv("STRIPE_SECRET_KEY");

  const res = await fetch(`https://api.stripe.com/v1/${params.path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.form.toString(),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const details = json ? JSON.stringify(json) : "(no body)";
    throw new Error(`Stripe API error (${res.status}): ${details}`);
  }

  return json as any;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    const supabase = createAuthedClient({ req });
    const service = createServiceClient();

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonResponse(401, { error: "Unauthorized" });
    }

    const user = userData.user;
    const orgId = user.id;

    const body = (await req.json().catch(() => null)) as any;
    const returnUrl = (body?.returnUrl as string | undefined) ?? "";

    if (!returnUrl) {
      return jsonResponse(400, { error: "Missing returnUrl" });
    }

    const { data: subRow, error: subErr } = await service
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("org_id", orgId)
      .maybeSingle();

    if (subErr) throw subErr;

    const customerId = subRow?.stripe_customer_id;
    if (!customerId) {
      return jsonResponse(400, { error: "No Stripe customer on file" });
    }

    const session = await stripeFormRequest({
      path: "billing_portal/sessions",
      form: new URLSearchParams({
        customer: customerId,
        return_url: returnUrl,
      }),
    });

    return jsonResponse(200, { url: session.url });
  } catch (e) {
    console.error("Stripe portal error:", e);
    return jsonResponse(500, { error: (e as Error)?.message ?? "Unknown error" });
  }
});
