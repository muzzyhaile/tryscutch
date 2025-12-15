// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(status: number, body: Record<string, unknown>) {
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
  if (!v) throw new Error(`Missing ${name} in Edge Function env.`);
  return v;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim().toLowerCase();
  if (clean.length % 2 !== 0) return new Uint8Array();
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    const byte = clean.slice(i * 2, i * 2 + 2);
    const val = Number.parseInt(byte, 16);
    if (!Number.isFinite(val)) return new Uint8Array();
    out[i] = val;
  }
  return out;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

function parseStripeSignatureHeader(header: string): { t: number; v1: string[] } | null {
  const parts = header.split(",").map((p) => p.trim());
  const kv = new Map<string, string[]>();
  for (const p of parts) {
    const [k, v] = p.split("=");
    if (!k || !v) continue;
    const key = k.trim();
    const val = v.trim();
    const arr = kv.get(key) ?? [];
    arr.push(val);
    kv.set(key, arr);
  }
  const tRaw = (kv.get("t") ?? [])[0];
  const v1 = kv.get("v1") ?? [];
  const t = Number.parseInt(String(tRaw ?? ""), 10);
  if (!Number.isFinite(t) || v1.length === 0) return null;
  return { t, v1 };
}

async function computeHmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  const bytes = new Uint8Array(sig);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyStripeSignature(params: {
  payload: string;
  signatureHeader: string;
  secret: string;
  toleranceSeconds?: number;
}): Promise<boolean> {
  const parsed = parseStripeSignatureHeader(params.signatureHeader);
  if (!parsed) return false;

  const tolerance = params.toleranceSeconds ?? 300;
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - parsed.t) > tolerance) return false;

  const signedPayload = `${parsed.t}.${params.payload}`;
  const expectedHex = await computeHmacSha256Hex(params.secret, signedPayload);
  const expected = hexToBytes(expectedHex);
  if (expected.length === 0) return false;

  for (const sigHex of parsed.v1) {
    const candidate = hexToBytes(sigHex);
    if (candidate.length === 0) continue;
    if (timingSafeEqual(candidate, expected)) return true;
  }
  return false;
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

async function stripeJsonRequest(params: { path: string }) {
  const stripeSecret = requireEnv("STRIPE_SECRET_KEY");
  const res = await fetch(`https://api.stripe.com/v1/${params.path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${stripeSecret}`,
    },
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const details = json ? JSON.stringify(json) : "(no body)";
    throw new Error(`Stripe API error (${res.status}): ${details}`);
  }
  return json as any;
}

async function stripeGetSubscription(subId: string) {
  return stripeJsonRequest({ path: `subscriptions/${subId}` });
}

async function stripeGetPrice(priceId: string) {
  return stripeJsonRequest({ path: `prices/${priceId}` });
}

async function stripeGetProduct(productId: string) {
  return stripeJsonRequest({ path: `products/${productId}` });
}

function mapStripeStatusToLocal(status: string): "active" | "past_due" | "canceled" | "incomplete" {
  if (status === "active" || status === "trialing") return "active";
  if (status === "past_due" || status === "unpaid") return "past_due";
  if (status === "canceled") return "canceled";
  return "incomplete";
}

function toIsoFromUnixSeconds(s: number | null | undefined) {
  if (!s) return null;
  return new Date(s * 1000).toISOString();
}

function inferPlanIdFromProductName(name: string): "starter" | "pro" {
  const n = name.toLowerCase();
  if (n.includes("pro")) return "pro";
  return "starter";
}

async function applySubscriptionSnapshot(params: { supabase: any; stripeSubId: string }) {
  const stripeSub = await stripeGetSubscription(params.stripeSubId);
  const customerId = stripeSub.customer as string;
  const status = mapStripeStatusToLocal(String(stripeSub.status));
  const currentPeriodStart = toIsoFromUnixSeconds(stripeSub.current_period_start);
  const currentPeriodEnd = toIsoFromUnixSeconds(stripeSub.current_period_end);

  const firstItem = stripeSub.items?.data?.[0];
  const priceId = firstItem?.price?.id as string | undefined;
  const productId = firstItem?.price?.product as string | undefined;

  let productName = "";
  if (productId) {
    const product = await stripeGetProduct(productId);
    productName = String(product?.name ?? "");
  } else if (priceId) {
    const price = await stripeGetPrice(priceId);
    const prodId2 = price?.product as string | undefined;
    if (prodId2) {
      const product = await stripeGetProduct(prodId2);
      productName = String(product?.name ?? "");
    }
  }

  const planId = inferPlanIdFromProductName(productName);

  // We expect org_id to be on subscription metadata.
  const orgId = String(stripeSub?.metadata?.org_id ?? "");
  if (!orgId) {
    throw new Error("stripe subscription missing metadata.org_id");
  }

  await params.supabase
    .from("subscriptions")
    .upsert(
      {
        org_id: orgId,
        plan_id: planId,
        status,
        stripe_customer_id: customerId,
        stripe_subscription_id: stripeSub.id,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: Boolean(stripeSub.cancel_at_period_end),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "org_id" },
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
    const signature = req.headers.get("Stripe-Signature") ?? "";
    const payload = await req.text();
    const webhookSecret = requireEnv("STRIPE_WEBHOOK_SECRET");

    const ok = await verifyStripeSignature({
      payload,
      signatureHeader: signature,
      secret: webhookSecret,
      toleranceSeconds: 300,
    });

    if (!ok) {
      return jsonResponse(400, { error: "Invalid signature" });
    }

    const supabase = createServiceClient();

    const event = (JSON.parse(payload) as any) ?? null;
    if (!event?.type) {
      return jsonResponse(400, { error: "Invalid event" });
    }

    const type = String(event.type);
    const dataObject = event.data?.object;

    // We reconcile by fetching subscription from Stripe for subscription-related events.
    if (
      type === "customer.subscription.created" ||
      type === "customer.subscription.updated" ||
      type === "customer.subscription.deleted"
    ) {
      const stripeSubId = String(dataObject?.id ?? "");
      if (!stripeSubId) {
        return jsonResponse(400, { error: "Missing subscription id" });
      }

      await applySubscriptionSnapshot({ supabase, stripeSubId });
      return jsonResponse(200, { received: true });
    }

    if (type === "checkout.session.completed") {
      const stripeSubId = String(dataObject?.subscription ?? "");
      if (stripeSubId) {
        await applySubscriptionSnapshot({ supabase, stripeSubId });
      }
      return jsonResponse(200, { received: true });
    }

    return jsonResponse(200, { received: true, ignored: true });
  } catch (e) {
    console.error("Stripe webhook error:", e);
    return jsonResponse(500, { error: (e as Error)?.message ?? "Unknown error" });
  }
});
