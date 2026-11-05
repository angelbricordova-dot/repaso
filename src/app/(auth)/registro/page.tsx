import Link from "next/link";
import { Suspense } from "react";
import { SignUpForm } from "../AuthForms";

export const metadata = { title: "Crear cuenta" };

export default function SignUp() {
  return (
    <>
      <h1 className="display text-[34px]">Crea tu cuenta</h1>
      <p className="mb-8 mt-1 text-[15px] text-ink-soft">
        Tu primera tarea es gratis. ¿Ya tienes cuenta?{" "}
        <Link href="/entrar" className="font-medium text-marino underline underline-offset-4">
          Entra
        </Link>
      </p>
      <Suspense>
        <SignUpForm />
      </Suspense>
    </>
  );
}
