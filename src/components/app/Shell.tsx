"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/landing/Logo";
import { Icon, type IconName } from "./Icon";

export type NavItem = { href: string; label: string; icon: IconName; count?: number; exact?: boolean };
export type NavGroup = { label?: string; items: NavItem[] };

export function Shell({
  groups,
  tabs,
  footer,
  scope,
  children,
}: {
  groups: NavGroup[];
  /** Pestañas de la barra inferior en el teléfono (máximo 3; la cuarta es «Más») */
  tabs: NavItem[];
  footer: React.ReactNode;
  scope: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMore(false);
  }
  useEffect(() => {
    document.body.style.overflow = more ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMore(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [more]);

  const isActive = (it: NavItem) => (it.exact ? pathname === it.href : pathname === it.href || pathname.startsWith(it.href + "/"));
  const tabHrefs = new Set(tabs.map((t) => t.href));
  const moreItems = groups.flatMap((g) => g.items).filter((i) => !tabHrefs.has(i.href));
  const moreActive = moreItems.some(isActive);

  return (
    <div className="min-h-svh bg-papel text-marino">
      {/* Barra lateral (escritorio) */}
      <aside className="fixed inset-y-0 left-0 hidden w-[248px] flex-col border-r border-line bg-papel px-3 pb-4 pt-5 lg:flex">
        <div className="px-2">
          <Link href="/" aria-label="Inicio">
            <Logo size={19} />
          </Link>
          <p className="mt-3 truncate text-[13px] text-ink-soft">{scope}</p>
        </div>
        <nav aria-label="Secciones" className="mt-6 flex flex-1 flex-col overflow-y-auto">
          {groups.map((g, gi) => (
            <div key={gi} className={gi > 0 ? "mt-6" : ""}>
              {g.label && <p className="mb-2 px-3 text-[12.5px] font-semibold text-ink-soft">{g.label}</p>}
              <ul className="flex flex-col gap-[2px]">
                {g.items.map((it) => {
                  const active = isActive(it);
                  return (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        aria-current={active ? "page" : undefined}
                        className={`flex h-10 items-center gap-3 rounded-[10px] px-3 text-[15px] transition-colors duration-150 ${
                          active ? "bg-celeste-soft font-semibold text-marino" : "text-[#33405f] hover:bg-surface"
                        }`}
                      >
                        <Icon name={it.icon} className="size-[18px] shrink-0" />
                        <span className="truncate">{it.label}</span>
                        {it.count ? <span className="num ml-auto rounded-full bg-hilo px-2 text-[12px] font-bold text-marino">{it.count}</span> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="mt-4">{footer}</div>
      </aside>

      {/* Barra superior (teléfono) */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-papel px-4 lg:hidden">
        <Link href="/app" aria-label="Inicio">
          <Logo size={16} />
        </Link>
        <span className="truncate pl-3 text-[13px] text-ink-soft">{scope}</span>
      </header>

      <div className="pb-[calc(76px+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-[248px]">{children}</div>

      {/* Pestañas inferiores (teléfono) */}
      <nav
        aria-label="Pestañas"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-papel pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {tabs.map((t) => {
          const active = isActive(t);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex h-[64px] flex-col items-center justify-center gap-1 text-[12px] font-semibold transition-[color,transform] duration-150 active:scale-[0.96] ${
                active ? "text-marino" : "text-[#6b7590]"
              }`}
            >
              <Icon name={t.icon} className="size-[22px]" />
              {t.label}
              {t.count ? <span className="num absolute right-[22%] top-2 rounded-full bg-hilo px-1.5 text-[11px] font-bold text-marino">{t.count}</span> : null}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMore(true)}
          aria-expanded={more}
          className={`flex h-[64px] flex-col items-center justify-center gap-1 text-[12px] font-semibold transition-transform duration-150 active:scale-[0.96] ${
            moreActive ? "text-marino" : "text-[#6b7590]"
          }`}
        >
          <Icon name="user" className="size-[22px]" />
          Cuenta
        </button>
      </nav>

      {more && (
        <div role="dialog" aria-modal="true" aria-label="Cuenta" className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Cerrar" className="absolute inset-0 bg-marino/40" onClick={() => setMore(false)} />
          <div className="sheet absolute inset-x-0 bottom-0 rounded-t-[22px] bg-papel px-3 pb-[calc(20px+env(safe-area-inset-bottom))] pt-3">
            <div className="mx-auto mb-1 h-1.5 w-10 rounded-full bg-line-strong" aria-hidden="true" />
            <div className="mb-1 flex items-center justify-between px-3">
              <p className="text-[17px] font-bold">Cuenta</p>
              <button type="button" onClick={() => setMore(false)} className="min-h-[44px] px-2 text-[16px] font-semibold text-marino-3">
                Cerrar
              </button>
            </div>
            <ul className="flex flex-col">
              {moreItems.map((it) => (
                <li key={it.href}>
                  <Link href={it.href} className="flex min-h-[52px] items-center gap-3 rounded-[12px] px-3 text-[17px] font-medium active:bg-surface">
                    <Icon name={it.icon} className="size-5 text-ink-soft" />
                    {it.label}
                    {it.count ? <span className="num ml-auto rounded-full bg-hilo px-2 text-[12px] font-bold">{it.count}</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-2 border-t border-line pt-2">{footer}</div>
          </div>
        </div>
      )}
    </div>
  );
}
