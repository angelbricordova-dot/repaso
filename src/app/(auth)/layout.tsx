import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh grid-cols-1 lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between bg-bg p-8 text-ink lg:flex">
        <Link href="/" className="text-[28px] font-semibold tracking-[-0.04em]">
          repaso
        </Link>
        <div>
          <p className="display max-w-[11ch] text-[clamp(48px,5.4vw,88px)]">Tu clase, lista para el parcial.</p>
          <p className="mt-6 max-w-[38ch] text-[18px] leading-[1.5]">
            Resumen, fichas, quiz y un tutor que conoce tu clase. Hecho para universitarios en Venezuela.
          </p>
        </div>
        <p className="text-[13px]">
          <Link href="/terminos" className="underline underline-offset-4">
            Términos
          </Link>{" "}
          ·{" "}
          <Link href="/privacidad" className="underline underline-offset-4">
            Privacidad
          </Link>
        </p>
      </aside>
      <main className="flex flex-col px-5 py-6 sm:px-10">
        <Link href="/" className="text-[24px] font-semibold tracking-[-0.04em] lg:hidden">
          repaso
        </Link>
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">{children}</div>
      </main>
    </div>
  );
}
