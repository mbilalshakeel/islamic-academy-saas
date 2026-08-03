"use client";

import { useState } from "react";
import { useResource } from "@/components/useResource";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

type DhikrItem = {
  id: string;
  arabic_text: string;
  transliteration: string;
  translation: string;
  default_target_count: number;
  category: string;
  is_active: boolean;
};

export default function DhikrContentPage() {
  const dhikr = useResource<DhikrItem>("dhikr_items");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ arabic_text: "", transliteration: "", translation: "", default_target_count: "33", category: "custom" });
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await dhikr.create({
        arabic_text: form.arabic_text,
        transliteration: form.transliteration,
        translation: form.translation,
        default_target_count: parseInt(form.default_target_count, 10) || 33,
        category: form.category,
      } as Partial<DhikrItem>);
      setForm({ arabic_text: "", transliteration: "", translation: "", default_target_count: "33", category: "custom" });
      setFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    }
  }

  return (
    <div className="max-w-3xl" style={{ padding: "var(--sp-8)" }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="ds-h1">Dhikr Items</h1>
        <button onClick={() => setFormOpen(true)} className="ds-btn ds-btn-primary ds-btn-sm">
          + Add Dhikr
        </button>
      </div>
      <p className="ds-caption" style={{ marginBottom: "var(--sp-4)" }}>
        Manage the phrases available in the public Tasbih/Dhikr Counter. The actual counting happens in
        each visitor&apos;s own browser — no login required.
      </p>

      {formOpen && (
        <form onSubmit={handleAdd} className="ds-card space-y-3" style={{ marginBottom: "var(--sp-6)" }}>
          <input required dir="rtl" placeholder="Arabic text" className="ds-input" value={form.arabic_text} onChange={(e) => setForm({ ...form, arabic_text: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="Transliteration" className="ds-input" value={form.transliteration} onChange={(e) => setForm({ ...form, transliteration: e.target.value })} />
            <input required placeholder="Translation" className="ds-input" value={form.translation} onChange={(e) => setForm({ ...form, translation: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Default target count" className="ds-input" value={form.default_target_count} onChange={(e) => setForm({ ...form, default_target_count: e.target.value })} />
            <select className="ds-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="tasbih">Tasbih</option>
              <option value="istighfar">Istighfar</option>
              <option value="durood">Durood</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-body)" }}>{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="ds-btn ds-btn-primary ds-btn-sm">Save</button>
            <button type="button" onClick={() => setFormOpen(false)} className="ds-btn ds-btn-ghost ds-btn-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {dhikr.items.map((d) => (
          <DhikrRow key={d.id} item={d} onUpdate={dhikr.update} onDelete={dhikr.remove} />
        ))}
      </div>
    </div>
  );
}

function DhikrRow({
  item,
  onUpdate,
  onDelete,
}: {
  item: DhikrItem;
  onUpdate: (id: string, fields: Partial<DhikrItem>) => Promise<DhikrItem>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [translation, setTranslation] = useState(item.translation);
  const [targetCount, setTargetCount] = useState(item.default_target_count);

  async function save() {
    await onUpdate(item.id, { translation, default_target_count: targetCount });
    setEditing(false);
  }

  return (
    <div className="ds-card flex items-center gap-3" style={{ padding: "var(--sp-3)" }}>
      <span dir="rtl" className="w-32">{item.arabic_text}</span>
      <span className="w-28 font-semibold text-sm">{item.transliteration}</span>
      {editing ? (
        <>
          <input className="ds-input" style={{ flex: 1, minHeight: 36 }} value={translation} onChange={(e) => setTranslation(e.target.value)} />
          <input type="number" className="border rounded px-2 py-1 w-16" value={targetCount} onChange={(e) => setTargetCount(parseInt(e.target.value) || 33)} />
          <button onClick={save} className="ds-btn ds-btn-primary ds-btn-sm">Save</button>
          <button onClick={() => setEditing(false)} style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)" }}>Cancel</button>
        </>
      ) : (
        <>
          <span style={{ flex: 1, color: "var(--text-secondary)", fontSize: "var(--fs-body)" }}>{item.translation}</span>
          <span style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)" }}>×{item.default_target_count}</span>
          <button onClick={() => setEditing(true)} className="ds-btn ds-btn-secondary ds-btn-sm">Edit</button>
          <ConfirmDeleteButton itemLabel={item.transliteration} onConfirm={() => onDelete(item.id)} />
        </>
      )}
    </div>
  );
}
