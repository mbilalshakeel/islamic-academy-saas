import Link from "next/link";

export default function TenantAdminDashboard({ params }: { params: { slug: string } }) {
  const sections = [
    { href: `content/quran`, label: "📖 Quran Editions & Paras", desc: "Manage 15/16-line editions and their 30 paras" },
    { href: `content/qaida`, label: "🔤 Qaida Courses", desc: "Noorani/Qurani Qaida entries" },
    { href: `content/names`, label: "✨ Divine Names", desc: "Allah's 99 Names & Prophet's Names" },
    { href: `content/duas`, label: "🤲 Dua Categories & Duas", desc: "Masnoon Duas, Kalimas, Ayat-ul-Kursi, etc." },
    { href: `content/hadith`, label: "📜 Hadith Collections", desc: "Manage hadith entries" },
    { href: `content/pillars`, label: "🕌 Pillars of Islam", desc: "5 pillars & their detail lists" },
    { href: `content/prayers`, label: "🙏 Prayers & Ritual Guides", desc: "Rakat counts, Wudu/Namaz step guides" },
    { href: `content/dhikr`, label: "📿 Dhikr Items", desc: "Tasbih counter phrases" },
    { href: `content/calendar`, label: "🗓️ Calendar Events", desc: "Hijri calendar dates" },
    { href: `content/books`, label: "📚 Islamic Books", desc: "Book catalogue" },
    { href: `content/qa`, label: "❓ Q&A", desc: "Common questions & answers" },
    { href: `content/pages/about`, label: "ℹ️ About Us Page", desc: "About page content blocks" },
    { href: `content/pages/home-hero`, label: "🏠 Home Hero", desc: "Home screen hero section" },
    { href: `content/contact`, label: "📞 Contact Channels", desc: "Phone, email, social, hours" },
    { href: `content/home-menu`, label: "🧩 Home Menu Config", desc: "Toggle & reorder dashboard cards" },
    { href: `settings/theme`, label: "🎨 Theme Customizer", desc: "Colors, fonts, logo, branding" },
    { href: `settings/tools`, label: "📍 Location & Zakat Settings", desc: "City, currency, gold/silver prices" },
  ];

  return (
    <div style={{ padding: "var(--sp-8)" }}>
      <h1 className="ds-h1" style={{ marginBottom: 4 }}>
        Institute Admin Dashboard
      </h1>
      <p className="ds-caption" style={{ marginBottom: "var(--sp-6)" }}>
        {params.slug}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => (
          <Link key={s.href} href={`/t/${params.slug}/admin/${s.href}`} className="ds-card ds-card-interactive">
            <div className="font-semibold" style={{ fontSize: "var(--fs-body)" }}>
              {s.label}
            </div>
            <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-tertiary)", marginTop: 4 }}>{s.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
