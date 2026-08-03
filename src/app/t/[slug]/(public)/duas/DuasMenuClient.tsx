"use client";

import { useState } from "react";
import Link from "next/link";
import { Modal, EmptyState } from "@/components/ui";

type Category = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  icon: string | null;
  display_type: string;
};

type Dua = {
  id: string;
  title: string;
  arabic_text: string;
  translation_en: string;
  numbered_position: number | null;
};

const ICONS: Record<string, string> = {
  masnoon: "⭐",
  kalimas: "🔢",
  ayat_kursi: "✨",
  dua_qunoot: "🤲",
  iman_mujmal: "🔵",
  iman_mufassal: "🔵",
};

export default function DuasMenuClient({
  slug,
  categories,
  modalDuas,
}: {
  slug: string;
  categories: Category[];
  modalDuas: Record<string, Dua[]>;
}) {
  const [openModalSlug, setOpenModalSlug] = useState<string | null>(null);

  const listScreenCategories = categories.filter((c) => c.display_type === "list_screen");
  const modalCategories = categories.filter((c) => c.display_type === "modal");
  const activeModal = modalCategories.find((c) => c.slug === openModalSlug);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
      <div
        className="rounded-2xl p-6 md:p-7 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, var(--tenant-primary), var(--tenant-secondary))`, boxShadow: "var(--shadow-md)", marginBottom: "var(--sp-6)" }}
      >
        <div className="ds-motif-bg" />
        <h1 className="tenant-on-primary ds-h1 relative">Spiritual Growth</h1>
        <p className="tenant-on-primary relative" style={{ opacity: 0.88, fontSize: "var(--fs-body)", marginTop: 6, maxWidth: 320 }}>
          Nourish your soul with daily supplications and core beliefs of Islam.
        </p>
      </div>

      <div className="space-y-3">
        {listScreenCategories.map((cat) => (
          <Link key={cat.id} href={`/t/${slug}/duas/${cat.slug}`} className="ds-card ds-card-interactive flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: "color-mix(in srgb, var(--tenant-primary) 12%, var(--surface-1))" }}
            >
              {ICONS[cat.slug] ?? "📖"}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold" style={{ fontSize: "var(--fs-body)" }}>
                {cat.title}
              </h3>
              <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-tertiary)" }}>{cat.subtitle}</p>
            </div>
            <span style={{ color: "var(--text-tertiary)" }}>→</span>
          </Link>
        ))}

        {modalCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setOpenModalSlug(cat.slug)}
            className="ds-card ds-card-interactive w-full flex items-center gap-3 text-left"
          >
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: "color-mix(in srgb, var(--tenant-primary) 12%, var(--surface-1))" }}
            >
              {ICONS[cat.slug] ?? "📖"}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold" style={{ fontSize: "var(--fs-body)" }}>
                {cat.title}
              </h3>
              <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-tertiary)" }}>{cat.subtitle}</p>
            </div>
            <span style={{ color: "var(--text-tertiary)" }}>→</span>
          </button>
        ))}

        {listScreenCategories.length === 0 && modalCategories.length === 0 && (
          <EmptyState icon="🤲" title="No dua categories have been added yet" />
        )}
      </div>

      {/* Modal — shared Modal shell (bottom sheet on mobile, centered ≥640px) */}
      <Modal open={!!activeModal} onClose={() => setOpenModalSlug(null)}>
        {activeModal && (
          <>
            <div className="flex items-center justify-between" style={{ marginBottom: "var(--sp-5)" }}>
              <div>
                <h2 className="tenant-primary-text font-bold" style={{ fontSize: "var(--fs-h3)" }}>
                  {activeModal.title}
                </h2>
                {activeModal.subtitle && <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-tertiary)" }}>{activeModal.subtitle}</p>}
              </div>
              <button
                onClick={() => setOpenModalSlug(null)}
                aria-label="Close"
                className="flex items-center justify-center rounded-full"
                style={{ width: 36, height: 36, background: "var(--surface-2)", color: "var(--text-secondary)" }}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {(modalDuas[activeModal.slug] ?? []).map((dua) => (
                <div key={dua.id} className="rounded-xl text-center" style={{ background: "var(--surface-2)", border: "1px solid var(--border-subtle)", padding: "var(--sp-4)" }}>
                  {dua.numbered_position && (
                    <div className="flex items-center gap-2 justify-center" style={{ marginBottom: "var(--sp-2)" }}>
                      <span
                        className="flex items-center justify-center font-bold"
                        style={{ width: 24, height: 24, borderRadius: "999px", background: "var(--tenant-primary)", color: "var(--tenant-on-primary)", fontSize: "var(--fs-micro)" }}
                      >
                        {dua.numbered_position}
                      </span>
                      <span className="font-semibold" style={{ fontSize: "var(--fs-body)" }}>
                        {dua.title}
                      </span>
                    </div>
                  )}
                  <p className="tenant-arabic" style={{ fontSize: "var(--fs-ar-body)", marginBottom: "var(--sp-2)" }} dir="rtl">
                    {dua.arabic_text}
                  </p>
                  <div className="mx-auto" style={{ height: 1, width: "60%", background: "var(--border-subtle)", marginBottom: "var(--sp-2)" }} />
                  <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-secondary)", fontStyle: "italic" }}>{dua.translation_en}</p>
                </div>
              ))}

              {(!modalDuas[activeModal.slug] || modalDuas[activeModal.slug].length === 0) && (
                <p className="text-center" style={{ color: "var(--text-tertiary)", padding: "var(--sp-6) 0" }}>
                  No content has been added yet.
                </p>
              )}
            </div>

            <div className="flex justify-end" style={{ marginTop: "var(--sp-5)" }}>
              <button onClick={() => setOpenModalSlug(null)} className="ds-btn ds-btn-primary ds-btn-sm">
                Close
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
