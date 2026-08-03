"use client";

import { useResource } from "@/components/useResource";
import { DragReorderList } from "@/components/DragReorderList";

type HomeMenuItem = {
  id: string;
  module_key: string;
  section: "reading" | "learning" | "nav";
  custom_label: string | null;
  is_enabled: boolean;
  sort_order: number;
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
  sehri_iftar: "Sehri & Iftar Timings",
  dhikr_counter: "Dhikr Counter",
  hijri_calendar: "Hijri Calendar",
  zakat_calculator: "Zakat Calculator",
  nav_home: "Home",
  nav_qa: "Q&A",
  nav_about: "About",
  nav_contact: "Contact",
};

export default function HomeMenuContentPage() {
  const menu = useResource<HomeMenuItem>("home_menu_items");

  const nav = menu.items.filter((m) => m.section === "nav").sort((a, b) => a.sort_order - b.sort_order);
  const reading = menu.items.filter((m) => m.section === "reading").sort((a, b) => a.sort_order - b.sort_order);
  const learning = menu.items.filter((m) => m.section === "learning").sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="max-w-2xl" style={{ padding: "var(--sp-8)" }}>
      <h1 className="ds-h1" style={{ marginBottom: "var(--sp-2)" }}>Home Menu Configuration</h1>
      <p className="ds-caption" style={{ marginBottom: "var(--sp-6)" }}>
        Toggle which cards appear on your home screen, rename their labels, and drag to reorder — no
        code changes needed. New Stage 2 tools (Sehri/Iftar, Dhikr Counter, Hijri Calendar, Zakat
        Calculator) appear here alongside the original modules. The navigation bar (Home/Q&amp;A/About/
        Contact) is configured the same way, below.
      </p>

      <section className="mb-8">
        <h2 className="ds-h3" style={{ marginBottom: "var(--sp-3)" }}>🧭 Navigation Bar</h2>
        <DragReorderList
          items={nav}
          onReorder={menu.reorder}
          renderItem={(item, _i, drag) => (
            <MenuItemRow item={item} onUpdate={menu.update} drag={drag} />
          )}
        />
      </section>

      <section className="mb-8">
        <h2 className="ds-h3" style={{ marginBottom: "var(--sp-3)" }}>📖 Reading Section</h2>
        <DragReorderList
          items={reading}
          onReorder={menu.reorder}
          renderItem={(item, _i, drag) => (
            <MenuItemRow item={item} onUpdate={menu.update} drag={drag} />
          )}
        />
      </section>

      <section>
        <h2 className="ds-h3" style={{ marginBottom: "var(--sp-3)" }}>🎓 Learning Section</h2>
        <DragReorderList
          items={learning}
          onReorder={menu.reorder}
          renderItem={(item, _i, drag) => (
            <MenuItemRow item={item} onUpdate={menu.update} drag={drag} />
          )}
        />
      </section>
    </div>
  );
}


function MenuItemRow({
  item,
  onUpdate,
  drag,
}: {
  item: HomeMenuItem;
  onUpdate: (id: string, fields: Partial<HomeMenuItem>) => Promise<HomeMenuItem>;
  drag: { draggable: boolean; onDragStart: () => void };
}) {
  const displayLabel = item.custom_label || MODULE_DEFAULT_LABELS[item.module_key] || item.module_key;

  async function toggleEnabled() {
    await onUpdate(item.id, { is_enabled: !item.is_enabled });
  }

  async function renameLabel(newLabel: string) {
    await onUpdate(item.id, { custom_label: newLabel });
  }

  return (
    <div
      draggable={drag.draggable}
      onDragStart={drag.onDragStart}
      className={`bg-white border rounded-lg p-3 flex items-center gap-3 cursor-move mb-2 ${!item.is_enabled ? "opacity-50" : ""}`}
    >
      <span style={{ color: "var(--text-tertiary)" }}>⠿</span>
      <input
        className="flex-1 border rounded px-2 py-1 text-sm font-medium"
        value={displayLabel}
        onChange={(e) => renameLabel(e.target.value)}
      />
      <span style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-caption)", fontFamily: "ui-monospace, monospace" }}>{item.module_key}</span>
      <button
        onClick={toggleEnabled}
        className={`text-xs px-3 py-1 rounded-full font-semibold ${item.is_enabled ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"}`}
      >
        {item.is_enabled ? "Enabled" : "Disabled"}
      </button>
    </div>
  );
}
