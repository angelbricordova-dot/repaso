import Link from "next/link";
import { Logo } from "@/components/landing/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh grid-cols-1 lg:grid-cols-[1fr_1fr]">
      <aside className="relative hidden flex-col justify-between bg-celeste p-10 text-marino lg:flex">
        <Link href="/" aria-label="Inicio">
          <Logo size={22} />
        </Link>
        <div>
          <p className="display max-w-[11ch] text-[clamp(52px,5.6vw,92px)]">Tu tarea, resuelta a tiempo.</p>
          <p className="mt-6 max-w-[36ch] text-[19px] leading-[1.5] text-[#2f3f66]">Personas reales la resuelven y te la entregan antes de tu hora de entrega. La primera es gratis.</p>
        </div>
        <p className="text-[14px]">
          <Link href="/terminos" className="underline">
            Términos
          </Link>{" "}
          ·{" "}
          <Link href="/privacidad" className="underline">
            Privacidad
          </Link>
        </p>
      </aside>
      <main className="flex flex-col bg-papel px-5 py-5 sm:px-10">
        <Link href="/" aria-label="Inicio" className="self-start lg:hidden">
          <Logo size={17} />
        </Link>
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-8">{children}</div>
      </main>
    </div>
  );
}
