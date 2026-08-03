"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui";

type QAItem = { id: string; category: string; question: string; answer: string };

const CATEGORIES = [
  { key: "all", label: "All", icon: "" },
  { key: "namaz", label: "Namaz", icon: "🕌" },
  { key: "quran", label: "Quran", icon: "📖" },
  { key: "roza", label: "Roza", icon: "🌙" },
  { key: "zakat", label: "Zakat", icon: "💰" },
  { key: "aqaid", label: "Aqaid", icon: "✨" },
];

export default function QAClient({ items }: { items: QAItem[] }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = activeCategory === "all" ? items : items.filter((i) => i.category === activeCategory);

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className="px-4 py-9 text-center relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, var(--tenant-primary), var(--tenant-secondary))` }}
      >
        <div className="ds-motif-bg" />
        <div
          className="rounded-2xl flex items-center justify-center mx-auto relative"
          style={{ width: 64, height: 64, background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)", fontSize: 30, marginBottom: "var(--sp-3)" }}
        >
          ❓
        </div>
        <h1 className="tenant-on-primary ds-h2 relative">Got a Question?</h1>
        <p className="tenant-on-primary relative" style={{ opacity: 0.85, fontSize: "var(--fs-body)", marginTop: 4 }}>
          Find answers to common Islamic questions
        </p>
      </div>

      <div className="px-4" style={{ paddingTop: "var(--sp-4)" }}>
        <div className="flex gap-2 overflow-x-auto no-scrollbar" style={{ paddingBottom: "var(--sp-3)" }}>
          {CATEGORIES.map((c) => {
            const isActive = activeCategory === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setActiveCategory(c.key)}
                className="flex-shrink-0 font-semibold transition-colors"
                style={{
                  padding: "8px 16px",
                  borderRadius: "var(--r-full)",
                  fontSize: "var(--fs-caption)",
                  background: isActive ? "var(--tenant-primary)" : "var(--surface-2)",
                  color: isActive ? "var(--tenant-on-primary)" : "var(--text-secondary)",
                  minHeight: 40,
                }}
              >
                {c.icon} {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 space-y-2" style={{ paddingBottom: "var(--sp-8)" }}>
        {filtered.map((qa) => {
          const isOpen = openId === qa.id;
          return (
            <div key={qa.id} className="rounded-xl overflow-hidden" style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-xs)" }}>
              <button
                onClick={() => setOpenId(isOpen ? null : qa.id)}
                className="w-full text-left flex items-center justify-between gap-3"
                style={{ padding: "var(--sp-3) var(--sp-4)", minHeight: 44 }}
              >
                <span className="font-semibold" style={{ fontSize: "var(--fs-body)" }}>
                  {qa.question}
                </span>
                <span
                  className="tenant-primary-text flex-shrink-0 transition-transform"
                  style={{ transform: isOpen ? "rotate(180deg)" : "none" }}
                >
                  ⌄
                </span>
              </button>
              {isOpen && (
                <p style={{ padding: "0 var(--sp-4) var(--sp-4)", fontSize: "var(--fs-body)", color: "var(--text-secondary)", lineHeight: "var(--lh-body)" }}>
                  {qa.answer}
                </p>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && <EmptyState icon="❓" title="No questions in this category yet" />}
      </div>
    </div>
  );
}
