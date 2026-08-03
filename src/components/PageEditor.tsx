"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";

type Block =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[]; listKind?: string }
  | { type: "tags"; items: string[] }
  | { type: "offerings"; items: string[] }
  | { type: "developer"; name: string; org: string }
  | { type: "footer_note"; text: string }
  | { type: "copyright"; text: string }
  | { type: "version"; text: string };

type Page = {
  page_key: string;
  hero_title: string | null;
  hero_subtitle: string | null;
  content_blocks: Block[];
};

/**
 * Small, dedicated block editor for site_pages.content_blocks (About Us /
 * Home Hero). This is intentionally NOT the generic Stage-1 resource-CRUD
 * pattern — content_blocks is a JSONB array inside a single row per page,
 * not a table of independent rows, so "add/remove/reorder blocks" means
 * editing array positions client-side and PUTting the whole array back,
 * not row-level POST/PATCH/DELETE calls. Tenant isolation is unaffected:
 * the underlying PUT route is still anon-key/RLS-bound, same as everything
 * else.
 *
 * Supports full add/remove/reorder for "paragraph" and "list" (tags/
 * offerings-style) blocks per the spec. Other block types found in
 * existing seeded data (developer/footer_note/copyright/version) are
 * still rendered with simple field-level editors so a tenant's existing
 * content is never silently dropped on save — just not addable as new
 * blocks from this UI (they're one-off, singleton-style blocks by nature).
 */
