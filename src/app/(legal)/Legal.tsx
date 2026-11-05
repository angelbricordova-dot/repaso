export function LegalDoc({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="legal text-[16px] leading-[1.65]">
      <h1 className="display text-[38px] md:text-[52px]">{title}</h1>
      <p className="mt-3 text-[14px] text-ink-soft">Última actualización: {updated}</p>
      <div className="mt-10">{children}</div>
    </article>
  );
}
