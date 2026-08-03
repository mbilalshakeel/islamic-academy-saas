export function EmptyState({
  icon = "\u{1F4C2}",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="ds-empty">
      <div className="ds-empty-icon" aria-hidden>
        {icon}
      </div>
      <div className="ds-empty-title">{title}</div>
      {description && <p style={{ margin: "0 0 16px" }}>{description}</p>}
      {action}
    </div>
  );
}
