"use client";
import { useEffect, useState } from "react";

const STATES = ["pdf", "zoom", "card"] as const;

/** El hueco de la frase: un fragmento vivo del producto que cambia cada 2,6 s. */
export function HeroSlot() {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % STATES.length), 2600);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span
      data-ui
      aria-hidden="true"
      className="hero-slot relative inline-block overflow-hidden align-baseline bg-ink"
      style={{ width: "2.7em", height: "0.78em", borderRadius: "0.12em", verticalAlign: "-0.02em" }}
    >
      {STATES.map((s, n) => (
        <span
          key={s}
          className="absolute inset-0 flex items-center"
          style={{
            opacity: n === i ? 1 : 0,
            transform: n === i ? "translateY(0)" : n === (i + STATES.length - 1) % STATES.length ? "translateY(-30%)" : "translateY(30%)",
            transition: "opacity 420ms var(--ease-out), transform 520ms var(--ease-out)",
          }}
        >
          {s === "pdf" && <PdfFragment />}
          {s === "zoom" && <ZoomFragment />}
          {s === "card" && <CardFragment />}
        </span>
      ))}
    </span>
  );
}

function PdfFragment() {
  return (
    <span className="flex h-full w-full items-center" style={{ gap: "0.12em", padding: "0.07em 0.09em" }}>
      <span className="flex h-full flex-col bg-white" style={{ width: "0.5em", padding: "0.05em", gap: "0.03em", borderRadius: "0.03em" }}>
        <span className="block bg-ink" style={{ height: "0.05em", width: "70%" }} />
        <span className="block bg-[#ff87ab]" style={{ height: "0.16em" }} />
        <span className="block bg-[#d9d9d9]" style={{ height: "0.03em" }} />
        <span className="block bg-[#d9d9d9]" style={{ height: "0.03em", width: "80%" }} />
        <span className="block bg-[#d9d9d9]" style={{ height: "0.03em", width: "60%" }} />
      </span>
      <span className="flex flex-col justify-center text-[var(--bg)]" style={{ lineHeight: 1.1 }}>
        <span className="label" data-label="Clase 5.pdf" style={{ fontSize: "0.2em", letterSpacing: "-0.03em", fontWeight: 600 }} />
        <span className="label" data-label="Microeconomía · 18 páginas" style={{ fontSize: "0.11em", letterSpacing: "-0.01em", fontWeight: 400, color: "#ffffffcc" }} />
      </span>
    </span>
  );
}

function ZoomFragment() {
  const bars = [3, 6, 4, 8, 5, 9, 7, 4, 6, 10, 6, 3, 7, 5, 8, 4, 6, 3];
  return (
    <span className="flex h-full w-full flex-col justify-center" style={{ padding: "0.07em 0.12em", gap: "0.05em" }}>
      <span className="flex items-end" style={{ gap: "0.03em", height: "0.34em" }}>
        {bars.map((h, n) => (
          <span key={n} className="block bg-accent" style={{ width: "0.05em", height: `${h * 10}%`, borderRadius: "0.02em" }} />
        ))}
      </span>
      <span className="label text-[var(--bg)]" data-label="Zoom · 1:12:40" style={{ fontSize: "0.15em", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1 }} />
    </span>
  );
}

function CardFragment() {
  return (
    <span className="flex h-full w-full items-center bg-accent" style={{ padding: "0.07em 0.12em" }}>
      <span className="flex flex-col text-ink" style={{ lineHeight: 1.1, gap: "0.03em" }}>
        <span className="label" data-label="Ficha 3 de 24" style={{ fontSize: "0.11em", fontWeight: 500, letterSpacing: "-0.01em" }} />
        <span className="label" data-label="Ep = %ΔQ ÷ %ΔP" style={{ fontSize: "0.2em", fontWeight: 600, letterSpacing: "-0.03em" }} />
      </span>
    </span>
  );
}
