"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SkeletonCardGrid, EmptyState } from "@/components/ui";

export default function SehriIftarClient({ slug, tenantId }: { slug: string; tenantId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public/sehri-iftar?tenant_id=${tenantId}`)
      .then((r) => r.json())
      .then((body) => {
        setData(body);
        setLoading(false);
      });
  }, [tenantId]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <SkeletonCardGrid count={2} />
      </div>
    );
  }

  if (data?.needs_location) {
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <div className="ds-card">
          <EmptyState
            icon="📍"
            title="Location Not Set"
            description={data.message}
            action={
              <Link href={`/t/${slug}/admin/settings/tools`} className="tenant-primary-text font-semibold" style={{ fontSize: "var(--fs-body)", textDecoration: "underline" }}>
                Go to Settings
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 md:py-8">
      <div
        className="rounded-2xl p-6 text-center relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, var(--tenant-primary), var(--tenant-secondary))`, boxShadow: "var(--shadow-md)", marginBottom: "var(--sp-5)" }}
      >
        <div className="ds-motif-bg" />
        <div
          className="rounded-2xl flex items-center justify-center mx-auto relative"
          style={{ width: 64, height: 64, background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)", fontSize: 30, marginBottom: "var(--sp-3)" }}
        >
          🌙
        </div>
        <h1 className="tenant-on-primary ds-h2 relative">Sehri &amp; Iftar Timings</h1>
        <p className="tenant-on-primary relative" style={{ opacity: 0.85, fontSize: "var(--fs-body)", marginTop: 4 }}>
          {data?.date}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="ds-card text-center">
          <p className="ds-micro tenant-primary-text">Sehri Ends</p>
          <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-tertiary)", marginBottom: "var(--sp-2)" }}>(Fajr)</p>
          <p className="ds-display" style={{ fontSize: "1.75rem" }}>
            {data?.fajr}
          </p>
        </div>
        <div className="ds-card text-center">
          <p className="ds-micro tenant-primary-text">Iftar</p>
          <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-tertiary)", marginBottom: "var(--sp-2)" }}>(Maghrib)</p>
          <p className="ds-display" style={{ fontSize: "1.75rem" }}>
            {data?.maghrib}
          </p>
        </div>
      </div>

      {data?.source === "cache" && (
        <p className="text-center" style={{ fontSize: "var(--fs-caption)", color: "var(--text-tertiary)", marginTop: "var(--sp-4)" }}>
          Cached · updated within the last 24 hours
        </p>
      )}
      {data?.source === "aladhan_live" && (
        <p className="text-center" style={{ fontSize: "var(--fs-caption)", color: "var(--text-tertiary)", marginTop: "var(--sp-4)" }}>
          Just fetched from Aladhan
        </p>
      )}
      {data?.warning && (
        <p className="text-center" style={{ fontSize: "var(--fs-caption)", color: "var(--warning)", marginTop: "var(--sp-2)" }}>
          {data.warning}
        </p>
      )}
    </div>
  );
}
