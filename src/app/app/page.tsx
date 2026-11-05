import Link from "next/link";
import { Icon } from "@/components/app/Icon";
import { EmptyState, Page } from "@/components/app/Page";
import { TaskRow } from "@/components/app/TaskRow";
import { requireUser } from "@/lib/auth";
import { formatDate, formatDue } from "@/lib/format";
import { effectivePlan, REFERRAL_REWARD, startOfMonthIso } from "@/lib/plans";
import { ACTIVE_STATUSES } from "@/lib/tasks";
import type { Task } from "@/lib/types";

function hello() {
  const h = Number(new Intl.DateTimeFormat("es-VE", { hour: "numeric", hour12: false, timeZone: "America/Caracas" }).format(new Date()));
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

export default async function Home() {
  const { profile, supabase } = await requireUser();
  const plan = effectivePlan(profile.plan, profile.plan_expires_at);
  const { data } = await supabase
    .from("tasks")
    .select("id, number, title, subject, task_type, status, due_at, urgent, cost, paid_with, created_at, rating")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const tasks = (data ?? []) as (Pick<Task, "id" | "number" | "title" | "subject" | "task_type" | "status" | "due_at" | "urgent" | "cost" | "paid_with" | "created_at" | "rating">)[];

  const used = tasks.filter((t) => t.paid_with === "plan" && t.status !== "cancelada" && t.created_at >= startOfMonthIso()).reduce((a, t) => a + t.cost, 0);
  const left = Math.max(0, plan.tasksPerMonth - used);
  const available = left + profile.credits;

  const attention = tasks.filter((t) => t.status === "necesita_info" || (t.status === "entregada" && !t.rating));
  const active = tasks.filter((t) => ACTIVE_STATUSES.includes(t.status) && t.status !== "necesita_info").sort((a, b) => a.due_at.localeCompare(b.due_at));
  const next = active[0];

  const first = (profile.full_name || "").split(" ")[0];
  let fact = "Manda tu primera tarea: va por nuestra cuenta.";
  if (attention.some((t) => t.status === "necesita_info")) fact = "El equipo necesita un dato tuyo para seguir.";
  else if (attention.length) fact = attention.length === 1 ? "Tienes una tarea entregada por revisar." : `Tienes ${attention.length} tareas entregadas por revisar.`;
  else if (next) fact = `Tu tarea de ${next.subject} se entrega ${formatDue(next.due_at)}`.replace(/\.?$/, ".");
  else if (tasks.length) fact = "No tienes tareas en curso.";

  return (
    <Page>
      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-[26px] font-bold leading-[1.15] tracking-[-0.02em] md:text-[32px]">
          {hello()}
          {first ? `, ${first}` : ""}.
        </h1>
        <p className="mt-1 text-[16px] text-ink-soft">{fact}</p>
      </header>

      {/* Mandar una tarea: la acción más frecuente, siempre arriba */}
      <section aria-label="Mandar una tarea" className="flex flex-col gap-4 rounded-[20px] bg-celeste p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div>
          <p className="font-[family-name:var(--font-display)] text-[22px] font-bold tracking-[-0.02em]">
            {available > 0 ? `Tienes ${available} ${available === 1 ? "tarea disponible" : "tareas disponibles"}` : "No te quedan tareas este mes"}
          </p>
          <p className="mt-1 text-[14.5px] text-[#2f3f66]">
            {plan.tasksPerMonth > 0 ? `${left} de ${plan.tasksPerMonth} de tu plan ${plan.name}` : "Sin plan"}
            {profile.credits > 0 ? ` · ${profile.credits} ${profile.credits === 1 ? "suelta" : "sueltas"}` : ""}
            {plan.id !== "gratis" && profile.plan_expires_at ? ` · vence el ${formatDate(profile.plan_expires_at, { day: "numeric", month: "long" })}` : ""}
          </p>
        </div>
        {available > 0 ? (
          <Link href="/app/nueva" className="btn w-full sm:w-auto">
            <Icon name="plus" className="size-5" />
            Mandar una tarea
          </Link>
        ) : (
          <Link href="/app/plan" className="btn w-full sm:w-auto">
            Ver planes
          </Link>
        )}
      </section>

      {attention.length > 0 && (
        <section aria-labelledby="atencion" className="mt-8">
          <h2 id="atencion" className="mb-3 text-[17px] font-bold">
            Te toca a ti
          </h2>
          <ul className="flex flex-col gap-2">
            {attention.map((t) => (
              <li key={t.id}>
                <TaskRow task={t} href={`/app/tareas/${t.id}`} meta={t.status === "entregada" ? "Revísala y califícala" : "Responde en el chat"} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="curso" className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="curso" className="text-[17px] font-bold">
            En curso <span className="num ml-1 font-normal text-ink-soft">{active.length}</span>
          </h2>
          <Link href="/app/tareas" className="text-[14px] font-semibold text-marino-3 hover:underline">
            Ver todas
          </Link>
        </div>
        {active.length === 0 ? (
          <EmptyState action={<Link href="/app/nueva" className="app-btn">Mandar una tarea</Link>}>Aquí verás cada tarea con su estado y hora de entrega.</EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {active.map((t) => (
              <li key={t.id}>
                <TaskRow task={t} href={`/app/tareas/${t.id}`} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="invita" className="mt-8 flex flex-col gap-3 rounded-[20px] bg-beige p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="invita" className="text-[17px] font-bold">
            Gana {REFERRAL_REWARD} tareas por cada amigo
          </h2>
          <p className="mt-1 text-[14.5px] text-[#4a4130]">Comparte tu enlace en el grupo del salón. Te las regalamos cuando tu invitado pague su primer plan.</p>
        </div>
        <Link href="/app/invitar" className="app-btn shrink-0">
          <Icon name="gift" />
          Invitar
        </Link>
      </section>
    </Page>
  );
}
