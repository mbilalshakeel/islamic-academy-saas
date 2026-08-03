"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";

export default function ViewAsTenantPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const grant = searchParams.get("grant");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/platform-admin/tenants/${params.id}/view?grant=${grant}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          setError(body.error);
        } else {
          setData(body);
        }
      });
  }, [params.id, grant]);

  if (error) return <div style={{ padding: "var(--sp-8)", color: "var(--danger)" }}>{error}</div>;
  if (!data) return <div style={{ padding: "var(--sp-8)", color: "var(--text-tertiary)" }}>Loading...</div>;

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-0)", padding: "var(--sp-8)" }}>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="font-semibold" style={{ background: "var(--warning-bg)", border: "1px solid color-mix(in srgb, var(--warning) 40%, transparent)", color: "var(--warning)", borderRadius: "var(--r-md)", padding: "var(--sp-3)", fontSize: "var(--fs-body)" }}>
          🔒 READ-ONLY support view — grant expires {new Date(data.grant_expires_at).toLocaleTimeString()}
        </div>
        <h1 className="ds-h1">{data.tenant.name}</h1>
        <p className="ds-caption" style={{ fontFamily: "ui-monospace, monospace" }}>
          {data.tenant.slug} · {data.tenant.status} · {data.tenant.plan}
        </p>

        <div className="ds-card">
          <h2 className="ds-h3" style={{ marginBottom: "var(--sp-2)" }}>
            Sample Hadiths
          </h2>
          <ul className="space-y-1" style={{ fontSize: "var(--fs-body)", color: "var(--text-secondary)" }}>
            {data.sample_hadiths.map((h: any) => (
              <li key={h.hadith_number}>
                #{h.hadith_number}: {h.text_en.slice(0, 80)}...
              </li>
            ))}
          </ul>
        </div>

        <div className="ds-card">
          <h2 className="ds-h3" style={{ marginBottom: "var(--sp-2)" }}>
            Admin Users
          </h2>
          <ul className="space-y-1" style={{ fontSize: "var(--fs-body)", color: "var(--text-secondary)" }}>
            {data.admin_users.map((u: any) => (
              <li key={u.email}>
                {u.email} — {u.role}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
