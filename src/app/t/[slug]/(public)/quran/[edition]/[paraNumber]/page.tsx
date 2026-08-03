import { getPublicTenantContext } from "@/lib/public-tenant";
import Link from "next/link";
import { notFound } from "next/navigation";

const EDITION_LINE_COUNTS: Record<string, number> = {
  "16-line": 16,
  "15-line": 15,
};

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

export default async function ParaViewerPage({
  params,
}: {
  params: { slug: string; edition: string; paraNumber: string };
}) {
  const lineCount = EDITION_LINE_COUNTS[params.edition];
  if (!lineCount) notFound();

  const { tenant, supabase } = await getPublicTenantContext(params.slug);

  const { data: edition } = await supabase
    .from("quran_editions")
    .select("id")
    .eq("line_count", lineCount)
    .maybeSingle();

  const { data: para } = edition
    ? await supabase
        .from("quran_paras")
        .select("para_number, name_arabic, file_provider, file_reference")
        .eq("edition_id", edition.id)
        .eq("para_number", parseInt(params.paraNumber, 10))
        .maybeSingle()
    : { data: null };

  if (!para) notFound();

  const viewerSrc = buildViewerSrc(para.file_provider, para.file_reference);

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 64px)" }}>
      <header
        className="flex items-center gap-3 px-4 flex-shrink-0"
        style={{ height: 56, borderBottom: "1px solid var(--border-subtle)", background: "var(--surface-1)" }}
      >
        <Link
          href={`/t/${tenant.slug}/quran/${params.edition}`}
          aria-label="Back"
          className="rounded-full flex items-center justify-center"
          style={{ width: 40, height: 40, background: "var(--surface-2)", color: "var(--text-secondary)" }}
        >
          ←
        </Link>
        <div>
          <p className="font-bold" style={{ fontSize: "var(--fs-body)" }}>
            Para {para.para_number}
          </p>
          <p className="tenant-arabic" style={{ fontSize: "var(--fs-caption)", color: "var(--text-tertiary)" }} dir="rtl">
            {para.name_arabic}
          </p>
        </div>
      </header>

      {viewerSrc ? (
        <iframe src={viewerSrc} className="flex-1 w-full border-0" allow="autoplay" loading="lazy" title={`Para ${para.para_number}`} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-center px-6" style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-body)" }}>
          No file has been linked for this para yet. Please check back later.
        </div>
      )}
    </div>
  );
}
