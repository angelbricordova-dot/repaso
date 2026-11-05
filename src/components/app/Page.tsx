export function Page({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return <main className={`mx-auto w-full px-4 pb-16 pt-5 md:px-8 lg:pt-9 ${wide ? "max-w-[1200px]" : "max-w-[1040px]"}`}>{children}</main>;
}

export function TitleRow({ title, subtitle, actions }: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <h1 className="font-[family-name:var(--font-display)] text-[26px] font-bold leading-[1.15] tracking-[-0.02em] md:text-[30px]">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-ink-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-[14px] border border-dashed border-line-strong px-4 py-5 text-[15px] text-ink-soft sm:flex-row sm:items-center sm:justify-between">
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
          <span className="text-ink-soft">Sin plan</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-[#e3e9f2]" aria-hidden="true" />
      </div>
    );
  }
  const pct = Math.min(100, Math.round((used / total) * 100));
  const over = used >= total;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-[14px]">
        <span>{label}</span>
        <span className="num text-ink-soft">
          {used} de {total}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e3e9f2]" role="meter" aria-valuemin={0} aria-valuemax={total} aria-valuenow={used} aria-label={label}>
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: over ? "var(--rojo)" : "var(--marino-3)" }} />
      </div>
    </div>
  );
}
