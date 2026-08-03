"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui";

type DhikrItem = {
  id: string;
  arabic_text: string;
  transliteration: string;
  translation: string;
  default_target_count: number;
  category: string;
};

export default function DhikrCounterPage({ params }: { params: { slug: string } }) {
  const [items, setItems] = useState<DhikrItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch(`/api/public/dhikr-items?slug=${params.slug}`)
      .then((r) => r.json())
      .then((body) => {
        setItems(body.items ?? []);
        if (body.items?.length) setActiveId(body.items[0].id);
      });
  }, [params.slug]);

  const active = items.find((i) => i.id === activeId);

  // Persist count locally per-dhikr, per-tenant — no login, no server round-trip.
  useEffect(() => {
    if (!activeId) return;
    const saved = localStorage.getItem(`dhikr_count_${params.slug}_${activeId}`);
    setCount(saved ? parseInt(saved, 10) : 0);
  }, [activeId, params.slug]);

  function increment() {
    if (!active) return;
    const next = count + 1;
    setCount(next);
    localStorage.setItem(`dhikr_count_${params.slug}_${active.id}`, String(next));

    if (next === active.default_target_count) {
      if (navigator.vibrate) navigator.vibrate(200);
      try {
        new Audio(
          "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="
        ).play();
      } catch {}
    }
  }

  function reset() {
    if (!active) return;
    setCount(0);
    localStorage.setItem(`dhikr_count_${params.slug}_${active.id}`, "0");
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 md:py-8">
      <div
        className="rounded-2xl p-6 text-center relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, var(--tenant-primary), var(--tenant-secondary))`, boxShadow: "var(--shadow-md)", marginBottom: "var(--sp-5)" }}
      >
        <div className="ds-motif-bg" />
        <div
          className="rounded-2xl flex items-center justify-center mx-auto relative"
          style={{ width: 64, height: 64, background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)", fontSize: 30, marginBottom: "var(--sp-3)" }}
        >
          📿
        </div>
        <h1 className="tenant-on-primary ds-h2 relative">Dhikr Counter</h1>
      </div>

      <div className="flex gap-2 flex-wrap justify-center" style={{ marginBottom: "var(--sp-5)" }}>
        {items.map((i) => {
          const isActive = activeId === i.id;
          return (
            <button
              key={i.id}
              onClick={() => setActiveId(i.id)}
              className="font-semibold transition-colors"
              style={{
                padding: "8px 16px",
                borderRadius: "var(--r-full)",
                fontSize: "var(--fs-caption)",
                minHeight: 40,
                background: isActive ? "var(--tenant-primary)" : "var(--surface-1)",
                color: isActive ? "var(--tenant-on-primary)" : "var(--text-secondary)",
                border: isActive ? "none" : "1px solid var(--border-subtle)",
              }}
            >
              {i.transliteration}
            </button>
          );
        })}

        {items.length === 0 && <EmptyState icon="📿" title="No dhikr items have been added yet" />}
      </div>

      {active && (
        <div className="ds-card text-center" style={{ padding: "var(--sp-8) var(--sp-6)" }}>
          <p className="tenant-arabic" style={{ fontSize: "var(--fs-ar-display)", marginBottom: "var(--sp-2)" }} dir="rtl">
            {active.arabic_text}
          </p>
          <p style={{ fontSize: "var(--fs-body)", color: "var(--text-secondary)", marginBottom: "var(--sp-6)" }}>{active.translation}</p>

          <button
            onClick={increment}
            className="rounded-full font-bold mx-auto flex items-center justify-center transition-transform active:scale-95"
            style={{
              width: 160,
              height: 160,
              fontSize: 40,
              color: "var(--tenant-on-primary)",
              background: `linear-gradient(135deg, var(--tenant-primary), var(--tenant-secondary))`,
              boxShadow: "var(--shadow-lg)",
            }}
          >
            {count}
          </button>

          <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-tertiary)", marginTop: "var(--sp-3)" }}>Target: {active.default_target_count}</p>

          <button onClick={reset} style={{ marginTop: "var(--sp-4)", fontSize: "var(--fs-body)", color: "var(--text-secondary)", textDecoration: "underline" }}>
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
