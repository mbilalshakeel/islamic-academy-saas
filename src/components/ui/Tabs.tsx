"use client";

export interface TabItem {
  key: string;
  label: string;
}

/** Consistent horizontal tab bar used across content-tabbed screens (Pillars, Prayers) and admin CRUD screens. */
export function Tabs({ items, activeKey, onChange }: { items: TabItem[]; activeKey: string; onChange: (key: string) => void }) {
  return (
    <div className="ds-tabs" role="tablist">
      {items.map((item) => (
        <button
          key={item.key}
          role="tab"
          aria-selected={item.key === activeKey}
          onClick={() => onChange(item.key)}
          className={`ds-tab ${item.key === activeKey ? "ds-tab-active" : ""}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
