"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/app/Icon";
import { RichText } from "@/components/app/RichText";
import { compressImage, safeName } from "@/lib/client-upload";
import { timeAgo } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { StoredFile, TaskMessage } from "@/lib/types";

type Send = (body: string, files: StoredFile[]) => Promise<{ ok: boolean; error?: string }>;

/** Chat de la tarea entre el estudiante y el equipo. `side` decide qué mensajes van a la derecha. */
export function Chat({
  messages,
  urls,
  side,
  uploadFolder,
  send,
  disabled,
  placeholder = "Escribe un mensaje…",
}: {
  messages: TaskMessage[];
  urls: Record<string, string>;
  side: "student" | "staff";
  uploadFolder: string;
  send: Send;
  disabled?: boolean;
  placeholder?: string;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Revisa si hay mensajes nuevos cada 20 s mientras la pestaña está visible.
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 20000);
    return () => clearInterval(t);
  }, [router]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() && !file) return;
    setBusy(true);
    setError(null);
    try {
      const files: StoredFile[] = [];
      if (file) {
        const f = await compressImage(file);
        const path = `${uploadFolder}/${Date.now()}-${safeName(f.name)}`;
        const { error: upErr } = await createClient().storage.from("tasks").upload(path, f, { contentType: f.type || undefined });
        if (upErr) throw new Error("No se pudo subir el archivo.");
        files.push({ path, name: file.name, size: f.size, type: f.type });
      }
      const r = await send(text, files);
      if (!r.ok) throw new Error(r.error || "No se pudo enviar.");
      setText("");
      setFile(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3">
        {messages.length === 0 && <p className="text-[14px] text-ink-soft">Aún no hay mensajes. Si quieres aclarar algo de la tarea, escríbelo aquí.</p>}
        {messages.map((m) => {
          const mine = side === "staff" ? m.from_staff : !m.from_staff;
          return (
            <div key={m.id} className={`flex max-w-[86%] flex-col gap-1 ${mine ? "self-end items-end" : "self-start items-start"}`}>
              <div className={`rounded-[16px] px-4 py-2.5 text-[15px] leading-[1.45] ${mine ? "rounded-br-[6px] bg-marino text-papel" : "rounded-bl-[6px] bg-surface text-marino"}`}>
                {m.body && <RichText text={m.body} className="prose-kit" />}
                {m.files.map((f) => (
                  <a key={f.path} href={urls[f.path]} target="_blank" rel="noopener" className="mt-1 flex items-center gap-2 font-semibold underline underline-offset-4">
                    <Icon name="paperclip" className="size-4" />
                    {f.name}
                  </a>
                ))}
              </div>
              <span className="px-1 text-[12px] text-ink-soft">
                {m.from_staff ? (side === "staff" ? "Equipo" : "Equipo") : side === "staff" ? "Estudiante" : "Tú"} · {timeAgo(m.created_at)}
              </span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      {!disabled && (
        <form onSubmit={submit} className="mt-4">
          {file && (
            <p className="mb-2 flex items-center justify-between gap-2 rounded-[10px] bg-surface px-3 py-2 text-[13.5px]">
              <span className="truncate">{file.name}</span>
              <button type="button" className="text-ink-soft underline" onClick={() => setFile(null)}>
                Quitar
              </button>
            </p>
          )}
          <div className="flex items-end gap-2 rounded-[16px] border border-line-strong bg-white p-1.5 focus-within:border-marino-3">
            <input id={`adj-${side}`} type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <label htmlFor={`adj-${side}`} className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-[10px] text-ink-soft hover:bg-surface" title="Adjuntar">
              <Icon name="paperclip" className="size-5" />
              <span className="sr-only">Adjuntar archivo</span>
            </label>
            <label htmlFor={`msg-${side}`} className="sr-only">
              Mensaje
            </label>
            <textarea
              id={`msg-${side}`}
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholder}
              maxLength={4000}
              className="max-h-[160px] min-h-[40px] flex-1 resize-none bg-transparent px-1 py-2 text-[15px] outline-none"
            />
            <button type="submit" className="app-btn !h-10 !w-10 !p-0" disabled={busy || (!text.trim() && !file)} aria-label="Enviar">
              <Icon name="send" />
            </button>
          </div>
          {error && (
            <p className="mt-2 text-[13.5px] text-rojo" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
