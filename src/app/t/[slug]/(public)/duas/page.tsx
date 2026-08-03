import { getPublicTenantContext } from "@/lib/public-tenant";
import DuasMenuClient from "./DuasMenuClient";

export default async function DuasMenuPage({ params }: { params: { slug: string } }) {
  const { supabase } = await getPublicTenantContext(params.slug);

  const { data: categories } = await supabase
    .from("dua_categories")
    .select("id, slug, title, subtitle, icon, display_type")
    .order("sort_order", { ascending: true });

  // For modal-type categories, pre-fetch their (typically single) dua item
  // so opening a modal client-side needs no extra round trip.
  const modalCategories = (categories ?? []).filter((c) => c.display_type === "modal");
  const modalDuas: Record<string, any[]> = {};
  for (const cat of modalCategories) {
    const { data: duas } = await supabase
      .from("duas")
      .select("id, title, arabic_text, translation_en, numbered_position")
      .eq("category_id", cat.id)
      .order("sort_order", { ascending: true });
    modalDuas[cat.slug] = duas ?? [];
  }

  return (
    <DuasMenuClient
      slug={params.slug}
      categories={categories ?? []}
      modalDuas={modalDuas}
    />
  );
}
