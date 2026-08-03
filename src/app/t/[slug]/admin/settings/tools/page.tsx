"use client";

import { useEffect, useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";

type Settings = {
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  calculation_method: number;
  currency: string;
  gold_price_per_gram: number | null;
  silver_price_per_gram: number | null;
  zakat_nisab_override: number | null;
};

const CALC_METHODS = [
  { id: 2, label: "ISNA (North America)" },
  { id: 3, label: "Muslim World League" },
  { id: 4, label: "Umm al-Qura (Saudi Arabia)" },
  { id: 5, label: "Egyptian General Authority" },
];

export default function ToolsSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    fetch("/api/tenant-admin/settings")
      .then((r) => r.json())
      .then((body) => {
        setSettings(body.settings);
        setLoading(false);
      });
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/tenant-admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const body = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(body.error);
      return;
    }
    setSettings(body.settings);
    setSavedAt(new Date());
  }

  if (loading || !settings)
    return <div style={{ padding: "var(--sp-8)", color: "var(--text-tertiary)" }}>Loading...</div>;

  return (
    <div className="max-w-xl" style={{ padding: "var(--sp-8)" }}>
      <h1 className="ds-h1" style={{ marginBottom: "var(--sp-6)" }}>
        Location &amp; Zakat Settings
      </h1>

      <section className="ds-card space-y-3" style={{ marginBottom: "var(--sp-6)" }}>
        <h2 className="ds-h3">Location (for Sehri/Iftar timings)</h2>
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="City (e.g. Dammam)" value={settings.city ?? ""} onChange={(e) => update("city", e.target.value)} />
          <Input placeholder="Country (e.g. Saudi Arabia)" value={settings.country ?? ""} onChange={(e) => update("country", e.target.value)} />
        </div>
        <Field label="Prayer Time Calculation Method">
          <Select value={settings.calculation_method} onChange={(e) => update("calculation_method", parseInt(e.target.value, 10))}>
            {CALC_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </Select>
        </Field>
      </section>

      <section className="ds-card space-y-3" style={{ marginBottom: "var(--sp-6)" }}>
        <h2 className="ds-h3">Zakat Calculator Inputs</h2>
        <p className="ds-caption">
          These are estimates you should update periodically — the app does not fetch live gold/silver prices automatically.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Currency">
            <Input value={settings.currency} onChange={(e) => update("currency", e.target.value)} />
          </Field>
          <Field label="Gold price / gram">
            <Input
              type="number"
              step="0.01"
              value={settings.gold_price_per_gram ?? ""}
              onChange={(e) => update("gold_price_per_gram", e.target.value ? parseFloat(e.target.value) : null)}
            />
          </Field>
          <Field label="Silver price / gram">
            <Input
              type="number"
              step="0.01"
              value={settings.silver_price_per_gram ?? ""}
              onChange={(e) => update("silver_price_per_gram", e.target.value ? parseFloat(e.target.value) : null)}
            />
          </Field>
        </div>
      </section>

      {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-body)", marginBottom: "var(--sp-3)" }}>{error}</p>}

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Settings"}
      </Button>
      {savedAt && (
        <p style={{ color: "var(--success)", fontSize: "var(--fs-caption)", marginTop: "var(--sp-2)" }}>
          Saved at {savedAt.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
