// Columna centrada de la app y fila de título.
export function Page({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return <main className={`mx-auto w-full px-4 pb-24 pt-6 md:px-8 lg:pt-9 ${wide ? "max-w-[1200px]" : "max-w-[1100px]"}`}>{children}</main>;
}

export function TitleRow({ title, subtitle, actions }: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <h1 className="text-[24px] font-semibold leading-[1.2] tracking-[-0.02em]">{title}</h1>
        {subtitle && <p className="mt-1 text-[14px] text-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-[12px] border border-dashed border-control px-4 py-4 text-[14px] text-soft sm:flex-row sm:items-center sm:justify-between">
      <span>{children}</span>
      {action}
    </div>
  );
}

export function UsageBar({ used, total, label }: { used: number; total: number; label: string }) {
  if (total === 0) {
    return (
      <div>
        <div className="flex items-baseline justify-between gap-3 text-[14px]">
          <span>{label}</span>
          <span className="text-soft">No incluido en tu plan</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-[#efe4e8]" aria-hidden="true" />
      </div>
    );
  }
  const pct = Math.min(100, Math.round((used / total) * 100));
  const over = used >= total;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-[14px]">
        <span>{label}</span>
        <span className="num text-soft">
          {used} de {total}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#efe4e8]" role="meter" aria-valuemin={0} aria-valuemax={total} aria-valuenow={used} aria-label={label}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: over ? "var(--a-negative)" : "var(--a-data)" }} />
      </div>
    </div>
  );
}
