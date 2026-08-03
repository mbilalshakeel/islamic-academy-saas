import { getPublicTenantContext } from "@/lib/public-tenant";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/ui";

const CATEGORY_TITLES: Record<string, { title: string; subtitle: string }> = {
  allah: { title: "Asma-ul-Husna", subtitle: "99 Names of Allah" },
  prophet: { title: "Beautiful Names", subtitle: "Names of the Prophet (PBUH)" },
};

export default async function DivineNamesPage({
  params,
}: {
  params: { slug: string; category: string };
}) {
  if (!CATEGORY_TITLES[params.category]) notFound();

  const { supabase } = await getPublicTenantContext(params.slug);

  const { data: names } = await supabase
    .from("divine_names")
    .select("id, order_index, arabic, transliteration, meaning_en, meaning_urdu, meaning_extra")
    .eq("category", params.category)
    .order("order_index", { ascending: true });

  const { title, subtitle } = CATEGORY_TITLES[params.category];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      <div
        className="rounded-2xl p-6 md:p-7 text-center relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, var(--tenant-primary), var(--tenant-secondary))`, boxShadow: "var(--shadow-md)", marginBottom: "var(--sp-6)" }}
      >
        <div className="ds-motif-bg" />
        <h1 className="tenant-on-primary ds-h1 relative">{title}</h1>
        <p className="tenant-on-primary relative" style={{ opacity: 0.88, fontSize: "var(--fs-body)", marginTop: 6 }}>
          {subtitle} {names ? `(${names.length})` : ""}
        </p>
      </div>

      {/* Card min-width bumped up from the original dense 3-per-row grid so
          Arabic + transliteration + meaning never need to shrink below a
          legible size — this is the specific fix for the "cramped" feeling
          flagged in the Design System review for dense Arabic content. */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(128px, 1fr))" }}>
        {(names ?? []).map((name) => (
          <div key={name.id} className="ds-card relative flex flex-col items-center text-center" style={{ padding: "var(--sp-3)" }}>
            <span className="ds-micro tenant-primary-text" style={{ position: "absolute", top: 8, left: 10, opacity: 0.7 }}>
              {name.order_index}
            </span>
            <span className="tenant-arabic" style={{ fontSize: "var(--fs-h3)", lineHeight: 1.5, marginTop: 10, marginBottom: 6 }} dir="rtl">
              {name.arabic}
            </span>
            <h3 className="tenant-primary-text font-bold truncate w-full" style={{ fontSize: "var(--fs-caption)", marginBottom: 3 }}>
              {name.transliteration}
            </h3>
            <p className="w-full truncate" style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
              {name.meaning_en}
            </p>
            {name.meaning_urdu && (
              <p className="tenant-urdu w-full truncate" style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: 4 }} dir="rtl">
                {name.meaning_urdu}
              </p>
            )}
          </div>
        ))}

        {(!names || names.length === 0) && (
          <div className="col-span-full">
            <EmptyState icon="✨" title="No names have been added yet" />
          </div>
        )}
      </div>

      <div className="text-center" style={{ padding: "var(--sp-8) 0", opacity: 0.4, fontSize: "var(--fs-micro)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        End of Names
      </div>
    </div>
  );
}
