export function LegalDoc({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="legal text-[16px] leading-[1.65]">
      <h1 className="text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] md:text-[48px]">{title}</h1>
      <p className="mt-3 text-[14px] text-soft">Última actualización: {updated}</p>
      <div className="mt-10">{children}</div>
    </article>
  );
}
