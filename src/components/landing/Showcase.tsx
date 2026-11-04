"use client";
import { useEffect, useRef, useState } from "react";

const OPTIONS = [
  { label: "Elástica", correct: false },
  { label: "Inelástica", correct: true },
  { label: "Unitaria", correct: false },
  { label: "Perfectamente elástica", correct: false },
];

/**
 * Una clase, tres maneras de estudiarla. Un marco fijo en pantalla muestra la
 * misma clase como lámina, como resumen y como quiz mientras se hace scroll.
 * En la tercera etapa el visitante responde la pregunta de verdad.
 */
export function Showcase() {
  const [stage, setStage] = useState(0);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = sectionRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const travel = r.height - window.innerHeight;
      const progress = travel > 0 ? Math.min(Math.max(-r.top / travel, 0), 1) : 0;
      setStage(progress < 0.28 ? 0 : progress < 0.6 ? 1 : 2);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="ejemplo"
      aria-labelledby="ejemplo-title"
      data-ink="#0a0a0a"
      data-on="light"
      className="relative bg-bg"
      style={{ height: "250vh" }}
    >
      <div className="sticky top-0 flex h-svh flex-col items-center justify-center overflow-hidden wrap">
        <h2 id="ejemplo-title" className="display text-center" style={{ fontSize: "clamp(40px, 7.2vw, 116px)" }}>
          <span className="block">Una clase,</span>
          <span
            className="block"
            style={{
              position: "relative",
              zIndex: 2,
              opacity: stage >= 1 ? 1 : 0,
              transform: stage >= 1 ? "none" : "translateY(0.25em)",
              transition: "opacity 500ms var(--ease-out), transform 600ms var(--ease-out)",
            }}
          >
            tres formas.
          </span>
        </h2>

        <div className="mt-6 flex w-full items-start justify-center gap-10 md:mt-8">
          <div
            data-ui
            className="relative overflow-hidden bg-white text-[#111]"
            style={{ width: "min(30vw, 440px)", minWidth: "min(78vw, 340px)", aspectRatio: "4 / 5", maxHeight: "56svh" }}
          >
            <Stage show={stage === 0}>
              <Slide />
            </Stage>
            <Stage show={stage === 1}>
              <Summary />
            </Stage>
            <Stage show={stage === 2}>
              <Quiz />
            </Stage>
          </div>

          <p
            className="hidden max-w-[28ch] text-[17px] leading-[1.5] lg:block"
            style={{ opacity: stage === 2 ? 1 : 0, transition: "opacity 400ms var(--ease-out)" }}
          >
            Una pregunta del quiz que Repaso armó con esa lámina. Elige una respuesta: cada opción trae su explicación.
          </p>
        </div>

        <div className="mt-5 flex gap-2" aria-hidden="true">
          {["Lámina", "Resumen", "Quiz"].map((l, n) => (
            <span
              key={l}
              className="px-3 py-1 text-[14px] font-medium"
              style={{
                background: stage === n ? "var(--ink)" : "transparent",
                color: stage === n ? "var(--bg)" : "var(--ink)",
                transition: "background-color 250ms var(--ease-out), color 250ms var(--ease-out)",
              }}
            >
              {l}
            </span>
          ))}
        </div>
      </div>

    </section>
  );
}

function Stage({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <div
      className="absolute inset-0"
      aria-hidden={!show}
      style={{
        opacity: show ? 1 : 0,
        transform: show ? "scale(1)" : "scale(0.98)",
        transition: "opacity 420ms var(--ease-out), transform 520ms var(--ease-out)",
        pointerEvents: show ? "auto" : "none",
        visibility: show ? "visible" : "hidden",
        transitionProperty: "opacity, transform, visibility",
      }}
    >
      {children}
    </div>
  );
}

