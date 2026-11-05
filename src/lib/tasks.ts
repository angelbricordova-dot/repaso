import type { Level, TaskStatus, TaskType } from "@/lib/types";

export const LEVELS: { id: Level; label: string; short: string; uniform: string }[] = [
  { id: "bachillerato", label: "1ero a 3er año", short: "1ero–3er año", uniform: "Camisa azul celeste" },
  { id: "diversificado", label: "4to y 5to año", short: "4to–5to año", uniform: "Camisa beige" },
  { id: "universidad", label: "Universidad", short: "Universidad", uniform: "Azul marino" },
];

export const LEVEL_LABEL: Record<Level, string> = Object.fromEntries(LEVELS.map((l) => [l.id, l.label])) as Record<Level, string>;

export const TASK_TYPES: { id: TaskType; label: string }[] = [
  { id: "ejercicios", label: "Ejercicios" },
  { id: "informe", label: "Informe" },
  { id: "ensayo", label: "Ensayo" },
  { id: "presentacion", label: "Presentación" },
  { id: "resumen", label: "Resumen" },
  { id: "mapa", label: "Mapa mental o conceptual" },
  { id: "ingles", label: "Inglés" },
  { id: "otro", label: "Otro" },
];
export const TASK_TYPE_LABEL: Record<TaskType, string> = Object.fromEntries(TASK_TYPES.map((t) => [t.id, t.label])) as Record<TaskType, string>;

export const STATUS: Record<TaskStatus, { label: string; tone: "neutral" | "progress" | "attention" | "done" | "muted" }> = {
  recibida: { label: "Recibida", tone: "neutral" },
  en_proceso: { label: "En proceso", tone: "progress" },
  necesita_info: { label: "Necesita información", tone: "attention" },
  entregada: { label: "Entregada", tone: "done" },
  corrigiendo: { label: "En corrección", tone: "progress" },
  cerrada: { label: "Cerrada", tone: "muted" },
  cancelada: { label: "Cancelada", tone: "muted" },
};

export const ACTIVE_STATUSES: TaskStatus[] = ["recibida", "en_proceso", "necesita_info", "corrigiendo"];

/** Las tareas con menos de 24 horas son urgentes y cuestan 2 tareas. */
export const URGENT_HOURS = 24;
export function hoursUntil(iso: string) {
  return (new Date(iso).getTime() - Date.now()) / 3_600_000;
}
