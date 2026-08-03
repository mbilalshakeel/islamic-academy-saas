import { getPublicTenantContext } from "@/lib/public-tenant";
import Link from "next/link";
import { EmptyState } from "@/components/ui";

const MODULE_ICONS: Record<string, string> = {
  quran_16line: "📖",
  quran_15line: "📗",
  qaida: "🔤",
  daily_duas: "🤲",
  allah_names: "✨",
  prophet_names: "🌟",
  hadith: "📜",
  pillars: "🕌",
  islamic_knowledge: "🧠",
  prayers: "🙏",
  books: "📚",
  sehri_iftar: "🌙",
  dhikr_counter: "📿",
  hijri_calendar: "🗓️",
  zakat_calculator: "💰",
};

const MODULE_DEFAULT_LABELS: Record<string, string> = {
  quran_16line: "16 Line Quran",
  quran_15line: "15 Line Quran",
  qaida: "Read Qaida",
  daily_duas: "Daily Duas",
  allah_names: "Allah Names",
  prophet_names: "Prophet Names",
  hadith: "40 Hadiths",
  pillars: "Pillars of Islam",
  islamic_knowledge: "Islamic Knowledge",
  prayers: "Prayers",
  books: "Islamic Books",
  sehri_iftar: "Sehri & Iftar",
  dhikr_counter: "Dhikr Counter",
  hijri_calendar: "Hijri Calendar",
  zakat_calculator: "Zakat Calculator",
};

// Maps a module_key to the actual route it should link to. Modules that
// aren't built yet still render as cards if enabled — matching the
// original app's behavior of having some dashboard cards be "coming
// soon"/not-yet-wired.
function hrefFor(slug: string, moduleKey: string): string | null {
  const map: Record<string, string> = {
    quran_16line: `/t/${slug}/quran/16-line`,
    quran_15line: `/t/${slug}/quran/15-line`,
    qaida: `/t/${slug}/qaida`,
    daily_duas: `/t/${slug}/duas`,
    allah_names: `/t/${slug}/names/allah`,
    prophet_names: `/t/${slug}/names/prophet`,
    hadith: `/t/${slug}/hadith`,
    pillars: `/t/${slug}/pillars`,
    prayers: `/t/${slug}/prayers`,
    sehri_iftar: `/t/${slug}/tools/sehri-iftar`,
    dhikr_counter: `/t/${slug}/tools/dhikr`,
    hijri_calendar: `/t/${slug}/tools/calendar`,
    zakat_calculator: `/t/${slug}/tools/zakat`,
  };
  return map[moduleKey] ?? null;
}

