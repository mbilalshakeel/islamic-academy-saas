"use client";

import { useState } from "react";
import { useResource } from "@/components/useResource";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { DragReorderList } from "@/components/DragReorderList";

type Edition = { id: string; name: string; line_count: number; sort_order: number; is_active: boolean };
type Para = {
  id: string;
  edition_id: string;
  para_number: number;
  name_arabic: string;
  file_provider: string;
  file_reference: string | null;
  sort_order: number;
};

export default function QuranContentPage() {
  const editions = useResource<Edition>("quran_editions");
  const [activeEditionId, setActiveEditionId] = useState<string | null>(null);
  const paras = useResource<Para>("quran_paras", activeEditionId, "edition_id");

  const [newParaOpen, setNewParaOpen] = useState(false);
  const [form, setForm] = useState({ para_number: "", name_arabic: "", file_provider: "google_drive", file_reference: "" });
  const [error, setError] = useState<string | null>(null);

  const activeEdition = editions.items.find((e) => e.id === activeEditionId) ?? editions.items[0];
  if (!activeEditionId && editions.items.length > 0) {
    setActiveEditionId(editions.items[0].id);
  }

  async function handleAddPara(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await paras.create({
        edition_id: activeEditionId!,
        para_number: parseInt(form.para_number, 10),
        name_arabic: form.name_arabic,
        file_provider: form.file_provider,
        file_reference: form.file_reference || null,
      } as Partial<Para>);
      setForm({ para_number: "", name_arabic: "", file_provider: "google_drive", file_reference: "" });
      setNewParaOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add para");
    }
  }

  return (
    <div className="max-w-4xl" style={{ padding: "var(--sp-8)" }}>
      <h1 className="ds-h1" style={{ marginBottom: "var(--sp-6)" }}>Quran Editions &amp; Paras</h1>

      {/* Edition tabs */}
      <div className="flex gap-2 mb-6">
        {editions.items.map((ed) => (
          <button
            key={ed.id}
            onClick={() => setActiveEditionId(ed.id)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm ${
              activeEditionId === ed.id ? "bg-slate-900 text-white" : "bg-white text-slate-600 border"
            }`}
          >
            {ed.name} ({ed.line_count}-line)
          </button>
        ))}
      </div>

      {activeEdition && (
        <div className="ds-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="ds-h3">
              {activeEdition.name} — {paras.items.length} Paras
            </h2>
            <button
              onClick={() => setNewParaOpen(true)}
              className="ds-btn ds-btn-primary ds-btn-sm"
            >
              + Add Para
            </button>
          </div>

          {newParaOpen && (
            <form onSubmit={handleAddPara} className="space-y-3" style={{ background: "var(--surface-2)", borderRadius: "var(--r-md)", padding: "var(--sp-4)", marginBottom: "var(--sp-4)" }}>
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  type="number"
                  placeholder="Para Number (1-30)"
                  className="ds-input"
                  value={form.para_number}
                  onChange={(e) => setForm({ ...form, para_number: e.target.value })}
                />
                <input
                  required
                  placeholder="Arabic Name"
                  dir="rtl"
                  className="ds-input"
                  value={form.name_arabic}
                  onChange={(e) => setForm({ ...form, name_arabic: e.target.value })}
                />
              </div>
              <select
                className="ds-input"
                value={form.file_provider}
                onChange={(e) => setForm({ ...form, file_provider: e.target.value })}
              >
                <option value="google_drive">Google Drive</option>
                <option value="url">URL</option>
                <option value="upload">Upload</option>
                <option value="none">None (coming soon)</option>
              </select>
              <input
                placeholder="File reference (Drive ID or URL)"
                className="ds-input"
                value={form.file_reference}
                onChange={(e) => setForm({ ...form, file_reference: e.target.value })}
              />
              {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-body)" }}>{error}</p>}
              <div className="flex gap-2">
                <button type="submit" className="ds-btn ds-btn-primary ds-btn-sm">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setNewParaOpen(false)}
                  className="ds-btn ds-btn-ghost ds-btn-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <DragReorderList
            items={paras.items}
            onReorder={paras.reorder}
            renderItem={(para, _i, drag) => (
              <ParaRow para={para} onUpdate={paras.update} onDelete={paras.remove} drag={drag} />
            )}
          />
        </div>
      )}
    </div>
  );
}

function ParaRow({
  para,
  onUpdate,
  onDelete,
  drag,
}: {
  para: Para;
  onUpdate: (id: string, fields: Partial<Para>) => Promise<Para>;
  onDelete: (id: string) => Promise<void>;
  drag: { draggable: boolean; onDragStart: () => void };
}) {
  const [editing, setEditing] = useState(false);
  const [nameArabic, setNameArabic] = useState(para.name_arabic);
  const [fileRef, setFileRef] = useState(para.file_reference ?? "");
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!nameArabic.trim()) {
      setError("Arabic name cannot be empty");
      return;
    }
    try {
      await onUpdate(para.id, { name_arabic: nameArabic, file_reference: fileRef || null });
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
      className="flex items-center gap-3 cursor-move" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--r-md)", padding: "10px 12px", background: "var(--surface-1)" }}
    >
      <span style={{ color: "var(--text-tertiary)" }}>⠿</span>
      <span style={{ width: 32, textAlign: "center", fontWeight: 700, color: "var(--text-secondary)" }}>{para.para_number}</span>
      {editing ? (
        <div className="flex-1 flex gap-2 items-center">
          <input
            dir="rtl"
            className="ds-input" style={{ flex: 1, minHeight: 36 }}
            value={nameArabic}
            onChange={(e) => setNameArabic(e.target.value)}
          />
          <input
            placeholder="File reference"
            className="ds-input" style={{ flex: 1, minHeight: 36, fontSize: "var(--fs-caption)" }}
            value={fileRef}
            onChange={(e) => setFileRef(e.target.value)}
          />
          <button onClick={save} className="ds-btn ds-btn-primary ds-btn-sm">
            Save
          </button>
          <button onClick={() => setEditing(false)} className="ds-btn ds-btn-ghost ds-btn-sm">
            Cancel
          </button>
        </div>
      ) : (
        <>
          <span dir="rtl" className="flex-1 font-arabic">
            {para.name_arabic}
          </span>
          <span style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>{para.file_reference || "no file"}</span>
          <button onClick={() => setEditing(true)} className="ds-btn ds-btn-secondary ds-btn-sm">
            Edit
          </button>
          <ConfirmDeleteButton itemLabel={`Para ${para.para_number}`} onConfirm={() => onDelete(para.id)} />
        </>
      )}
      {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-caption)" }}>{error}</p>}
    </div>
  );
}
