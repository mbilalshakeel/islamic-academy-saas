"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui";

type Prayer = {
  id: string;
  name: string;
  time_label: string | null;
  rakat_fard: number;
  rakat_sunnah: number;
  rakat_nafl: number;
  rakat_witr: number;
};

type Guide = { id: string; guide_type: string; title: string; intro_text: string | null };
type Step = {
  id: string;
  guide_id: string;
  step_number: number;
  title: string;
  description: string;
  arabic_text: string | null;
};

const OTHER_PRAYERS = [
  { name: "Jumu'ah", label: "Friday Prayer", icon: "🕌" },
  { name: "Eid Salah", label: "Festive Prayer", icon: "🎉" },
  { name: "Tarawih", label: "Ramadan Night", icon: "🌙" },
  { name: "Janazah", label: "Funeral Prayer", icon: "⛩️" },
  { name: "Tahajjud", label: "Night Vigil Prayer", icon: "🌃" },
  { name: "Witr", label: "Closing Night Prayer", icon: "🌒" },
];

/**
 * Renders each prayer's rakat breakdown from the SUMMARY columns
 * (rakat_fard/sunnah/nafl/witr) rather than the `rakat_breakdown` JSONB
 * column. The admin panel's rakat editing screen (Stage 1) only writes
 * the summary columns — editing e.g. Fajr's Sunnah count there does NOT
 * update rakat_breakdown, so displaying from that JSON would silently
 * show stale data after an edit (confirmed: Tenant A's Fajr
 * rakat_breakdown still says "2 Sunnah" even though rakat_sunnah=3 after
 * the walkthrough edit). Order shown is Sunnah -> Fard -> Nafl -> Witr,
 * a reasonable fixed reading order since the summary columns don't
 * preserve original sequencing.
 */
function formatRakatSummary(p: Prayer): string {
  const parts: string[] = [];
  if (p.rakat_sunnah > 0) parts.push(`${p.rakat_sunnah} Sunnah`);
  if (p.rakat_fard > 0) parts.push(`${p.rakat_fard} Fard`);
  if (p.rakat_nafl > 0) parts.push(`${p.rakat_nafl} Nafl`);
  if (p.rakat_witr > 0) parts.push(`${p.rakat_witr} Witr`);
  return parts.join(", ");
}

