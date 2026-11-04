import Link from "next/link";
import { EmptyState, Page, TitleRow } from "@/components/app/Page";
import { RequestPill } from "@/components/app/Pills";
import { RichText } from "@/components/app/RichText";
import { requireUser } from "@/lib/auth";
import { formatDate, timeAgo } from "@/lib/format";
import { effectivePlan, startOfMonthIso } from "@/lib/plans";
import type { HelpRequest, Subject } from "@/lib/types";
import { HelpForm } from "./HelpForm";

export const metadata = { title: "Pide una explicación" };

export default async function HelpPage() {
  const { profile, supabase } = await requireUser();
  const plan = effectivePlan(profile.plan, profile.plan_expires_at);
  const [{ data: reqs }, { data: subjects }] = await Promise.all([
    supabase.from("help_requests").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }),
    supabase.from("subjects").select("name").eq("user_id", profile.id).order("name"),
  ]);
  const list = (reqs ?? []) as HelpRequest[];
  const usedThisMonth = list.filter((r) => r.created_at >= startOfMonthIso()).length;
  const left = Math.max(0, plan.helpRequestsPerMonth - usedThisMonth);

  // Enlaces firmados (1 hora) para descargar los archivos de las respuestas
  const signed = new Map<string, string>();
  const paths = list.flatMap((r) => [...(r.response_files ?? []), ...(r.files ?? [])].map((f) => f.path));
  if (paths.length) {
    const { data } = await supabase.storage.from("requests").createSignedUrls(paths, 3600);
    (data ?? []).forEach((d) => d.path && d.signedUrl && signed.set(d.path, d.signedUrl));
  }

  return (
    <Page>
      <TitleRow
        title="Pide una explicación"
        subtitle="¿Una clase que ni con el resumen se entiende? Mándanosla y una persona del equipo te prepara la explicación."
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="lg:col-span-7" aria-labelledby="nuevo">
          <h2 id="nuevo" className="sr-only">
            Nuevo envío
          </h2>
          {plan.helpRequestsPerMonth === 0 ? (
            <div className="panel">
              <p className="text-[16px] font-semibold">Disponible en los planes Repaso y Repaso+</p>
              <p className="mt-1 text-[14px] text-soft">
                Con Repaso tienes 1 envío al mes y con Repaso+ tienes 5, con prioridad. Envías la clase, las láminas o el enlace de la grabación y te respondemos aquí.
              </p>
              <Link href="/app/plan" className="app-btn mt-4">
                Ver planes
              </Link>
            </div>
          ) : (
            <HelpForm userId={profile.id} left={left} total={plan.helpRequestsPerMonth} subjects={((subjects ?? []) as Pick<Subject, "name">[]).map((s) => s.name)} />
          )}
        </section>

        <section className="panel lg:col-span-5" aria-labelledby="mis-envios">
          <h2 id="mis-envios" className="mb-4 text-[14px] font-semibold">
            Tus envíos <span className="num ml-1 font-normal text-soft">{list.length}</span>
          </h2>
          {list.length === 0 ? (
            <EmptyState>Aún no has enviado ninguna clase.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-3">
              {list.map((r) => (
                <li key={r.id} id={`r-${r.id}`} className="card scroll-mt-20 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium">{r.topic}</p>
                      <p className="text-[13px] text-soft">
                        {r.subject} · enviado {timeAgo(r.created_at)}
                        {r.exam_date ? ` · examen el ${formatDate(r.exam_date + "T12:00:00Z", { day: "numeric", month: "short" })}` : ""}
                      </p>
                    </div>
                    <RequestPill status={r.status} />
                  </div>
                  {r.admin_response ? (
                    <div className="mt-3 rounded-[10px] bg-panel p-3">
                      <p className="text-[13px] font-medium">Respuesta del equipo · {timeAgo(r.responded_at)}</p>
                      <RichText text={r.admin_response} className="prose-kit mt-1 text-[14px] leading-[1.55]" />
                      {r.response_files?.length > 0 && (
                        <ul className="mt-2 flex flex-col gap-1">
                          {r.response_files.map((f) => (
                            <li key={f.path}>
                              <a href={signed.get(f.path)} className="text-[14px] font-medium underline underline-offset-4" target="_blank" rel="noopener">
                                {f.name}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 text-[13px] text-soft">
                      {r.status === "en_revision" ? "Lo estamos preparando." : "Lo recibimos. Te avisamos aquí cuando esté listo."}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Page>
  );
}
