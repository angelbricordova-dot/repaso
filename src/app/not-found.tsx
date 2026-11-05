import Link from "next/link";
import { Logo } from "@/components/landing/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col justify-between bg-celeste px-5 py-6 text-marino md:px-10">
      <Link href="/" aria-label="Inicio" className="self-start">
        <Logo />
      </Link>
      <div>
        <h1 className="display text-[clamp(52px,10vw,140px)]">Esta página no existe.</h1>
        <p className="mt-5 max-w-[40ch] text-[18px]">Puede que el enlace esté mal copiado o que la tarea se haya borrado.</p>
        <Link href="/" className="btn mt-8">
          Volver al inicio
        </Link>
      </div>
      <span />
    </main>
  );
}
