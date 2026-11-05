import { Page, TitleRow } from "@/components/app/Page";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { DangerZone, PasswordForm, ProfileForm } from "./ProfileForms";

export const metadata = { title: "Perfil" };

export default async function ProfilePage() {
  const { profile } = await requireUser();
  return (
    <Page>
      <TitleRow title="Perfil" subtitle={`${profile.email} · desde el ${formatDate(profile.created_at, { day: "numeric", month: "long", year: "numeric" })}`} />
      <div className="flex flex-col">
        <Row title="Tus datos" description="Tu WhatsApp es por donde te avisamos cuando tu tarea esté lista.">
          <ProfileForm
            initial={{ full_name: profile.full_name, whatsapp: profile.whatsapp, level: profile.level, institution: profile.institution, career: profile.career }}
          />
        </Row>
        <Row title="Contraseña" description="Usa al menos 8 caracteres.">
          <PasswordForm />
        </Row>
        <Row title="Tu información" description="Descarga todo lo que guardamos de ti, o borra tu cuenta.">
          <div className="flex flex-col gap-4">
            <div>
              <a href="/api/export" className="app-btn app-btn-secondary">
                Descargar mis datos
              </a>
              <p className="hint">Perfil, tareas, mensajes y pagos en un archivo JSON.</p>
            </div>
            <DangerZone email={profile.email} />
          </div>
        </Row>
      </div>
    </Page>
  );
}

function Row({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="grid grid-cols-1 gap-4 border-b border-line py-8 first:pt-0 last:border-0 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:gap-10">
      <div className="md:pt-2">
        <h2 className="text-[17px] font-bold">{title}</h2>
        <p className="mt-1 text-[14.5px] text-ink-soft">{description}</p>
      </div>
      <div className="rounded-[16px] bg-surface p-4 md:p-5">{children}</div>
    </section>
  );
}
