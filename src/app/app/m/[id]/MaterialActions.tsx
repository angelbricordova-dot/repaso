"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteMaterial, renameMaterial } from "@/app/app/actions";
import { Icon } from "@/components/app/Icon";
import type { Subject } from "@/lib/types";

export function MaterialActions({ id, title, subjectId, subjects }: { id: string; title: string; subjectId: string | null; subjects: Subject[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [t, setT] = useState(title);
  const [s, setS] = useState(subjectId ?? "");
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button type="button" className="app-btn app-btn-secondary !h-9" onClick={() => setOpen(true)}>
        Editar
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-labelledby="edit-title" className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-[440px] rounded-[16px] bg-white p-5 shadow-[0_12px_32px_rgba(0,0,0,0.18)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 id="edit-title" className="text-[16px] font-semibold">
                Editar material
              </h2>
              <button type="button" onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-[8px] hover:bg-panel" aria-label="Cerrar">
                <Icon name="x" />
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-4">
              <div>
                <label className="field-label" htmlFor="m-title">
                  Título
                </label>
                <input id="m-title" className="field" value={t} onChange={(e) => setT(e.target.value)} maxLength={140} />
              </div>
              <div>
                <label className="field-label" htmlFor="m-subject">
                  Materia
                </label>
                <select id="m-subject" className="field" value={s} onChange={(e) => setS(e.target.value)}>
                  <option value="">Sin materia</option>
                  {subjects.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
              </div>
              {error && <p className="text-[13px] text-negative">{error}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="app-btn"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const r = await renameMaterial(id, t, s || null);
                      if (!r.ok) return setError(r.error);
                      setOpen(false);
                      router.refresh();
                    })
                  }
                >
                  Guardar
                </button>
              </div>
              <div className="mt-2 border-t border-line pt-4">
                {confirm ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-[14px]">Se borrará «{title}» con su resumen, fichas, quiz y conversación con el tutor. No se puede deshacer.</p>
                    <div className="flex gap-2">
                      <button type="button" className="app-btn app-btn-danger" disabled={pending} onClick={() => start(() => deleteMaterial(id))}>
                        Sí, borrar material
                      </button>
                      <button type="button" className="app-btn app-btn-ghost" onClick={() => setConfirm(false)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" className="app-btn app-btn-danger" onClick={() => setConfirm(true)}>
                    <Icon name="trash" />
                    Borrar material
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
