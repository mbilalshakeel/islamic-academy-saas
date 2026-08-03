"use client";

import { useState } from "react";

export function ConfirmDeleteButton({
  label = "Delete",
  itemLabel,
  onConfirm,
}: {
  label?: string;
  itemLabel: string;
  onConfirm: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="ds-badge ds-badge-danger" style={{ cursor: "pointer", border: "none" }}>
        {label}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2" style={{ fontSize: "var(--fs-caption)" }}>
      <span style={{ color: "var(--danger)" }}>Delete &quot;{itemLabel}&quot;?</span>
      <button disabled={busy} onClick={async () => { setBusy(true); await onConfirm(); setBusy(false); setConfirming(false); }} className="ds-btn ds-btn-danger ds-btn-sm">
        {busy ? "..." : "Yes"}
      </button>
      <button onClick={() => setConfirming(false)} className="ds-btn ds-btn-secondary ds-btn-sm">
        No
      </button>
    </span>
  );
}
