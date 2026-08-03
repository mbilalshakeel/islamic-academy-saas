import { getPublicTenantContext } from "@/lib/public-tenant";
import PillarsClient from "./PillarsClient";

export default async function PillarsPage({ params }: { params: { slug: string } }) {
  const { supabase } = await getPublicTenantContext(params.slug);

  const { data: pillars } = await supabase
    .from("pillars")
    .select("id, slug, title, arabic_text, description, importance, sort_order")
    .order("sort_order", { ascending: true });

  const pillarIds = (pillars ?? []).map((p) => p.id);

  const [{ data: details }, { data: guideSteps }] = await Promise.all([
    supabase
      .from("pillar_details")
      .select("id, pillar_id, detail_text, sort_order")
      .in("pillar_id", pillarIds.length ? pillarIds : ["00000000-0000-0000-0000-000000000000"])
      .order("sort_order", { ascending: true }),
    supabase
      .from("pillar_guide_steps")
      .select("id, pillar_id, title, description, sort_order")
      .in("pillar_id", pillarIds.length ? pillarIds : ["00000000-0000-0000-0000-000000000000"])
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <PillarsClient
      pillars={pillars ?? []}
      details={details ?? []}
      guideSteps={guideSteps ?? []}
    />
  );
}