export default async function TenantHomePage({ params }: { params: { slug: string } }) {
  const { tenant, supabase, branding } = await getPublicTenantContext(params.slug);

  const [{ data: menuItems }, { data: books }, { data: homeHero }] = await Promise.all([
    supabase
      .from("home_menu_items")
      .select("module_key, section, custom_label, is_enabled, sort_order")
      .in("section", ["reading", "learning"])
      .order("sort_order", { ascending: true }),
    supabase
      .from("books")
      .select("id, title, author, category, cover_icon, cover_gradient")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("site_pages")
      .select("hero_title, hero_subtitle")
      .eq("page_key", "home_hero")
      .maybeSingle(),
  ]);

  const reading = (menuItems ?? []).filter((m) => m.section === "reading" && m.is_enabled);
  const learning = (menuItems ?? []).filter((m) => m.section === "learning" && m.is_enabled);

  // Home hero text comes from site_pages(page_key='home_hero') — the actual
  // admin-editable Home Hero screen — NOT tenant_branding.tagline (which is
  // a different field, edited from the Theme Customizer). Falls back to the
  // branding tagline only if the tenant has never touched Home Hero at all,
  // then to a generic default as the last resort.
  const heroSubtitle = homeHero?.hero_subtitle ?? branding?.tagline ?? "Learn Islam — Anywhere, Anytime";

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-9">
      {/* Bismillah hero — the one place the signature geometric motif
          appears on the Home screen, at low opacity, never behind the
          Arabic text itself (it sits in the corners/edges of the banner). */}
      <section
        className="rounded-2xl p-7 md:p-10 text-center relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, var(--tenant-primary), var(--tenant-secondary))`,
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div className="ds-motif-bg" />
        <p className="tenant-arabic tenant-on-primary relative" style={{ fontSize: "var(--fs-ar-display)", marginBottom: 10 }} dir="rtl">
          بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
        </p>
        <p className="tenant-on-primary relative ds-body-lg" style={{ opacity: 0.92 }}>
          {heroSubtitle}
        </p>
      </section>

      {/* Reading Section */}
      {reading.length > 0 && (
        <section>
          <h2 className="ds-h2 mb-4">📖 Reading Section</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
            {reading.map((m) => (
              <ModuleCard key={m.module_key} slug={tenant.slug} moduleKey={m.module_key} label={m.custom_label} />
            ))}
          </div>
        </section>
      )}

      {/* Learning Section */}
      {learning.length > 0 && (
        <section>
          <h2 className="ds-h2 mb-4">🎓 Learning Section</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
            {learning.map((m) => (
              <ModuleCard key={m.module_key} slug={tenant.slug} moduleKey={m.module_key} label={m.custom_label} />
            ))}
          </div>
        </section>
      )}

      {/* Islamic Books — horizontal scroll, links through to the full Books page */}
      {books && books.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="ds-h2">📚 Islamic Books</h2>
            <Link href={`/t/${tenant.slug}/books`} className="tenant-primary-text font-semibold" style={{ fontSize: "var(--fs-caption)" }}>
              {books.length} Books →
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {books.map((book) => (
              <Link key={book.id} href={`/t/${tenant.slug}/books`} className="ds-card ds-card-interactive flex-shrink-0 w-40">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-lg mb-3"
                  style={{ background: book.cover_gradient || "linear-gradient(135deg,var(--tenant-primary),var(--tenant-secondary))", color: "#fff" }}
                >
                  📖
                </div>
                <div className="font-semibold leading-tight" style={{ fontSize: "var(--fs-body)" }}>
                  {book.title}
                </div>
                <div className="mt-1" style={{ fontSize: "var(--fs-caption)", color: "var(--text-tertiary)" }}>
                  {book.author}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Graceful empty state if a tenant has disabled almost everything */}
      {reading.length === 0 && learning.length === 0 && (!books || books.length === 0) && (
        <EmptyState
          icon="🕌"
          title="No modules are enabled yet"
          description="Enable some from Home Menu Config in the admin panel."
        />
      )}
    </div>
  );
}

function ModuleCard({ slug, moduleKey, label }: { slug: string; moduleKey: string; label: string | null }) {
  const href = hrefFor(slug, moduleKey);
  const displayLabel = label || MODULE_DEFAULT_LABELS[moduleKey] || moduleKey;
  const icon = MODULE_ICONS[moduleKey] || "▫️";

  const content = (
    <div className="ds-card ds-card-interactive flex flex-col items-center gap-2.5 text-center h-full">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
        style={{ background: `linear-gradient(135deg, var(--tenant-primary), var(--tenant-secondary))`, color: "#fff" }}
      >
        {icon}
      </div>
      <span className="font-semibold" style={{ fontSize: "var(--fs-body)" }}>
        {displayLabel}
      </span>
    </div>
  );

  if (!href) {
    // Module enabled but its screen isn't built yet — render as a visibly
    // disabled/"coming soon" card rather than a broken link, matching the
    // original app's own pattern for not-yet-wired cards.
    return (
      <div className="relative" style={{ opacity: 0.55 }}>
        {content}
        <span className="ds-badge ds-badge-warning" style={{ position: "absolute", top: 6, right: 6, padding: "2px 8px" }}>
          Soon
        </span>
      </div>
    );
  }

  return (
    <Link href={href} prefetch>
      {content}
    </Link>
  );
}
