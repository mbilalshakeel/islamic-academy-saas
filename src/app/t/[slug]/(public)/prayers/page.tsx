import { getPublicTenantContext } from "@/lib/public-tenant";
import PrayersClient from "./PrayersClient";

export default async function PrayersPage({ params }: { params: { slug: string } }) {
  const { supabase } = await getPublicTenantContext(params.slug);

  const [{ data: prayers }, { data: guides }] = await Promise.all([
    supabase
      .from("prayers")
      .select("id, name, time_label, rakat_fard, rakat_sunnah, rakat_nafl, rakat_witr")
      .order("sort_order", { ascending: true }),
    supabase
      .from("ritual_guides")
      .select("id, guide_type, title, intro_text")
      .order("sort_order", { ascending: true }),
  ]);

  const guideIds = (guides ?? []).map((g) => g.id);
  const { data: steps } = await supabase
    .from("ritual_guide_steps")
    .select("id, guide_id, step_number, title, description, arabic_text, icon")
    .in("guide_id", guideIds.length ? guideIds : ["00000000-0000-0000-0000-000000000000"])
    .order("sort_order", { ascending: true });

  return <PrayersClient prayers={prayers ?? []} guides={guides ?? []} steps={steps ?? []} />;
}