export default function PageEditor({ pageKey, title }: { pageKey: "about" | "home_hero"; title: string }) {
  const [page, setPage] = useState<Page | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    fetch(`/api/tenant-admin/pages/${pageKey}`)
      .then((r) => r.json())
      .then((body) => setPage(body.page));
  }, [pageKey]);

  function updateBlock(index: number, block: Block) {
    setPage((prev) => {
      if (!prev) return prev;
      const blocks = [...prev.content_blocks];
      blocks[index] = block;
      return { ...prev, content_blocks: blocks };
    });
  }

  function removeBlock(index: number) {
    setPage((prev) => {
      if (!prev) return prev;
      return { ...prev, content_blocks: prev.content_blocks.filter((_, i) => i !== index) };
    });
  }

  function moveBlock(index: number, direction: -1 | 1) {
    setPage((prev) => {
      if (!prev) return prev;
      const blocks = [...prev.content_blocks];
      const target = index + direction;
      if (target < 0 || target >= blocks.length) return prev;
      [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
      return { ...prev, content_blocks: blocks };
    });
  }

  function addParagraph() {
    setPage((prev) => (prev ? { ...prev, content_blocks: [...prev.content_blocks, { type: "paragraph", text: "" }] } : prev));
  }

  function addList() {
    setPage((prev) => (prev ? { ...prev, content_blocks: [...prev.content_blocks, { type: "list", items: [""] } as Block] } : prev));
  }

  async function handleSave() {
    if (!page) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/tenant-admin/pages/${pageKey}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hero_title: page.hero_title,
        hero_subtitle: page.hero_subtitle,
        content_blocks: page.content_blocks,
      }),
    });
    const body = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(body.error);
      return;
    }
    setPage(body.page);
    setSavedAt(new Date());
  }

  if (!page)
    return (
      <div style={{ padding: "var(--sp-8)", color: "var(--text-tertiary)" }}>Loading...</div>
    );

  return (
    <div className="max-w-2xl" style={{ padding: "var(--sp-8)" }}>
      <h1 className="ds-h1" style={{ marginBottom: "var(--sp-6)" }}>
        {title}
      </h1>

      <div className="ds-card space-y-3" style={{ marginBottom: "var(--sp-6)" }}>
        <div>
          <label className="ds-label">Hero Title</label>
          <input
            className="ds-input"
            style={{ marginTop: 4 }}
            value={page.hero_title ?? ""}
            onChange={(e) => setPage({ ...page, hero_title: e.target.value })}
          />
        </div>
        <div>
          <label className="ds-label">Hero Subtitle</label>
          <input
            className="ds-input"
            style={{ marginTop: 4 }}
            value={page.hero_subtitle ?? ""}
            onChange={(e) => setPage({ ...page, hero_subtitle: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-3" style={{ marginBottom: "var(--sp-4)" }}>
        {page.content_blocks.map((block, i) => (
          <BlockEditor
            key={i}
            block={block}
            onChange={(b) => updateBlock(i, b)}
            onRemove={() => removeBlock(i)}
            onMoveUp={() => moveBlock(i, -1)}
            onMoveDown={() => moveBlock(i, 1)}
            isFirst={i === 0}
            isLast={i === page.content_blocks.length - 1}
          />
        ))}
      </div>

      <div className="flex gap-2" style={{ marginBottom: "var(--sp-6)" }}>
        <Button variant="secondary" size="sm" onClick={addParagraph}>
          + Add Paragraph
        </Button>
        <Button variant="secondary" size="sm" onClick={addList}>
          + Add List
        </Button>
      </div>

      {error && (
        <p style={{ color: "var(--danger)", fontSize: "var(--fs-body)", marginBottom: "var(--sp-3)" }}>{error}</p>
      )}

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Page"}
      </Button>
      {savedAt && (
        <p style={{ color: "var(--success)", fontSize: "var(--fs-caption)", marginTop: "var(--sp-2)" }}>
          Saved at {savedAt.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}

function BlockEditor({
  block,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  block: Block;
  onChange: (b: Block) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const controls = (
    <div className="flex gap-1 flex-shrink-0">
      <button onClick={onMoveUp} disabled={isFirst} className="ds-btn ds-btn-ghost ds-btn-sm" style={{ padding: "0 8px" }}>
        ↑
      </button>
      <button onClick={onMoveDown} disabled={isLast} className="ds-btn ds-btn-ghost ds-btn-sm" style={{ padding: "0 8px" }}>
        ↓
      </button>
      <button onClick={onRemove} className="ds-badge ds-badge-danger" style={{ cursor: "pointer", border: "none" }}>
        Remove
      </button>
    </div>
  );

  if (block.type === "paragraph") {
    return (
      <div className="ds-card flex gap-2" style={{ padding: "var(--sp-3)" }}>
        <textarea
          className="ds-textarea"
          style={{ flex: 1, minHeight: 56 }}
          rows={2}
          placeholder="Paragraph text..."
          value={block.text}
          onChange={(e) => onChange({ type: "paragraph", text: e.target.value })}
        />
        {controls}
      </div>
    );
  }

  if (block.type === "list" || block.type === "tags" || block.type === "offerings") {
    return (
      <div className="ds-card" style={{ padding: "var(--sp-3)" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: "var(--sp-2)" }}>
          <span className="ds-micro">{block.type} list</span>
          {controls}
        </div>
        <div className="space-y-1.5">
          {block.items.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                className="ds-input"
                style={{ flex: 1, minHeight: 36 }}
                value={item}
                onChange={(e) => {
                  const items = [...block.items];
                  items[idx] = e.target.value;
                  onChange({ ...block, items });
                }}
              />
              <button
                onClick={() => onChange({ ...block, items: block.items.filter((_, i2) => i2 !== idx) })}
                style={{ color: "var(--danger)", fontSize: "var(--fs-caption)", padding: "0 8px" }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={() => onChange({ ...block, items: [...block.items, ""] })}
            className="tenant-primary-text font-semibold"
            style={{ fontSize: "var(--fs-caption)" }}
          >
            + Add item
          </button>
        </div>
      </div>
    );
  }

  if (block.type === "developer") {
    return (
      <div className="ds-card flex gap-2 items-center" style={{ padding: "var(--sp-3)" }}>
        <input className="ds-input" style={{ flex: 1, minHeight: 36 }} value={block.name} onChange={(e) => onChange({ ...block, name: e.target.value })} placeholder="Developer name" />
        <input className="ds-input" style={{ flex: 1, minHeight: 36 }} value={block.org} onChange={(e) => onChange({ ...block, org: e.target.value })} placeholder="Organization" />
        {controls}
      </div>
    );
  }

  // footer_note / copyright / version — simple single-text-field blocks
  return (
    <div className="ds-card flex gap-2 items-center" style={{ padding: "var(--sp-3)" }}>
      <span className="ds-micro flex-shrink-0" style={{ width: 96 }}>
        {block.type}
      </span>
      <input className="ds-input" style={{ flex: 1, minHeight: 36 }} value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value } as Block)} />
      {controls}
    </div>
  );
}
