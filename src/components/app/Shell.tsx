"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "./Icon";

export type NavItem = { href: string; label: string; icon: IconName; count?: number; exact?: boolean };
export type NavGroup = { label?: string; items: NavItem[] };

export function Shell({
  groups,
  footer,
  scope,
  children,
}: {
  groups: NavGroup[];
  footer: React.ReactNode;
  scope: { title: string; subtitle: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const all = groups.flatMap((g) => g.items);
  const isActive = (it: NavItem) => (it.exact ? pathname === it.href : pathname === it.href || pathname.startsWith(it.href + "/"));
  const current = all.find(isActive);

  const nav = (
    <nav aria-label="Secciones" className="flex flex-col">
      {groups.map((g, gi) => (
        <div key={gi} className={gi > 0 ? "mt-7" : ""}>
          {g.label && <p className="mb-2 px-3 text-[12px] text-soft">{g.label}</p>}
          <ul className="flex flex-col gap-[2px]">
            {g.items.map((it) => {
              const active = isActive(it);
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex h-9 items-center gap-[10px] rounded-[10px] px-3 text-[14px] transition-colors duration-150 ${
                      active ? "bg-active text-text" : "text-[#3f3a3d] hover:bg-panel"
                    }`}
                  >
                    <Icon name={it.icon} className="size-4 shrink-0 text-[#5d5559]" />
                    <span className="truncate">{it.label}</span>
                    {it.count ? <span className="num ml-auto text-[12px] font-medium text-data">{it.count}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-svh bg-ground text-text">
      {/* Barra lateral (escritorio) */}
      <aside className="fixed inset-y-0 left-0 hidden w-[240px] flex-col border-r border-rule bg-ground px-3 pb-4 pt-5 lg:flex">
        <Brand scope={scope} />
        <div className="mt-6 flex-1 overflow-y-auto">{nav}</div>
        <div className="mt-4">{footer}</div>
      </aside>

      {/* Barra superior (teléfono y tableta) */}
      <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-rule bg-ground px-4 lg:hidden">
        <Link href="/" className="text-[20px] font-semibold tracking-[-0.04em]">
          repaso
        </Link>
        <span className="truncate px-3 text-[14px] font-medium">{current?.label}</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="app-menu"
          className="flex h-11 items-center gap-1 px-1 text-[14px] font-medium"
        >
          <Icon name="menu" className="size-5" />
          <span className="sr-only">Abrir menú</span>
        </button>
      </header>

      {open && (
        <div id="app-menu" role="dialog" aria-modal="true" aria-label="Menú" className="fixed inset-0 z-50 flex flex-col bg-ground px-3 pb-4 pt-3 lg:hidden" style={{ animation: "sheetIn 220ms var(--ease-out)" }}>
          <div className="flex items-center justify-between px-1">
            <Brand scope={scope} />
            <button type="button" onClick={() => setOpen(false)} className="flex h-11 items-center px-2 text-[14px] font-medium">
              Cerrar
            </button>
          </div>
          <div className="mt-6 flex-1 overflow-y-auto">{nav}</div>
          <div className="mt-4">{footer}</div>
          <style>{`@keyframes sheetIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
        </div>
      )}

      <div className="lg:pl-[240px]">{children}</div>
    </div>
  );
}

function Brand({ scope }: { scope: { title: string; subtitle: string } }) {
  return (
    <div className="flex items-center gap-3 px-1">
      <Link href="/" aria-label="Repaso, inicio" className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-accent text-[18px] font-semibold tracking-[-0.04em] text-ink">
        r
      </Link>
      <div className="min-w-0">
        <p className="truncate text-[14px] font-semibold leading-tight">{scope.title}</p>
        <p className="truncate text-[12px] leading-tight text-soft">{scope.subtitle}</p>
      </div>
    </div>
  );
}
