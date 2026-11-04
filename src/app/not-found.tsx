import Link from "next/link";

export default function NotFound() {
  return (
    <main className="landing flex min-h-svh flex-col justify-between wrap py-6">
      <Link href="/" className="text-[28px] font-semibold tracking-[-0.04em]">
        repaso
      </Link>
      <div>
        <h1 className="display text-[clamp(56px,10vw,160px)]">Esta página no existe.</h1>
        <p className="mt-6 max-w-[40ch] text-[18px]">Puede que el enlace esté mal escrito o que el material se haya borrado.</p>
        <Link href="/" className="btn mt-8">
          Volver al inicio
        </Link>
      </div>
      <span />
    </main>
  );
}
