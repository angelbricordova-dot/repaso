import { EmptyState, Page, TitleRow, UsageBar } from "@/components/app/Page";
import { requireUser } from "@/lib/auth";
import { formatBs, formatDate, formatUsd } from "@/lib/format";
import { effectivePlan, PAID_PLANS, startOfMonthIso } from "@/lib/plans";
import { getSettings } from "@/lib/settings";
import type { Payment } from "@/lib/types";
import { PaymentForm } from "./PaymentForm";

export const metadata = { title: "Plan y pagos" };

const METHOD_LABEL: Record<string, string> = { pago_movil: "Pago Móvil", binance: "Binance", zelle: "Zelle", efectivo: "Efectivo" };

export default async function PlanPage() {
  const { profile, supabase } = await requireUser();
  const plan = effectivePlan(profile.plan, profile.plan_expires_at);
  const monthStart = startOfMonthIso();
  const [{ count: used }, { data: recs }, { count: helpUsed }, { data: payments }, settings] = await Promise.all([
    supabase.from("materials").select("id", { count: "exact", head: true }).eq("user_id", profile.id).eq("status", "ready").gte("processed_at", monthStart),
    supabase.from("materials").select("duration_seconds").eq("user_id", profile.id).in("kind", ["audio", "video"]).gte("created_at", monthStart),
    supabase.from("help_requests").select("id", { count: "exact", head: true }).eq("user_id", profile.id).gte("created_at", monthStart),
    supabase.from("payments").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }),
    getSettings(),
  ]);
  const recMin = Math.round(((recs ?? []) as { duration_seconds: number | null }[]).reduce((a, r) => a + (r.duration_seconds ?? 0), 0) / 60);
  const pays = (payments ?? []) as Payment[];
  const pending = pays.find((p) => p.status === "pendiente");

  return (
    <Page>
      <TitleRow
        title="Plan y pagos"
        subtitle={
          plan.id === "gratis"
            ? "Estás en el plan gratis. Paga solo los meses que quieras: no hay cobros automáticos."
            : `Plan ${plan.name} activo hasta el ${formatDate(profile.plan_expires_at, { day: "numeric", month: "long", year: "numeric" })}.`
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="panel flex flex-col gap-5 lg:col-span-4" aria-labelledby="uso">
          <h2 id="uso" className="text-[14px] font-semibold">
            Tu uso este mes · plan {plan.name}
          </h2>
          <UsageBar label="Clases" used={used ?? 0} total={plan.materialsPerMonth} />
          <UsageBar label="Minutos de grabaciones" used={recMin} total={plan.recordingMinutesPerMonth} />
          <UsageBar label="Envíos al equipo" used={helpUsed ?? 0} total={plan.helpRequestsPerMonth} />
          <p className="text-[13px] text-soft">El conteo se reinicia el primer día de cada mes.</p>
        </section>

        <section className="lg:col-span-8" aria-labelledby="mejorar">
          <h2 id="mejorar" className="sr-only">
            Mejorar plan
          </h2>
          {pending ? (
            <div className="panel">
              <p className="text-[16px] font-semibold">Estamos verificando tu pago</p>
              <p className="mt-1 text-[14px] text-soft">
                {METHOD_LABEL[pending.method]} · referencia {pending.reference} · {formatUsd(Number(pending.amount_usd))}
                {pending.amount_bs ? ` (${formatBs(Number(pending.amount_bs))})` : ""}. Normalmente lo activamos el mismo día.
              </p>
            </div>
          ) : (
            <PaymentForm userId={profile.id} plans={PAID_PLANS} rate={settings.rate.bs_per_usd} rateUpdated={settings.rate.updated} methods={settings.methods} currentPlan={plan.id} />
          )}
        </section>

        <section className="panel lg:col-span-12" aria-labelledby="historial">
          <h2 id="historial" className="mb-4 text-[14px] font-semibold">
            Historial de pagos <span className="num ml-1 font-normal text-soft">{pays.length}</span>
          </h2>
          {pays.length === 0 ? (
            <EmptyState>Todavía no has registrado pagos.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-[14px]">
                <thead>
                  <tr className="border-b border-line text-left text-[12px] text-soft">
                    <th className="py-2 pr-4 font-normal">Fecha</th>
                    <th className="py-2 pr-4 font-normal">Plan</th>
                    <th className="py-2 pr-4 font-normal">Método</th>
                    <th className="py-2 pr-4 font-normal">Referencia</th>
                    <th className="py-2 pr-4 text-right font-normal">Monto</th>
                    <th className="py-2 font-normal">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pays.map((p) => (
                    <tr key={p.id} className="border-b border-rule last:border-0">
                      <td className="py-3 pr-4">{formatDate(p.created_at, { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td className="py-3 pr-4">
                        {p.plan === "repaso" ? "Repaso" : "Repaso+"} · {p.months} {p.months === 1 ? "mes" : "meses"}
                      </td>
                      <td className="py-3 pr-4">{METHOD_LABEL[p.method]}</td>
                      <td className="py-3 pr-4">{p.reference}</td>
                      <td className="num py-3 pr-4 text-right">
                        {formatUsd(Number(p.amount_usd))}
                        {p.amount_bs ? <span className="block text-[12px] text-soft">{formatBs(Number(p.amount_bs))}</span> : null}
                      </td>
                      <td className="py-3">
                        <span className={`pill ${p.status === "aprobado" ? "pill-positive" : p.status === "rechazado" ? "pill-negative" : "pill-warning"}`}>
                          {p.status === "aprobado" ? "Aprobado" : p.status === "rechazado" ? "Rechazado" : "Pendiente"}
                        </span>
                        {p.admin_note && <span className="block text-[12px] text-soft">{p.admin_note}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </Page>
  );
}
