"use client";

import { useState } from "react";
import { useResource } from "@/components/useResource";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { DragReorderList } from "@/components/DragReorderList";

type Pillar = { id: string; slug: string; title: string; description: string; importance: string | null; sort_order: number };
type PillarDetail = { id: string; pillar_id: string; detail_text: string; sort_order: number };

export default function PillarsContentPage() {
  const pillars = useResource<Pillar>("pillars");
  const [activePillarId, setActivePillarId] = useState<string | null>(null);
  const details = useResource<PillarDetail>("pillar_details", activePillarId, "pillar_id");

  const activePillar = pillars.items.find((p) => p.id === activePillarId) ?? pillars.items[0];
  if (!activePillarId && pillars.items.length > 0) {
    setActivePillarId(pillars.items[0].id);
  }

  const [editingDesc, setEditingDesc] = useState(false);
  const [desc, setDesc] = useState("");
  const [newDetail, setNewDetail] = useState("");
  const [error, setError] = useState<string | null>(null);

  function startEditDesc() {
    setDesc(activePillar?.description ?? "");
    setEditingDesc(true);
  }

  async function saveDesc() {
    if (!desc.trim() || !activePillar) {
      setError("Description cannot be empty");
      return;
    }
    try {
      await pillars.update(activePillar.id, { description: desc });
      setEditingDesc(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function addDetail(e: React.FormEvent) {
    e.preventDefault();
    if (!newDetail.trim() || !activePillar) return;
    try {
      const maxOrder = Math.max(0, ...details.items.map((d) => d.sort_order));
      await details.create({ pillar_id: activePillar.id, detail_text: newDetail, sort_order: maxOrder + 1 } as Partial<PillarDetail>);
      setNewDetail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    }
  }

  return (
    <div className="max-w-3xl" style={{ padding: "var(--sp-8)" }}>
      <h1 className="ds-h1" style={{ marginBottom: "var(--sp-6)" }}>Pillars of Islam</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {pillars.items.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePillarId(p.id)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm capitalize ${activePillarId === p.id ? "bg-slate-900 text-white" : "bg-white border"}`}
          >
            {p.title}
          </button>
        ))}
      </div>

      {activePillar && (
        <>
          <div className="ds-card" style={{ marginBottom: "var(--sp-4)" }}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="ds-h3">Description</h2>
              {!editingDesc && (
                <button onClick={startEditDesc} className="ds-btn ds-btn-secondary ds-btn-sm">Edit</button>
              )}
            </div>
            {editingDesc ? (
              <div className="space-y-2">
                <textarea className="ds-input" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />
                <div className="flex gap-2">
                  <button onClick={saveDesc} className="ds-btn ds-btn-primary ds-btn-sm">Save</button>
                  <button onClick={() => setEditingDesc(false)} style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)" }}>Cancel</button>
                </div>
                {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-caption)" }}>{error}</p>}
              </div>
            ) : (
              <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body)" }}>{activePillar.description}</p>
            )}
          </div>

          <div className="ds-card">
            <h2 className="ds-h3" style={{ marginBottom: "var(--sp-3)" }}>Detail Points ({details.items.length})</h2>
            <DragReorderList
              items={details.items}
              onReorder={details.reorder}
              renderItem={(d, _i, drag) => (
                <DetailRow detail={d} onUpdate={details.update} onDelete={details.remove} drag={drag} />
              )}
            />
            <form onSubmit={addDetail} className="flex gap-2 mt-3">
              <input
                placeholder="Add a new detail point..."
                className="border rounded px-3 py-2 flex-1"
                value={newDetail}
                onChange={(e) => setNewDetail(e.target.value)}
              />
              <button type="submit" className="ds-btn ds-btn-primary ds-btn-sm">
                Add
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

function DetailRow({
  detail,
  onUpdate,
  onDelete,
  drag,
}: {
  detail: PillarDetail;
  onUpdate: (id: string, fields: Partial<PillarDetail>) => Promise<PillarDetail>;
  onDelete: (id: string) => Promise<void>;
  drag: { draggable: boolean; onDragStart: () => void };
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(detail.detail_text);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!text.trim()) {
      setError("Cannot be empty");
      return;
    }
    try {
      await onUpdate(detail.id, { detail_text: text });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <div draggable={drag.draggable} onDragStart={drag.onDragStart} className="flex items-center gap-2 border-b py-2 cursor-move">
      <span style={{ color: "var(--text-tertiary)" }}>⠿</span>
      {editing ? (
        <input className="ds-input" style={{ flex: 1, minHeight: 36 }} value={text} onChange={(e) => setText(e.target.value)} />
      ) : (
        <span className="flex-1 text-sm">{detail.detail_text}</span>
      )}
      {editing ? (
        <>
          <button onClick={save} className="ds-btn ds-btn-primary ds-btn-sm">Save</button>
          <button onClick={() => setEditing(false)} style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)" }}>Cancel</button>
        </>
      ) : (
        <>
          <button onClick={() => setEditing(true)} className="ds-btn ds-btn-secondary ds-btn-sm">Edit</button>
          <ConfirmDeleteButton itemLabel="this detail" onConfirm={() => onDelete(detail.id)} />
        </>
      )}
      {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-caption)" }}>{error}</p>}
    </div>
  );
}
