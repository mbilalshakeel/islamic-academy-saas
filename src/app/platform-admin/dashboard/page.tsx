"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Badge } from "@/components/ui";
import type { BadgeVariant } from "@/components/ui";

type Tenant = {
  id: string;
  slug: string;
  name: string;
  status: string;
  plan: string | null;
  is_template: boolean;
  created_at: string;
  hadith_count: number;
  dua_count: number;
  admin_user_count: number;
  deletion_requested_at?: string | null;
  deletion_scheduled_for?: string | null;
};

export default function PlatformAdminDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [pendingDeletion, setPendingDeletion] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Tenant | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();

  async function load() {
    setLoading(true);
    const [activeRes, pendingRes] = await Promise.all([
      fetch("/api/platform-admin/tenants"),
      fetch("/api/platform-admin/tenants?include_pending_deletion=true"),
    ]);
    const activeBody = await activeRes.json();
    const pendingBody = await pendingRes.json();
    setLoading(false);

    if (!activeRes.ok) {
      setError(activeBody.error);
      return;
    }
    setTenants(activeBody.tenants);
    setPendingDeletion(pendingRes.ok ? pendingBody.tenants : []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSuspend(t: Tenant) {
    setBusyId(t.id);
    await fetch(`/api/platform-admin/tenants/${t.id}/suspend`, { method: "POST" });
    setBusyId(null);
    load();
  }

  async function handleReactivate(t: Tenant) {
    setBusyId(t.id);
    await fetch(`/api/platform-admin/tenants/${t.id}/reactivate`, { method: "POST" });
    setBusyId(null);
    load();
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setBusyId(confirmDelete.id);
    const res = await fetch(`/api/platform-admin/tenants/${confirmDelete.id}/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm_slug: confirmText }),
    });
    const body = await res.json();
    setBusyId(null);
    if (!res.ok) {
      alert(body.error);
      return;
    }
    setConfirmDelete(null);
    setConfirmText("");
    load();
  }

  async function handleRestore(t: Tenant) {
    setBusyId(t.id);
    const res = await fetch(`/api/platform-admin/tenants/${t.id}/restore`, { method: "POST" });
    const body = await res.json();
    setBusyId(null);
    if (!res.ok) {
      alert(body.error);
      return;
    }
    load();
  }

  async function handleViewAsTenant(t: Tenant) {
    const reason = window.prompt(
      `Reason for viewing "${t.name}"'s data (required, for the audit log):`
    );
    if (!reason) return;

    const res = await fetch(`/api/platform-admin/tenants/${t.id}/impersonate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const body = await res.json();
    if (!res.ok) {
      alert(body.error);
      return;
    }
    router.push(body.view_url);
  }

  const statusVariant: Record<string, BadgeVariant> = {
    trial: "warning",
    active: "success",
    suspended: "danger",
    cancelled: "neutral",
    pending_deletion: "warning",
  };

  function daysRemaining(scheduledFor?: string | null) {
    if (!scheduledFor) return null;
    const ms = new Date(scheduledFor).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-0)", padding: "var(--sp-8)" }}>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="ds-h1">Platform Admin — Tenants</h1>
            <p className="ds-caption">All institutes on the platform</p>
          </div>
          <Link href="/platform-admin/tenants/new" className="ds-btn ds-btn-primary">
            + Create New Tenant
          </Link>
        </div>

        {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
        {loading && <p style={{ color: "var(--text-tertiary)" }}>Loading...</p>}

        {!loading && (
          <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-xs)" }}>
            <table className="w-full" style={{ fontSize: "var(--fs-body)" }}>
              <thead style={{ background: "var(--surface-2)", color: "var(--text-secondary)", textAlign: "left" }}>
                <tr>
                  <th style={{ padding: "var(--sp-3) var(--sp-4)", fontWeight: 600, fontSize: "var(--fs-caption)" }}>Name</th>
                  <th style={{ padding: "var(--sp-3) var(--sp-4)", fontWeight: 600, fontSize: "var(--fs-caption)" }}>Slug</th>
                  <th style={{ padding: "var(--sp-3) var(--sp-4)", fontWeight: 600, fontSize: "var(--fs-caption)" }}>Status</th>
                  <th style={{ padding: "var(--sp-3) var(--sp-4)", fontWeight: 600, fontSize: "var(--fs-caption)" }}>Plan</th>
                  <th style={{ padding: "var(--sp-3) var(--sp-4)", fontWeight: 600, fontSize: "var(--fs-caption)" }}>Created</th>
                  <th style={{ padding: "var(--sp-3) var(--sp-4)", fontWeight: 600, fontSize: "var(--fs-caption)" }}>Content Health</th>
                  <th style={{ padding: "var(--sp-3) var(--sp-4)", fontWeight: 600, fontSize: "var(--fs-caption)" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "var(--sp-3) var(--sp-4)", fontWeight: 500 }}>
                      {t.name}
                      {t.is_template && (
                        <span className="ds-badge ds-badge-neutral" style={{ marginLeft: 8 }}>
                          TEMPLATE
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "var(--sp-3) var(--sp-4)", fontFamily: "ui-monospace, monospace", fontSize: "var(--fs-caption)" }}>{t.slug}</td>
                    <td style={{ padding: "var(--sp-3) var(--sp-4)" }}>
                      <Badge variant={statusVariant[t.status]}>{t.status}</Badge>
                    </td>
                    <td style={{ padding: "var(--sp-3) var(--sp-4)" }}>{t.plan || "—"}</td>
                    <td style={{ padding: "var(--sp-3) var(--sp-4)" }}>{new Date(t.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: "var(--sp-3) var(--sp-4)", fontSize: "var(--fs-caption)", color: "var(--text-secondary)" }}>
                      {t.hadith_count} hadiths · {t.dua_count} duas · {t.admin_user_count} admin(s)
                    </td>
                    <td style={{ padding: "var(--sp-3) var(--sp-4)" }}>
                      {!t.is_template && (
                        <div className="flex gap-2 flex-wrap">
                          {t.status !== "suspended" ? (
                            <button onClick={() => handleSuspend(t)} disabled={busyId === t.id} className="ds-badge ds-badge-warning" style={{ cursor: "pointer", border: "none" }}>
                              Suspend
                            </button>
                          ) : (
                            <button onClick={() => handleReactivate(t)} disabled={busyId === t.id} className="ds-badge ds-badge-success" style={{ cursor: "pointer", border: "none" }}>
                              Reactivate
                            </button>
                          )}
                          <button onClick={() => handleViewAsTenant(t)} className="ds-badge" style={{ cursor: "pointer", border: "none" }}>
                            View as tenant
                          </button>
                          <button onClick={() => setConfirmDelete(t)} className="ds-badge ds-badge-danger" style={{ cursor: "pointer", border: "none" }}>
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pending Deletion section ── */}
        {!loading && pendingDeletion.length > 0 && (
          <div>
            <h2 className="ds-h2" style={{ color: "var(--warning)", marginBottom: "var(--sp-2)" }}>
              🗑️ Pending Deletion ({pendingDeletion.length})
            </h2>
            <p className="ds-caption" style={{ marginBottom: "var(--sp-3)" }}>
              These tenants are hidden from normal use but fully recoverable until their scheduled deletion date. All data is untouched during this grace period.
            </p>
            <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface-1)", border: "2px solid color-mix(in srgb, var(--warning) 40%, transparent)", boxShadow: "var(--shadow-xs)" }}>
              <table className="w-full" style={{ fontSize: "var(--fs-body)" }}>
                <thead style={{ background: "var(--warning-bg)", color: "var(--warning)", textAlign: "left" }}>
                  <tr>
                    <th style={{ padding: "var(--sp-3) var(--sp-4)", fontSize: "var(--fs-caption)" }}>Name</th>
                    <th style={{ padding: "var(--sp-3) var(--sp-4)", fontSize: "var(--fs-caption)" }}>Slug</th>
                    <th style={{ padding: "var(--sp-3) var(--sp-4)", fontSize: "var(--fs-caption)" }}>Requested</th>
                    <th style={{ padding: "var(--sp-3) var(--sp-4)", fontSize: "var(--fs-caption)" }}>Permanently Deleted In</th>
                    <th style={{ padding: "var(--sp-3) var(--sp-4)", fontSize: "var(--fs-caption)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDeletion.map((t) => (
                    <tr key={t.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "var(--sp-3) var(--sp-4)", fontWeight: 500 }}>{t.name}</td>
                      <td style={{ padding: "var(--sp-3) var(--sp-4)", fontFamily: "ui-monospace, monospace", fontSize: "var(--fs-caption)" }}>{t.slug}</td>
                      <td style={{ padding: "var(--sp-3) var(--sp-4)", fontSize: "var(--fs-caption)" }}>
                        {t.deletion_requested_at && new Date(t.deletion_requested_at).toLocaleString()}
                      </td>
                      <td style={{ padding: "var(--sp-3) var(--sp-4)", fontSize: "var(--fs-caption)", fontWeight: 600, color: "var(--warning)" }}>
                        {daysRemaining(t.deletion_scheduled_for)} day(s) — {t.deletion_scheduled_for && new Date(t.deletion_scheduled_for).toLocaleString()}
                      </td>
                      <td style={{ padding: "var(--sp-3) var(--sp-4)" }}>
                        <button onClick={() => handleRestore(t)} disabled={busyId === t.id} className="ds-btn ds-btn-primary ds-btn-sm">
                          ↺ Restore
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="ds-modal-backdrop" style={{ alignItems: "center" }}>
          <div className="ds-modal space-y-4" style={{ maxWidth: 480 }}>
            <h2 className="ds-h2" style={{ color: "var(--warning)" }}>
              Move &quot;{confirmDelete.name}&quot; to pending deletion?
            </h2>
            <p style={{ fontSize: "var(--fs-body)", color: "var(--text-secondary)" }}>
              This tenant will be hidden from normal dashboard views immediately, but <b>all of its data stays fully intact</b> for 14 days. You (or another platform admin) can restore it at any time before then. After 14 days it will be permanently deleted and cannot be recovered. Type <b>{confirmDelete.slug}</b> to confirm.
            </p>
            <input
              className="ds-input"
              style={{ fontFamily: "ui-monospace, monospace" }}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={confirmDelete.slug}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setConfirmDelete(null);
                  setConfirmText("");
                }}
              >
                Cancel
              </Button>
              <button
                onClick={handleDelete}
                disabled={confirmText !== confirmDelete.slug || busyId === confirmDelete.id}
                className="ds-btn"
                style={{ background: "var(--warning)", color: "#fff" }}
              >
                Move to Pending Deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
