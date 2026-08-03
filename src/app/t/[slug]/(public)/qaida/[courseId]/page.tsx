import { getPublicTenantContext } from "@/lib/public-tenant";
import Link from "next/link";
import { notFound } from "next/navigation";

function buildViewerSrc(fileProvider: string, fileReference: string | null): string | null {
  if (!fileReference) return null;
  if (fileProvider === "google_drive") {
    return `https://drive.google.com/file/d/${fileReference}/preview`;
  }
  if (fileProvider === "url") {
    return fileReference;
  }
  return null;
}

export default async function QaidaViewerPage({
  params,
}: {
  params: { slug: string; courseId: string };
}) {
  const { tenant, supabase } = await getPublicTenantContext(params.slug);

  const { data: course } = await supabase
    .from("qaida_courses")
    .select("name, level_label, file_provider, file_reference")
    .eq("id", params.courseId)
    .maybeSingle();

  if (!course) notFound();

  const viewerSrc = buildViewerSrc(course.file_provider, course.file_reference);

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 64px)" }}>
      <header
        className="flex items-center justify-between gap-3 px-4 flex-shrink-0"
        style={{ height: 56, borderBottom: "1px solid var(--border-subtle)", background: "var(--surface-1)" }}
      >
        <div className="flex items-center gap-3">
          <Link
            href={`/t/${tenant.slug}/qaida`}
            aria-label="Back"
            className="rounded-full flex items-center justify-center"
            style={{ width: 40, height: 40, background: "var(--surface-2)", color: "var(--text-secondary)" }}
          >
            ←
          </Link>
          <p className="font-bold" style={{ fontSize: "var(--fs-body)" }}>
            {course.name}
          </p>
        </div>
        {course.level_label && <span className="ds-badge ds-badge-neutral">{course.level_label}</span>}
      </header>

      {viewerSrc ? (
        <iframe src={viewerSrc} className="flex-1 w-full border-0" allow="autoplay" loading="lazy" title={course.name} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-center px-6" style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-body)" }}>
          No file has been linked for this course yet. Please check back later.
        </div>
      )}
    </div>
  );
}
