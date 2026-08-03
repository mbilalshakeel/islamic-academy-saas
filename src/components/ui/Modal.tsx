"use client";

import { useEffect } from "react";

/**
 * Shared modal/bottom-sheet shell — bottom sheet on mobile, centered
 * modal from 640px up (matches the design-system proposal's
 * responsiveness rules). Closes on Escape and backdrop click.
 */
export function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="ds-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ds-modal" role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}
