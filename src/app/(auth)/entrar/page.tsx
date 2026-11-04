import Link from "next/link";
import { Suspense } from "react";
import { SignInForm } from "../AuthForms";

export const metadata = { title: "Entrar" };

export default function SignIn() {
  return (
    <>
      <h1 className="text-[28px] font-semibold tracking-[-0.03em]">Entrar a Repaso</h1>
      <p className="mb-8 mt-1 text-[15px] text-soft">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-medium text-text underline underline-offset-4">
          Créala gratis
        </Link>
      </p>
      <Suspense>
        <SignInForm />
      </Suspense>
    </>
  );
}
