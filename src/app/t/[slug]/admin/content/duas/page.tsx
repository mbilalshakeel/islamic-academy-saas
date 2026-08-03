"use client";

import { useState } from "react";
import { useResource } from "@/components/useResource";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

type DuaCategory = { id: string; slug: string; title: string; subtitle: string | null; display_type: string; sort_order: number };
type Dua = {
  id: string;
  category_id: string;
  title: string;
  subtitle: string | null;
  arabic_text: string;
  translation_en: string;
  numbered_position: number | null;
  sort_order: number;
};

export default function DuasContentPage() {
  const categories = useResource<DuaCategory>("dua_categories");
  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const duas = useResource<Dua>("duas", activeCatId, "category_id");

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ title: "", subtitle: "", arabic_text: "", translation_en: "", numbered_position: "" });
  const [error, setError] = useState<string | null>(null);

  const activeCat = categories.items.find((c) => c.id === activeCatId) ?? categories.items[0];
  if (!activeCatId && categories.items.length > 0) {
    setActiveCatId(categories.items[0].id);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await duas.create({
        category_id: activeCatId!,
        title: form.title,
        subtitle: form.subtitle || null,
        arabic_text: form.arabic_text,
        translation_en: form.translation_en,
        numbered_position: form.numbered_position ? parseInt(form.numbered_position, 10) : null,
      } as Partial<Dua>);
      setForm({ title: "", subtitle: "", arabic_text: "", translation_en: "", numbered_position: "" });
      setFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    }
  }

  return (
    <div className="max-w-4xl" style={{ padding: "var(--sp-8)" }}>
      <h1 className="ds-h1" style={{ marginBottom: "var(--sp-6)" }}>Dua Categories &amp; Duas</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.items.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCatId(c.id)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm ${activeCatId === c.id ? "bg-slate-900 text-white" : "bg-white border"}`}
          >
            {c.title}
          </button>
        ))}
      </div>

      {activeCat && (
        <div className="ds-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="ds-h3">
              {activeCat.title} — {duas.items.length} entries
            </h2>
            <button onClick={() => setFormOpen(true)} className="ds-btn ds-btn-primary ds-btn-sm">
              + Add Dua
            </button>
          </div>

          {formOpen && (
            <form onSubmit={handleAdd} className="space-y-3" style={{ background: "var(--surface-2)", borderRadius: "var(--r-md)", padding: "var(--sp-4)", marginBottom: "var(--sp-4)" }}>
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Title" className="ds-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <input placeholder="Subtitle (optional)" className="ds-input" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
              </div>
              <textarea required dir="rtl" placeholder="Arabic text" className="ds-input" rows={2} value={form.arabic_text} onChange={(e) => setForm({ ...form, arabic_text: e.target.value })} />
              <textarea required placeholder="Translation (English)" className="ds-input" rows={2} value={form.translation_en} onChange={(e) => setForm({ ...form, translation_en: e.target.value })} />
              {activeCat.slug === "kalimas" && (
                <input type="number" placeholder="Numbered position (1-6)" className="ds-input" value={form.numbered_position} onChange={(e) => setForm({ ...form, numbered_position: e.target.value })} />
              )}
              {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-body)" }}>{error}</p>}
              <div className="flex gap-2">
                <button type="submit" className="ds-btn ds-btn-primary ds-btn-sm">Save</button>
                <button type="button" onClick={() => setFormOpen(false)} className="ds-btn ds-btn-ghost ds-btn-sm">Cancel</button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {duas.items.map((dua) => (
              <DuaRow key={dua.id} dua={dua} onUpdate={duas.update} onDelete={duas.remove} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DuaRow({
  dua,
  onUpdate,
  onDelete,
}: {
  dua: Dua;
  onUpdate: (id: string, fields: Partial<Dua>) => Promise<Dua>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [arabic, setArabic] = useState(dua.arabic_text);
  const [translation, setTranslation] = useState(dua.translation_en);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!arabic.trim() || !translation.trim()) {
      setError("Arabic text and translation cannot be empty");
      return;
    }
    try {
      await onUpdate(dua.id, { arabic_text: arabic, translation_en: translation });
      setEditing(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <div className="ds-card" style={{ padding: "var(--sp-3)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold">
          {dua.numbered_position ? `${dua.numbered_position}. ` : ""}
          {dua.title}
        </span>
        {!editing && (
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="ds-btn ds-btn-secondary ds-btn-sm">Edit</button>
            <ConfirmDeleteButton itemLabel={dua.title} onConfirm={() => onDelete(dua.id)} />
          </div>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <textarea dir="rtl" className="ds-input" style={{ minHeight: 36 }} rows={2} value={arabic} onChange={(e) => setArabic(e.target.value)} />
          <textarea className="ds-input" style={{ minHeight: 36 }} rows={2} value={translation} onChange={(e) => setTranslation(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={save} className="ds-btn ds-btn-primary ds-btn-sm">Save</button>
            <button onClick={() => setEditing(false)} style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)" }}>Cancel</button>
          </div>
          {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-caption)" }}>{error}</p>}
        </div>
      ) : (
        <>
          <p dir="rtl" className="text-lg mb-1">{dua.arabic_text}</p>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body)", fontStyle: "italic" }}>{dua.translation_en}</p>
        </>
      )}
    </div>
  );
}
