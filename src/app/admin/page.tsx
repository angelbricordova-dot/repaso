import Link from "next/link";
import { Page, TitleRow } from "@/components/app/Page";
import { TaskRow } from "@/components/app/TaskRow";
import { requireAdmin } from "@/lib/auth";
import { formatUsd, timeAgo } from "@/lib/format";
import { startOfMonthIso } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Task } from "@/lib/types";

export default async function AdminHome() {
  await requireAdmin();
  const db = createAdminClient();
  const month = startOfMonthIso();
  const now = new Date().toISOString();
  const [users, paid, monthTasks, open, late, pays, revenue, ratings] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    db.from("profiles").select("plan").neq("plan", "gratis").gt("plan_expires_at", now),
    db.from("tasks").select("id", { count: "exact", head: true }).gte("created_at", month).neq("status", "cancelada"),
    db.from("tasks").select("id, number, title, subject, task_type, status, due_at, urgent").in("status", ["recibida", "en_proceso", "necesita_info", "corrigiendo"]).order("due_at").limit(5),
    db.from("tasks").select("id", { count: "exact", head: true }).in("status", ["recibida", "en_proceso", "corrigiendo"]).lt("due_at", now),
    db.from("payments").select("id, amount_usd, reference, created_at").eq("status", "pendiente").order("created_at").limit(5),
    db.from("payments").select("amount_usd").eq("status", "aprobado").gte("reviewed_at", month),
    db.from("tasks").select("rating").not("rating", "is", null).gte("created_at", month),
  ]);
  const paidRows = (paid.data ?? []) as { plan: string }[];
  const cobrado = ((revenue.data ?? []) as { amount_usd: number }[]).reduce((a, p) => a + Number(p.amount_usd), 0);
  const rs = ((ratings.data ?? []) as { rating: number }[]).map((r) => r.rating);
  const avg = rs.length ? (rs.reduce((a, b) => a + b, 0) / rs.length).toFixed(1).replace(".", ",") : "—";

  const kpis = [
    { label: "Estudiantes", value: `${users.count ?? 0}`, caption: `${paidRows.length} con plan activo` },
    { label: "Tareas este mes", value: `${monthTasks.count ?? 0}`, caption: `${late.count ?? 0} vencidas sin entregar` },
    { label: "Cobrado este mes", value: formatUsd(cobrado), caption: `${paidRows.filter((p) => p.plan === "basico").length} Básico · ${paidRows.filter((p) => p.plan === "pro").length} Pro · ${paidRows.filter((p) => p.plan === "full").length} Full` },
    { label: "Calificación promedio", value: avg, caption: rs.length ? `${rs.length} calificaciones este mes` : "Aún sin calificaciones" },
  ];

  return (
    <Page wide>
      <TitleRow title="Resumen" />
      <section aria-label="Cifras del mes" className="grid grid-cols-2 gap-[2px] overflow-hidden rounded-[18px] md:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="flex min-h-[120px] flex-col justify-between bg-surface p-4">
            <p className="text-[13px] text-ink-soft">{k.label}</p>
            <p className="num font-[family-name:var(--font-display)] text-[28px] font-bold leading-none">{k.value}</p>
            <p className="text-[12.5px] text-ink-soft">{k.caption}</p>
          </div>
        ))}
      </section>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section aria-labelledby="proximas">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="proximas" className="text-[17px] font-bold">
              Próximas a vencer
            </h2>
            <Link href="/admin/tareas" className="text-[14px] font-semibold text-marino-3 hover:underline">
              Ver cola
            </Link>
          </div>
          {(open.data ?? []).length === 0 ? (
            <p className="rounded-[14px] border border-dashed border-line-strong px-4 py-4 text-[15px] text-ink-soft">No hay tareas abiertas.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {((open.data ?? []) as Task[]).map((t) => (
                <li key={t.id}>
                  <TaskRow task={t} href={`/admin/tareas/${t.id}`} />
                </li>
              ))}
            </ul>
          )}
        </section>
        <section aria-labelledby="pagos">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="pagos" className="text-[17px] font-bold">
              Pagos por verificar
            </h2>
            <Link href="/admin/pagos" className="text-[14px] font-semibold text-marino-3 hover:underline">
              Verificar
            </Link>
          </div>
          {(pays.data ?? []).length === 0 ? (
            <p className="rounded-[14px] border border-dashed border-line-strong px-4 py-4 text-[15px] text-ink-soft">No hay pagos pendientes.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {(pays.data ?? []).map((p) => (
                <li key={p.id} className="card flex items-center justify-between px-4 py-3">
                  <span>
                    <span className="block text-[15px] font-semibold">Ref. {p.reference}</span>
                    <span className="text-[13px] text-ink-soft">{timeAgo(p.created_at)}</span>
                  </span>
                  <span className="num text-[15px]">{formatUsd(Number(p.amount_usd))}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Page>
  );
}
