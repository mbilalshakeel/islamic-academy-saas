import { getPublicTenantContext } from "@/lib/public-tenant";
import Link from "next/link";
import { EmptyState } from "@/components/ui";

export default async function QaidaSelectionPage({ params }: { params: { slug: string } }) {
  const { tenant, supabase } = await getPublicTenantContext(params.slug);

  const { data: courses } = await supabase
    .from("qaida_courses")
    .select("id, name, level_label, color_theme, file_provider, file_reference")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
      <h1 className="ds-h1" style={{ marginBottom: 4 }}>
        Choose Your Path
      </h1>
      <p className="ds-caption" style={{ marginBottom: "var(--sp-6)" }}>
        Select a foundation course to begin your journey of learning the Holy Quran.
      </p>

      {/*
        Renders EXACTLY the active courses for this tenant — a tenant with
        only 1 active course (e.g. Masjid An-Noor, which deleted its
        "Qurani Qaida" entry during Stage 1 testing) sees a single,
        properly-laid-out card, not a broken 2-card grid with an empty slot.
      */}
      <div className="space-y-4">
        {(courses ?? []).map((course) => {
          const hasFile = course.file_provider !== "none" && course.file_reference;
          return (
            <div key={course.id} className="rounded-xl overflow-hidden" style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-xs)" }}>
              <div className="h-1.5" style={{ background: `linear-gradient(135deg, var(--tenant-primary), var(--tenant-secondary))` }} />
              <div style={{ padding: "var(--sp-5)" }}>
                <div className="flex justify-between items-start" style={{ marginBottom: "var(--sp-3)" }}>
                  <div
                    className="rounded-xl flex items-center justify-center"
                    style={{ width: 56, height: 56, fontSize: 26, background: `linear-gradient(135deg, var(--tenant-primary), var(--tenant-secondary))`, color: "#fff" }}
                  >
                    🔤
                  </div>
                  {course.level_label && (
                    <span className="ds-badge ds-badge-neutral">{course.level_label}</span>
                  )}
                </div>
                <h2 className="ds-h3" style={{ marginBottom: "var(--sp-3)" }}>
                  {course.name}
                </h2>
                {hasFile ? (
                  <Link href={`/t/${tenant.slug}/qaida/${course.id}`} className="ds-btn ds-btn-primary" style={{ width: "100%" }}>
                    Open Qaida →
                  </Link>
                ) : (
                  <button disabled className="ds-btn ds-btn-secondary" style={{ width: "100%" }}>
                    Coming Soon
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {(!courses || courses.length === 0) && <EmptyState icon="🔤" title="No Qaida courses have been added yet" />}
      </div>
    </div>
  );
}
