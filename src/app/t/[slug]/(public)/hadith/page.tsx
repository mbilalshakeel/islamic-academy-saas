import { getPublicTenantContext } from "@/lib/public-tenant";
import { EmptyState } from "@/components/ui";

export default async function HadithListPage({ params }: { params: { slug: string } }) {
  const { supabase } = await getPublicTenantContext(params.slug);

  const { data: collections } = await supabase
    .from("hadith_collections")
    .select("id, name")
    .order("sort_order", { ascending: true })
    .limit(1);

  const collection = collections?.[0];

  const { data: hadiths } = collection
    ? await supabase
        .from("hadiths")
        .select("id, hadith_number, text_en, narrator")
        .eq("collection_id", collection.id)
        .order("sort_order", { ascending: true })
    : { data: [] };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
      <h1 className="ds-h1" style={{ marginBottom: 4 }}>
        {collection?.name ?? "Hadiths"}
      </h1>
      <p className="ds-caption" style={{ marginBottom: "var(--sp-6)" }}>
        {hadiths?.length ?? 0} hadiths
      </p>

      <div className="space-y-3">
        {(hadiths ?? []).map((h) => (
          <div key={h.id} className="ds-card">
            <span className="ds-micro tenant-primary-text">Hadith {h.hadith_number}</span>
            <p style={{ fontSize: "var(--fs-body)", color: "var(--text-primary)", marginTop: "var(--sp-2)", lineHeight: "var(--lh-body)" }}>
              &quot;{h.text_en}&quot;
            </p>
            {h.narrator && (
              <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-tertiary)", marginTop: "var(--sp-2)" }}>— {h.narrator}</p>
            )}
          </div>
        ))}

        {(!hadiths || hadiths.length === 0) && <EmptyState icon="📜" title="No hadiths have been added yet" />}
      </div>
    </div>
  );
}
