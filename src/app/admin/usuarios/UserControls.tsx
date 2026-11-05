"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { giveCredits, setRole, setUserPlan } from "@/app/admin/actions";
import { formatDate } from "@/lib/format";

const NAMES: Record<string, string> = { gratis: "Sin plan", basico: "Básico", pro: "Pro", full: "Full" };

export function UserControls({
  userId,
  isSelf,
  role,
  plan,
  expires,
  credits,
}: {
  userId: string;
  isSelf: boolean;
  role: string;
  plan: string;
  expires: string | null;
  credits: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [p, setP] = useState(plan as "gratis" | "basico" | "pro" | "full");
  const [months, setMonths] = useState(1);
  const [gift, setGift] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? "Guardado" : r.error ?? "Error");
      router.refresh();
    });

  if (!open)
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 md:justify-end">
        <span className="text-[14px]">
          {NAMES[plan]}
          {expires && <span className="text-ink-soft"> hasta {formatDate(expires, { day: "numeric", month: "short" })}</span>} · {credits} sueltas
        </span>
        <button type="button" className="app-btn app-btn-secondary !h-10" onClick={() => setOpen(true)}>
          Gestionar
        </button>
      </div>
    );

  return (
    <div className="flex flex-col gap-3 rounded-[12px] bg-surface p-3">
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Plan" className="field !h-10 !w-auto" value={p} onChange={(e) => setP(e.target.value as typeof p)}>
          {Object.entries(NAMES).map(([id, n]) => (
            <option key={id} value={id}>
              {n}
            </option>
          ))}
        </select>
        {p !== "gratis" && (
          <select aria-label="Meses" className="field !h-10 !w-auto" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
            {[1, 2, 3, 6, 12].map((n) => (
              <option key={n} value={n}>
                +{n} {n === 1 ? "mes" : "meses"}
              </option>
            ))}
          </select>
        )}
        <button type="button" className="app-btn !h-10" disabled={pending} onClick={() => run(() => setUserPlan(userId, p, months))}>
          Guardar plan
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Tareas a regalar" className="field !h-10 !w-auto" value={gift} onChange={(e) => setGift(Number(e.target.value))}>
          {[1, 2, 3, 5, 10].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "tarea" : "tareas"}
            </option>
          ))}
        </select>
        <button type="button" className="app-btn app-btn-secondary !h-10" disabled={pending} onClick={() => run(() => giveCredits(userId, gift))}>
          Regalar tareas sueltas
        </button>
      </div>
      {!isSelf && role !== "admin" && (
        <button
          type="button"
          className="app-btn app-btn-ghost !h-10 self-start"
          disabled={pending}
          onClick={() => run(() => setRole(userId, role === "staff" ? "student" : "staff"))}
        >
          {role === "staff" ? "Quitar del equipo" : "Sumar al equipo"}
        </button>
      )}
      <div className="flex items-center justify-between">
        {msg && <span className="text-[13px] text-ink-soft">{msg}</span>}
        <button type="button" className="ml-auto text-[13.5px] font-semibold underline" onClick={() => setOpen(false)}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
