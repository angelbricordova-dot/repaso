"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { respondRequest, setRequestStatus } from "@/app/admin/actions";
import { safeName } from "@/lib/client-upload";
import { createClient } from "@/lib/supabase/client";
import type { StoredFile } from "@/lib/types";

export function RespondForm({ id, studentId, status, initial }: { id: string; studentId: string; status: string; initial: string }) {
  const router = useRouter();
  const [text, setText] = useState(initial);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const supabase = createClient();
      const stored: StoredFile[] = [];
      for (const [i, f] of files.entries()) {
        // Se guarda en la carpeta del estudiante para que él pueda descargarlo.
        const path = `${studentId}/respuestas/${Date.now()}-${i}-${safeName(f.name)}`;
        const { error } = await supabase.storage.from("requests").upload(path, f, { contentType: f.type || undefined });
        if (error) throw new Error(`No se pudo subir «${f.name}».`);
        stored.push({ path, name: f.name, size: f.size, type: f.type });
      }
      const r = await respondRequest(id, text, stored);
      if (!r.ok) throw new Error(r.error);
      setFiles([]);
      setMsg("Respuesta enviada. El estudiante la ve en «Pide una explicación».");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Algo salió mal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label htmlFor="resp" className="sr-only">
        Explicación
      </label>
      <textarea
        id="resp"
        className="field !min-h-[220px]"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Explica el tema paso a paso. Puedes usar listas con guiones y **negritas**. También puedes adjuntar un PDF, audio o video con la explicación."
      />
      <div className="flex flex-wrap items-center gap-2">
        <input id="resp-files" type="file" multiple className="sr-only" onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 10))} />
        <label htmlFor="resp-files" className="app-btn app-btn-secondary">
          {files.length ? `${files.length} archivo(s) adjunto(s)` : "Adjuntar archivos"}
        </label>
        <button type="submit" className="app-btn" disabled={busy}>
          {busy ? "Enviando…" : "Enviar respuesta"}
        </button>
        {status === "recibido" && (
          <button
            type="button"
            className="app-btn app-btn-ghost"
            disabled={pending}
            onClick={() => start(async () => void (await setRequestStatus(id, "en_revision"), router.refresh()))}
          >
            Marcar en revisión
          </button>
        )}
        {status !== "cerrado" && (
          <button type="button" className="app-btn app-btn-ghost" disabled={pending} onClick={() => start(async () => void (await setRequestStatus(id, "cerrado"), router.refresh()))}>
            Cerrar
          </button>
        )}
      </div>
      {msg && (
        <p className="text-[13px] text-soft" role="status">
          {msg}
        </p>
      )}
    </form>
  );
}
