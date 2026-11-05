import { EmptyState, Page, TitleRow } from "@/components/app/Page";
import { requireAdmin } from "@/lib/auth";
import { formatBs, formatDate, formatUsd } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Payment, Profile } from "@/lib/types";
import { PaymentReview } from "./PaymentReview";

export const metadata = { title: "Pagos" };
const METHOD: Record<string, string> = { pago_movil: "Pago Móvil", binance: "Binance", zelle: "Zelle", efectivo: "Efectivo" };
const PLAN_NAME: Record<string, string> = { basico: "Básico", pro: "Pro", full: "Full" };

export default async function PaymentsAdmin({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  await requireAdmin();
  const { ver } = await searchParams;
  const showAll = ver === "todos";
  const db = createAdminClient();
  let q = db.from("payments").select("*").order("created_at", { ascending: !showAll }).limit(150);
  if (!showAll) q = q.eq("status", "pendiente");
  const { data } = await q;
  const pays = (data ?? []) as Payment[];
  const ids = [...new Set(pays.map((p) => p.user_id))];
  const { data: profs } = ids.length ? await db.from("profiles").select("id, email, full_name, whatsapp").in("id", ids) : { data: [] };
  const who = new Map(((profs ?? []) as Pick<Profile, "id" | "email" | "full_name" | "whatsapp">[]).map((p) => [p.id, p]));
  const receipts = pays.filter((p) => p.receipt_path).map((p) => p.receipt_path!);
  const signed = new Map<string, string>();
  if (receipts.length) {
    const { data: urls } = await db.storage.from("receipts").createSignedUrls(receipts, 3600);
    (urls ?? []).forEach((u) => u.path && u.signedUrl && signed.set(u.path, u.signedUrl));
  }

  return (
    <Page wide>
      <TitleRow
        title={showAll ? "Todos los pagos" : "Pagos por verificar"}
        subtitle="Revisa la referencia en tu banco, Binance o Zelle antes de aprobar. Aprobar activa el plan o suma las tareas sueltas."
        actions={
          <a href={showAll ? "/admin/pagos" : "/admin/pagos?ver=todos"} className="app-btn app-btn-secondary">
            {showAll ? "Solo pendientes" : "Ver todos"}
          </a>
        }
      />
      {pays.length === 0 ? (
        <EmptyState>{showAll ? "No hay pagos registrados." : "No hay pagos pendientes."}</EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {pays.map((p) => {
            const u = who.get(p.user_id);
            return (
              <li key={p.id} className="panel grid grid-cols-1 gap-4 md:grid-cols-12 md:items-center">
                <div className="md:col-span-3">
                  <p className="text-[15px] font-semibold">{u?.full_name || u?.email}</p>
                  <p className="truncate text-[13.5px] text-ink-soft">{u?.email}</p>
                  {u?.whatsapp && <p className="num text-[13.5px] text-ink-soft">{u.whatsapp}</p>}
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[14px] md:col-span-6">
                  <dt className="text-ink-soft">Compra</dt>
                  <dd className="font-semibold">
                    {p.kind === "plan" ? `Plan ${PLAN_NAME[p.plan ?? ""]} · ${p.months} ${p.months === 1 ? "mes" : "meses"}` : `${p.quantity} tareas sueltas`}
                  </dd>
                  <dt className="text-ink-soft">Monto</dt>
                  <dd className="num">
                    {formatUsd(Number(p.amount_usd))}
                    {p.amount_bs ? ` · ${formatBs(Number(p.amount_bs))}` : ""}
                  </dd>
                  <dt className="text-ink-soft">{METHOD[p.method]}</dt>
                  <dd className="num font-semibold">Ref. {p.reference}</dd>
                  <dt className="text-ink-soft">Pagador</dt>
                  <dd>{[p.payer_name, p.payer_id_doc, p.payer_phone].filter(Boolean).join(" · ") || "—"}</dd>
                  <dt className="text-ink-soft">Registrado</dt>
                  <dd>{formatDate(p.created_at, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</dd>
                  {p.receipt_path && (
                    <>
                      <dt className="text-ink-soft">Capture</dt>
                      <dd>
                        <a href={signed.get(p.receipt_path)} target="_blank" rel="noopener" className="font-semibold text-marino-3 underline">
                          Ver comprobante
                        </a>
                      </dd>
                    </>
                  )}
                </dl>
                <div className="md:col-span-3 md:justify-self-end">
                  {p.status === "pendiente" ? (
                    <PaymentReview id={p.id} />
                  ) : (
                    <span className={`pill ${p.status === "aprobado" ? "pill-done" : "pill-urgent"}`}>{p.status === "aprobado" ? "Aprobado" : "Rechazado"}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}
