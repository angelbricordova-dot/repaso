import Link from "next/link";
import { StatusPill } from "@/components/app/Pills";
import { dueIn, formatDue, isPast } from "@/lib/format";
import { TASK_TYPE_LABEL } from "@/lib/tasks";
import type { Task } from "@/lib/types";

/** Una tarea como ticket: número, título, materia y la hora de entrega siempre visible. */
export function TaskRow({ task, href, meta }: { task: Pick<Task, "id" | "number" | "title" | "subject" | "task_type" | "status" | "due_at" | "urgent">; href: string; meta?: string }) {
  const overdue = isPast(task.due_at) && ["recibida", "en_proceso", "necesita_info", "corrigiendo"].includes(task.status);
  return (
    <Link href={href} className="card flex items-stretch gap-0 overflow-hidden transition-[border-color,transform] duration-150 hover:border-line-strong active:scale-[0.99]">
      <span className="num flex w-[64px] shrink-0 flex-col items-center justify-center border-r border-dashed border-line-strong bg-surface text-center">
        <span className="text-[11px] font-semibold text-ink-soft">N.º</span>
        <span className="font-[family-name:var(--font-display)] text-[18px] font-bold leading-none">{task.number}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1 px-4 py-3">
        <span className="flex items-start justify-between gap-3">
          <span className="truncate text-[15.5px] font-semibold">{task.title}</span>
          <StatusPill status={task.status} />
        </span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px] text-ink-soft">
          <span>{task.subject}</span>
          <span aria-hidden="true">·</span>
          <span>{TASK_TYPE_LABEL[task.task_type]}</span>
          <span aria-hidden="true">·</span>
          <span className={overdue ? "font-semibold text-rojo" : ""} title={formatDue(task.due_at)}>
            Entrega {formatDue(task.due_at)} ({dueIn(task.due_at)})
          </span>
          {task.urgent && <span className="pill pill-urgent !h-5 !text-[11.5px]">Urgente</span>}
          {meta && (
            <>
              <span aria-hidden="true">·</span>
              <span>{meta}</span>
            </>
          )}
        </span>
      </span>
    </Link>
  );
}
