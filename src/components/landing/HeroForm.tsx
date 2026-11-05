"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Level } from "@/lib/types";
import { LevelSelect } from "./LevelSelect";

const WHEN = [
  { id: "manana", label: "Mañana", days: 1 },
  { id: "2dias", label: "En 2 días", days: 2 },
  { id: "semana", label: "Esta semana", days: 5 },
];

/** El formulario de la portada: elegir nivel viste toda la página con ese uniforme. */
export function HeroForm({ signedIn, priceLine }: { signedIn: boolean; priceLine: string }) {
  const router = useRouter();
  const [level, setLevel] = useState<Level>("bachillerato");
  const [subject, setSubject] = useState("");
  const [when, setWhen] = useState("2dias");

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-landing]");
    if (root) root.dataset.uniform = level;
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute("content", level === "universidad" ? "#14234a" : level === "diversificado" ? "#e8d6b0" : "#a9d2f0");
  }, [level]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const days = WHEN.find((w) => w.id === when)?.days ?? 2;
    const due = new Date(Date.now() + days * 86_400_000);
    due.setHours(18, 0, 0, 0);
    // Nunca menos de 25 horas: las entregas de menos de 24 h son urgentes y no están en todos los planes.
    const floor = Date.now() + 25 * 3_600_000;
    if (due.getTime() < floor) due.setTime(Math.ceil(floor / 3_600_000) * 3_600_000);
    const q = new URLSearchParams({ nivel: level, materia: subject.trim(), entrega: due.toISOString() });
    router.push(`${signedIn ? "/app/nueva" : "/registro"}?${q.toString()}`);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <LevelSelect value={level} onChange={setLevel} label="¿En qué nivel estás?" />
      <div className="rounded-[14px] bg-papel p-3 text-marino shadow-[0_10px_30px_-16px_rgba(20,35,74,0.55)] sm:p-4">
        <label htmlFor="hero-materia" className="sr-only">
          Materia
        </label>
        <input
          id="hero-materia"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="¿De qué materia es? Ej: Química"
          maxLength={80}
          autoComplete="off"
          className="h-12 w-full rounded-[10px] bg-surface px-4 text-[17px] text-marino outline-none placeholder:text-[#66708a] focus:bg-white focus:shadow-[inset_0_0_0_2px_var(--marino-3)]"
        />
        <fieldset className="mt-3">
          <legend className="mb-2 px-1 text-[14px] font-semibold">¿Para cuándo la necesitas?</legend>
          <div className="grid grid-cols-3 gap-2">
            {WHEN.map((w) => (
              <label
                key={w.id}
                className={`flex min-h-[44px] cursor-pointer items-center justify-center rounded-[10px] px-2 text-center text-[15px] font-semibold transition-[background-color,transform,box-shadow] duration-150 active:scale-[0.97] ${
                  when === w.id ? "bg-marino text-papel" : "bg-surface text-marino shadow-[inset_0_0_0_1px_var(--line)]"
                }`}
              >
                <input type="radio" name="when" value={w.id} checked={when === w.id} onChange={() => setWhen(w.id)} className="sr-only" />
                {w.label}
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" className="btn mt-4 w-full">
          Mandar mi tarea gratis
        </button>
        <p className="mt-3 text-center text-[14px] text-ink-soft">{priceLine}</p>
      </div>
    </form>
  );
}
