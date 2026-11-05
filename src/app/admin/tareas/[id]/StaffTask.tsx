"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deliverTask, setTaskStatus, staffMessage, takeTask } from "@/app/admin/actions";
import { Icon } from "@/components/app/Icon";
import { Chat } from "@/components/task/Chat";
import { safeName } from "@/lib/client-upload";
import { createClient } from "@/lib/supabase/client";
import type { StoredFile, TaskMessage, TaskStatus } from "@/lib/types";

export function StaffChat({ taskId, studentId, messages, urls, disabled }: { taskId: string; studentId: string; messages: TaskMessage[]; urls: Record<string, string>; disabled: boolean }) {
  const [ask, setAsk] = useState(false);
  return (
    <div>
      <Chat
        messages={messages}
        urls={urls}
        side="staff"
        uploadFolder={`${studentId}/entregas`}
        disabled={disabled}
        placeholder={ask ? "¿Qué información te falta?" : "Escribe al estudiante…"}
        send={async (body: string, files: StoredFile[]) => {
          const r = await staffMessage(taskId, body, files, ask);
          if (r.ok) setAsk(false);
          return r.ok ? { ok: true } : { ok: false, error: r.error };
        }}
      />
      {!disabled && (
        <label className="mt-2 flex items-center gap-2 text-[14px]">
          <input type="checkbox" checked={ask} onChange={(e) => setAsk(e.target.checked)} className="size-4 accent-[#14234a]" />
          Pausar la tarea hasta que responda (necesita información)
        </label>
      )}
    </div>
  );
}

export function StatusControls({ taskId, status, assignedToMe, assigneeName }: { taskId: string; status: TaskStatus; assignedToMe: boolean; assigneeName: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? null : r.error ?? "Error");
      router.refresh();
    });

  return (
    <section aria-label="Acciones" className="panel flex flex-col gap-3">
      <p className="text-[14px] text-ink-soft">{assigneeName ? (assignedToMe ? "La tienes tú." : `La tiene ${assigneeName}.`) : "Nadie la ha tomado."}</p>
      {!assignedToMe && ["recibida", "en_proceso", "corrigiendo", "necesita_info"].includes(status) && (
        <button type="button" className="app-btn app-btn-hilo w-full" disabled={pending} onClick={() => run(() => takeTask(taskId))}>
          {assigneeName ? "Tomarla yo" : "Tomar esta tarea"}
        </button>
      )}
      {status === "necesita_info" && (
        <button type="button" className="app-btn app-btn-secondary w-full" disabled={pending} onClick={() => run(() => setTaskStatus(taskId, "en_proceso"))}>
          Ya tengo la información, seguir
        </button>
      )}
      {status === "entregada" && (
        <button type="button" className="app-btn app-btn-secondary w-full" disabled={pending} onClick={() => run(() => setTaskStatus(taskId, "cerrada"))}>
          Cerrar tarea
        </button>
      )}
      {msg && <p className="text-[13.5px] text-rojo">{msg}</p>}
    </section>
  );
}

export function DeliverForm({ taskId, studentId, hasDelivery, initialNote }: { taskId: string; studentId: string; hasDelivery: boolean; initialNote: string }) {
  const router = useRouter();
  const [note, setNote] = useState(initialNote);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const supabase = createClient();
      const stored: StoredFile[] = [];
      for (const [i, f] of files.entries()) {
        const path = `${studentId}/entregas/${Date.now()}-${i}-${safeName(f.name)}`;
        const { error } = await supabase.storage.from("tasks").upload(path, f, { contentType: f.type || undefined });
        if (error) throw new Error(`No se pudo subir «${f.name}».`);
        stored.push({ path, name: f.name, size: f.size, type: f.type });
      }
      const r = await deliverTask(taskId, note, stored);
      if (!r.ok) throw new Error(r.error);
      setFiles([]);
      setMsg(r.message ?? "Entregada.");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Algo salió mal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
      <label htmlFor="nota" className="field-label !mb-0">
        Explicación para el estudiante
      </label>
      <textarea
        id="nota"
        className="field !min-h-[140px]"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Resumen de cómo se resolvió, pasos clave y cualquier cosa que deba saber para entregarla. Puedes usar listas con guiones."
      />
      <input
        id="entrega-archivos"
        type="file"
        multiple
        className="sr-only"
        onChange={(e) => {
          const picked = Array.from(e.target.files ?? []);
          setFiles((p) => [...p, ...picked].slice(0, 20));
          e.target.value = "";
        }}
      />
      <label htmlFor="entrega-archivos" className="app-btn app-btn-secondary cursor-pointer self-start">
        <Icon name="paperclip" />
        {files.length ? `${files.length} archivo(s) listos` : hasDelivery ? "Agregar más archivos" : "Adjuntar la tarea resuelta"}
      </label>
      {files.length > 0 && (
        <ul className="flex flex-col gap-1 text-[14px]">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2">
              <span className="truncate">{f.name}</span>
              <button type="button" className="text-ink-soft underline" onClick={() => setFiles((p) => p.filter((_, n) => n !== i))}>
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="submit" className="app-btn self-start" disabled={busy}>
        {busy ? "Entregando…" : hasDelivery ? "Volver a entregar" : "Entregar al estudiante"}
      </button>
      {msg && (
        <p className="text-[14px] text-ink-soft" role="status">
          {msg}
        </p>
      )}
    </form>
  );
}
