import Link from "next/link";
import { EmptyState, Page, TitleRow } from "@/components/app/Page";
import { TaskRow } from "@/components/app/TaskRow";
import { requireStaff } from "@/lib/auth";
import { isFuture } from "@/lib/format";
import { PLAN_PRIORITY, PLANS, type PlanId } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile, Task } from "@/lib/types";

export const metadata = { title: "Cola de tareas" };

const VIEWS = [
  { id: "hacer", label: "Por hacer", statuses: ["recibida", "en_proceso", "corrigiendo"] },
  { id: "info", label: "Esperando al estudiante", statuses: ["necesita_info"] },
  { id: "entregadas", label: "Entregadas", statuses: ["entregada", "cerrada"] },
  { id: "canceladas", label: "Canceladas", statuses: ["cancelada"] },
] as const;

export default async function Queue({ searchParams }: { searchParams: Promise<{ ver?: string; mias?: string }> }) {
  const { user } = await requireStaff();
  const sp = await searchParams;
  const view = VIEWS.find((v) => v.id === sp.ver) ?? VIEWS[0];
  const mine = sp.mias === "1";
  const db = createAdminClient();
  let q = db.from("tasks").select("*").in("status", [...view.statuses]).limit(300);
  if (mine) q = q.eq("assigned_to", user.id);
  q = view.id === "hacer" || view.id === "info" ? q.order("due_at") : q.order("updated_at", { ascending: false });
  const { data } = await q;
  const tasks = (data ?? []) as Task[];
  const ids = [...new Set(tasks.flatMap((t) => [t.user_id, t.assigned_to].filter(Boolean) as string[]))];
  const { data: people } = ids.length ? await db.from("profiles").select("id, full_name, email, plan, plan_expires_at").in("id", ids) : { data: [] };
  const who = new Map(((people ?? []) as Pick<Profile, "id" | "full_name" | "email" | "plan" | "plan_expires_at">[]).map((p) => [p.id, p]));
  const prio = (t: Task) => {
    const p = who.get(t.user_id);
    const active = isFuture(p?.plan_expires_at) ? (p!.plan as PlanId) : "gratis";
    return PLAN_PRIORITY[active];
  };
  // Primero lo que vence pronto; entre tareas que vencen el mismo día, el plan más alto va primero.
  if (view.id === "hacer") tasks.sort((a, b) => a.due_at.slice(0, 10).localeCompare(b.due_at.slice(0, 10)) || prio(b) - prio(a) || a.due_at.localeCompare(b.due_at));

  return (
    <Page wide>
      <TitleRow title="Cola de tareas" subtitle="Ordenada por hora de entrega. A igual día, los planes Full y Pro van primero." />
      <nav aria-label="Filtrar" className="-mx-4 mb-5 flex gap-1 overflow-x-auto px-4 md:mx-0 md:px-0">
        {VIEWS.map((v) => (
          <Link
            key={v.id}
            href={`/admin/tareas?ver=${v.id}${mine ? "&mias=1" : ""}`}
            aria-current={v.id === view.id ? "page" : undefined}
            className={`flex h-10 shrink-0 items-center rounded-full px-4 text-[14.5px] font-semibold ${v.id === view.id ? "bg-marino text-papel" : "bg-surface text-marino hover:bg-celeste-soft"}`}
          >
            {v.label}
          </Link>
        ))}
        <Link
          href={`/admin/tareas?ver=${view.id}${mine ? "" : "&mias=1"}`}
          className={`ml-auto flex h-10 shrink-0 items-center rounded-full px-4 text-[14.5px] font-semibold ${mine ? "bg-hilo text-marino" : "bg-surface text-marino"}`}
        >
          {mine ? "Solo las mías" : "Ver solo las mías"}
        </Link>
      </nav>
      {tasks.length === 0 ? (
        <EmptyState>No hay tareas aquí.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map((t) => {
            const s = who.get(t.user_id);
            const a = t.assigned_to ? who.get(t.assigned_to) : null;
            const p = PLANS[(s?.plan ?? "gratis") as PlanId];
            return (
              <li key={t.id}>
                <TaskRow
                  task={t}
                  href={`/admin/tareas/${t.id}`}
                  meta={`${s?.full_name || s?.email || "—"}${p && p.id !== "gratis" ? ` (${p.name})` : ""} · ${a ? `toma: ${(a.full_name || a.email).split(" ")[0]}` : "sin tomar"}`}
                />
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}
