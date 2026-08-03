import { getPublicTenantContext } from "@/lib/public-tenant";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/ui";

export default async function DuaListScreenPage({
  params,
}: {
  params: { slug: string; categorySlug: string };
}) {
  const { supabase } = await getPublicTenantContext(params.slug);

  const { data: category } = await supabase
    .from("dua_categories")
    .select("id, title, subtitle, display_type")
    .eq("slug", params.categorySlug)
    .maybeSingle();

  // Only list_screen categories get their own page — modal categories
  // (Kalimas, Ayat-ul-Kursi, etc.) are handled entirely within the Duas
  // menu itself and should never be reachable as a standalone URL.
  if (!category || category.display_type !== "list_screen") {
    notFound();
  }

  const { data: duas } = await supabase
    .from("duas")
    .select("id, title, subtitle, arabic_text, translation_en, icon")
    .eq("category_id", category.id)
    .order("sort_order", { ascending: true });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
      <h1 className="ds-h1" style={{ marginBottom: 4 }}>
        {category.title}
      </h1>
      <p className="ds-caption" style={{ marginBottom: "var(--sp-6)" }}>
        {category.subtitle}
      </p>

      <div className="space-y-4">
        {(duas ?? []).map((dua) => (
          <div key={dua.id} className="rounded-xl overflow-hidden" style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-xs)" }}>
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ background: `linear-gradient(135deg, var(--tenant-primary), var(--tenant-secondary))` }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.22)" }}>
                🤲
              </div>
              <div>
                <p className="tenant-on-primary font-bold" style={{ fontSize: "var(--fs-body)" }}>
                  {dua.title}
                </p>
                {dua.subtitle && (
                  <p className="tenant-on-primary" style={{ fontSize: "var(--fs-caption)", opacity: 0.85 }}>
                    {dua.subtitle}
                  </p>
                )}
              </div>
            </div>
            <div className="text-center" style={{ padding: "var(--sp-5)" }}>
              <p className="tenant-arabic" style={{ fontSize: "var(--fs-ar-body)", marginBottom: "var(--sp-3)" }} dir="rtl">
                {dua.arabic_text}
              </p>
              <div className="mx-auto" style={{ height: 1, width: "60%", background: "var(--border-subtle)", marginBottom: "var(--sp-3)" }} />
              <p style={{ fontSize: "var(--fs-body)", color: "var(--text-secondary)", fontStyle: "italic" }}>{dua.translation_en}</p>
            </div>
          </div>
        ))}

        {(!duas || duas.length === 0) && <EmptyState icon="🤲" title="No duas have been added yet" />}
      </div>
    </div>
  );
}
