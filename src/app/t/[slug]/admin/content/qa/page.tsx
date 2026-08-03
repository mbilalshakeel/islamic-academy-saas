"use client";

import { useState } from "react";
import { useResource } from "@/components/useResource";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { DragReorderList } from "@/components/DragReorderList";

type QAItem = {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
};

const CATEGORIES = ["namaz", "quran", "roza", "zakat", "aqaid"];

export default function QAContentPage() {
  const qa = useResource<QAItem>("qa_items");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ category: "namaz", question: "", answer: "" });
  const [error, setError] = useState<string | null>(null);

  const filtered = filterCat === "all" ? qa.items : qa.items.filter((q) => q.category === filterCat);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await qa.create({ category: form.category, question: form.question, answer: form.answer } as Partial<QAItem>);
      setForm({ category: "namaz", question: "", answer: "" });
      setFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    }
  }

  return (
    <div className="max-w-3xl" style={{ padding: "var(--sp-8)" }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="ds-h1">Islamic Q&amp;A</h1>
        <button onClick={() => setFormOpen(true)} className="ds-btn ds-btn-primary ds-btn-sm">
          + Add Q&amp;A
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setFilterCat("all")} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${filterCat === "all" ? "bg-slate-900 text-white" : "bg-white border"}`}>
          All ({qa.items.length})
        </button>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilterCat(c)} className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${filterCat === c ? "bg-slate-900 text-white" : "bg-white border"}`}>
            {c} ({qa.items.filter((q) => q.category === c).length})
          </button>
        ))}
      </div>

      {formOpen && (
        <form onSubmit={handleAdd} className="ds-card space-y-3" style={{ marginBottom: "var(--sp-6)" }}>
          <select className="ds-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea required placeholder="Question" rows={2} className="ds-input" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
          <textarea required placeholder="Answer" rows={3} className="ds-input" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} />
          {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-body)" }}>{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="ds-btn ds-btn-primary ds-btn-sm">Save</button>
            <button type="button" onClick={() => setFormOpen(false)} className="ds-btn ds-btn-ghost ds-btn-sm">Cancel</button>
          </div>
        </form>
      )}

      <DragReorderList
        items={filtered}
        onReorder={qa.reorder}
        renderItem={(item, _i, drag) => (
          <QARow item={item} onUpdate={qa.update} onDelete={qa.remove} drag={drag} />
        )}
      />
    </div>
  );
}

function QARow({
  item,
  onUpdate,
  onDelete,
  drag,
}: {
  item: QAItem;
  onUpdate: (id: string, fields: Partial<QAItem>) => Promise<QAItem>;
  onDelete: (id: string) => Promise<void>;
  drag: { draggable: boolean; onDragStart: () => void };
}) {
  const [editing, setEditing] = useState(false);
  const [question, setQuestion] = useState(item.question);
  const [answer, setAnswer] = useState(item.answer);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!question.trim() || !answer.trim()) {
      setError("Question and answer cannot be empty");
      return;
    }
    try {
      await onUpdate(item.id, { question, answer });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function toggleActive() {
    await onUpdate(item.id, { is_active: !item.is_active });
  }

  return (
    <div draggable={drag.draggable} onDragStart={drag.onDragStart} className="ds-card cursor-move" style={{ padding: "var(--sp-3)", marginBottom: "var(--sp-2)" }}>
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color: "var(--text-tertiary)" }}>⠿</span>
        <span style={{ fontSize: "var(--fs-micro)", fontWeight: 700, textTransform: "uppercase", color: "var(--tenant-primary)" }}>{item.category}</span>
        <button
          onClick={toggleActive}
          className={`text-xs px-2 py-0.5 rounded font-semibold ml-auto ${item.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}
        >
          {item.is_active ? "Active" : "Inactive"}
        </button>
        {!editing && (
          <>
            <button onClick={() => setEditing(true)} className="ds-btn ds-btn-secondary ds-btn-sm">Edit</button>
            <ConfirmDeleteButton itemLabel="this Q&A" onConfirm={() => onDelete(item.id)} />
          </>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <textarea className="ds-input" style={{ minHeight: 36 }} rows={2} value={question} onChange={(e) => setQuestion(e.target.value)} />
          <textarea className="ds-input" style={{ minHeight: 36 }} rows={3} value={answer} onChange={(e) => setAnswer(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={save} className="ds-btn ds-btn-primary ds-btn-sm">Save</button>
            <button onClick={() => setEditing(false)} style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)" }}>Cancel</button>
          </div>
          {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-caption)" }}>{error}</p>}
        </div>
      ) : (
        <>
          <p className="font-semibold text-sm">{item.question}</p>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body)", marginTop: 4 }}>{item.answer}</p>
        </>
      )}
    </div>
  );
}
