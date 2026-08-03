import { getPublicTenantContext } from "@/lib/public-tenant";
import { EmptyState, Badge } from "@/components/ui";

type Block =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "tags"; items: string[] }
  | { type: "offerings"; items: string[] }
  | { type: "developer"; name: string; org: string }
  | { type: "footer_note"; text: string }
  | { type: "copyright"; text: string }
  | { type: "version"; text: string };

export default async function AboutPage({ params }: { params: { slug: string } }) {
  const { supabase } = await getPublicTenantContext(params.slug);

  const { data: page } = await supabase
    .from("site_pages")
    .select("hero_title, hero_subtitle, content_blocks")
    .eq("page_key", "about")
    .maybeSingle();

  const blocks = (page?.content_blocks ?? []) as Block[];
  const versionBlock = blocks.find((b) => b.type === "version") as Extract<Block, { type: "version" }> | undefined;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
      <div
        className="rounded-2xl p-6 text-center relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, var(--tenant-primary), var(--tenant-secondary))`, boxShadow: "var(--shadow-md)", marginBottom: "var(--sp-5)" }}
      >
        <div className="ds-motif-bg" />
        <div
          className="rounded-2xl flex items-center justify-center mx-auto relative"
          style={{ width: 64, height: 64, background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)", fontSize: 30, marginBottom: "var(--sp-3)" }}
        >
          ℹ️
        </div>
        <h1 className="tenant-on-primary ds-h2 relative">{page?.hero_title ?? "About Us"}</h1>
        {page?.hero_subtitle && (
          <p className="tenant-on-primary relative" style={{ opacity: 0.85, fontSize: "var(--fs-body)", marginTop: 4 }}>
            {page.hero_subtitle}
          </p>
        )}
        {versionBlock && (
          <div
            className="inline-flex items-center gap-1 relative"
            style={{ marginTop: "var(--sp-3)", background: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: "var(--r-full)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <span className="tenant-on-primary" style={{ fontSize: "var(--fs-micro)" }}>
              Version {versionBlock.text}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {blocks.map((block, i) => {
          if (block.type === "paragraph") {
            return (
              <p key={i} className="ds-card" style={{ fontSize: "var(--fs-body)", color: "var(--text-secondary)", lineHeight: "var(--lh-body)" }}>
                {block.text}
              </p>
            );
          }

          if (block.type === "tags") {
            return (
              <div key={i} className="flex flex-wrap gap-2">
                {block.items.map((item, j) => (
                  <Badge key={j} variant="neutral">
                    {item}
                  </Badge>
                ))}
              </div>
            );
          }

          if (block.type === "offerings") {
            return (
              <div key={i} className="rounded-xl overflow-hidden" style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-xs)" }}>
                {block.items.map((item, j) => (
                  <div
                    key={j}
                    className="flex items-center gap-3"
                    style={{ padding: "var(--sp-3) var(--sp-4)", borderBottom: j < block.items.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
                  >
                    <span className="tenant-primary-text">✓</span>
                    <span style={{ fontSize: "var(--fs-body)" }}>{item}</span>
                  </div>
                ))}
              </div>
            );
          }

          if (block.type === "list") {
            return (
              <ul key={i} className="ds-card space-y-2.5">
                {block.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5" style={{ fontSize: "var(--fs-body)", color: "var(--text-secondary)" }}>
                    <span className="tenant-primary-text" style={{ marginTop: 2 }}>
                      •
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            );
          }

          if (block.type === "developer") {
            return (
              <div key={i} className="ds-card flex items-center gap-4">
                <div
                  className="rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ width: 48, height: 48, fontSize: 22, color: "#fff", background: `linear-gradient(135deg, var(--tenant-primary), var(--tenant-secondary))` }}
                >
                  💻
                </div>
                <div>
                  <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-tertiary)" }}>Developed by</p>
                  <p className="font-bold" style={{ fontSize: "var(--fs-body)" }}>
                    {block.name}
                  </p>
                  <p className="tenant-primary-text" style={{ fontSize: "var(--fs-caption)" }}>
                    {block.org}
                  </p>
                </div>
              </div>
            );
          }

          if (block.type === "footer_note") {
            return (
              <p key={i} className="text-center" style={{ fontSize: "var(--fs-body)", color: "var(--text-secondary)", paddingTop: "var(--sp-2)" }}>
                {block.text}
              </p>
            );
          }

          if (block.type === "copyright") {
            return (
              <p key={i} className="text-center" style={{ fontSize: "var(--fs-caption)", color: "var(--text-tertiary)" }}>
                {block.text}
              </p>
            );
          }

          // version already rendered in the hero badge above
          return null;
        })}

        {blocks.length === 0 && <EmptyState icon="ℹ️" title="No content has been added yet" />}
      </div>
    </div>
  );
}
