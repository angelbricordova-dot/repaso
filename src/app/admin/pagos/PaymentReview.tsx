"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { approvePayment, rejectPayment } from "../actions";

export function PaymentReview({ id }: { id: string }) {
  const router = useRouter();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (rejecting)
    return (
      <div className="flex w-full flex-col gap-2 md:w-[260px]">
        <label htmlFor={`note-${id}`} className="sr-only">
          Motivo
        </label>
        <input id={`note-${id}`} className="field !h-9" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Motivo (lo verá el estudiante)" maxLength={300} />
        <div className="flex gap-2">
          <button
            type="button"
            className="app-btn app-btn-danger !h-9"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await rejectPayment(id, note);
                if (!r.ok) setError(r.error);
                router.refresh();
              })
            }
          >
            Rechazar pago
          </button>
          <button type="button" className="app-btn app-btn-ghost !h-9" onClick={() => setRejecting(false)}>
            Cancelar
          </button>
        </div>
        {error && <p className="text-[12px] text-negative">{error}</p>}
      </div>
    );
  return (
    <div className="flex gap-2">
      <button
        type="button"
        className="app-btn !h-9"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await approvePayment(id);
            if (!r.ok) setError(r.error);
            router.refresh();
          })
        }
      >
        Aprobar y activar
      </button>
      <button type="button" className="app-btn app-btn-secondary !h-9" onClick={() => setRejecting(true)}>
        Rechazar
      </button>
      {error && <p className="text-[12px] text-negative">{error}</p>}
    </div>
  );
}
