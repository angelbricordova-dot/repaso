import Link from "next/link";
import { Page, TitleRow } from "@/components/app/Page";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatUsd, timeAgo } from "@/lib/format";
import { PLANS, startOfMonthIso } from "@/lib/plans";

// Precio por millón de tokens (USD) para estimar el gasto en IA. Ajusta si cambias de modelo.
const PRICES: Record<string, { in: number; out: number }> = {
  "claude-opus-5-5": { in: 4, out: 20 },
  "claude-sonnet-5-5": { in: 2, out: 10 },
  "claude-haiku-5-5": { in: 0.1, out: 0.5 },
};

export default async function AdminHome() {
  await requireAdmin();
  const db = createAdminClient();
  const monthStart = startOfMonthIso();
  const [users, paid, mats, pays, reqs, approved] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("profiles").select("plan").neq("plan", "gratis").gt("plan_expires_at", new Date().toISOString()),
    db.from("materials").select("ai_model, tokens_in, tokens_out").eq("status", "ready").gte("processed_at", monthStart),
    db.from("payments").select("id, amount_usd, method, reference, created_at, plan").eq("status", "pendiente").order("created_at").limit(5),
    db.from("help_requests").select("id, subject, topic, created_at, status").in("status", ["recibido", "en_revision"]).order("created_at").limit(5),
    db.from("payments").select("amount_usd").eq("status", "aprobado").gte("reviewed_at", monthStart),
  ]);

  const paidRows = (paid.data ?? []) as { plan: string }[];
  const matRows = (mats.data ?? []) as { ai_model: string | null; tokens_in: number | null; tokens_out: number | null }[];
  const aiCost = matRows.reduce((a, m) => {
    const key = Object.keys(PRICES).find((k) => (m.ai_model ?? "").startsWith(k)) ?? "claude-opus-5-5";
    const p = PRICES[key];
    return a + ((m.tokens_in ?? 0) * p.in + (m.tokens_out ?? 0) * p.out) / 1_000_000;
  }, 0);
  const revenue = ((approved.data ?? []) as { amount_usd: number }[]).reduce((a, p) => a + Number(p.amount_usd), 0);
  const kits = matRows.length;

  const kpis = [
    { label: "Usuarios", value: `${users.count ?? 0}`, caption: `${paidRows.length} con plan pago` },
    { label: "Kits generados este mes", value: `${kits}`, caption: kits ? `${formatUsd(aiCost / kits)} por kit en promedio` : "Aún ninguno" },
    { label: "Gasto estimado en IA este mes", value: formatUsd(Math.round(aiCost * 100) / 100), caption: "Kits; el tutor no está incluido" },
    { label: "Cobrado este mes", value: formatUsd(revenue), caption: `${paidRows.filter((p) => p.plan === "repaso").length} Repaso · ${paidRows.filter((p) => p.plan === "repaso_plus").length} Repaso+` },
  ];

  return (
    <Page>
      <TitleRow title="Resumen" subtitle={`Precios vigentes: Repaso ${formatUsd(PLANS.repaso.priceUsd)} · Repaso+ ${formatUsd(PLANS.repaso_plus.priceUsd)} al mes`} />
      <section aria-label="Cifras del mes" className="grid grid-cols-2 overflow-hidden rounded-[16px] bg-panel md:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="flex min-h-[128px] flex-col justify-between p-4">
            <p className="text-[13px] text-soft">{k.label}</p>
            <p className="num text-[28px] leading-none tracking-[-0.02em]">{k.value}</p>
            <p className="text-[13px] text-soft">{k.caption}</p>
          </div>
        ))}
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="panel" aria-labelledby="q-pagos">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="q-pagos" className="text-[14px] font-semibold">
              Pagos por verificar <span className="num ml-1 font-normal text-soft">{pays.data?.length ?? 0}</span>
            </h2>
            <Link href="/admin/pagos" className="text-[13px] font-medium text-soft hover:text-text">
              Ver todos
            </Link>
          </div>
          {(pays.data ?? []).length === 0 ? (
            <p className="rounded-[12px] border border-dashed border-control px-4 py-3 text-[14px] text-soft">No hay pagos pendientes.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {(pays.data ?? []).map((p) => (
                <li key={p.id} className="card flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium">Ref. {p.reference}</p>
                    <p className="text-[13px] text-soft">{timeAgo(p.created_at)}</p>
                  </div>
                  <span className="num text-[14px]">{formatUsd(Number(p.amount_usd))}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="panel" aria-labelledby="q-sol">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="q-sol" className="text-[14px] font-semibold">
              Solicitudes abiertas <span className="num ml-1 font-normal text-soft">{reqs.data?.length ?? 0}</span>
            </h2>
            <Link href="/admin/solicitudes" className="text-[13px] font-medium text-soft hover:text-text">
              Ver bandeja
            </Link>
          </div>
          {(reqs.data ?? []).length === 0 ? (
            <p className="rounded-[12px] border border-dashed border-control px-4 py-3 text-[14px] text-soft">No hay solicitudes abiertas.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {(reqs.data ?? []).map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/solicitudes/${r.id}`} className="card flex items-center justify-between gap-3 px-4 py-3 hover:border-control">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-medium">{r.topic}</p>
                      <p className="truncate text-[13px] text-soft">
                        {r.subject} · {timeAgo(r.created_at)}
                      </p>
                    </div>
                    <span className={`pill ${r.status === "en_revision" ? "pill-warning" : ""}`}>{r.status === "en_revision" ? "En revisión" : "Nuevo"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Page>
  );
}
