"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createTask } from "@/app/app/actions";
import { Icon } from "@/components/app/Icon";
import { LevelSelect } from "@/components/landing/LevelSelect";
import { compressImage, safeName } from "@/lib/client-upload";
import { formatBytes } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { TASK_TYPES, URGENT_HOURS } from "@/lib/tasks";
import type { Level, StoredFile, TaskType } from "@/lib/types";

const SUBJECTS = ["Matemática", "Física", "Química", "Biología", "Castellano", "Inglés", "Historia", "GHC", "Contabilidad", "Estadística"];
const MAX_MB = 50;

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function NewTaskForm({
  userId,
  initial,
  recentSubjects,
  planLeft,
  credits,
  planName,
  allowUrgent,
  minHours,
}: {
  userId: string;
  initial: { level: Level; subject: string; dueAt: string | null };
  recentSubjects: string[];
  planLeft: number;
  credits: number;
  planName: string | null;
  allowUrgent: boolean;
  minHours: number;
}) {
  const router = useRouter();
  const [level, setLevel] = useState<Level>(initial.level);
  const [subject, setSubject] = useState(initial.subject);
  const [taskType, setTaskType] = useState<TaskType>("ejercicios");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [links, setLinks] = useState("");
  const [due, setDue] = useState(() => {
    if (initial.dueAt) return toLocalInput(new Date(initial.dueAt));
    const d = new Date(Date.now() + 2 * 86_400_000);
    d.setHours(18, 0, 0, 0);
    return toLocalInput(d);
  });
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<string | null>(null);
  const [error, setError] = useState<{ text: string; needsPlan?: boolean } | null>(null);

  const [now] = useState(() => Date.now());
  const hours = useMemo(() => (due ? (new Date(due).getTime() - now) / 3_600_000 : NaN), [due, now]);
  const urgent = hours < URGENT_HOURS;
  const cost = urgent ? 2 : 1;
  const available = planLeft + credits;
  const dueProblem = Number.isNaN(hours)
    ? "Elige la fecha y hora de entrega."
    : hours < 3
      ? "La entrega debe ser dentro de 3 horas o más."
      : urgent && !allowUrgent
        ? "Para menos de 24 horas necesitas el plan Pro o Full."
        : hours < minHours
          ? `Con tu plan, la entrega debe ser con ${minHours} horas o más.`
          : null;

  const subjectChips = [...new Set([...recentSubjects, ...SUBJECTS])].slice(0, 10);

  function addFiles(list: FileList | null) {
    const picked = Array.from(list ?? []);
    const big = picked.find((f) => f.size > MAX_MB * 1024 * 1024);
    if (big) setError({ text: `«${big.name}» pesa más de ${MAX_MB} MB. Compártelo como enlace de Drive.` });
    setFiles((prev) => [...prev, ...picked.filter((f) => f.size <= MAX_MB * 1024 * 1024)].slice(0, 15));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (dueProblem) return setError({ text: dueProblem, needsPlan: urgent && !allowUrgent });
    const linkList = links.split(/\s+/).map((l) => l.trim()).filter(Boolean);
    if (linkList.some((l) => !/^https?:\/\//i.test(l))) return setError({ text: "Los enlaces deben empezar por https://" });
    setBusy(true);
    try {
      const supabase = createClient();
      const stored: StoredFile[] = [];
      for (const [i, raw] of files.entries()) {
        setStage(files.length > 1 ? `Subiendo archivo ${i + 1} de ${files.length}…` : "Subiendo archivo…");
        const f = await compressImage(raw);
        const path = `${userId}/${Date.now()}-${i}-${safeName(f.name)}`;
        const { error: upErr } = await supabase.storage.from("tasks").upload(path, f, { contentType: f.type || undefined });
        if (upErr) throw new Error("No se pudo subir un archivo. Revisa tu conexión e intenta de nuevo.");
        stored.push({ path, name: raw.name, size: f.size, type: f.type });
      }
      setStage("Mandando tu tarea…");
      const r = await createTask({
        level,
        subject: subject.trim(),
        taskType,
        title: title.trim(),
        instructions: instructions.trim(),
        files: stored,
        links: linkList,
        dueAt: new Date(due).toISOString(),
      });
      if (!r.ok) {
        setError({ text: r.error, needsPlan: r.needsPlan });
        setBusy(false);
        setStage(null);
        return;
      }
      router.push(`/app/tareas/${r.id}?nueva=1`);
      router.refresh();
    } catch (err) {
      setError({ text: err instanceof Error ? err.message : "Algo salió mal." });
      setBusy(false);
      setStage(null);
    }
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
      <div className="flex flex-col gap-6">
        <div>
          <span className="field-label">Nivel</span>
          <LevelSelect value={level} onChange={setLevel} label="Nivel" />
        </div>

        <div>
          <label htmlFor="materia" className="field-label">
            Materia
          </label>
          <input id="materia" className="field" value={subject} onChange={(e) => setSubject(e.target.value)} required maxLength={80} placeholder="Química" autoComplete="off" />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {subjectChips.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSubject(s)}
                className={`h-10 rounded-full px-3.5 text-[14.5px] font-medium transition-[background-color,transform] duration-150 active:scale-[0.96] ${
                  subject === s ? "bg-marino text-papel" : "bg-surface text-marino hover:bg-celeste-soft"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <fieldset>
          <legend className="field-label">Tipo de tarea</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TASK_TYPES.map((t) => (
              <label
                key={t.id}
                className={`flex min-h-[44px] cursor-pointer items-center justify-center rounded-[10px] px-2 text-center text-[14px] font-semibold leading-tight transition-[background-color,transform] duration-150 active:scale-[0.97] ${
                  taskType === t.id ? "bg-marino text-papel" : "bg-surface text-marino shadow-[inset_0_0_0_1px_var(--line)]"
                }`}
              >
                <input type="radio" name="tipo" value={t.id} checked={taskType === t.id} onChange={() => setTaskType(t.id)} className="sr-only" />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="titulo" className="field-label">
            ¿Qué hay que hacer?
          </label>
          <input id="titulo" className="field" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} maxLength={140} placeholder="Balancear 6 ecuaciones químicas" />
        </div>

        <div>
          <span className="field-label">Enunciado</span>
          <input
            id="archivos"
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
            className="sr-only"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
            aria-describedby="archivos-hint"
          />
          <label
            htmlFor="archivos"
            className="flex min-h-[112px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-line-strong bg-surface px-4 py-5 text-center transition-colors hover:border-marino-3 active:scale-[0.99]"
          >
            <Icon name="paperclip" className="size-6 text-marino-3" />
            <span className="text-[16px] font-semibold">Tomar foto o subir archivo</span>
            <span id="archivos-hint" className="text-[13.5px] text-ink-soft">
              Fotos, PDF, Word o PowerPoint. Hasta 15 archivos de {MAX_MB} MB.
            </span>
          </label>
          {files.length > 0 && (
            <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="card flex items-center gap-3 px-3 py-2">
                  {f.type.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={URL.createObjectURL(f)} alt="" className="size-11 shrink-0 rounded-[8px] object-cover" />
                  ) : (
                    <span className="grid size-11 shrink-0 place-items-center rounded-[8px] bg-surface text-[11px] font-bold text-ink-soft">
                      {f.name.split(".").pop()?.toUpperCase().slice(0, 4)}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium">{f.name}</span>
                    <span className="num text-[12.5px] text-ink-soft">{formatBytes(f.size)}</span>
                  </span>
                  <button type="button" onClick={() => setFiles((p) => p.filter((_, n) => n !== i))} className="grid size-10 place-items-center rounded-[8px] text-ink-soft hover:bg-surface" aria-label={`Quitar ${f.name}`}>
                    <Icon name="x" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label htmlFor="instrucciones" className="field-label">
            Instrucciones <span className="font-normal text-ink-soft">(opcional si subiste el enunciado)</span>
          </label>
          <textarea
            id="instrucciones"
            className="field"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            maxLength={6000}
            placeholder="Lo que pidió el profesor: formato, número de páginas, normas APA, si es a mano o en digital…"
          />
        </div>

        <details className="group">
          <summary className="cursor-pointer list-none text-[15px] font-semibold text-marino-3">+ Agregar enlaces (Drive, Classroom, YouTube)</summary>
          <textarea
            aria-label="Enlaces, uno por línea"
            className="field mt-2 !min-h-[80px]"
            value={links}
            onChange={(e) => setLinks(e.target.value)}
            placeholder="https://drive.google.com/…"
          />
        </details>
      </div>

      {/* Resumen y envío: en el teléfono queda al final; en escritorio, a la derecha y fijo */}
      <aside className="lg:sticky lg:top-8 lg:self-start">
        <div className="rounded-[20px] bg-celeste p-5">
          <label htmlFor="entrega" className="field-label">
            ¿Para cuándo la necesitas?
          </label>
          <input id="entrega" type="datetime-local" className="field" value={due} onChange={(e) => setDue(e.target.value)} required />
          <p className={`mt-2 text-[14px] ${dueProblem ? "font-semibold text-rojo" : "text-[#2f3f66]"}`} aria-live="polite">
            {dueProblem ?? (urgent ? `Urgente: faltan ${Math.round(hours)} horas. Cuenta como 2 tareas.` : `Faltan ${hours < 48 ? `${Math.round(hours)} horas` : `${Math.round(hours / 24)} días`}. Cuenta como 1 tarea.`)}
          </p>

          <div className="mt-4 rounded-[12px] bg-papel p-3 text-[14px]">
            <p className="flex justify-between gap-2">
              <span>Disponibles</span>
              <span className="num font-semibold">{available}</span>
            </p>
            <p className="mt-1 text-[13px] text-ink-soft">
              {planName ? `${planLeft} de tu plan ${planName}` : "Sin plan"}
              {credits ? ` · ${credits} ${credits === 1 ? "suelta" : "sueltas"}` : ""}
            </p>
          </div>

          <button type="submit" className="btn mt-4 w-full" disabled={busy || available < cost}>
            {busy ? "Mandando…" : available < cost ? "Sin tareas disponibles" : "Mandar tarea"}
          </button>
          {stage && (
            <p className="mt-2 text-[13.5px] text-[#2f3f66]" role="status">
              {stage}
            </p>
          )}
          {error && (
            <p className="mt-3 rounded-[10px] bg-papel px-3 py-2 text-[14px] font-medium text-rojo" role="alert">
              {error.text}{" "}
              {error.needsPlan && (
                <Link href="/app/plan" className="underline">
                  Ver planes
                </Link>
              )}
            </p>
          )}
          {available < cost && !error && (
            <Link href="/app/plan" className="mt-3 block text-center text-[14px] font-semibold underline">
              Elegir un plan o comprar tareas sueltas
            </Link>
          )}
        </div>
      </aside>
    </form>
  );
}
