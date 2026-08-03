"use client";

import { useState } from "react";
import { useResource } from "@/components/useResource";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { DragReorderList } from "@/components/DragReorderList";

type Prayer = { id: string; name: string; time_label: string | null; rakat_fard: number; rakat_sunnah: number; rakat_nafl: number; rakat_witr: number };
type Guide = { id: string; guide_type: string; title: string; sort_order: number };
type Step = { id: string; guide_id: string; step_number: number; title: string; description: string; sort_order: number };

export default function PrayersContentPage() {
  const prayers = useResource<Prayer>("prayers");
  const guides = useResource<Guide>("ritual_guides");
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);
  const steps = useResource<Step>("ritual_guide_steps", activeGuideId, "guide_id");

  const activeGuide = guides.items.find((g) => g.id === activeGuideId) ?? guides.items[0];
  if (!activeGuideId && guides.items.length > 0) {
    setActiveGuideId(guides.items[0].id);
  }

  const [newStepTitle, setNewStepTitle] = useState("");
  const [newStepDesc, setNewStepDesc] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function addStep(e: React.FormEvent) {
    e.preventDefault();
    if (!newStepTitle.trim() || !newStepDesc.trim() || !activeGuide) return;
    try {
      const maxOrder = Math.max(0, ...steps.items.map((s) => s.sort_order));
      await steps.create({
        guide_id: activeGuide.id,
        step_number: maxOrder + 1,
        title: newStepTitle,
        description: newStepDesc,
        sort_order: maxOrder + 1,
      } as Partial<Step>);
      setNewStepTitle("");
      setNewStepDesc("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add step");
    }
  }

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="ds-h1" style={{ marginBottom: "var(--sp-4)" }}>Prayers (Rakat Counts)</h1>
        <div className="ds-card space-y-2">
          {prayers.items.map((p) => (
            <PrayerRow key={p.id} prayer={p} onUpdate={prayers.update} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="ds-h2" style={{ marginBottom: "var(--sp-4)" }}>Ritual Guides (Wudu / Namaz Steps)</h2>
        <div className="flex gap-2 mb-4">
          {guides.items.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveGuideId(g.id)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm ${activeGuideId === g.id ? "bg-slate-900 text-white" : "bg-white border"}`}
            >
              {g.title}
            </button>
          ))}
        </div>

        {activeGuide && (
          <div className="ds-card">
            <h3 className="ds-h3" style={{ marginBottom: "var(--sp-3)" }}>{activeGuide.title} — {steps.items.length} steps</h3>
            <DragReorderList
              items={steps.items}
              onReorder={steps.reorder}
              renderItem={(step, _i, drag) => (
                <StepRow step={step} onUpdate={steps.update} onDelete={steps.remove} drag={drag} />
              )}
            />
            <form onSubmit={addStep} className="space-y-2 mt-3 border-t pt-3">
              <input placeholder="Step title" className="ds-input" value={newStepTitle} onChange={(e) => setNewStepTitle(e.target.value)} />
              <textarea placeholder="Step description" rows={2} className="ds-input" value={newStepDesc} onChange={(e) => setNewStepDesc(e.target.value)} />
              <button type="submit" className="ds-btn ds-btn-primary ds-btn-sm">+ Add Step</button>
              {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-caption)" }}>{error}</p>}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function PrayerRow({ prayer, onUpdate }: { prayer: Prayer; onUpdate: (id: string, fields: Partial<Prayer>) => Promise<Prayer> }) {
  const [editing, setEditing] = useState(false);
  const [fard, setFard] = useState(prayer.rakat_fard);
  const [sunnah, setSunnah] = useState(prayer.rakat_sunnah);
  const [nafl, setNafl] = useState(prayer.rakat_nafl);
  const [witr, setWitr] = useState(prayer.rakat_witr);

  async function save() {
    await onUpdate(prayer.id, { rakat_fard: fard, rakat_sunnah: sunnah, rakat_nafl: nafl, rakat_witr: witr });
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-3 border-b py-2">
      <span className="w-20 font-semibold">{prayer.name}</span>
      {editing ? (
        <>
          <label style={{ fontSize: "var(--fs-caption)" }}>Fard <input type="number" className="ds-input" style={{ width: 56, minHeight: 32, padding: "2px 6px" }} value={fard} onChange={(e) => setFard(parseInt(e.target.value) || 0)} /></label>
          <label style={{ fontSize: "var(--fs-caption)" }}>Sunnah <input type="number" className="ds-input" style={{ width: 56, minHeight: 32, padding: "2px 6px" }} value={sunnah} onChange={(e) => setSunnah(parseInt(e.target.value) || 0)} /></label>
          <label style={{ fontSize: "var(--fs-caption)" }}>Nafl <input type="number" className="ds-input" style={{ width: 56, minHeight: 32, padding: "2px 6px" }} value={nafl} onChange={(e) => setNafl(parseInt(e.target.value) || 0)} /></label>
          <label style={{ fontSize: "var(--fs-caption)" }}>Witr <input type="number" className="ds-input" style={{ width: 56, minHeight: 32, padding: "2px 6px" }} value={witr} onChange={(e) => setWitr(parseInt(e.target.value) || 0)} /></label>
          <button onClick={save} className="ds-btn ds-btn-primary ds-btn-sm">Save</button>
          <button onClick={() => setEditing(false)} style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)" }}>Cancel</button>
        </>
      ) : (
        <>
          <span style={{ flex: 1, color: "var(--text-secondary)", fontSize: "var(--fs-body)" }}>
            {prayer.rakat_fard} Fard, {prayer.rakat_sunnah} Sunnah, {prayer.rakat_nafl} Nafl, {prayer.rakat_witr} Witr
          </span>
          <button onClick={() => setEditing(true)} className="ds-btn ds-btn-secondary ds-btn-sm">Edit</button>
        </>
      )}
    </div>
  );
}

function StepRow({
  step,
  onUpdate,
  onDelete,
  drag,
}: {
  step: Step;
  onUpdate: (id: string, fields: Partial<Step>) => Promise<Step>;
  onDelete: (id: string) => Promise<void>;
  drag: { draggable: boolean; onDragStart: () => void };
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(step.title);
  const [description, setDescription] = useState(step.description);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!title.trim() || !description.trim()) {
      setError("Title and description cannot be empty");
      return;
    }
    try {
      await onUpdate(step.id, { title, description });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <div draggable={drag.draggable} onDragStart={drag.onDragStart} className="border-b py-2 cursor-move">
      <div className="flex items-center gap-2">
        <span style={{ color: "var(--text-tertiary)" }}>⠿</span>
        {editing ? (
          <input className="ds-input" style={{ flex: 1, minHeight: 36, fontWeight: 600 }} value={title} onChange={(e) => setTitle(e.target.value)} />
        ) : (
          <span className="flex-1 font-semibold text-sm">{step.title}</span>
        )}
        {editing ? (
          <>
            <button onClick={save} className="ds-btn ds-btn-primary ds-btn-sm">Save</button>
            <button onClick={() => setEditing(false)} style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)" }}>Cancel</button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)} className="ds-btn ds-btn-secondary ds-btn-sm">Edit</button>
            <ConfirmDeleteButton itemLabel={step.title} onConfirm={() => onDelete(step.id)} />
          </>
        )}
      </div>
      {editing ? (
        <textarea className="ds-input" style={{ marginTop: 4, minHeight: 36, fontSize: "var(--fs-caption)" }} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      ) : (
        <p style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)", marginLeft: "var(--sp-6)" }}>{step.description}</p>
      )}
      {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-caption)", marginLeft: "var(--sp-6)" }}>{error}</p>}
    </div>
  );
}
