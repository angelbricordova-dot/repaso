import Link from "next/link";
import { Logo } from "@/components/landing/Logo";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-papel">
      <header className="flex h-16 items-center justify-between bg-celeste px-5 md:px-8">
        <Link href="/" aria-label="Inicio">
          <Logo size={18} />
        </Link>
        <nav className="flex gap-5 text-[15px] font-medium" aria-label="Legal">
          <Link href="/terminos" className="link">
            Términos
          </Link>
          <Link href="/privacidad" className="link">
            Privacidad
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-[720px] px-5 pb-24 pt-10 md:pt-16">{children}</main>
    </div>
  );
}
