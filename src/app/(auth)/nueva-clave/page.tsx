import { NewPasswordForm } from "../AuthForms";

export const metadata = { title: "Nueva contraseña" };

export default function NewPassword() {
  return (
    <>
      <h1 className="display mb-8 text-[34px]">Crea tu nueva contraseña</h1>
      <NewPasswordForm />
    </>
  );
}
