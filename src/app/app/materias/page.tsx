import Link from "next/link";
import { EmptyState, Page, TitleRow } from "@/components/app/Page";
import { requireUser } from "@/lib/auth";
import type { Subject } from "@/lib/types";
import { NewSubject } from "./SubjectForms";

export const metadata = { title: "Materias" };

export default async function SubjectsPage() {
  const { profile, supabase } = await requireUser();
  const [{ data: subjects }, { data: mats }] = await Promise.all([
    supabase.from("subjects").select("*").eq("user_id", profile.id).order("name"),
    supabase.from("materials").select("id, subject_id, status").eq("user_id", profile.id),
  ]);
  const subs = (subjects ?? []) as Subject[];
  const count = (id: string | null) => (mats ?? []).filter((m) => m.subject_id === id).length;
  const loose = count(null);

  return (
    <Page>
      <TitleRow title="Materias" subtitle="Agrupa tus clases y pon la fecha del parcial para verla en Inicio." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="panel lg:col-span-8" aria-label="Tus materias">
          {subs.length === 0 ? (
            <EmptyState>Todavía no tienes materias. Crea la primera a la derecha.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-2">
              {subs.map((s) => (
                <li key={s.id}>
                  <Link href={`/app/materias/${s.id}`} className="card flex min-h-[63px] items-center justify-between gap-3 px-4 py-3 hover:border-control">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-medium">{s.name}</p>
                      <p className="text-[13px] text-soft">
                        {count(s.id)} {count(s.id) === 1 ? "clase" : "clases"}
                      </p>
                    </div>
                    <span className="text-[13px] text-soft">
                      {s.exam_date
                        ? `Parcial: ${new Intl.DateTimeFormat("es-VE", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(s.exam_date))}`
                        : "Sin fecha"}
                    </span>
                  </Link>
                </li>
              ))}
              {loose > 0 && (
                <li className="px-1 pt-2 text-[13px] text-soft">
                  {loose} {loose === 1 ? "clase sin materia" : "clases sin materia"}: asígnalas desde «Editar» en cada clase.
                </li>
              )}
            </ul>
          )}
        </section>
        <aside className="lg:col-span-4">
          <NewSubject />
        </aside>
      </div>
    </Page>
  );
}
