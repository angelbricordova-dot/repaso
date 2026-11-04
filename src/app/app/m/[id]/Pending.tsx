"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { processMaterial } from "@/lib/client-upload";

export function Pending({ id, status, error, kind, startedAt }: { id: string; status: string; error: string | null; kind: string; startedAt: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(error);
  const auto = useRef(false);

  async function run() {
    setBusy(true);
    setErr(null);
    try {
      await processMaterial(id, setStage);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Algo salió mal.");
      setBusy(false);
      setStage(null);
    }
  }

  // Si quedó pendiente (por ejemplo, se cerró la pestaña al subir), lo retomamos solo.
  useEffect(() => {
    if (status === "pending" && !auto.current) {
      auto.current = true;
      run();
    }
    if (status === "processing") {
      const t = setInterval(() => router.refresh(), 8000);
      return () => clearInterval(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const processing = busy || status === "processing";
  const recording = kind === "audio" || kind === "video";

  return (
    <section className="panel max-w-[720px]" aria-live="polite">
      {processing ? (
        <>
          <h2 className="text-[16px] font-semibold">Estamos preparando tu repaso</h2>
          <p className="mt-1 text-[14px] text-soft">
            {stage || (recording ? "Transcribiendo la clase. Una grabación de una hora tarda unos minutos." : "Leyendo el material y armando resumen, fichas y quiz.")}
          </p>
          <div className="mt-5 grid gap-3" aria-hidden="true">
            <div className="skeleton h-5 w-2/3" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
            <div className="skeleton h-4 w-3/4" />
          </div>
          {startedAt && !busy && <p className="mt-4 text-[13px] text-soft">Puedes salir de esta página: el proceso sigue y lo verás listo al volver.</p>}
        </>
      ) : (
        <>
          <h2 className="text-[16px] font-semibold">{status === "error" ? "No pudimos preparar este material" : "Este material está pendiente"}</h2>
          {err && <p className="mt-2 rounded-[10px] bg-[#ffedea] px-3 py-2 text-[14px] text-[#831c1e]">{err}</p>}
          <button type="button" onClick={run} className="app-btn mt-4">
            Intentar de nuevo
          </button>
        </>
      )}
    </section>
  );
}
