// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js@2";

type PlanId = "starter" | "pro";

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

function resolvePriceId(planId: PlanId): string {
  const starter = requireEnv("STRIPE_PRICE_STARTER");
  const pro = requireEnv("STRIPE_PRICE_PRO");
  return planId === "starter" ? starter : pro;
}

async function ensurePersonalOrgAndMembership(params: { supabase: any; userId: string }) {
  const { supabase, userId } = params;
  await supabase
    .from("organizations")
    .upsert({ id: userId, name: "Personal" }, { onConflict: "id", ignoreDuplicates: true });
  await supabase
    .from("organization_members")
    .upsert(
      { org_id: userId, user_id: userId, role: "owner" },
      { onConflict: "org_id,user_id", ignoreDuplicates: true }
    );
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
    const body = (await req.json().catch(() => null)) as any;
    const planId = body?.planId as PlanId | undefined;

    if (!planId || (planId !== "starter" && planId !== "pro")) {
      return jsonResponse(400, { error: "Invalid planId" });
    }

    const successUrl = (body?.successUrl as string | undefined) ?? "";
    const cancelUrl = (body?.cancelUrl as string | undefined) ?? "";
    if (!successUrl || !cancelUrl) {
      return jsonResponse(400, { error: "Missing successUrl or cancelUrl" });
    }

    const orgId = user.id;

    // Ensure org/membership exists under RLS.
    await ensurePersonalOrgAndMembership({ supabase, userId: orgId });

    // Read subscription via service role (we may need to create/update stripe_customer_id).
    const { data: subRow, error: subErr } = await service
      .from("subscriptions")
      .select("org_id, stripe_customer_id")
      .eq("org_id", orgId)
      .maybeSingle();

    if (subErr) throw subErr;

    let customerId = subRow?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripeFormRequest({
        path: "customers",
        form: new URLSearchParams({
          email: user.email ?? "",
          "metadata[org_id]": orgId,
          "metadata[user_id]": user.id,
        }),
      });

      customerId = customer.id;

      // Do not mark the subscription active here. We create/update a placeholder row and let the webhook
      // reconcile the real subscription after payment succeeds.
      await service
        .from("subscriptions")
        .upsert(
          {
            org_id: orgId,
            plan_id: planId,
            status: "incomplete",
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "org_id" }
        );
    }

    const priceId = resolvePriceId(planId);

    const session = await stripeFormRequest({
      path: "checkout/sessions",
      form: new URLSearchParams({
        mode: "subscription",
        customer: customerId,
        success_url: successUrl,
        cancel_url: cancelUrl,
        "line_items[0][price]": priceId,
        "line_items[0][quantity]": "1",
        "metadata[org_id]": orgId,
        "metadata[plan_id]": planId,
        "subscription_data[metadata][org_id]": orgId,
        "subscription_data[metadata][plan_id]": planId,
      }),
    });

    return jsonResponse(200, { url: session.url });
  } catch (e) {
    console.error("Stripe checkout error:", e);
    return jsonResponse(500, { error: (e as Error)?.message ?? "Unknown error" });
  }
});
