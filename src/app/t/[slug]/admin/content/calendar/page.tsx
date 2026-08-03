"use client";

import { useState } from "react";
import { useResource } from "@/components/useResource";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

type CalendarEvent = {
  id: string;
  hijri_month: number;
  hijri_day: number;
  title: string;
  description: string | null;
  is_recurring_yearly: boolean;
};

const HIJRI_MONTHS = [
  "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani", "Jumada al-Awwal", "Jumada al-Thani",
  "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhul-Qadah", "Dhul-Hijjah",
];

export default function CalendarContentPage() {
  const events = useResource<CalendarEvent>("calendar_events");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ hijri_month: "1", hijri_day: "1", title: "", description: "" });
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await events.create({
        hijri_month: parseInt(form.hijri_month, 10),
        hijri_day: parseInt(form.hijri_day, 10),
        title: form.title,
        description: form.description || null,
      } as Partial<CalendarEvent>);
      setForm({ hijri_month: "1", hijri_day: "1", title: "", description: "" });
      setFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    }
  }

  const sorted = [...events.items].sort((a, b) => a.hijri_month - b.hijri_month || a.hijri_day - b.hijri_day);

  return (
    <div className="max-w-3xl" style={{ padding: "var(--sp-8)" }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="ds-h1">Hijri Calendar Events</h1>
        <button onClick={() => setFormOpen(true)} className="ds-btn ds-btn-primary ds-btn-sm">
          + Add Event
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleAdd} className="ds-card space-y-3" style={{ marginBottom: "var(--sp-6)" }}>
          <div className="grid grid-cols-3 gap-3">
            <select className="ds-input" value={form.hijri_month} onChange={(e) => setForm({ ...form, hijri_month: e.target.value })}>
              {HIJRI_MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <input required type="number" min="1" max="30" placeholder="Day" className="ds-input" value={form.hijri_day} onChange={(e) => setForm({ ...form, hijri_day: e.target.value })} />
            <input required placeholder="Title" className="ds-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <textarea placeholder="Description (optional)" className="ds-input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-body)" }}>{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="ds-btn ds-btn-primary ds-btn-sm">Save</button>
            <button type="button" onClick={() => setFormOpen(false)} className="ds-btn ds-btn-ghost ds-btn-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {sorted.map((e) => (
          <EventRow key={e.id} event={e} onUpdate={events.update} onDelete={events.remove} />
        ))}
      </div>
    </div>
  );
}

function EventRow({
  event,
  onUpdate,
  onDelete,
}: {
  event: CalendarEvent;
  onUpdate: (id: string, fields: Partial<CalendarEvent>) => Promise<CalendarEvent>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description ?? "");

  async function save() {
    await onUpdate(event.id, { title, description });
    setEditing(false);
  }

  return (
    <div className="ds-card" style={{ padding: "var(--sp-3)" }}>
      <div className="flex items-center gap-3">
        <span style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)", fontWeight: 700, width: 128 }}>
          {event.hijri_day} {HIJRI_MONTHS[event.hijri_month - 1]}
        </span>
        {editing ? (
          <input className="ds-input" style={{ flex: 1, minHeight: 36, fontWeight: 600 }} value={title} onChange={(e) => setTitle(e.target.value)} />
        ) : (
          <span className="flex-1 font-semibold text-sm">{event.title}</span>
        )}
        {editing ? (
          <>
            <button onClick={save} className="ds-btn ds-btn-primary ds-btn-sm">Save</button>
            <button onClick={() => setEditing(false)} style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)" }}>Cancel</button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)} className="ds-btn ds-btn-secondary ds-btn-sm">Edit</button>
            <ConfirmDeleteButton itemLabel={event.title} onConfirm={() => onDelete(event.id)} />
          </>
        )}
      </div>
      {editing ? (
        <textarea className="ds-input" style={{ marginTop: 4, minHeight: 36, fontSize: "var(--fs-caption)" }} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      ) : (
        event.description && <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)", marginLeft: "8.5rem" }}>{event.description}</p>
      )}
    </div>
  );
}
