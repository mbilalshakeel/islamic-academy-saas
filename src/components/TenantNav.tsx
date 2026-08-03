import Link from "next/link";

type NavItem = {
  module_key: string;
  custom_label: string | null;
  is_enabled: boolean;
  sort_order: number;
};

const NAV_DEFAULT_LABELS: Record<string, string> = {
  nav_home: "Home",
  nav_qa: "Q&A",
  nav_about: "About",
  nav_contact: "Contact",
};

const NAV_HREF_SUFFIX: Record<string, string> = {
  nav_home: "",
  nav_qa: "/qa",
  nav_about: "/about",
  nav_contact: "/contact",
};

/**
 * Shared top (desktop) + bottom (mobile) navigation, built from the
 * tenant's own home_menu_items rows for section='nav' — respecting
 * whatever custom labels/order/enable-state that tenant's admin has
 * configured via Home Menu Config, exactly like the Reading/Learning
 * grids on the home screen. A tenant that disables "Contact" from nav,
 * for instance, simply won't see it here — no code change needed.
 */
export function TenantNav({ slug, navItems }: { slug: string; navItems: NavItem[] }) {
  const items = navItems
    .filter((n) => n.is_enabled)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((n) => ({
      key: n.module_key,
      label: n.custom_label || NAV_DEFAULT_LABELS[n.module_key] || n.module_key,
      href: `/t/${slug}${NAV_HREF_SUFFIX[n.module_key] ?? ""}`,
    }));

  return (
    <>
      {/* Desktop top nav */}
      <nav className="hidden md:flex items-center gap-1 px-6 py-2" style={{ background: "rgba(0,0,0,0.08)" }}>
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="tenant-on-primary font-medium text-sm px-4 py-2 rounded-full transition-colors"
            style={{ opacity: 0.92 }}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16"
        style={{ background: "var(--surface-1)", borderTop: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-md)" }}
      >
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="flex flex-col items-center justify-center font-semibold"
            style={{ fontSize: "var(--fs-micro)", color: "var(--text-secondary)", minWidth: 44, minHeight: 44 }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
