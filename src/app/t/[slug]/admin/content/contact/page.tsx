"use client";

import { useState } from "react";
import { useResource } from "@/components/useResource";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { DragReorderList } from "@/components/DragReorderList";

type ContactChannel = {
  id: string;
  channel_type: string;
  label: string;
  value: string;
  icon: string | null;
  sort_order: number;
};

const CHANNEL_TYPES = ["phone", "whatsapp", "email", "address", "social", "working_hours"];

export default function ContactContentPage() {
  const channels = useResource<ContactChannel>("contact_channels");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ channel_type: "phone", label: "", value: "", icon: "" });
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await channels.create({
        channel_type: form.channel_type,
        label: form.label,
        value: form.value,
        icon: form.icon || null,
      } as Partial<ContactChannel>);
      setForm({ channel_type: "phone", label: "", value: "", icon: "" });
      setFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    }
  }

  return (
    <div className="max-w-2xl" style={{ padding: "var(--sp-8)" }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="ds-h1">Contact Channels</h1>
        <button onClick={() => setFormOpen(true)} className="ds-btn ds-btn-primary ds-btn-sm">
          + Add Channel
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleAdd} className="ds-card space-y-3" style={{ marginBottom: "var(--sp-6)" }}>
          <select className="ds-input" value={form.channel_type} onChange={(e) => setForm({ ...form, channel_type: e.target.value })}>
            {CHANNEL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input required placeholder="Label (e.g. Phone, Facebook, Monday—Friday)" className="ds-input" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <input required placeholder="Value (e.g. +966..., info@..., 9AM–6PM)" className="ds-input" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
          {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-body)" }}>{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="ds-btn ds-btn-primary ds-btn-sm">Save</button>
            <button type="button" onClick={() => setFormOpen(false)} className="ds-btn ds-btn-ghost ds-btn-sm">Cancel</button>
          </div>
        </form>
      )}

      <DragReorderList
        items={channels.items}
        onReorder={channels.reorder}
        renderItem={(ch, _i, drag) => (
          <ChannelRow channel={ch} onUpdate={channels.update} onDelete={channels.remove} drag={drag} />
        )}
      />
    </div>
  );
}

function ChannelRow({
  channel,
  onUpdate,
  onDelete,
  drag,
}: {
  channel: ContactChannel;
  onUpdate: (id: string, fields: Partial<ContactChannel>) => Promise<ContactChannel>;
  onDelete: (id: string) => Promise<void>;
  drag: { draggable: boolean; onDragStart: () => void };
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(channel.label);
  const [value, setValue] = useState(channel.value);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!label.trim() || !value.trim()) {
      setError("Label and value cannot be empty");
      return;
    }
    try {
      await onUpdate(channel.id, { label, value });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <div draggable={drag.draggable} onDragStart={drag.onDragStart} className="ds-card flex items-center gap-3 cursor-move" style={{ padding: "var(--sp-3)", marginBottom: "var(--sp-2)" }}>
      <span style={{ color: "var(--text-tertiary)" }}>⠿</span>
      <span className="tenant-primary-text" style={{ fontSize: "var(--fs-micro)", fontWeight: 700, textTransform: "uppercase", width: 96, color: "var(--tenant-primary)" }}>{channel.channel_type}</span>
      {editing ? (
        <div className="flex-1 flex gap-2">
          <input className="ds-input" style={{ flex: 1, minHeight: 36 }} value={label} onChange={(e) => setLabel(e.target.value)} />
          <input className="ds-input" style={{ flex: 1, minHeight: 36 }} value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
      ) : (
        <div className="flex-1">
          <span className="font-semibold text-sm">{channel.label}</span>
          <span style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-body)", marginLeft: 8 }}>{channel.value}</span>
        </div>
      )}
      {editing ? (
        <>
          <button onClick={save} className="ds-btn ds-btn-primary ds-btn-sm">Save</button>
          <button onClick={() => setEditing(false)} style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)" }}>Cancel</button>
        </>
      ) : (
        <>
          <button onClick={() => setEditing(true)} className="ds-btn ds-btn-secondary ds-btn-sm">Edit</button>
          <ConfirmDeleteButton itemLabel={channel.label} onConfirm={() => onDelete(channel.id)} />
        </>
      )}
      {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-caption)" }}>{error}</p>}
    </div>
  );
}
