export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface-0)" }}>
      <div className="text-center max-w-sm" style={{ padding: "var(--sp-6)" }}>
        <div className="ds-empty-icon mx-auto" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
          🔒
        </div>
        <h1 className="ds-h2" style={{ color: "var(--danger)", marginTop: "var(--sp-4)" }}>
          403 — Unauthorized
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "var(--sp-2)", fontSize: "var(--fs-body)" }}>
          Your account does not belong to this tenant. Access denied by middleware.
        </p>
      </div>
    </div>
  );
}
