import Link from "next/link";
import { ResetRequestForm } from "../AuthForms";

export const metadata = { title: "Recuperar contraseña" };

export default function Reset() {
  return (
    <>
      <h1 className="display text-[34px]">Recupera tu contraseña</h1>
      <p className="mb-8 mt-1 text-[15px] text-ink-soft">Te enviamos un enlace a tu correo para crear una nueva.</p>
      <ResetRequestForm />
      <Link href="/entrar" className="mt-6 text-[14px] text-ink-soft underline underline-offset-4">
        Volver a entrar
      </Link>
    </>
  );
}
