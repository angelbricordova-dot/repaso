import { EmptyState, Page, TitleRow } from "@/components/app/Page";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBs, formatDate, formatUsd } from "@/lib/format";
import type { Payment, Profile } from "@/lib/types";
import { PaymentReview } from "./PaymentReview";

export const metadata = { title: "Pagos" };
const METHOD: Record<string, string> = { pago_movil: "Pago Móvil", binance: "Binance", zelle: "Zelle", efectivo: "Efectivo" };

export default async function PaymentsAdmin({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  await requireAdmin();
  const { ver } = await searchParams;
  const showAll = ver === "todos";
  const db = createAdminClient();
  let q = db.from("payments").select("*").order("created_at", { ascending: !showAll }).limit(100);
  if (!showAll) q = q.eq("status", "pendiente");
  const { data } = await q;
  const pays = (data ?? []) as Payment[];
  const userIds = [...new Set(pays.map((p) => p.user_id))];
  const { data: profs } = userIds.length ? await db.from("profiles").select("id, email, full_name, university").in("id", userIds) : { data: [] };
  const who = new Map(((profs ?? []) as Pick<Profile, "id" | "email" | "full_name" | "university">[]).map((p) => [p.id, p]));
  const receipts = pays.filter((p) => p.receipt_path).map((p) => p.receipt_path!) ;
  const signed = new Map<string, string>();
  if (receipts.length) {
    const { data: urls } = await db.storage.from("receipts").createSignedUrls(receipts, 3600);
    (urls ?? []).forEach((u) => u.path && u.signedUrl && signed.set(u.path, u.signedUrl));
  }

  return (
    <Page wide>
      <TitleRow
        title={showAll ? "Todos los pagos" : "Pagos por verificar"}
        subtitle="Revisa la referencia en tu banco, Binance o Zelle antes de aprobar. Aprobar activa o extiende el plan del estudiante."
        actions={
          <a href={showAll ? "/admin/pagos" : "/admin/pagos?ver=todos"} className="app-btn app-btn-secondary">
            {showAll ? "Solo pendientes" : "Ver todos"}
          </a>
        }
      />
      {pays.length === 0 ? (
        <EmptyState>{showAll ? "No hay pagos registrados." : "No hay pagos pendientes. Todo al día."}</EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {pays.map((p) => {
            const u = who.get(p.user_id);
            return (
              <li key={p.id} className="panel grid grid-cols-1 gap-4 md:grid-cols-12 md:items-center">
                <div className="md:col-span-4">
                  <p className="text-[14px] font-medium">{u?.full_name || u?.email}</p>
                  <p className="text-[13px] text-soft">
                    {u?.email}
                    {u?.university ? ` · ${u.university}` : ""}
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[13px] md:col-span-5">
                  <dt className="text-soft">Plan</dt>
                  <dd>
                    {p.plan === "repaso" ? "Repaso" : "Repaso+"} · {p.months} {p.months === 1 ? "mes" : "meses"}
                  </dd>
                  <dt className="text-soft">Monto</dt>
                  <dd className="num">
                    {formatUsd(Number(p.amount_usd))}
                    {p.amount_bs ? ` · ${formatBs(Number(p.amount_bs))}` : ""}
                  </dd>
                  <dt className="text-soft">{METHOD[p.method]}</dt>
                  <dd className="num font-medium">Ref. {p.reference}</dd>
                  <dt className="text-soft">Pagador</dt>
                  <dd>{[p.payer_name, p.payer_id_doc, p.payer_phone].filter(Boolean).join(" · ") || "—"}</dd>
                  <dt className="text-soft">Registrado</dt>
                  <dd>{formatDate(p.created_at, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</dd>
                  {p.receipt_path && (
                    <>
                      <dt className="text-soft">Capture</dt>
                      <dd>
                        <a href={signed.get(p.receipt_path)} target="_blank" rel="noopener" className="font-medium underline underline-offset-4">
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
                    <span className={`pill ${p.status === "aprobado" ? "pill-positive" : "pill-negative"}`}>{p.status === "aprobado" ? "Aprobado" : "Rechazado"}</span>
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