export default function PrayersClient({
  prayers,
  guides,
  steps,
}: {
  prayers: Prayer[];
  guides: Guide[];
  steps: Step[];
}) {
  const [openModal, setOpenModal] = useState<"wudu" | "namaz" | "others" | null>(null);
  const [namazTab, setNamazTab] = useState<"daily" | "lesson" | "howto">("daily");

  const wuduGuide = guides.find((g) => g.guide_type === "wudu");
  const lessonGuide = guides.find((g) => g.guide_type === "namaz_lesson");
  const howToGuide = guides.find((g) => g.guide_type === "namaz_how_to");

  const wuduSteps = steps.filter((s) => s.guide_id === wuduGuide?.id);
  const lessonSteps = steps.filter((s) => s.guide_id === lessonGuide?.id);
  const howToSteps = steps.filter((s) => s.guide_id === howToGuide?.id);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
      <div
        className="rounded-2xl p-6 md:p-7 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, var(--tenant-primary), var(--tenant-secondary))`, boxShadow: "var(--shadow-md)", marginBottom: "var(--sp-6)" }}
      >
        <div className="ds-motif-bg" />
        <h1 className="tenant-on-primary ds-h1 relative">Learn &amp; Perform</h1>
        <p className="tenant-on-primary relative" style={{ opacity: 0.92, fontSize: "var(--fs-body)", marginTop: 6, maxWidth: 320 }}>
          Master the sacred pillars of prayer with guided wisdom and peace.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <EntryRow icon="💧" title="Wudu (Ablution)" desc="Step-by-step purification guide." onClick={() => setOpenModal("wudu")} />
        <EntryRow icon="🕌" title="Namaz (Salah)" desc="Daily prayers, lessons, and methods." onClick={() => setOpenModal("namaz")} accentTop />
        <EntryRow icon="🌙" title="Other Prayers" desc="Jumu'ah, Eid, Tarawih, and more." onClick={() => setOpenModal("others")} neutralIcon />
      </div>

      {/* ── Wudu Modal ── */}
      {openModal === "wudu" && (
        <BottomSheet title="Wudu Guide" onClose={() => setOpenModal(null)}>
          <div className="rounded-xl text-center" style={{ background: "var(--surface-2)", padding: "var(--sp-4)", marginBottom: "var(--sp-4)" }}>
            <p className="tenant-arabic" style={{ fontSize: "var(--fs-ar-body)", marginBottom: "var(--sp-2)" }}>
              بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
            </p>
            <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-secondary)", fontStyle: "italic" }}>
              &quot;In the name of Allah, the Most Gracious, the Most Merciful.&quot; — begin every Wudu with this intention.
            </p>
          </div>
          {wuduGuide?.intro_text && (
            <p style={{ fontSize: "var(--fs-body)", color: "var(--text-secondary)", marginBottom: "var(--sp-4)" }}>{wuduGuide.intro_text}</p>
          )}
          <div className="space-y-3">
            {wuduSteps.map((step, i) => (
              <StepRow key={step.id} index={i + 1} title={step.title} description={step.description} />
            ))}
          </div>
        </BottomSheet>
      )}

      {/* ── Namaz Modal (tabbed) ── */}
      {openModal === "namaz" && (
        <BottomSheet title="Namaz (Salah)" onClose={() => setOpenModal(null)} tall>
          <div style={{ marginBottom: "var(--sp-4)" }}>
            <Tabs
              items={[
                { key: "daily", label: "Daily Prayers" },
                { key: "lesson", label: "Namaz Lesson" },
                { key: "howto", label: "How to Perform" },
              ]}
              activeKey={namazTab}
              onChange={(k) => setNamazTab(k as typeof namazTab)}
            />
          </div>

          {namazTab === "daily" && (
            <div className="space-y-2">
              {prayers.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl flex justify-between items-center"
                  style={{ background: "var(--surface-2)", padding: "var(--sp-3) var(--sp-4)", borderLeft: "4px solid var(--tenant-secondary)" }}
                >
                  <div>
                    <h6 className="font-bold" style={{ fontSize: "var(--fs-body)" }}>
                      {p.name}
                    </h6>
                    <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-tertiary)" }}>{formatRakatSummary(p)}</span>
                  </div>
                  <span
                    className="rounded-full"
                    style={{ background: "var(--tenant-primary)", color: "var(--tenant-on-primary)", padding: "4px 12px", fontSize: "var(--fs-caption)" }}
                  >
                    {p.time_label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {namazTab === "lesson" && (
            <div className="space-y-3">
              {lessonSteps.map((step) => (
                <div key={step.id} className="text-center ds-card">
                  <h6 className="tenant-primary-text font-bold" style={{ fontSize: "var(--fs-body)", marginBottom: "var(--sp-2)" }}>
                    {step.title}
                  </h6>
                  {step.arabic_text && (
                    <p className="tenant-arabic" style={{ fontSize: "var(--fs-ar-body)", marginBottom: "var(--sp-2)" }} dir="rtl">
                      {step.arabic_text}
                    </p>
                  )}
                  <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-secondary)", fontStyle: "italic" }}>{step.description}</p>
                </div>
              ))}
            </div>
          )}

          {namazTab === "howto" && (
            <div className="space-y-3">
              {howToSteps.map((step, i) => (
                <StepRow key={step.id} index={i + 1} title={step.title} description={step.description} />
              ))}
            </div>
          )}
        </BottomSheet>
      )}

      {/* ── Other Prayers Modal ── */}
      {openModal === "others" && (
        <BottomSheet title="Special Prayers" onClose={() => setOpenModal(null)}>
          <div className="grid grid-cols-2 gap-3">
            {OTHER_PRAYERS.map((p) => (
              <div key={p.name} className="ds-card flex flex-col items-center text-center gap-1">
                <div
                  className="flex items-center justify-center"
                  style={{ width: 44, height: 44, borderRadius: "999px", background: "color-mix(in srgb, var(--tenant-primary) 12%, var(--surface-1))", fontSize: 22, marginBottom: 4 }}
                >
                  {p.icon}
                </div>
                <h6 className="font-bold" style={{ fontSize: "var(--fs-body)" }}>
                  {p.name}
                </h6>
                <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-tertiary)" }}>{p.label}</p>
              </div>
            ))}
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

function EntryRow({
  icon,
  title,
  desc,
  onClick,
  accentTop,
  neutralIcon,
}: {
  icon: string;
  title: string;
  desc: string;
  onClick: () => void;
  accentTop?: boolean;
  neutralIcon?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="ds-card ds-card-interactive w-full text-left flex items-center gap-4"
      style={accentTop ? { borderTop: "4px solid var(--tenant-primary)" } : undefined}
    >
      <div
        className="rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          width: 48,
          height: 48,
          fontSize: 24,
          background: neutralIcon ? "var(--text-secondary)" : "var(--tenant-primary)",
          color: neutralIcon ? "var(--surface-1)" : "var(--tenant-on-primary)",
        }}
      >
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="tenant-primary-text font-bold" style={{ fontSize: "var(--fs-body)" }}>
          {title}
        </h3>
        <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-tertiary)" }}>{desc}</p>
      </div>
      <span style={{ color: "var(--text-tertiary)" }}>→</span>
    </button>
  );
}

function StepRow({ index, title, description }: { index: number; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg" style={{ background: "var(--surface-2)", padding: "var(--sp-3)" }}>
      <div
        className="flex-shrink-0 flex items-center justify-center font-bold"
        style={{ width: 32, height: 32, borderRadius: "999px", background: "var(--tenant-primary)", color: "var(--tenant-on-primary)", fontSize: "var(--fs-caption)" }}
      >
        {index}
      </div>
      <div>
        <p className="font-semibold" style={{ fontSize: "var(--fs-body)" }}>
          {title}
        </p>
        <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-tertiary)" }}>{description}</p>
      </div>
    </div>
  );
}

function BottomSheet({
  title,
  onClose,
  children,
  tall,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  tall?: boolean;
}) {
  return (
    <div className="ds-modal-backdrop" style={{ alignItems: "flex-end" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="flex flex-col"
        style={{
          background: "var(--surface-1)",
          width: "100%",
          maxWidth: 480,
          borderRadius: "var(--r-lg) var(--r-lg) 0 0",
          boxShadow: "var(--shadow-lg)",
          maxHeight: tall ? "88vh" : "80vh",
        }}
      >
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "var(--sp-4)", borderBottom: "1px solid var(--border-subtle)" }}>
          <h4 className="tenant-primary-text font-bold" style={{ fontSize: "var(--fs-h3)" }}>
            {title}
          </h4>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full flex items-center justify-center"
            style={{ width: 36, height: 36, background: "var(--surface-2)", color: "var(--text-secondary)" }}
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto" style={{ padding: "var(--sp-4)" }}>
          {children}
        </div>
        <div className="flex-shrink-0" style={{ padding: "var(--sp-4)", borderTop: "1px solid var(--border-subtle)", background: "var(--surface-2)" }}>
          <button onClick={onClose} className="ds-btn ds-btn-primary" style={{ width: "100%" }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
