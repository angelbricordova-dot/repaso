"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createSubject, deleteSubject, updateSubject } from "@/app/app/actions";

export function NewSubject() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="panel flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await createSubject(name, date || null);
          if (!r.ok) return setError(r.error);
          setName("");
          setDate("");
          setError(null);
          router.refresh();
        });
      }}
    >
      <h2 className="text-[14px] font-semibold">Nueva materia</h2>
      <div>
        <label htmlFor="s-name" className="field-label">
          Nombre
        </label>
        <input id="s-name" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Derecho Constitucional" maxLength={80} required />
      </div>
      <div>
        <label htmlFor="s-date" className="field-label">
          Fecha del próximo parcial <span className="font-normal text-soft">(opcional)</span>
        </label>
        <input id="s-date" type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      {error && <p className="text-[13px] text-negative">{error}</p>}
      <button type="submit" className="app-btn" disabled={pending}>
        Crear materia
      </button>
    </form>
  );
}

export function EditSubject({ id, name, examDate }: { id: string; name: string; examDate: string | null }) {
  const router = useRouter();
  const [n, setN] = useState(name);
  const [d, setD] = useState(examDate ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div className="panel flex flex-col gap-4">
      <h2 className="text-[14px] font-semibold">Ajustes de la materia</h2>
      <div>
        <label htmlFor="e-name" className="field-label">
          Nombre
        </label>
        <input id="e-name" className="field" value={n} onChange={(e) => setN(e.target.value)} maxLength={80} />
      </div>
      <div>
        <label htmlFor="e-date" className="field-label">
          Fecha del próximo parcial
        </label>
        <input id="e-date" type="date" className="field" value={d} onChange={(e) => setD(e.target.value)} />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="app-btn"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await updateSubject(id, { name: n, exam_date: d || null });
              setMsg(r.ok ? "Guardado" : r.error);
              router.refresh();
            })
          }
        >
          Guardar
        </button>
        {msg && (
          <span className="text-[13px] text-soft" role="status">
            {msg}
          </span>
        )}
      </div>
      <div className="border-t border-line pt-4">
        {confirm ? (
          <div className="flex flex-col gap-3">
            <p className="text-[14px]">Se borrará la materia «{name}». Sus clases no se borran: quedan sin materia.</p>
            <div className="flex gap-2">
              <button
                type="button"
                className="app-btn app-btn-danger"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    await deleteSubject(id);
                    router.push("/app/materias");
                    router.refresh();
                  })
                }
              >
                Sí, borrar materia
              </button>
              <button type="button" className="app-btn app-btn-ghost" onClick={() => setConfirm(false)}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="app-btn app-btn-danger" onClick={() => setConfirm(true)}>
            Borrar materia
          </button>
        )}
      </div>
    </div>
  );
}
