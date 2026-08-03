import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Returns the CURRENT SESSION'S hadiths only. There is no tenant_id
 * parameter accepted from the client anywhere in this route — the only
 * thing that determines which rows come back is:
 *   1. The user's own session cookie (who they logged in as)
 *   2. Postgres RLS on `hadiths`, keyed off the tenant_id claim baked
 *      into that session's JWT by the custom_access_token_hook.
 *
 * This route uses the same anon-key client as every other part of the
 * app — it has no elevated access. If RLS were misconfigured, this
 * route would leak data; if RLS is correct (as we tested at the SQL
 * layer), it cannot.
 */
export async function GET() {
  const supabase = createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("hadiths")
    .select("id, tenant_id, hadith_number, text_en")
    .order("hadith_number", { ascending: true })
    .limit(5);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    session_user_email: session.user.email,
    row_count_returned: data.length,
    hadiths: data,
  });
}

/**
 * Edits ONE of the current tenant's own hadiths (by hadith_number, not by
 * a client-supplied tenant_id — there is no tenant_id field accepted from
 * the request body at all). Used by the isolation test to prove tenant A
 * editing "their" hadith #1 never touches tenant B's row with the same
 * hadith_number.
 */
export async function PATCH(request: Request) {
  const supabase = createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { hadith_number, text_en } = await request.json();

  const { data, error } = await supabase
    .from("hadiths")
    .update({ text_en })
    .eq("hadith_number", hadith_number)
    .select("id, tenant_id, hadith_number, text_en");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    session_user_email: session.user.email,
    rows_affected: data.length,
    updated: data,
  });
}
