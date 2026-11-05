"use client";
import { useEffect, useRef, useState } from "react";

const STEPS = [
  { label: "Recibida", time: "Lun 4:12 p. m.", note: "Llegaron las 2 fotos del enunciado." },
  { label: "En proceso", time: "Lun 6:40 p. m.", note: "María la está resolviendo." },
  { label: "Entregada", time: "Mar 9:05 a. m.", note: "Ejercicios resueltos con el paso a paso." },
];

/** Un ticket de tarea que avanza solo cuando entra en pantalla. Datos de ejemplo. */
export function TicketDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = requestAnimationFrame(() => setStep(2));
      return () => cancelAnimationFrame(id);
    }
    let timers: ReturnType<typeof setTimeout>[] = [];
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        timers = [setTimeout(() => setStep(1), 700), setTimeout(() => setStep(2), 1700)];
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div ref={ref} data-ui className="relative w-full max-w-[420px] rounded-[18px] bg-papel p-5 text-marino shadow-[0_24px_60px_-30px_rgba(20,35,74,0.6)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold text-ink-soft">Tarea n.º 214 · ejemplo</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-[22px] font-bold leading-[1.1] tracking-[-0.02em]">Química: balanceo de ecuaciones</p>
        </div>
        <span className="tape shrink-0 !min-h-[30px] !text-[13px]">4to año</span>
      </div>
      <p className="mt-2 text-[14px] text-ink-soft">Entrega pedida: martes 10:00 a. m.</p>

      <ol className="mt-5 flex flex-col gap-0">
        {STEPS.map((s, i) => {
          const done = i <= step;
          return (
            <li key={s.label} className="relative flex gap-3 pb-4 last:pb-0">
              {i < STEPS.length - 1 && (
                <span aria-hidden="true" className="absolute left-[11px] top-6 bottom-0 w-[2px] rounded bg-line">
                  <span
                    className="block w-full rounded bg-marino transition-[height] duration-500"
                    style={{ height: i < step ? "100%" : "0%", transitionTimingFunction: "var(--ease-out)" }}
                  />
                </span>
              )}
              <span
                aria-hidden="true"
                className="relative z-10 mt-0.5 grid size-6 shrink-0 place-items-center rounded-full transition-[background-color,transform] duration-300"
                style={{ background: done ? (i === 2 ? "var(--verde)" : "var(--marino)") : "var(--line)", transform: done ? "scale(1)" : "scale(0.85)" }}
              >
                {done && (
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 12.5 4.5 4.5L19 7.5" />
                  </svg>
                )}
              </span>
              <div className="min-w-0 flex-1 transition-opacity duration-300" style={{ opacity: done ? 1 : 0.45 }}>
                <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-[15px] font-semibold">
                  {s.label}
                  <span className="num text-[13px] font-medium text-ink-soft">{s.time}</span>
                </p>
                <p className="text-[14px] text-ink-soft">{s.note}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <div
        className="mt-4 flex items-center gap-3 rounded-[12px] bg-surface p-3 transition-[opacity,transform] duration-500"
        style={{ opacity: step === 2 ? 1 : 0, transform: step === 2 ? "none" : "translateY(6px)", transitionTimingFunction: "var(--ease-out)" }}
        aria-hidden={step !== 2}
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-[8px] bg-rojo text-[11px] font-bold text-white">PDF</span>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold">balanceo-resuelto.pdf</p>
          <p className="text-[13px] text-ink-soft">6 ejercicios · con explicación</p>
        </div>
      </div>
    </div>
  );
}
