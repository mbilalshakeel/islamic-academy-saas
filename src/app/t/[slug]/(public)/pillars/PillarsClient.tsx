"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui";

type Pillar = {
  id: string;
  slug: string;
  title: string;
  arabic_text: string | null;
  description: string;
  importance: string | null;
};

type Detail = { id: string; pillar_id: string; detail_text: string };
type GuideStep = { id: string; pillar_id: string; title: string; description: string };

/**
 * This screen was structurally present but functionally INCOMPLETE in the
 * original index.html — the pill-tab UI existed, but its content-rendering
 * JS was never finished, so switching tabs never actually displayed a
 * pillar's real content (title/arabic/description/importance/details/
 * guide steps all existed in the DESIGN but were never wired to the DOM).
 * This rebuild renders every one of those fields for real, per pillar,
 * per tenant, using the shared design system's Arabic typography scale
 * (var(--fs-ar-display) / var(--lh-arabic)) so the Bismillah-style verse
 * text gets real breathing room instead of the default cramped line-height.
 */
export default function PillarsClient({
  pillars,
  details,
  guideSteps,
}: {
  pillars: Pillar[];
  details: Detail[];
  guideSteps: GuideStep[];
}) {
  const [activeSlug, setActiveSlug] = useState(pillars[0]?.slug ?? "");
  const active = pillars.find((p) => p.slug === activeSlug);
  const activeDetails = details.filter((d) => d.pillar_id === active?.id);
  const activeSteps = guideSteps.filter((s) => s.pillar_id === active?.id);

  if (pillars.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <EmptyState icon="🕌" title="No pillars have been added yet" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Pill tabs */}
      <div className="px-4 pt-4 pb-2 sticky top-0 z-10" style={{ background: "var(--tenant-background)" }}>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {pillars.map((p) => {
            const isActive = activeSlug === p.slug;
            return (
              <button
                key={p.slug}
                onClick={() => setActiveSlug(p.slug)}
                className="whitespace-nowrap font-semibold flex-shrink-0 transition-colors"
                style={{
                  fontSize: "var(--fs-body)",
                  padding: "10px 20px",
                  borderRadius: "var(--r-md)",
                  background: isActive ? "var(--tenant-primary)" : "var(--surface-2)",
                  color: isActive ? "var(--tenant-on-primary)" : "var(--text-secondary)",
                  boxShadow: isActive ? "var(--shadow-xs)" : "none",
                  minHeight: 44,
                }}
              >
                {p.title.split(" (")[0]}
              </button>
            );
          })}
        </div>
      </div>

      {active && (
        <div className="px-4 pb-10">
          <div className="ds-card">
            {active.arabic_text && (
              <p className="tenant-arabic text-center" style={{ fontSize: "var(--fs-ar-display)", marginBottom: "var(--sp-4)" }} dir="rtl">
                {active.arabic_text}
              </p>
            )}
            <h1 className="tenant-primary-text ds-h2" style={{ marginBottom: "var(--sp-3)" }}>
              {active.title}
            </h1>
            <p className="ds-body-lg" style={{ color: "var(--text-secondary)", marginBottom: "var(--sp-5)" }}>
              {active.description}
            </p>

            {activeDetails.length > 0 && (
              <ul className="space-y-2.5" style={{ marginBottom: "var(--sp-5)" }}>
                {activeDetails.map((d) => (
                  <li key={d.id} className="flex items-start gap-2.5" style={{ fontSize: "var(--fs-body)", color: "var(--text-secondary)" }}>
                    <span className="tenant-primary-text" style={{ marginTop: 2 }}>
                      •
                    </span>
                    <span>{d.detail_text}</span>
                  </li>
                ))}
              </ul>
            )}

            {active.importance && (
              <div className="rounded-lg" style={{ background: "var(--surface-2)", border: "1px solid var(--border-subtle)", padding: "var(--sp-4)", marginBottom: "var(--sp-5)" }}>
                <p className="ds-micro" style={{ marginBottom: 6 }}>
                  Why it matters
                </p>
                <p style={{ fontSize: "var(--fs-body)", color: "var(--text-secondary)" }}>{active.importance}</p>
              </div>
            )}

            {activeSteps.length > 0 && (
              <div className="space-y-4">
                <p className="ds-micro">Practical Guide</p>
                {activeSteps.map((step, i) => (
                  <div key={step.id} className="flex items-start gap-3">
                    <div
                      className="flex-shrink-0 flex items-center justify-center font-bold"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "999px",
                        background: "var(--tenant-primary)",
                        color: "var(--tenant-on-primary)",
                        fontSize: "var(--fs-caption)",
                      }}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ fontSize: "var(--fs-body)" }}>
                        {step.title}
                      </p>
                      <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-tertiary)" }}>{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
