"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelTask, rateTask, requestRevision, sendMessage } from "@/app/app/actions";
import { Icon } from "@/components/app/Icon";
import { Chat } from "@/components/task/Chat";
import type { StoredFile, TaskMessage, TaskStatus } from "@/lib/types";

export function StudentChat({ taskId, userId, messages, urls, disabled }: { taskId: string; userId: string; messages: TaskMessage[]; urls: Record<string, string>; disabled: boolean }) {
  return (
    <Chat
      messages={messages}
      urls={urls}
      side="student"
      uploadFolder={userId}
      disabled={disabled}
      send={async (body: string, files: StoredFile[]) => {
        const r = await sendMessage(taskId, body, files);
        return r.ok ? { ok: true } : { ok: false, error: r.error };
      }}
    />
  );
}

export function StudentTaskActions({
  taskId,
  status,
  rating,
  revisionsLeft,
  cancelOnly = false,
}: {
  taskId: string;
  status: TaskStatus;
  rating: number | null;
  revisionsLeft: number;
  cancelOnly?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"idle" | "revision" | "cancel">("idle");
  const [text, setText] = useState("");
  const [stars, setStars] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);

  if (cancelOnly) {
    return mode === "cancel" ? (
      <div className="rounded-[14px] border border-[#ecc3bf] p-4">
        <p className="text-[14.5px]">¿Cancelar esta tarea? Nadie la ha empezado, así que vuelve a tu cupo.</p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            className="app-btn app-btn-danger"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await cancelTask(taskId);
                setMsg(r.ok ? r.message ?? null : r.error);
                router.refresh();
              })
            }
          >
            Sí, cancelar
          </button>
          <button type="button" className="app-btn app-btn-ghost" onClick={() => setMode("idle")}>
            No
          </button>
        </div>
        {msg && <p className="mt-2 text-[13.5px] text-ink-soft">{msg}</p>}
      </div>
    ) : (
      <button type="button" className="app-btn app-btn-ghost self-start text-[14px] !text-ink-soft" onClick={() => setMode("cancel")}>
        Cancelar tarea
      </button>
    );
  }

  if (status === "cerrada") {
    return rating ? (
      <p className="mt-5 flex items-center gap-1 text-[14.5px] text-ink-soft">
        Calificaste esta tarea con {rating} de 5
        <Icon name="star" className="size-4 fill-hilo text-hilo-deep" />
      </p>
    ) : null;
  }
  if (status !== "entregada") return null;

  return (
    <div className="mt-6 border-t border-[#c8dcef] pt-5">
      {mode === "revision" ? (
        <div className="flex flex-col gap-3">
          <label htmlFor="rev" className="field-label !mb-0">
            ¿Qué hay que corregir?
          </label>
          <textarea id="rev" className="field !min-h-[96px]" value={text} onChange={(e) => setText(e.target.value)} maxLength={3000} placeholder="El ejercicio 4 no da el resultado del libro, y faltó la portada." />
          <div className="flex gap-2">
            <button
              type="button"
              className="app-btn"
              disabled={pending || text.trim().length < 10}
              onClick={() =>
                start(async () => {
                  const r = await requestRevision(taskId, text);
                  setMsg(r.ok ? r.message ?? null : r.error);
                  if (r.ok) setMode("idle");
                  router.refresh();
                })
              }
            >
              Pedir corrección
            </button>
            <button type="button" className="app-btn app-btn-ghost" onClick={() => setMode("idle")}>
              Volver
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-[15px] font-semibold">¿Cómo quedó?</p>
            <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Calificación de 1 a 5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={stars === n}
                  aria-label={`${n} de 5`}
                  onClick={() => setStars(n)}
                  className="grid size-11 place-items-center rounded-[10px] transition-transform duration-150 active:scale-[0.9]"
                >
                  <Icon name="star" className={`size-7 transition-colors duration-150 ${n <= stars ? "fill-hilo text-hilo-deep" : "text-line-strong"}`} />
                </button>
              ))}
            </div>
          </div>
          {stars > 0 && (
            <>
              <label htmlFor="comentario" className="sr-only">
                Comentario
              </label>
              <input id="comentario" className="field" value={text} onChange={(e) => setText(e.target.value)} placeholder="Comentario (opcional)" maxLength={500} />
              <button
                type="button"
                className="app-btn self-start"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const r = await rateTask(taskId, stars, text);
                    setMsg(r.ok ? r.message ?? null : r.error);
                    router.refresh();
                  })
                }
              >
                Enviar calificación
              </button>
            </>
          )}
          {revisionsLeft > 0 && (
            <button type="button" className="app-btn app-btn-secondary self-start" onClick={() => setMode("revision")}>
              Pedir una corrección ({revisionsLeft} {revisionsLeft === 1 ? "disponible" : "disponibles"})
            </button>
          )}
        </div>
      )}
      {msg && (
        <p className="mt-3 text-[14px] text-ink-soft" role="status">
          {msg}
        </p>
      )}
    </div>
  );
}
