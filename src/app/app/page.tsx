import Link from "next/link";
import { Icon } from "@/components/app/Icon";
import { KindIcon, RequestPill, StatusPill } from "@/components/app/Pills";
import { EmptyState, Page, UsageBar } from "@/components/app/Page";
import { requireUser } from "@/lib/auth";
import { formatDate, KIND_LABEL, timeAgo } from "@/lib/format";
import { effectivePlan, startOfMonthIso } from "@/lib/plans";
import type { HelpRequest, Material, Subject } from "@/lib/types";

function greetingWord() {
  const h = Number(new Intl.DateTimeFormat("es-VE", { hour: "numeric", hour12: false, timeZone: "America/Caracas" }).format(new Date()));
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

function daysUntil(date: string) {
  const today = new Date(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Caracas" }).format(new Date()));
  return Math.round((new Date(date).getTime() - today.getTime()) / 86_400_000);
}

export default async function Home() {
  const { profile, supabase } = await requireUser();
  const plan = effectivePlan(profile.plan, profile.plan_expires_at);
  const monthStart = startOfMonthIso();

  const [{ data: materials }, { data: subjects }, { data: requests }, { count: usedThisMonth }] = await Promise.all([
    supabase
      .from("materials")
      .select("id, title, kind, status, subject_id, created_at, processed_at, kit, progress, error")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(60),
    supabase.from("subjects").select("*").eq("user_id", profile.id).order("exam_date", { ascending: true, nullsFirst: false }),
    supabase.from("help_requests").select("id, subject, topic, status, created_at, responded_at").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(4),
    supabase.from("materials").select("id", { count: "exact", head: true }).eq("user_id", profile.id).eq("status", "ready").gte("processed_at", monthStart),
  ]);

  const mats = (materials ?? []) as Pick<Material, "id" | "title" | "kind" | "status" | "subject_id" | "created_at" | "processed_at" | "kit" | "progress" | "error">[];
  const subs = (subjects ?? []) as Subject[];
  const reqs = (requests ?? []) as Pick<HelpRequest, "id" | "subject" | "topic" | "status" | "created_at" | "responded_at">[];
  const subjectName = new Map(subs.map((s) => [s.id, s.name]));

  const ready = mats.filter((m) => m.status === "ready" && m.kit);
  const cardsTotal = ready.reduce((a, m) => a + (m.kit?.flashcards.length ?? 0), 0);
  const cardsKnown = ready.reduce((a, m) => a + Object.values(m.progress?.cards ?? {}).filter((b) => b >= 3).length, 0);
  const cardsToReview = cardsTotal - cardsKnown;
  const quizScores = ready.map((m) => m.progress?.quiz_best).filter((n): n is number => typeof n === "number");
  const quizAvg = quizScores.length ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length) : null;
  const answered = reqs.filter((r) => r.status === "respondido").length;

  const upcoming = subs
    .filter((s) => s.exam_date && daysUntil(s.exam_date) >= 0)
    .sort((a, b) => daysUntil(a.exam_date!) - daysUntil(b.exam_date!));
  const next = upcoming[0];

  const first = (profile.full_name || "").split(" ")[0] || "";
  let fact = "Sube tu próxima clase y te la dejamos lista para repasar.";
  if (next) {
    const d = daysUntil(next.exam_date!);
    fact = `Tu parcial de ${next.name} es ${d === 0 ? "hoy" : d === 1 ? "mañana" : `en ${d} días`}.`;
  } else if (cardsToReview > 0) {
    fact = `Tienes ${cardsToReview} fichas por repasar.`;
  }

  const today = formatDate(new Date().toISOString(), { weekday: "long", day: "numeric", month: "long" });

  return (
    <Page>
      <header className="mb-10 lg:mb-12">
        <h1 className="text-[24px] font-normal leading-[1.25] tracking-[-0.02em] md:text-[28px]">
          {greetingWord()}
          {first ? `, ${first}` : ""}. {fact}
        </h1>
        <p className="mt-1 text-[14px] text-soft first-letter:uppercase">{today}</p>
      </header>

      {/* Cuatro conteos, en una sola fila dividida */}
      <section aria-label="Tu mes" className="grid grid-cols-2 gap-[2px] overflow-hidden rounded-[16px] md:grid-cols-4">
        <Tile label="Clases este mes" value={`${usedThisMonth ?? 0}`} suffix={`de ${plan.materialsPerMonth}`} caption={`Plan ${plan.name}`} />
        <Tile label="Fichas por repasar" value={`${cardsToReview}`} caption={cardsTotal ? `${cardsKnown} ya dominadas` : "Aparecen al subir una clase"} />
        <Tile label="Promedio en quiz" value={quizAvg === null ? "—" : `${quizAvg}`} suffix={quizAvg === null ? "" : "%"} caption={quizScores.length ? `Mejor intento de ${quizScores.length} quiz` : "Aún sin intentos"} />
        <Tile label="Respuestas del equipo" value={`${answered}`} caption={reqs.length ? `${reqs.length} envíos en total` : "Pide una explicación"} />
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Clases recientes */}
        <section aria-labelledby="recientes" className="panel lg:col-span-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="recientes" className="text-[14px] font-semibold">
              Clases recientes <span className="num ml-1 font-normal text-soft">{mats.length}</span>
            </h2>
            <Link href="/app/materias" className="text-[13px] font-medium text-soft hover:text-text">
              Ver todas
            </Link>
          </div>
          {mats.length === 0 ? (
            <EmptyState
              action={
                <Link href="/app/subir" className="app-btn">
                  Subir mi primera clase
                </Link>
              }
            >
              Todavía no has subido clases.
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-2">
              {mats.slice(0, 6).map((m) => (
                <li key={m.id}>
                  <Link href={`/app/m/${m.id}`} className="card flex min-h-[63px] items-center gap-3 px-4 py-3 transition-colors hover:border-control">
                    <KindIcon kind={m.kind} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">{m.kit?.title || m.title}</p>
                      <p className="truncate text-[13px] text-soft">
                        {[m.subject_id ? subjectName.get(m.subject_id) : null, KIND_LABEL[m.kind], timeAgo(m.created_at)].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <StatusPill status={m.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Subir y uso del plan */}
        <section aria-labelledby="subir" className="panel flex flex-col gap-5 lg:col-span-4">
          <div>
            <h2 id="subir" className="text-[14px] font-semibold">
              Subir una clase
            </h2>
            <p className="mt-1 text-[14px] text-soft">PDF, láminas, Word, fotos, audio o video.</p>
            <Link href="/app/subir" className="app-btn mt-4 w-full">
              <Icon name="upload" />
              Elegir archivo
            </Link>
          </div>
          <div className="flex flex-col gap-4 border-t border-line pt-5">
            <UsageBar label="Clases este mes" used={usedThisMonth ?? 0} total={plan.materialsPerMonth} />
            {plan.id === "gratis" ? (
              <p className="text-[13px] text-soft">
                Con Repaso tienes 30 clases al mes y grabaciones de Zoom.{" "}
                <Link href="/app/plan" className="font-medium text-text underline underline-offset-4">
                  Ver planes
                </Link>
              </p>
            ) : (
              <p className="text-[13px] text-soft">Tu plan vence el {formatDate(profile.plan_expires_at, { day: "numeric", month: "long" })}.</p>
            )}
          </div>
        </section>

        {/* Materias y parciales */}
        <section aria-labelledby="materias" className="panel lg:col-span-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="materias" className="text-[14px] font-semibold">
              Materias <span className="num ml-1 font-normal text-soft">{subs.length}</span>
            </h2>
            <Link href="/app/materias" className="text-[13px] font-medium text-soft hover:text-text">
              Organizar
            </Link>
          </div>
          {subs.length === 0 ? (
            <EmptyState>Crea una materia al subir tu primera clase.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-2">
              {subs.slice(0, 5).map((s) => {
                const count = mats.filter((m) => m.subject_id === s.id).length;
                const d = s.exam_date ? daysUntil(s.exam_date) : null;
                return (
                  <li key={s.id}>
                    <Link href={`/app/materias/${s.id}`} className="card flex min-h-[56px] items-center justify-between gap-3 px-4 py-3 hover:border-control">
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-medium">{s.name}</p>
                        <p className="text-[13px] text-soft">
                          {count} {count === 1 ? "clase" : "clases"}
                        </p>
                      </div>
                      {d !== null && d >= 0 ? (
                        <span className={`pill ${d <= 3 ? "pill-data" : ""}`}>{d === 0 ? "Parcial hoy" : d === 1 ? "Parcial mañana" : `Parcial en ${d} días`}</span>
                      ) : (
                        <span className="text-[13px] text-soft">Sin fecha de parcial</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Envíos al equipo */}
        <section aria-labelledby="envios" className="panel lg:col-span-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="envios" className="text-[14px] font-semibold">
              Pide una explicación
            </h2>
            <Link href="/app/ayuda" className="text-[13px] font-medium text-soft hover:text-text">
              Nuevo envío
            </Link>
          </div>
          {reqs.length === 0 ? (
            <EmptyState>¿Una clase que ni con resumen se entiende? Mándasela al equipo.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-2">
              {reqs.map((r) => (
                <li key={r.id}>
                  <Link href={`/app/ayuda#r-${r.id}`} className="card flex min-h-[56px] items-center justify-between gap-3 px-4 py-3 hover:border-control">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-medium">{r.topic}</p>
                      <p className="truncate text-[13px] text-soft">
                        {r.subject} · {timeAgo(r.created_at)}
                      </p>
                    </div>
                    <RequestPill status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Page>
  );
}

function Tile({ label, value, suffix, caption }: { label: string; value: string; suffix?: string; caption: string }) {
  return (
    <div className="flex min-h-[128px] flex-col justify-between bg-panel p-4">
      <p className="text-[13px] text-soft">{label}</p>
      <p className="num text-[30px] font-normal leading-none tracking-[-0.02em]">
        {value}
        {suffix ? <span className="ml-1 text-[14px] text-soft">{suffix}</span> : null}
      </p>
      <p className="text-[13px] text-soft">{caption}</p>
    </div>
  );
}
