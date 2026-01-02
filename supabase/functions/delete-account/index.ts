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

async function bestEffortDelete(params: { service: any; table: string; where: Record<string, string> }) {
  const { service, table, where } = params;
  try {
    let q = service.from(table).delete();
    for (const [k, v] of Object.entries(where)) {
      q = q.eq(k, v);
    }
    await q;
  } catch {
    // best effort
  }
}

async function bestEffortUpdate(params: {
  service: any;
  table: string;
  values: Record<string, unknown>;
  where: Record<string, string>;
}) {
  const { service, table, values, where } = params;
  try {
    let q = service.from(table).update(values);
    for (const [k, v] of Object.entries(where)) {
      q = q.eq(k, v);
    }
    await q;
  } catch {
    // best effort
  }
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
    const userId = user.id;

    // Best-effort cleanup for tables that may not have FKs.
    // Keep this list aligned with migrations.
    await bestEffortDelete({ service, table: "projects", where: { user_id: userId } });
    await bestEffortDelete({ service, table: "forms", where: { user_id: userId } });
    await bestEffortDelete({ service, table: "organization_members", where: { user_id: userId } });

    // Invite gating state:
    // - Remove the user's own redemption record (so it doesn't follow them)
    // - Scrub inviter references pointing at this user without deleting other users' records
    // - Scrub created_by on invites (some invites may be referenced by other users' redemptions)
    await bestEffortDelete({ service, table: "invite_redemptions", where: { invited_user_id: userId } });
    await bestEffortUpdate({
      service,
      table: "invite_redemptions",
      values: { inviter_user_id: null },
      where: { inviter_user_id: userId },
    });
    await bestEffortUpdate({
      service,
      table: "invites",
      values: { created_by: null },
      where: { created_by: userId },
    });

    // Delete the personal workspace (org_id == userId). This cascades to many org-scoped tables.
    await service.from("organizations").delete().eq("id", userId);

    // Finally delete the auth user (cascades projects, etc if FKs exist).
    const { error: delErr } = await service.auth.admin.deleteUser(userId);
    if (delErr) throw delErr;

    return jsonResponse(200, { ok: true });
  } catch (e) {
    console.error("Delete account error:", e);
    return jsonResponse(500, { error: (e as Error)?.message ?? "Unknown error" });
  }
});
