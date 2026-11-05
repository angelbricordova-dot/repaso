"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPayment } from "@/app/app/actions";
import { safeName } from "@/lib/client-upload";
import { formatBs, formatDate, formatUsd } from "@/lib/format";
import { CREDIT_PACKS, CREDIT_PRICE_USD, type Plan } from "@/lib/plans";
import { createClient } from "@/lib/supabase/client";
import type { PaymentMethod, PaymentMethodsSetting } from "@/lib/types";

const METHODS: { id: PaymentMethod; label: string }[] = [
  { id: "pago_movil", label: "Pago Móvil" },
  { id: "binance", label: "Binance" },
  { id: "zelle", label: "Zelle" },
];
const LOOK: Record<string, string> = { basico: "var(--celeste)", pro: "var(--beige)", full: "var(--papel)" };

export function PaymentForm({
  userId,
  plans,
  rate,
  rateUpdated,
  methods,
  initialPlan,
}: {
  userId: string;
  plans: Plan[];
  rate: number;
  rateUpdated: string | null;
  methods: PaymentMethodsSetting;
  initialPlan: "basico" | "pro" | "full";
}) {
  const router = useRouter();
  const [kind, setKind] = useState<"plan" | "creditos">("plan");
  const [planId, setPlanId] = useState(initialPlan);
  const [months, setMonths] = useState(1);
  const [quantity, setQuantity] = useState(3);
  const [method, setMethod] = useState<PaymentMethod>("pago_movil");
  const [reference, setReference] = useState("");
  const [payerName, setPayerName] = useState("");
  const [payerIdDoc, setPayerIdDoc] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const plan = plans.find((p) => p.id === planId)!;
  const usd = Math.round((kind === "plan" ? plan.priceUsd * months : CREDIT_PRICE_USD * quantity) * 100) / 100;
  const bs = rate > 0 ? usd * rate : 0;
  const pm = methods.pago_movil;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      let receiptPath: string | null = null;
      if (receipt) {
        if (receipt.size > 10 * 1024 * 1024) throw new Error("El capture debe pesar menos de 10 MB.");
        const path = `${userId}/${Date.now()}-${safeName(receipt.name)}`;
        const { error: upErr } = await createClient().storage.from("receipts").upload(path, receipt, { contentType: receipt.type || undefined });
        if (upErr) throw new Error("No se pudo subir el capture.");
        receiptPath = path;
      }
      const r = await createPayment({ kind, plan: kind === "plan" ? planId : undefined, months, quantity, method, reference, payerName, payerIdDoc, payerPhone, receiptPath });
      if (!r.ok) throw new Error(r.error);
      setDone(r.message ?? "Recibido.");
      setReference("");
      setReceipt(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="seg max-w-[420px]" role="radiogroup" aria-label="Qué quieres pagar">
        {(["plan", "creditos"] as const).map((k) => (
          <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)}>
            {k === "plan" ? "Plan mensual" : "Tareas sueltas"}
          </button>
        ))}
        <div className="seg-active" aria-hidden="true" style={{ clipPath: kind === "plan" ? "inset(0 50% 0 0 round 9px)" : "inset(0 0 0 50% round 9px)" }}>
          <span>Plan mensual</span>
          <span>Tareas sueltas</span>
        </div>
      </div>

      {kind === "plan" ? (
        <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <legend className="sr-only">Elige tu plan</legend>
          {plans.map((p) => (
            <label
              key={p.id}
              className={`relative flex cursor-pointer flex-col gap-1 rounded-[16px] p-4 transition-[box-shadow,transform] duration-150 active:scale-[0.99] ${
                planId === p.id ? "shadow-[inset_0_0_0_2.5px_var(--marino)]" : "shadow-[inset_0_0_0_1px_var(--line-strong)]"
              }`}
              style={{ background: LOOK[p.id] }}
            >
              <input type="radio" name="plan" value={p.id} checked={planId === p.id} onChange={() => setPlanId(p.id as typeof planId)} className="sr-only" />
              <span className="font-[family-name:var(--font-display)] text-[20px] font-bold">{p.name}</span>
              <span className="num text-[15px] font-semibold">
                {formatUsd(p.priceUsd)} al mes{rate > 0 ? ` · ${formatBs(p.priceUsd * rate)}` : ""}
              </span>
              <span className="text-[13.5px] text-[#3a4462]">
                {p.tasksPerMonth} tareas{p.urgent ? " · urgentes" : ""} · {p.revisions} {p.revisions === 1 ? "corrección" : "correcciones"}
              </span>
            </label>
          ))}
        </fieldset>
      ) : (
        <fieldset>
          <legend className="field-label">¿Cuántas tareas?</legend>
          <div className="grid grid-cols-4 gap-2">
            {CREDIT_PACKS.map((n) => (
              <label
                key={n}
                className={`flex min-h-[64px] cursor-pointer flex-col items-center justify-center rounded-[12px] text-center transition-[background-color,transform] duration-150 active:scale-[0.97] ${
                  quantity === n ? "bg-marino text-papel" : "bg-surface text-marino shadow-[inset_0_0_0_1px_var(--line)]"
                }`}
              >
                <input type="radio" name="qty" value={n} checked={quantity === n} onChange={() => setQuantity(n)} className="sr-only" />
                <span className="font-[family-name:var(--font-display)] text-[22px] font-bold leading-none">{n}</span>
                <span className="num mt-1 text-[12.5px]">{formatUsd(n * CREDIT_PRICE_USD)}</span>
              </label>
            ))}
          </div>
          <p className="hint">Cada tarea suelta cuesta {formatUsd(CREDIT_PRICE_USD)} y no vence.</p>
        </fieldset>
      )}

      <div className="panel flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {kind === "plan" && (
            <div>
              <label htmlFor="p-months" className="field-label">
                Meses
              </label>
              <select id="p-months" className="field" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
                {[1, 2, 3, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "mes" : "meses"} · {formatUsd(plan.priceUsd * n)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className={kind === "plan" ? "" : "sm:col-span-2"}>
            <span className="field-label">Cómo pagas</span>
            <div className="grid grid-cols-3 gap-1 rounded-[12px] bg-white p-1 shadow-[inset_0_0_0_1px_var(--line-strong)]" role="radiogroup" aria-label="Método de pago">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={method === m.id}
                  onClick={() => setMethod(m.id)}
                  className={`h-10 rounded-[9px] text-[14px] font-semibold transition-colors ${method === m.id ? "bg-marino text-papel" : "text-ink-soft hover:text-marino"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[14px] bg-white p-4 shadow-[inset_0_0_0_1px_var(--line)]">
          <p className="text-[13.5px] text-ink-soft">Monto a pagar</p>
          <p className="num mt-1 font-[family-name:var(--font-display)] text-[34px] font-bold leading-none tracking-[-0.02em]">
            {method === "pago_movil" && bs > 0 ? formatBs(bs) : formatUsd(usd)}
          </p>
          {method === "pago_movil" && bs > 0 && (
            <p className="num mt-1 text-[13.5px] text-ink-soft">
              {formatUsd(usd)} a {rate.toLocaleString("es-VE", { maximumFractionDigits: 2 })} Bs/$ (tasa BCV{rateUpdated ? ` del ${formatDate(rateUpdated, { day: "numeric", month: "short" })}` : ""})
            </p>
          )}
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-[14.5px]">
            {method === "pago_movil" &&
              (pm.phone && pm.bank ? (
                <>
                  <dt className="text-ink-soft">Banco</dt>
                  <dd>{pm.bank}</dd>
                  <dt className="text-ink-soft">Teléfono</dt>
                  <dd className="num font-semibold">{pm.phone}</dd>
                  <dt className="text-ink-soft">Cédula / RIF</dt>
                  <dd className="num font-semibold">{pm.id_doc}</dd>
                  {pm.holder && (
                    <>
                      <dt className="text-ink-soft">Titular</dt>
                      <dd>{pm.holder}</dd>
                    </>
                  )}
                </>
              ) : (
                <dd className="col-span-2 text-ink-soft">Los datos de Pago Móvil aún no están configurados. Escríbenos para pagar.</dd>
              ))}
            {method === "binance" && (
              <>
                <dt className="text-ink-soft">Binance Pay ID</dt>
                <dd className="num font-semibold">{methods.binance.pay_id || "—"}</dd>
                {methods.binance.email && (
                  <>
                    <dt className="text-ink-soft">Correo</dt>
                    <dd>{methods.binance.email}</dd>
                  </>
                )}
                <dt className="text-ink-soft">Moneda</dt>
                <dd>USDT</dd>
              </>
            )}
            {method === "zelle" && (
              <>
                <dt className="text-ink-soft">Correo Zelle</dt>
                <dd className="font-semibold">{methods.zelle.email || "—"}</dd>
                {methods.zelle.holder && (
                  <>
                    <dt className="text-ink-soft">Titular</dt>
                    <dd>{methods.zelle.holder}</dd>
                  </>
                )}
              </>
            )}
          </dl>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="p-ref" className="field-label">
              {method === "pago_movil" ? "Número de referencia" : method === "binance" ? "ID de la orden de Binance" : "Número de confirmación de Zelle"}
            </label>
            <input id="p-ref" className="field num" value={reference} onChange={(e) => setReference(e.target.value)} required minLength={3} maxLength={80} inputMode={method === "pago_movil" ? "numeric" : "text"} />
          </div>
          <div>
            <label htmlFor="p-name" className="field-label">
              Nombre de quien paga
            </label>
            <input id="p-name" className="field" value={payerName} onChange={(e) => setPayerName(e.target.value)} maxLength={120} autoComplete="name" />
          </div>
          {method === "pago_movil" && (
            <>
              <div>
                <label htmlFor="p-doc" className="field-label">
                  Cédula de quien paga
                </label>
                <input id="p-doc" className="field num" value={payerIdDoc} onChange={(e) => setPayerIdDoc(e.target.value)} maxLength={20} placeholder="V-12345678" />
              </div>
              <div>
                <label htmlFor="p-phone" className="field-label">
                  Teléfono desde el que pagaste
                </label>
                <input id="p-phone" className="field num" value={payerPhone} onChange={(e) => setPayerPhone(e.target.value)} maxLength={20} inputMode="tel" placeholder="0412-0000000" />
              </div>
            </>
          )}
          <div>
            <span className="field-label">
              Capture del pago <span className="font-normal text-ink-soft">(opcional)</span>
            </span>
            <input id="p-receipt" type="file" accept="image/*,.pdf" className="sr-only" onChange={(e) => setReceipt(e.target.files?.[0] ?? null)} />
            <label htmlFor="p-receipt" className="app-btn app-btn-secondary w-full cursor-pointer">
              {receipt ? receipt.name.slice(0, 28) : "Adjuntar capture"}
            </label>
          </div>
        </div>

        {error && (
          <p className="rounded-[10px] bg-[#fbe5e3] px-3 py-2 text-[14px] text-[#8e2019]" role="alert">
            {error}
          </p>
        )}
        {done && (
          <p className="rounded-[10px] bg-[#dff4e7] px-3 py-2 text-[14px] text-[#135c37]" role="status">
            {done}
          </p>
        )}
        <button type="submit" className="btn w-full sm:w-auto sm:self-end" disabled={busy}>
          {busy ? "Enviando…" : "Ya pagué, registrar pago"}
        </button>
      </div>
    </form>
  );
}
