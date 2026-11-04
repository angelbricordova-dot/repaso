import { NewPasswordForm } from "../AuthForms";

export const metadata = { title: "Nueva contraseña" };

export default function NewPassword() {
  return (
    <>
      <h1 className="mb-8 text-[28px] font-semibold tracking-[-0.03em]">Crea tu nueva contraseña</h1>
      <NewPasswordForm />
    </>
  );
}
