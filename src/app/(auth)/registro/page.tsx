import Link from "next/link";
import { Suspense } from "react";
import { SignUpForm } from "../AuthForms";

export const metadata = { title: "Crear cuenta" };

export default function SignUp() {
  return (
    <>
      <h1 className="text-[28px] font-semibold tracking-[-0.03em]">Crea tu cuenta</h1>
      <p className="mb-8 mt-1 text-[15px] text-soft">
        Tus primeras 3 clases al mes son gratis. ¿Ya tienes cuenta?{" "}
        <Link href="/entrar" className="font-medium text-text underline underline-offset-4">
          Entra
        </Link>
      </p>
      <Suspense>
        <SignUpForm />
      </Suspense>
    </>
  );
}
