"use client";

import { useState } from "react";
import { useResource } from "@/components/useResource";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

type Collection = { id: string; name: string; sort_order: number };
type Hadith = {
  id: string;
  collection_id: string;
  hadith_number: number;
  text_en: string;
  narrator: string | null;
  sort_order: number;
};

export default function HadithContentPage() {
  const collections = useResource<Collection>("hadith_collections");
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const hadiths = useResource<Hadith>("hadiths", activeCollectionId, "collection_id");

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ hadith_number: "", text_en: "", narrator: "" });
  const [error, setError] = useState<string | null>(null);

  const activeCollection = collections.items.find((c) => c.id === activeCollectionId) ?? collections.items[0];
  if (!activeCollectionId && collections.items.length > 0) {
    setActiveCollectionId(collections.items[0].id);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await hadiths.create({
        collection_id: activeCollectionId!,
        hadith_number: parseInt(form.hadith_number, 10),
        text_en: form.text_en,
        narrator: form.narrator || null,
      } as Partial<Hadith>);
      setForm({ hadith_number: "", text_en: "", narrator: "" });
      setFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    }
  }

  return (
    <div className="max-w-4xl" style={{ padding: "var(--sp-8)" }}>
      <h1 className="ds-h1" style={{ marginBottom: "var(--sp-6)" }}>Hadith Collections</h1>

      <div className="flex gap-2 mb-6">
        {collections.items.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCollectionId(c.id)}
            className="ds-tab-pill" style={{ padding: "10px 18px", borderRadius: "var(--r-md)", fontWeight: 600, fontSize: "var(--fs-body)", minHeight: 44, background: activeCollectionId === c.id ? "var(--tenant-primary)" : "var(--surface-1)", color: activeCollectionId === c.id ? "var(--tenant-on-primary)" : "var(--text-secondary)", border: activeCollectionId === c.id ? "none" : "1px solid var(--border-subtle)" }}
          >
            {c.name}
          </button>
        ))}
      </div>

      {activeCollection && (
        <div className="ds-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="ds-h3">
              {activeCollection.name} — {hadiths.items.length} hadiths
            </h2>
            <button onClick={() => setFormOpen(true)} className="ds-btn ds-btn-primary ds-btn-sm">
              + Add Hadith
            </button>
          </div>

          {formOpen && (
            <form onSubmit={handleAdd} className="space-y-3" style={{ background: "var(--surface-2)", borderRadius: "var(--r-md)", padding: "var(--sp-4)", marginBottom: "var(--sp-4)" }}>
              <input required type="number" placeholder="Hadith Number" className="ds-input" value={form.hadith_number} onChange={(e) => setForm({ ...form, hadith_number: e.target.value })} />
              <textarea required placeholder="English text" rows={3} className="ds-input" value={form.text_en} onChange={(e) => setForm({ ...form, text_en: e.target.value })} />
              <input placeholder="Narrator (optional)" className="ds-input" value={form.narrator} onChange={(e) => setForm({ ...form, narrator: e.target.value })} />
              {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-body)" }}>{error}</p>}
              <div className="flex gap-2">
                <button type="submit" className="ds-btn ds-btn-primary ds-btn-sm">Save</button>
                <button type="button" onClick={() => setFormOpen(false)} className="ds-btn ds-btn-ghost ds-btn-sm">Cancel</button>
              </div>
            </form>
          )}

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {hadiths.items.map((h) => (
              <HadithRow key={h.id} hadith={h} onUpdate={hadiths.update} onDelete={hadiths.remove} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HadithRow({
  hadith,
  onUpdate,
  onDelete,
}: {
  hadith: Hadith;
  onUpdate: (id: string, fields: Partial<Hadith>) => Promise<Hadith>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(hadith.text_en);
  const [narrator, setNarrator] = useState(hadith.narrator ?? "");
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!text.trim()) {
      setError("Hadith text cannot be empty");
      return;
    }
    try {
      await onUpdate(hadith.id, { text_en: text, narrator: narrator || null });
      setEditing(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <div className="ds-card" style={{ padding: "var(--sp-3)" }}>
      <div className="flex items-center justify-between mb-1">
        <span style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)", fontWeight: 700 }}>Hadith #{hadith.hadith_number}</span>
        {!editing && (
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="ds-btn ds-btn-secondary ds-btn-sm">Edit</button>
            <ConfirmDeleteButton itemLabel={`Hadith #${hadith.hadith_number}`} onConfirm={() => onDelete(hadith.id)} />
          </div>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <textarea className="ds-input" style={{ minHeight: 36 }} rows={3} value={text} onChange={(e) => setText(e.target.value)} />
          <input placeholder="Narrator" className="border rounded px-2 py-1 w-full text-sm" value={narrator} onChange={(e) => setNarrator(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={save} className="ds-btn ds-btn-primary ds-btn-sm">Save</button>
            <button onClick={() => setEditing(false)} style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)" }}>Cancel</button>
          </div>
          {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-caption)" }}>{error}</p>}
        </div>
      ) : (
        <>
          <p style={{ color: "var(--text-primary)", fontSize: "var(--fs-body)" }}>&quot;{hadith.text_en}&quot;</p>
          {hadith.narrator && <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)", marginTop: 4 }}>— {hadith.narrator}</p>}
        </>
      )}
    </div>
  );
}
