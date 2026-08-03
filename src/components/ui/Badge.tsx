export type BadgeVariant = "default" | "neutral" | "success" | "warning" | "danger";

export function Badge({ variant = "default", children }: { variant?: BadgeVariant; children: React.ReactNode }) {
  const cls =
    variant === "neutral"
      ? "ds-badge-neutral"
      : variant === "success"
      ? "ds-badge-success"
      : variant === "warning"
      ? "ds-badge-warning"
      : variant === "danger"
      ? "ds-badge-danger"
      : "";
  return <span className={`ds-badge ${cls}`}>{children}</span>;
}
