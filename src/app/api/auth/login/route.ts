import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Real login route, exercised through actual application code (not curl-to-Kong
 * directly). Uses the server-side Supabase client (anon key only), which sets
 * the resulting session as httpOnly cookies via @supabase/ssr — exactly the
 * same mechanism a production login form would trigger.
 */
export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return NextResponse.json({ error: error?.message || "Login failed" }, { status: 401 });
  }

  // Decode (not verify — already trusted, this session was just issued to us
  // by GoTrue over this same request) the JWT claims purely for the response
  // body, so the test script can show what tenant this session resolved to.
  const payload = JSON.parse(
    Buffer.from(
      data.session.access_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf-8")
  );

  return NextResponse.json({
    ok: true,
    user_id: data.user?.id,
    email: data.user?.email,
    tenant_id: payload.tenant_id ?? null,
    tenant_role: payload.tenant_role ?? null,
  });
}
