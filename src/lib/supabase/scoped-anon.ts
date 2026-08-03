import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

/**
 * Mints a short-lived, tenant-scoped JWT (role=anon + tenant_id claim) and
 * returns a Supabase client configured to use it, instead of the shared,
 * static NEXT_PUBLIC_SUPABASE_ANON_KEY.
 *
 * WHY THIS EXISTS: for a logged-in tenant admin, tenant_id comes from
 * their own session JWT (via custom_access_token_hook at login time —
 * see migration 016). But an ANONYMOUS PUBLIC PWA VISITOR has no session
 * at all, and the shared anon API key is a single static JWT for the
 * whole Supabase project — it cannot carry a per-request tenant_id claim.
 * Since our RLS policies are keyed on current_tenant_id() reading
 * request.jwt.claims ->> 'tenant_id', an anonymous visitor's request
 * needs SOME JWT with that claim in order for RLS to scope their read to
 * the right tenant at all.
 *
 * The tenant_id used here MUST come from a trusted, server-side
 * resolution (e.g. middleware's slug -> tenant lookup via
 * get_tenant_by_slug(), or an explicit, validated tenant_id in a request
 * that's already been checked against that lookup) — never directly from
 * unvalidated client input, since whatever tenant_id ends up in this
 * JWT is exactly what RLS will scope the request to.
 *
 * Role is always 'anon' here — this helper grants no more Postgres
 * privilege than the anon key already has (SELECT on content tables,
 * per migration 015's grants), it only ADDS the tenant scoping. It is
 * NOT a way to escalate privilege.
 */
export function createSupabaseScopedAnonClient(tenantId: string) {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error("SUPABASE_JWT_SECRET is not set (server-only env var, never NEXT_PUBLIC_).");
  }

  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    role: "anon",
    iss: "supabase-demo",
    tenant_id: tenantId,
    iat: now,
    exp: now + 300, // 5 minutes — this token is used for exactly one request, no need for longer life
  };

  const b64url = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");

  const signingInput = `${b64url(header)}.${b64url(payload)}`;
  const signature = crypto.createHmac("sha256", secret).update(signingInput).digest("base64url");
  const token = `${signingInput}.${signature}`;

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, token, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! } },
  });
}
