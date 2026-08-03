"use client";

import { useState } from "react";
import { useResource } from "@/components/useResource";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { DragReorderList } from "@/components/DragReorderList";

type DivineName = {
  id: string;
  category: "allah" | "prophet";
  order_index: number;
  arabic: string;
  transliteration: string;
  meaning_en: string;
  meaning_urdu: string | null;
};

export default function NamesContentPage() {
  const [category, setCategory] = useState<"allah" | "prophet">("allah");
  const names = useResource<DivineName>("divine_names");
  const filtered = names.items.filter((n) => n.category === category);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ arabic: "", transliteration: "", meaning_en: "", meaning_urdu: "" });
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const maxOrder = Math.max(0, ...filtered.map((n) => n.order_index));
      await names.create({
        category,
        order_index: maxOrder + 1,
        arabic: form.arabic,
        transliteration: form.transliteration,
        meaning_en: form.meaning_en,
        meaning_urdu: form.meaning_urdu || null,
      } as Partial<DivineName>);
      setForm({ arabic: "", transliteration: "", meaning_en: "", meaning_urdu: "" });
      setFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    }
  }

  return (
    <div className="max-w-4xl" style={{ padding: "var(--sp-8)" }}>
      <h1 className="ds-h1" style={{ marginBottom: "var(--sp-6)" }}>Divine Names</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setCategory("allah")}
          className={`px-4 py-2 rounded-lg font-semibold text-sm ${category === "allah" ? "bg-slate-900 text-white" : "bg-white border"}`}
        >
          Allah&apos;s Names ({names.items.filter((n) => n.category === "allah").length})
        </button>
        <button
          onClick={() => setCategory("prophet")}
          className={`px-4 py-2 rounded-lg font-semibold text-sm ${category === "prophet" ? "bg-slate-900 text-white" : "bg-white border"}`}
        >
          Prophet&apos;s Names ({names.items.filter((n) => n.category === "prophet").length})
        </button>
      </div>

      <div className="ds-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="ds-h3">{filtered.length} names — drag ⠿ to reorder</h2>
          <button onClick={() => setFormOpen(true)} className="ds-btn ds-btn-primary ds-btn-sm">
            + Add Name
          </button>
        </div>

        {formOpen && (
          <form onSubmit={handleAdd} className="space-y-3" style={{ background: "var(--surface-2)", borderRadius: "var(--r-md)", padding: "var(--sp-4)", marginBottom: "var(--sp-4)" }}>
            <div className="grid grid-cols-2 gap-3">
              <input required dir="rtl" placeholder="Arabic" className="ds-input" value={form.arabic} onChange={(e) => setForm({ ...form, arabic: e.target.value })} />
              <input required placeholder="Transliteration" className="ds-input" value={form.transliteration} onChange={(e) => setForm({ ...form, transliteration: e.target.value })} />
            </div>
            <input required placeholder="Meaning (English)" className="ds-input" value={form.meaning_en} onChange={(e) => setForm({ ...form, meaning_en: e.target.value })} />
            <input dir="rtl" placeholder="Meaning (Urdu, optional)" className="ds-input" value={form.meaning_urdu} onChange={(e) => setForm({ ...form, meaning_urdu: e.target.value })} />
            {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-body)" }}>{error}</p>}
            <div className="flex gap-2">
              <button type="submit" className="ds-btn ds-btn-primary ds-btn-sm">Save</button>
              <button type="button" onClick={() => setFormOpen(false)} className="ds-btn ds-btn-ghost ds-btn-sm">Cancel</button>
            </div>
          </form>
        )}

        <div className="max-h-[600px] overflow-y-auto">
          <DragReorderList
            items={filtered}
            onReorder={names.reorder}
            renderItem={(name, _i, drag) => (
              <NameRow name={name} onUpdate={names.update} onDelete={names.remove} drag={drag} />
            )}
          />
        </div>
      </div>
    </div>
  );
}

function NameRow({
  name,
  onUpdate,
  onDelete,
  drag,
}: {
  name: DivineName;
  onUpdate: (id: string, fields: Partial<DivineName>) => Promise<DivineName>;
  onDelete: (id: string) => Promise<void>;
  drag: { draggable: boolean; onDragStart: () => void };
}) {
  const [editing, setEditing] = useState(false);
  const [arabic, setArabic] = useState(name.arabic);
  const [translit, setTranslit] = useState(name.transliteration);
  const [meaning, setMeaning] = useState(name.meaning_en);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!arabic.trim() || !translit.trim() || !meaning.trim()) {
      setError("Arabic, transliteration, and meaning cannot be empty");
      return;
    }
    try {
      await onUpdate(name.id, { arabic, transliteration: translit, meaning_en: meaning });
      setEditing(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <div
      draggable={drag.draggable}
      onDragStart={drag.onDragStart}
      className="flex items-center gap-3 border-b py-2 cursor-move"
    >
      <span style={{ color: "var(--text-tertiary)" }}>⠿</span>
      <span style={{ width: 24, textAlign: "center", fontSize: "var(--fs-caption)", fontWeight: 700, color: "var(--text-tertiary)" }}>{name.order_index}</span>
      {editing ? (
        <div className="flex-1 grid grid-cols-3 gap-2 items-center">
          <input dir="rtl" className="ds-input" style={{ minHeight: 36 }} value={arabic} onChange={(e) => setArabic(e.target.value)} />
          <input className="ds-input" style={{ minHeight: 36 }} value={translit} onChange={(e) => setTranslit(e.target.value)} />
          <input className="ds-input" style={{ minHeight: 36 }} value={meaning} onChange={(e) => setMeaning(e.target.value)} />
        </div>
      ) : (
        <>
          <span dir="rtl" className="w-24">{name.arabic}</span>
          <span className="w-32 font-semibold">{name.transliteration}</span>
          <span style={{ flex: 1, color: "var(--text-secondary)", fontSize: "var(--fs-body)" }}>{name.meaning_en}</span>
        </>
      )}
      {editing ? (
        <>
          <button onClick={save} className="ds-btn ds-btn-primary ds-btn-sm">Save</button>
          <button onClick={() => setEditing(false)} style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)" }}>Cancel</button>
        </>
      ) : (
        <>
          <button onClick={() => setEditing(true)} className="ds-btn ds-btn-secondary ds-btn-sm">Edit</button>
          <ConfirmDeleteButton itemLabel={name.transliteration} onConfirm={() => onDelete(name.id)} />
        </>
      )}
      {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-caption)" }}>{error}</p>}
    </div>
  );
}
