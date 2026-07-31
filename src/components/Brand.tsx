export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand" aria-label="Well Said">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      {!compact && <span>Well Said</span>}
    </div>
  );
}
