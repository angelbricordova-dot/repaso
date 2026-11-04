"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setUserPlan } from "@/app/admin/actions";
import { formatDate } from "@/lib/format";

export function PlanSetter({ userId, plan, expires }: { userId: string; plan: string; expires: string | null }) {
  const router = useRouter();
  const [p, setP] = useState(plan as "gratis" | "repaso" | "repaso_plus");
  const [months, setMonths] = useState(1);
  const [pending, start] = useTransition();
  const [edit, setEdit] = useState(false);
  if (!edit)
    return (
      <div className="flex items-center gap-2">
        <span>
          {plan === "gratis" ? "Gratis" : plan === "repaso" ? "Repaso" : "Repaso+"}
          {expires && <span className="block text-[12px] text-soft">hasta {formatDate(expires, { day: "numeric", month: "short" })}</span>}
        </span>
        <button type="button" className="ml-auto text-[13px] font-medium underline underline-offset-4" onClick={() => setEdit(true)}>
          Cambiar
        </button>
      </div>
    );
  return (
    <div className="flex items-center gap-2">
      <label className="sr-only" htmlFor={`plan-${userId}`}>
        Plan
      </label>
      <select id={`plan-${userId}`} className="field !h-9 !w-auto" value={p} onChange={(e) => setP(e.target.value as typeof p)}>
        <option value="gratis">Gratis</option>
        <option value="repaso">Repaso</option>
        <option value="repaso_plus">Repaso+</option>
      </select>
      {p !== "gratis" && (
        <select aria-label="Meses" className="field !h-9 !w-auto" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
          {[1, 2, 3, 6, 12].map((n) => (
            <option key={n} value={n}>
              +{n} {n === 1 ? "mes" : "meses"}
            </option>
          ))}
        </select>
      )}
      <button
        type="button"
        className="app-btn !h-9"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await setUserPlan(userId, p, months);
            setEdit(false);
            router.refresh();
          })
        }
      >
        Guardar
      </button>
    </div>
  );
}
