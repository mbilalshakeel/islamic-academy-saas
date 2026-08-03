import { getPublicTenantContext } from "@/lib/public-tenant";
import { EmptyState, Badge } from "@/components/ui";

function fileHref(fileProvider: string, fileReference: string | null): string | null {
  if (!fileReference) return null;
  if (fileProvider === "google_drive") {
    return `https://drive.google.com/file/d/${fileReference}/preview`;
  }
  if (fileProvider === "url") {
    return fileReference;
  }
  return null;
}

export default async function BooksPage({ params }: { params: { slug: string } }) {
  const { supabase } = await getPublicTenantContext(params.slug);

  const { data: books } = await supabase
    .from("books")
    .select("id, title, author, description, category, language_tags, cover_icon, cover_gradient, file_provider, file_reference")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
      <div className="flex items-center justify-between" style={{ marginBottom: "var(--sp-6)" }}>
        <h1 className="ds-h1">📚 Islamic Books</h1>
        <span className="tenant-primary-text font-semibold" style={{ fontSize: "var(--fs-caption)" }}>
          {books?.length ?? 0} Books
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(books ?? []).map((book) => {
          const href = fileHref(book.file_provider, book.file_reference);
          const content = (
            <div className="ds-card ds-card-interactive flex gap-4 items-start h-full">
              <div
                className="rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ width: 56, height: 56, fontSize: 24, color: "#fff", background: book.cover_gradient || `linear-gradient(135deg, var(--tenant-primary), var(--tenant-secondary))` }}
              >
                📖
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold truncate" style={{ fontSize: "var(--fs-body)" }}>
                  {book.title}
                </h3>
                <p className="truncate" style={{ fontSize: "var(--fs-caption)", color: "var(--text-tertiary)" }}>
                  {book.author}
                </p>
                {book.description && (
                  <p className="line-clamp-2" style={{ fontSize: "var(--fs-caption)", color: "var(--text-secondary)", marginTop: 4 }}>
                    {book.description}
                  </p>
                )}
                <div className="flex gap-1.5 flex-wrap" style={{ marginTop: "var(--sp-2)" }}>
                  <Badge variant="neutral">{book.category}</Badge>
                  {(book.language_tags ?? []).map((tag: string) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
                {!href && (
                  <p className="font-semibold" style={{ fontSize: "11px", color: "var(--warning)", marginTop: "var(--sp-2)" }}>
                    Coming soon — no file linked yet
                  </p>
                )}
              </div>
            </div>
          );

          return href ? (
            <a key={book.id} href={href} target="_blank" rel="noreferrer">
              {content}
            </a>
          ) : (
            <div key={book.id} style={{ opacity: 0.85 }}>
              {content}
            </div>
          );
        })}

        {(!books || books.length === 0) && (
          <div className="col-span-full">
            <EmptyState icon="📚" title="No books have been added yet" />
          </div>
        )}
      </div>
    </div>
  );
}
