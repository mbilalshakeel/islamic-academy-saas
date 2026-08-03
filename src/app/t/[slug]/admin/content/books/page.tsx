"use client";

import { useState } from "react";
import { useResource } from "@/components/useResource";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { DragReorderList } from "@/components/DragReorderList";

type Book = {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  category: string;
  language_tags: string[];
  cover_icon: string | null;
  cover_gradient: string | null;
  file_provider: string;
  file_reference: string | null;
  sort_order: number;
  is_active: boolean;
};

const CATEGORIES = ["hadith", "seerah", "tafsir", "fiqh", "other"];

export default function BooksContentPage() {
  const books = useResource<Book>("books");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", author: "", description: "", category: "other",
    language_tags: "", cover_icon: "auto_stories", cover_gradient: "",
    file_provider: "none", file_reference: "",
  });
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await books.create({
        title: form.title,
        author: form.author || null,
        description: form.description || null,
        category: form.category,
        language_tags: form.language_tags ? form.language_tags.split(",").map((t) => t.trim()) : [],
        cover_icon: form.cover_icon || null,
        cover_gradient: form.cover_gradient || null,
        file_provider: form.file_provider,
        file_reference: form.file_reference || null,
      } as Partial<Book>);
      setForm({ title: "", author: "", description: "", category: "other", language_tags: "", cover_icon: "auto_stories", cover_gradient: "", file_provider: "none", file_reference: "" });
      setFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    }
  }

  return (
    <div className="max-w-3xl" style={{ padding: "var(--sp-8)" }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="ds-h1">Islamic Books</h1>
        <button onClick={() => setFormOpen(true)} className="ds-btn ds-btn-primary ds-btn-sm">
          + Add Book
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleAdd} className="ds-card space-y-3" style={{ marginBottom: "var(--sp-6)" }}>
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="Title" className="ds-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input placeholder="Author" className="ds-input" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
          </div>
          <textarea placeholder="Description" rows={2} className="ds-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <select className="ds-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input placeholder="Language tags (comma-separated, e.g. Arabic, Urdu)" className="ds-input" value={form.language_tags} onChange={(e) => setForm({ ...form, language_tags: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select className="ds-input" value={form.file_provider} onChange={(e) => setForm({ ...form, file_provider: e.target.value })}>
              <option value="none">None</option>
              <option value="google_drive">Google Drive</option>
              <option value="url">URL</option>
            </select>
            <input placeholder="File reference" className="ds-input" value={form.file_reference} onChange={(e) => setForm({ ...form, file_reference: e.target.value })} />
          </div>
          {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-body)" }}>{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="ds-btn ds-btn-primary ds-btn-sm">Save</button>
            <button type="button" onClick={() => setFormOpen(false)} className="ds-btn ds-btn-ghost ds-btn-sm">Cancel</button>
          </div>
        </form>
      )}

      <DragReorderList
        items={books.items}
        onReorder={books.reorder}
        renderItem={(book, _i, drag) => (
          <BookRow book={book} onUpdate={books.update} onDelete={books.remove} drag={drag} />
        )}
      />
    </div>
  );
}

function BookRow({
  book,
  onUpdate,
  onDelete,
  drag,
}: {
  book: Book;
  onUpdate: (id: string, fields: Partial<Book>) => Promise<Book>;
  onDelete: (id: string) => Promise<void>;
  drag: { draggable: boolean; onDragStart: () => void };
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author ?? "");
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!title.trim()) {
      setError("Title cannot be empty");
      return;
    }
    try {
      await onUpdate(book.id, { title, author: author || null });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function toggleActive() {
    await onUpdate(book.id, { is_active: !book.is_active });
  }

  return (
    <div draggable={drag.draggable} onDragStart={drag.onDragStart} className="ds-card flex items-center gap-3 cursor-move" style={{ padding: "var(--sp-3)", marginBottom: "var(--sp-2)" }}>
      <span style={{ color: "var(--text-tertiary)" }}>⠿</span>
      {editing ? (
        <div className="flex-1 flex gap-2">
          <input className="ds-input" style={{ flex: 1, minHeight: 36 }} value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="ds-input" style={{ flex: 1, minHeight: 36 }} value={author} onChange={(e) => setAuthor(e.target.value)} />
        </div>
      ) : (
        <div className="flex-1">
          <div className="font-semibold">{book.title}</div>
          <div style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)" }}>
            {book.author} · {book.category} · {book.language_tags.join(", ")}
          </div>
        </div>
      )}
      <button
        onClick={toggleActive}
        className={`text-xs px-2 py-1 rounded font-semibold ${book.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}
      >
        {book.is_active ? "Active" : "Inactive"}
      </button>
      {editing ? (
        <>
          <button onClick={save} className="ds-btn ds-btn-primary ds-btn-sm">Save</button>
          <button onClick={() => setEditing(false)} style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)" }}>Cancel</button>
        </>
      ) : (
        <>
          <button onClick={() => setEditing(true)} className="ds-btn ds-btn-secondary ds-btn-sm">Edit</button>
          <ConfirmDeleteButton itemLabel={book.title} onConfirm={() => onDelete(book.id)} />
        </>
      )}
      {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-caption)" }}>{error}</p>}
    </div>
  );
}
