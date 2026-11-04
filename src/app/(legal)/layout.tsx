import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-ground">
      <header className="flex h-16 items-center justify-between px-5 md:px-8">
        <Link href="/" className="text-[24px] font-semibold tracking-[-0.04em]">
          repaso
        </Link>
        <nav className="flex gap-5 text-[14px]" aria-label="Legal">
          <Link href="/terminos" className="hover:underline">
            Términos
          </Link>
          <Link href="/privacidad" className="hover:underline">
            Privacidad
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-[720px] px-5 pb-24 pt-10 md:pt-16">{children}</main>
    </div>
  );
}
