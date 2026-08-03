"use client";

import { useEffect, useState } from "react";
import { Field, Input } from "@/components/ui";

const GOLD_NISAB_GRAMS = 85;
const SILVER_NISAB_GRAMS = 595;
const ZAKAT_RATE = 0.025; // 2.5%

// Commonly-cited approximate fallback prices if a tenant hasn't set its own —
// clearly labeled as estimates in the UI, never presented as live/authoritative.
const FALLBACK_GOLD_PRICE = 75;
const FALLBACK_SILVER_PRICE = 0.95;

export default function ZakatCalculatorPage({ params }: { params: { slug: string } }) {
  const [settings, setSettings] = useState<{
    currency: string;
    gold_price_per_gram: number | null;
    silver_price_per_gram: number | null;
    zakat_nisab_override: number | null;
  } | null>(null);

  const [cash, setCash] = useState("");
  const [goldGrams, setGoldGrams] = useState("");
  const [silverGrams, setSilverGrams] = useState("");
  const [investments, setInvestments] = useState("");
  const [debts, setDebts] = useState("");

  useEffect(() => {
    fetch(`/api/public/tenant-settings?slug=${params.slug}`)
      .then((r) => r.json())
      .then((body) => setSettings(body.settings ?? null));
  }, [params.slug]);

  const usingFallback = !settings?.gold_price_per_gram || !settings?.silver_price_per_gram;
  const goldPrice = settings?.gold_price_per_gram ?? FALLBACK_GOLD_PRICE;
  const silverPrice = settings?.silver_price_per_gram ?? FALLBACK_SILVER_PRICE;
  const currency = settings?.currency ?? "USD";

  const goldNisabValue = GOLD_NISAB_GRAMS * goldPrice;
  const silverNisabValue = SILVER_NISAB_GRAMS * silverPrice;
  // Traditional practice: the LOWER of the two thresholds is used (more
  // inclusive — more people qualify to pay Zakat).
  const nisabThreshold = settings?.zakat_nisab_override ?? Math.min(goldNisabValue, silverNisabValue);

  const totalAssets =
    (parseFloat(cash) || 0) +
    (parseFloat(goldGrams) || 0) * goldPrice +
    (parseFloat(silverGrams) || 0) * silverPrice +
    (parseFloat(investments) || 0) -
    (parseFloat(debts) || 0);

  const meetsNisab = totalAssets >= nisabThreshold;
  const zakatDue = meetsNisab ? totalAssets * ZAKAT_RATE : 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 md:py-8 space-y-5">
      <div
        className="rounded-2xl p-6 text-center relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, var(--tenant-primary), var(--tenant-secondary))`, boxShadow: "var(--shadow-md)" }}
      >
        <div className="ds-motif-bg" />
        <div
          className="rounded-2xl flex items-center justify-center mx-auto relative"
          style={{ width: 64, height: 64, background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)", fontSize: 30, marginBottom: "var(--sp-3)" }}
        >
          💰
        </div>
        <h1 className="tenant-on-primary ds-h2 relative">Zakat Calculator</h1>
        <p className="tenant-on-primary relative" style={{ opacity: 0.85, fontSize: "var(--fs-caption)", marginTop: 4 }}>
          2.5% of zakatable assets held above the Nisab threshold for one lunar year.
        </p>
      </div>

      {usingFallback && (
        <div className="rounded-xl" style={{ background: "var(--warning-bg)", border: "1px solid color-mix(in srgb, var(--warning) 40%, transparent)", padding: "var(--sp-3) var(--sp-4)", fontSize: "var(--fs-caption)", color: "var(--warning)" }}>
          ⚠️ This institute hasn&apos;t set current gold/silver prices — using commonly-cited <b>estimated</b> figures (not live market data). Ask your institute admin to update these in Settings for accuracy.
        </div>
      )}

      <div className="ds-card space-y-4">
        <Field label={`Cash & Savings (${currency})`}>
          <Input type="number" step="0.01" value={cash} onChange={(e) => setCash(e.target.value)} placeholder="0.00" />
        </Field>
        <Field label="Gold held (grams)">
          <Input type="number" step="0.01" value={goldGrams} onChange={(e) => setGoldGrams(e.target.value)} placeholder="0.00" />
        </Field>
        <Field label="Silver held (grams)">
          <Input type="number" step="0.01" value={silverGrams} onChange={(e) => setSilverGrams(e.target.value)} placeholder="0.00" />
        </Field>
        <Field label={`Investments/Business assets (${currency})`}>
          <Input type="number" step="0.01" value={investments} onChange={(e) => setInvestments(e.target.value)} placeholder="0.00" />
        </Field>
        <Field label={`Debts owed by you (${currency})`}>
          <Input type="number" step="0.01" value={debts} onChange={(e) => setDebts(e.target.value)} placeholder="0.00" />
        </Field>
      </div>

      <div className="ds-card space-y-3">
        <Row label="Nisab threshold (lower of gold/silver)" value={`${nisabThreshold.toFixed(2)} ${currency}`} />
        <Row label="Your total zakatable assets" value={`${totalAssets.toFixed(2)} ${currency}`} />
        <Row label="Meets Nisab?" value={meetsNisab ? "Yes" : "No"} />
        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "var(--sp-3)" }}>
          <Row label="Zakat Due (2.5%)" value={`${zakatDue.toFixed(2)} ${currency}`} highlight />
        </div>
      </div>

      <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-tertiary)" }}>
        This is an estimate for guidance only. Consult a qualified scholar for your specific situation, especially around what counts as zakatable and the exact one-lunar-year holding requirement.
      </p>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span style={{ fontSize: highlight ? "var(--fs-body)" : "var(--fs-body)", fontWeight: highlight ? 700 : 400, color: highlight ? "var(--text-primary)" : "var(--text-secondary)" }}>
        {label}
      </span>
      <span
        className={highlight ? "tenant-primary-text" : ""}
        style={{ fontSize: highlight ? "var(--fs-h3)" : "var(--fs-body)", fontWeight: 700 }}
      >
        {value}
      </span>
    </div>
  );
}
