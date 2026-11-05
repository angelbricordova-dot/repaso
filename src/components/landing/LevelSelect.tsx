"use client";
import { LEVELS } from "@/lib/tasks";
import type { Level } from "@/lib/types";

/**
 * Selector de nivel. La lista activa es una copia recortada con clip-path,
 * así el cambio de color es una sola transición limpia y no dos estados cruzándose.
 */
export function LevelSelect({ value, onChange, label = "Tu nivel" }: { value: Level; onChange: (l: Level) => void; label?: string }) {
  const index = LEVELS.findIndex((l) => l.id === value);
  const n = LEVELS.length;
  const left = (index / n) * 100;
  const right = ((n - index - 1) / n) * 100;
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {LEVELS.map((l) => (
        <button key={l.id} type="button" role="radio" aria-checked={value === l.id} onClick={() => onChange(l.id)}>
          {l.short}
        </button>
      ))}
      <div className="seg-active" aria-hidden="true" style={{ clipPath: `inset(0 ${right}% 0 ${left}% round 9px)` }}>
        {LEVELS.map((l) => (
          <span key={l.id}>{l.short}</span>
        ))}
      </div>
    </div>
  );
}
