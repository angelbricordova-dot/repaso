import { formatDue } from "@/lib/format";
import type { Task } from "@/lib/types";

/** Recibida → En proceso → Entregada, con el estado actual resaltado. */
export function Timeline({ task }: { task: Pick<Task, "status" | "created_at" | "delivered_at" | "due_at"> }) {
  const order = ["recibida", "en_proceso", "entregada"] as const;
  const at = task.status === "necesita_info" || task.status === "corrigiendo" ? 1 : task.status === "cerrada" ? 2 : Math.max(0, order.indexOf(task.status as (typeof order)[number]));
  const steps = [
    { label: "Recibida", sub: formatDue(task.created_at) },
    {
      label: task.status === "necesita_info" ? "Necesita información" : task.status === "corrigiendo" ? "En corrección" : "En proceso",
      sub: task.status === "necesita_info" ? "Responde en el chat para seguir" : at >= 1 ? "El equipo la está trabajando" : "Esperando a que alguien la tome",
    },
    { label: "Entregada", sub: task.delivered_at ? formatDue(task.delivered_at) : `Pedida para ${formatDue(task.due_at)}` },
  ];
  if (task.status === "cancelada") {
    return <p className="rounded-[12px] bg-surface px-4 py-3 text-[15px] text-ink-soft">Cancelaste esta tarea. Se devolvió a tu cupo.</p>;
  }
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Estado de la tarea">
      {steps.map((s, i) => {
        const done = i < at || (i === at && (i === 2 || task.status === "cerrada"));
        const current = i === at && !done;
        const attention = current && task.status === "necesita_info";
        return (
          <li key={s.label} aria-current={current ? "step" : undefined} className="flex flex-col gap-2">
            <span
              className="h-1.5 rounded-full transition-colors duration-300"
              style={{ background: done ? "var(--verde)" : current ? (attention ? "var(--hilo-deep)" : "var(--marino-3)") : "var(--line)" }}
            />
            <span className={`text-[14px] font-semibold leading-tight ${current || done ? "text-marino" : "text-ink-soft"}`}>{s.label}</span>
            <span className="text-[12.5px] leading-snug text-ink-soft">{s.sub}</span>
          </li>
        );
      })}
    </ol>
  );
}
