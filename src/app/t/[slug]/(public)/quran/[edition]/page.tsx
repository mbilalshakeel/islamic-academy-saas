import { getPublicTenantContext } from "@/lib/public-tenant";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/ui";

const EDITION_LINE_COUNTS: Record<string, number> = {
  "16-line": 16,
  "15-line": 15,
};

export default async function ParaListPage({
  params,
}: {
  params: { slug: string; edition: string };
}) {
  const lineCount = EDITION_LINE_COUNTS[params.edition];
  if (!lineCount) notFound();

  const { tenant, supabase } = await getPublicTenantContext(params.slug);

  const { data: edition } = await supabase
    .from("quran_editions")
    .select("id, name, line_count")
    .eq("line_count", lineCount)
    .eq("is_active", true)
    .maybeSingle();

  if (!edition) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <EmptyState icon="📖" title="This edition is not available" />
      </div>
    );
  }

  const { data: paras } = await supabase
    .from("quran_paras")
    .select("id, para_number, name_arabic, file_provider, file_reference")
    .eq("edition_id", edition.id)
    .order("sort_order", { ascending: true });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, var(--tenant-primary), var(--tenant-secondary))`, boxShadow: "var(--shadow-md)", marginBottom: "var(--sp-5)" }}
      >
        <div className="ds-motif-bg" />
        <h1 className="tenant-on-primary ds-h1 relative">{edition.name}</h1>
        <p className="tenant-on-primary relative" style={{ opacity: 0.88, fontSize: "var(--fs-body)", marginTop: 6 }}>
          {lineCount}-Line Script · Juz Index
        </p>
      </div>

      <div className="space-y-2">
        {(paras ?? []).map((para) => (
          <Link
            key={para.id}
            href={`/t/${tenant.slug}/quran/${params.edition}/${para.para_number}`}
            className="ds-card ds-card-interactive flex items-center justify-between"
            style={{ padding: "var(--sp-3) var(--sp-4)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="rounded-lg flex items-center justify-center font-bold"
                style={{ width: 36, height: 36, background: "var(--surface-2)", fontSize: "var(--fs-caption)", color: "var(--tenant-primary)" }}
              >
                {para.para_number}
              </div>
              <div>
                <p className="ds-micro" style={{ marginBottom: 2 }}>
                  Para {para.para_number}
                </p>
                <p className="tenant-arabic" style={{ fontSize: "var(--fs-h3)", lineHeight: 1.4 }} dir="rtl">
                  {para.name_arabic}
                </p>
              </div>
            </div>
            <span className="tenant-primary-text font-semibold" style={{ fontSize: "var(--fs-caption)" }}>
              READ →
            </span>
          </Link>
        ))}

        {(!paras || paras.length === 0) && <EmptyState icon="📖" title="No paras have been added for this edition yet" />}
      </div>
    </div>
  );
}
