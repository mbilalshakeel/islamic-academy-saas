import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Returns the CURRENT SESSION'S duas only, joined with their category —
 * same pattern/guarantee as /api/tenant-admin/hadiths.
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
    .from("duas")
    .select("id, tenant_id, title, subtitle, arabic_text, translation_en, dua_categories(slug, title)")
    .order("sort_order", { ascending: true })
    .limit(5);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    session_user_email: session.user.email,
    row_count_returned: data.length,
    duas: data,
  });
}