function Slide() {
  return (
    <div className="flex h-full flex-col p-[7%]">
      <div className="flex items-center justify-between text-[12px] text-[#5d5559]">
        <span>Microeconomía I · Clase 5</span>
        <span className="num">4 / 18</span>
      </div>
      <p className="mt-4 text-[clamp(18px,1.6vw,24px)] font-semibold leading-[1.1] tracking-[-0.02em]">
        Elasticidad precio de la demanda
      </p>
      <p className="mt-3 text-[14px] leading-[1.45]">Mide cuánto cambia la cantidad demandada cuando cambia el precio.</p>
      <p className="num mt-3 bg-[#fff0f4] px-3 py-2 text-[16px] font-semibold">Ep = %ΔQd ÷ %ΔP</p>
      <svg viewBox="0 0 200 120" className="mt-auto w-full" role="img" aria-label="Curva de demanda con pendiente negativa">
        <line x1="20" y1="10" x2="20" y2="105" stroke="#111" strokeWidth="1.5" />
        <line x1="20" y1="105" x2="195" y2="105" stroke="#111" strokeWidth="1.5" />
        <path d="M30 18 C 70 40, 110 70, 185 95" fill="none" stroke="#d93a72" strokeWidth="3" />
        <circle cx="96" cy="55" r="4" fill="#111" />
        <text x="6" y="16" fontSize="10" fill="#111">P</text>
        <text x="186" y="117" fontSize="10" fill="#111">Q</text>
        <text x="102" y="50" fontSize="10" fill="#111">Harina</text>
      </svg>
    </div>
  );
}

function Summary() {
  return (
    <div className="flex h-full flex-col overflow-hidden p-[7%]">
      <span className="text-[12px] text-[#5d5559]">Resumen · 4 secciones</span>
      <p className="mt-3 text-[clamp(17px,1.4vw,21px)] font-semibold leading-[1.15] tracking-[-0.02em]">Qué es la elasticidad</p>
      <p className="mt-2 text-[14px] leading-[1.5]">
        Es la sensibilidad de los compradores al precio. Si el precio sube 10% y compran 20% menos, la demanda es elástica.
      </p>
      <p className="mt-4 text-[clamp(17px,1.4vw,21px)] font-semibold leading-[1.15] tracking-[-0.02em]">De qué depende</p>
      <ul className="mt-2 space-y-1 text-[14px] leading-[1.45]">
        <li>— Si hay sustitutos cerca (arepa o pan).</li>
        <li>— Si es un bien básico o un lujo.</li>
        <li>— Cuánto pesa en el presupuesto.</li>
        <li>— El tiempo que tienes para ajustarte.</li>
      </ul>
      <p className="mt-auto bg-[#def915] px-3 py-2 text-[13px] font-medium">Lo que más preguntan: calcularla con dos puntos de la curva.</p>
    </div>
  );
}

function Quiz() {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  return (
    <div className="flex h-full flex-col p-[7%]">
      <span className="text-[12px] text-[#5d5559]">Quiz · pregunta 3 de 12</span>
      <p className="mt-3 text-[clamp(16px,1.3vw,19px)] font-semibold leading-[1.25] tracking-[-0.015em]">
        La harina de maíz sube 10% y en tu casa compran solo 2% menos. La demanda es…
      </p>
      <div className="mt-4 grid gap-2" role="group" aria-label="Opciones">
        {OPTIONS.map((o, n) => {
          const isPicked = picked === n;
          const showRight = answered && o.correct;
          const showWrong = answered && isPicked && !o.correct;
          return (
            <button
              key={o.label}
              type="button"
              disabled={answered}
              onClick={() => setPicked(n)}
              className="flex min-h-[44px] items-center justify-between px-3 text-left text-[15px] transition-[background-color,transform] duration-150 active:scale-[0.98]"
              style={{
                background: showRight ? "#def915" : showWrong ? "#ffd3e1" : "#f6eef1",
                color: "#111",
                cursor: answered ? "default" : "pointer",
              }}
            >
              <span>{o.label}</span>
              {showRight && <span className="text-[13px] font-medium">Correcta</span>}
              {showWrong && <span className="text-[13px] font-medium">No</span>}
            </button>
          );
        })}
      </div>
      <p
        className="mt-auto text-[13.5px] leading-[1.45]"
        aria-live="polite"
        style={{ opacity: answered ? 1 : 0.0001, transition: "opacity 300ms var(--ease-out)" }}
      >
        {answered
          ? "Inelástica: Ep = 2% ÷ 10% = 0,2, menor que 1. Es un bien básico con pocos sustitutos, así que se sigue comprando aunque suba."
          : "Elige una opción."}
      </p>
      {answered && (
        <button type="button" onClick={() => setPicked(null)} className="mt-2 self-start text-[13px] font-medium underline underline-offset-4">
          Responder de nuevo
        </button>
      )}
    </div>
  );
}
