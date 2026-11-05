import Link from "next/link";
import { Suspense } from "react";
import { SignInForm } from "../AuthForms";

export const metadata = { title: "Entrar" };

export default function SignIn() {
  return (
    <>
      <h1 className="display text-[34px]">Entra a tu cuenta</h1>
      <p className="mb-8 mt-1 text-[15px] text-ink-soft">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-medium text-marino underline underline-offset-4">
          Créala gratis
        </Link>
      </p>
      <Suspense>
        <SignInForm />
      </Suspense>
    </>
  );
}
