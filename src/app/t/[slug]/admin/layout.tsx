import Link from "next/link";

export default function TenantAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const base = `/t/${params.slug}/admin`;

  const groups: Array<{ title: string; items: Array<{ href: string; label: string }> }> = [
    {
      title: "",
      items: [{ href: base, label: "Dashboard" }],
    },
    {
      title: "Settings",
      items: [
        { href: `${base}/settings/theme`, label: "Theme" },
        { href: `${base}/settings/tools`, label: "Location & Zakat" },
      ],
    },
    {
      title: "Religious Content",
      items: [
        { href: `${base}/content/quran`, label: "Quran" },
        { href: `${base}/content/qaida`, label: "Qaida" },
        { href: `${base}/content/names`, label: "Divine Names" },
        { href: `${base}/content/duas`, label: "Duas" },
        { href: `${base}/content/hadith`, label: "Hadith" },
        { href: `${base}/content/pillars`, label: "Pillars" },
        { href: `${base}/content/prayers`, label: "Prayers" },
      ],
    },
    {
      title: "Islamic Tools",
      items: [
        { href: `${base}/content/dhikr`, label: "Dhikr Items" },
        { href: `${base}/content/calendar`, label: "Calendar Events" },
      ],
    },
    {
      title: "Site Content",
      items: [
        { href: `${base}/content/books`, label: "Books" },
        { href: `${base}/content/qa`, label: "Q&A" },
        { href: `${base}/content/pages/about`, label: "About Us Page" },
        { href: `${base}/content/pages/home-hero`, label: "Home Hero" },
        { href: `${base}/content/contact`, label: "Contact Channels" },
        { href: `${base}/content/home-menu`, label: "Home Menu Config" },
      ],
    },
  ];

  // NOTE: The admin panel is intentionally NOT theme-aware — it always
  // renders in a fixed, neutral light palette regardless of the tenant's
  // own public-app branding/dark-mode choice. This keeps the operator
  // experience predictable and consistent across every institute, and
  // matches the Super Admin Panel's own look (both are internal tools,
  // not part of the tenant's branded product surface).
  return (
    <div className="min-h-screen flex" style={{ background: "var(--surface-0)" }}>
      <aside
        className="flex-shrink-0 overflow-y-auto"
        style={{ width: 248, background: "#10151C", color: "#fff", padding: "var(--sp-4)" }}
      >
        <div className="font-bold" style={{ fontSize: "var(--fs-h3)", padding: "0 var(--sp-2)", marginBottom: "var(--sp-4)" }}>
          ICI Admin
        </div>
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.title || "root"}>
              {group.title && (
                <div className="ds-micro" style={{ padding: "0 var(--sp-3)", marginBottom: 4, color: "#8A93A0" }}>
                  {group.title}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="ds-admin-sidebar-link block rounded transition-colors"
                    style={{ padding: "8px 12px", fontSize: "var(--fs-body)", color: "#D0D5DC", minHeight: 36 }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
