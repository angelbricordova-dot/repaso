import Link from "next/link";
import { EmptyState, Page, TitleRow } from "@/components/app/Page";
import { TaskRow } from "@/components/app/TaskRow";
import { requireUser } from "@/lib/auth";
import type { Task } from "@/lib/types";

export const metadata = { title: "Mis tareas" };

const VIEWS = [
  { id: "curso", label: "En curso", statuses: ["recibida", "en_proceso", "necesita_info", "corrigiendo"] },
  { id: "entregadas", label: "Entregadas", statuses: ["entregada", "cerrada"] },
  { id: "canceladas", label: "Canceladas", statuses: ["cancelada"] },
] as const;

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { ver } = await searchParams;
  const view = VIEWS.find((v) => v.id === ver) ?? VIEWS[0];
  const { profile, supabase } = await requireUser();
  const { data } = await supabase
    .from("tasks")
    .select("id, number, title, subject, task_type, status, due_at, urgent")
    .eq("user_id", profile.id)
    .in("status", [...view.statuses])
    .order(view.id === "curso" ? "due_at" : "created_at", { ascending: view.id === "curso" })
    .limit(200);
  const tasks = (data ?? []) as Pick<Task, "id" | "number" | "title" | "subject" | "task_type" | "status" | "due_at" | "urgent">[];

  return (
    <Page>
      <TitleRow
        title="Mis tareas"
        actions={
          <Link href="/app/nueva" className="app-btn app-btn-hilo">
            Nueva tarea
          </Link>
        }
      />
      <nav aria-label="Filtrar tareas" className="-mx-4 mb-5 flex gap-1 overflow-x-auto px-4 md:mx-0 md:px-0">
        {VIEWS.map((v) => (
          <Link
            key={v.id}
            href={`/app/tareas?ver=${v.id}`}
            aria-current={v.id === view.id ? "page" : undefined}
            className={`flex h-10 shrink-0 items-center rounded-full px-4 text-[14.5px] font-semibold transition-colors ${
              v.id === view.id ? "bg-marino text-papel" : "bg-surface text-marino hover:bg-celeste-soft"
            }`}
          >
            {v.label}
          </Link>
        ))}
      </nav>
      {tasks.length === 0 ? (
        <EmptyState action={view.id === "curso" ? <Link href="/app/nueva" className="app-btn">Mandar una tarea</Link> : undefined}>
          {view.id === "curso" ? "No tienes tareas en curso." : view.id === "entregadas" ? "Aún no hay tareas entregadas." : "No has cancelado tareas."}
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map((t) => (
            <li key={t.id}>
              <TaskRow task={t} href={`/app/tareas/${t.id}`} />
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
