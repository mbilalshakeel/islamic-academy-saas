/** A single skeleton block/line — compose these to build list/card placeholders. */
export function Skeleton({ style, className = "" }: { style?: React.CSSProperties; className?: string }) {
  return <div className={`ds-skeleton ${className}`} style={style} />;
}

/** Pre-built skeleton for a row of card tiles (used on Home / content grids while loading). */
export function SkeletonCardGrid({ count = 6 }: { count?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "var(--sp-4)" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="ds-card" style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
          <Skeleton style={{ width: 44, height: 44, borderRadius: 12 }} />
          <Skeleton style={{ width: "70%", height: 12 }} />
        </div>
      ))}
    </div>
  );
}

/** Pre-built skeleton for a vertical list of rows (used on content list/admin table screens). */
export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="ds-card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Skeleton style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <Skeleton style={{ height: 14, width: "55%", marginBottom: 8 }} />
            <Skeleton style={{ height: 12, width: "35%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
