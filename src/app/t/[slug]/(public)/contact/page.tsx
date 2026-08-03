import { getPublicTenantContext } from "@/lib/public-tenant";
import { EmptyState } from "@/components/ui";

type Channel = { id: string; channel_type: string; label: string; value: string; icon: string | null };

function tapHref(channel: Channel): string | null {
  if (channel.channel_type === "phone") return `tel:${channel.value.replace(/[^+\d]/g, "")}`;
  if (channel.channel_type === "whatsapp") return `https://wa.me/${channel.value.replace(/[^\d]/g, "")}`;
  if (channel.channel_type === "email") return `mailto:${channel.value}`;
  return null;
}

const SOCIAL_ICONS: Record<string, string> = {
  Facebook: "📘",
  YouTube: "▶️",
  Instagram: "📷",
  Twitter: "🐦",
  X: "🐦",
  TikTok: "🎵",
};

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-xs)", marginBottom: "var(--sp-5)" }}>
      <div style={{ padding: "var(--sp-3) var(--sp-4)", borderBottom: "1px solid var(--border-subtle)" }}>
        <h2 className="font-bold" style={{ fontSize: "var(--fs-body)" }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

export default async function ContactPage({ params }: { params: { slug: string } }) {
  const { supabase } = await getPublicTenantContext(params.slug);

  const { data: channels } = await supabase
    .from("contact_channels")
    .select("id, channel_type, label, value, icon")
    .order("sort_order", { ascending: true });

  const direct = (channels ?? []).filter((c) => ["phone", "whatsapp", "email", "address"].includes(c.channel_type));
  const social = (channels ?? []).filter((c) => c.channel_type === "social");
  const hours = (channels ?? []).filter((c) => c.channel_type === "working_hours");

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
          📞
        </div>
        <h1 className="tenant-on-primary ds-h2 relative">Get In Touch</h1>
        <p className="tenant-on-primary relative" style={{ opacity: 0.85, fontSize: "var(--fs-body)", marginTop: 4 }}>
          We&apos;d love to hear from you
        </p>
      </div>

      {direct.length > 0 && (
        <SectionCard title="Direct Contact">
          <div>
            {direct.map((c, i) => {
              const href = tapHref(c);
              const row = (
                <div
                  className="flex items-center justify-between"
                  style={{ padding: "var(--sp-3) var(--sp-4)", borderBottom: i < direct.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
                >
                  <span style={{ fontSize: "var(--fs-body)", color: "var(--text-tertiary)" }}>{c.label}</span>
                  <span className="font-semibold" style={{ fontSize: "var(--fs-body)" }}>
                    {c.value}
                  </span>
                </div>
              );
              return href ? (
                <a key={c.id} href={href} className="block transition-colors">
                  {row}
                </a>
              ) : (
                <div key={c.id}>{row}</div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {social.length > 0 && (
        <SectionCard title="Social Media">
          <div>
            {social.map((c, i) => (
              <div
                key={c.id}
                className="flex items-center gap-3"
                style={{ padding: "var(--sp-3) var(--sp-4)", borderBottom: i < social.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
              >
                <span style={{ fontSize: 22 }}>{SOCIAL_ICONS[c.label] ?? "🔗"}</span>
                <div className="flex-1">
                  <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-tertiary)" }}>{c.label}</p>
                  <p className="font-semibold" style={{ fontSize: "var(--fs-body)" }}>
                    {c.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {hours.length > 0 && (
        <SectionCard title="Working Hours">
          <div className="space-y-2.5" style={{ padding: "var(--sp-4)" }}>
            {hours.map((c) => (
              <div key={c.id} className="flex justify-between items-center">
                <span style={{ fontSize: "var(--fs-body)" }}>{c.label}</span>
                <span
                  className="font-semibold"
                  style={{ fontSize: "var(--fs-body)", color: c.value.toLowerCase() === "closed" ? "var(--danger)" : "var(--tenant-primary)" }}
                >
                  {c.value}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {(!channels || channels.length === 0) && <EmptyState icon="📞" title="No contact information has been added yet" />}
    </div>
  );
}
