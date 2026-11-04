"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

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
    <header
      data-chapter-header
      className="chapter-header fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between wrap text-ink"
    >
      <Link href="/" className="text-[28px] font-semibold tracking-[-0.04em]" aria-label="Repaso, inicio">
        repaso
      </Link>

      <nav aria-label="Principal" className="hidden items-center gap-8 text-[16px] md:flex">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} className="link-u">
            {l.label}
          </a>
        ))}
        <Link href={signedIn ? "/app" : "/entrar"} className="link-u">
          {signedIn ? "Mi Repaso" : "Entrar"}
        </Link>
        <Link href={signedIn ? "/app/subir" : "/registro"} className="btn btn-accent !min-h-[40px] !text-[16px]">
          {signedIn ? "Subir clase" : "Crear cuenta"}
        </Link>
      </nav>

      <div className="flex items-center gap-3 md:hidden">
        <button
          type="button"
          className="min-h-[44px] px-2 text-[16px] font-medium"
          aria-expanded={open}
          aria-controls="menu-movil"
          onClick={() => setOpen(true)}
        >
          Menú
        </button>
        <Link href={signedIn ? "/app" : "/registro"} className="btn btn-accent !min-h-[40px] !px-3 !text-[15px]">
          {signedIn ? "Mi Repaso" : "Crear cuenta"}
        </Link>
      </div>

      {open && (
        <div
          id="menu-movil"
          role="dialog"
          aria-modal="true"
          aria-label="Menú"
          className="fixed inset-0 z-50 flex flex-col bg-ink text-[var(--bg)] wrap"
          style={{ animation: "menuIn 260ms var(--ease-out)" }}
        >
          <div className="flex h-16 items-center justify-between">
            <span className="text-[28px] font-semibold tracking-[-0.04em]">repaso</span>
            <button type="button" className="min-h-[44px] px-2 text-[16px] font-medium" onClick={() => setOpen(false)}>
              Cerrar
            </button>
          </div>
          <nav aria-label="Menú móvil" className="mt-8 flex flex-col gap-2">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="display py-2 text-[44px]">
                {l.label}
              </a>
            ))}
            <Link href={signedIn ? "/app" : "/entrar"} className="display py-2 text-[44px]">
              {signedIn ? "Mi Repaso" : "Entrar"}
            </Link>
          </nav>
          <Link href={signedIn ? "/app/subir" : "/registro"} className="btn btn-accent mt-auto mb-8 w-full">
            {signedIn ? "Subir una clase" : "Crear cuenta gratis"}
          </Link>
          <style>{`@keyframes menuIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}`}</style>
        </div>
      )}
    </header>
  );
}
