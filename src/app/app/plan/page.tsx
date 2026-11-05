import { EmptyState, Page, TitleRow, UsageBar } from "@/components/app/Page";
import { requireUser } from "@/lib/auth";
import { formatBs, formatDate, formatUsd } from "@/lib/format";
import { effectivePlan, PAID_PLANS, startOfMonthIso } from "@/lib/plans";
import { getSettings } from "@/lib/settings";
import type { Payment } from "@/lib/types";
import { PaymentForm } from "./PaymentForm";

export const metadata = { title: "Plan y pagos" };
const METHOD_LABEL: Record<string, string> = { pago_movil: "Pago Móvil", binance: "Binance", zelle: "Zelle", efectivo: "Efectivo" };
const PLAN_NAME: Record<string, string> = { basico: "Básico", pro: "Pro", full: "Full" };

export default async function PlanPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan: wanted } = await searchParams;
  const { profile, supabase } = await requireUser();
  const plan = effectivePlan(profile.plan, profile.plan_expires_at);
  const [{ data: used }, { data: payments }, settings] = await Promise.all([
    supabase.from("tasks").select("cost").eq("user_id", profile.id).eq("paid_with", "plan").neq("status", "cancelada").gte("created_at", startOfMonthIso()),
    supabase.from("payments").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }),
    getSettings(),
  ]);
  const usedCount = (used ?? []).reduce((a, t) => a + (t.cost as number), 0);
  const pays = (payments ?? []) as Payment[];
  const pending = pays.filter((p) => p.status === "pendiente");

  return (
    <Page>
      <TitleRow
        title="Plan y pagos"
        subtitle={
          plan.id === "gratis"
            ? "No tienes plan. Paga solo los meses que quieras: no hay cobros automáticos."
            : `Plan ${plan.name} activo hasta el ${formatDate(profile.plan_expires_at, { day: "numeric", month: "long", year: "numeric" })}.`
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-10">
        <section aria-labelledby="uso" className="panel flex flex-col gap-5 self-start">
          <h2 id="uso" className="text-[15px] font-bold">
            Este mes
          </h2>
          <UsageBar label={plan.id === "gratis" ? "Tareas del plan" : `Tareas del plan ${plan.name}`} used={usedCount} total={plan.tasksPerMonth} />
          <div className="flex items-baseline justify-between text-[14px]">
            <span>Tareas sueltas</span>
            <span className="num font-semibold">{profile.credits}</span>
          </div>
          <p className="text-[13px] text-ink-soft">El cupo del plan se reinicia el día 1 de cada mes. Las tareas sueltas no vencen.</p>
          {pending.length > 0 && (
            <p className="rounded-[10px] bg-[#fff4d6] px-3 py-2 text-[13.5px] text-[#7a4d00]">
              Estamos verificando {pending.length === 1 ? "un pago" : `${pending.length} pagos`}. Normalmente lo activamos el mismo día.
            </p>
          )}
        </section>

        <section aria-label="Pagar">
          <PaymentForm
            userId={profile.id}
            plans={PAID_PLANS}
            rate={settings.rate.bs_per_usd}
            rateUpdated={settings.rate.updated}
            methods={settings.methods}
            initialPlan={(["basico", "pro", "full"].includes(wanted ?? "") ? wanted : plan.id === "gratis" ? "basico" : plan.id) as "basico" | "pro" | "full"}
          />
        </section>
      </div>

      <section aria-labelledby="historial" className="mt-10">
        <h2 id="historial" className="mb-3 text-[17px] font-bold">
          Historial de pagos
        </h2>
        {pays.length === 0 ? (
          <EmptyState>Todavía no has registrado pagos.</EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {pays.map((p) => (
              <li key={p.id} className="card flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-[15px] font-semibold">
                    {p.kind === "plan" ? `Plan ${PLAN_NAME[p.plan ?? ""]} · ${p.months} ${p.months === 1 ? "mes" : "meses"}` : `${p.quantity} ${p.quantity === 1 ? "tarea suelta" : "tareas sueltas"}`}
                  </p>
                  <p className="text-[13.5px] text-ink-soft">
                    {formatDate(p.created_at, { day: "numeric", month: "short", year: "numeric" })} · {METHOD_LABEL[p.method]} · Ref. {p.reference}
                  </p>
                  {p.admin_note && <p className="text-[13.5px] text-rojo">{p.admin_note}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="num text-right text-[14.5px]">
                    {formatUsd(Number(p.amount_usd))}
                    {p.amount_bs ? <span className="block text-[12.5px] text-ink-soft">{formatBs(Number(p.amount_bs))}</span> : null}
                  </span>
                  <span className={`pill ${p.status === "aprobado" ? "pill-done" : p.status === "rechazado" ? "pill-urgent" : "pill-attention"}`}>
                    {p.status === "aprobado" ? "Aprobado" : p.status === "rechazado" ? "Rechazado" : "Por verificar"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Page>
  );
}
