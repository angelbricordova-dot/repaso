"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

const LINKS = [
  { href: "#como", label: "Cómo funciona" },
  { href: "#precios", label: "Precios" },
  { href: "#preguntas", label: "Preguntas" },
];

export function Header({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="field-bg relative z-30">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 wrap">
        <Link href="/" aria-label="Inicio">
          <Logo />
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-7 text-[16px] font-medium md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="link">
              {l.label}
            </a>
          ))}
          <Link href={signedIn ? "/app" : "/entrar"} className="btn btn-ink !min-h-[42px] !px-4 !text-[15px]">
            {signedIn ? "Mis tareas" : "Entrar"}
          </Link>
        </nav>
        <div className="flex items-center gap-2 md:hidden">
          <Link href={signedIn ? "/app" : "/entrar"} className="flex min-h-[44px] items-center px-2 text-[16px] font-semibold">
            {signedIn ? "Mis tareas" : "Entrar"}
          </Link>
          <button type="button" aria-expanded={open} aria-controls="menu" onClick={() => setOpen(true)} className="grid size-11 place-items-center rounded-[10px]">
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
            <span className="sr-only">Abrir menú</span>
          </button>
        </div>
      </div>
      {open && (
        <div id="menu" role="dialog" aria-modal="true" aria-label="Menú" className="fixed inset-0 z-50 md:hidden">
          <button type="button" aria-label="Cerrar menú" className="absolute inset-0 bg-marino/40" onClick={() => setOpen(false)} />
          <div className="sheet absolute inset-x-0 bottom-0 rounded-t-[22px] bg-papel px-5 pb-8 pt-3 text-marino">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line-strong" aria-hidden="true" />
            <nav aria-label="Menú móvil" className="flex flex-col">
              {LINKS.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="display flex min-h-[56px] items-center text-[28px]">
                  {l.label}
                </a>
              ))}
            </nav>
            <Link href={signedIn ? "/app/nueva" : "/registro"} className="btn mt-5 w-full">
              {signedIn ? "Mandar una tarea" : "Mandar mi tarea gratis"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
