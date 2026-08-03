"use client";

import { useState } from "react";
import { useResource } from "@/components/useResource";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

type Qaida = {
  id: string;
  name: string;
  level_label: string | null;
  color_theme: string | null;
  file_provider: string;
  file_reference: string | null;
  sort_order: number;
  is_active: boolean;
};

export default function QaidaContentPage() {
  const qaidas = useResource<Qaida>("qaida_courses");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: "", level_label: "", color_theme: "", file_provider: "none", file_reference: "" });
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await qaidas.create({
        name: form.name,
        level_label: form.level_label || null,
        color_theme: form.color_theme || null,
        file_provider: form.file_provider,
        file_reference: form.file_reference || null,
      } as Partial<Qaida>);
      setForm({ name: "", level_label: "", color_theme: "", file_provider: "none", file_reference: "" });
      setFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    }
  }

  return (
    <div className="max-w-3xl" style={{ padding: "var(--sp-8)" }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="ds-h1">Qaida Courses</h1>
        <button onClick={() => setFormOpen(true)} className="ds-btn ds-btn-primary ds-btn-sm">
          + Add Qaida
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleAdd} className="ds-card space-y-3" style={{ marginBottom: "var(--sp-6)" }}>
          <input required placeholder="Name (e.g. Noorani Qaida)" className="ds-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Level label (e.g. Beginner)" className="ds-input" value={form.level_label} onChange={(e) => setForm({ ...form, level_label: e.target.value })} />
            <input placeholder="Color theme (e.g. sky)" className="ds-input" value={form.color_theme} onChange={(e) => setForm({ ...form, color_theme: e.target.value })} />
          </div>
          <select className="ds-input" value={form.file_provider} onChange={(e) => setForm({ ...form, file_provider: e.target.value })}>
            <option value="none">None</option>
            <option value="google_drive">Google Drive</option>
            <option value="url">URL</option>
            <option value="upload">Upload</option>
          </select>
          <input placeholder="File reference" className="ds-input" value={form.file_reference} onChange={(e) => setForm({ ...form, file_reference: e.target.value })} />
          {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-body)" }}>{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="ds-btn ds-btn-primary ds-btn-sm">Save</button>
            <button type="button" onClick={() => setFormOpen(false)} className="ds-btn ds-btn-ghost ds-btn-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {qaidas.items.map((q) => (
          <QaidaRow key={q.id} qaida={q} onUpdate={qaidas.update} onDelete={qaidas.remove} />
        ))}
      </div>
    </div>
  );
}

function QaidaRow({
  qaida,
  onUpdate,
  onDelete,
}: {
  qaida: Qaida;
  onUpdate: (id: string, fields: Partial<Qaida>) => Promise<Qaida>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(qaida.name);
  const [fileRef, setFileRef] = useState(qaida.file_reference ?? "");
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!name.trim()) {
      setError("Name cannot be empty");
      return;
    }
    try {
      await onUpdate(qaida.id, { name, file_reference: fileRef || null });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <div className="ds-card flex items-center gap-3">
      {editing ? (
        <>
          <input className="ds-input" style={{ flex: 1, minHeight: 36 }} value={name} onChange={(e) => setName(e.target.value)} />
          <input className="ds-input" style={{ flex: 1, minHeight: 36, fontSize: "var(--fs-caption)" }} value={fileRef} onChange={(e) => setFileRef(e.target.value)} placeholder="File reference" />
          <button onClick={save} className="ds-btn ds-btn-primary ds-btn-sm">Save</button>
          <button onClick={() => setEditing(false)} style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)" }}>Cancel</button>
        </>
      ) : (
        <>
          <div className="flex-1">
            <div className="font-semibold">{qaida.name}</div>
            <div style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)" }}>{qaida.level_label} · {qaida.file_reference || "no file"}</div>
          </div>
          <button onClick={() => setEditing(true)} className="ds-btn ds-btn-secondary ds-btn-sm">Edit</button>
          <ConfirmDeleteButton itemLabel={qaida.name} onConfirm={() => onDelete(qaida.id)} />
        </>
      )}
      {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-caption)" }}>{error}</p>}
    </div>
  );
}
