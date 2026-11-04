"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPayment } from "@/app/app/actions";
import { safeName } from "@/lib/client-upload";
import { formatBs, formatDate, formatUsd } from "@/lib/format";
import type { Plan } from "@/lib/plans";
import { createClient } from "@/lib/supabase/client";
import type { PaymentMethod, PaymentMethodsSetting } from "@/lib/types";

const METHODS: { id: PaymentMethod; label: string }[] = [
  { id: "pago_movil", label: "Pago Móvil" },
  { id: "binance", label: "Binance" },
  { id: "zelle", label: "Zelle" },
];

export function PaymentForm({
  userId,
  plans,
  rate,
  rateUpdated,
  methods,
  currentPlan,
}: {
  userId: string;
  plans: Plan[];
  rate: number;
  rateUpdated: string | null;
  methods: PaymentMethodsSetting;
  currentPlan: string;
}) {
  const router = useRouter();
  const [planId, setPlanId] = useState<Plan["id"]>(currentPlan === "repaso_plus" ? "repaso_plus" : "repaso");
  const [months, setMonths] = useState(1);
  const [method, setMethod] = useState<PaymentMethod>("pago_movil");
  const [reference, setReference] = useState("");
  const [payerName, setPayerName] = useState("");
  const [payerIdDoc, setPayerIdDoc] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = plans.find((p) => p.id === planId)!;
  const usd = plan.priceUsd * months;
  const bs = rate > 0 ? usd * rate : 0;
  const pm = methods.pago_movil;
  const pmReady = Boolean(pm.phone && pm.bank);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      let receiptPath: string | null = null;
      if (receipt) {
        if (receipt.size > 10 * 1024 * 1024) throw new Error("El comprobante debe pesar menos de 10 MB.");
        const supabase = createClient();
        const path = `${userId}/${Date.now()}-${safeName(receipt.name)}`;
        const { error: upErr } = await supabase.storage.from("receipts").upload(path, receipt, { contentType: receipt.type || undefined });
        if (upErr) throw new Error("No se pudo subir el comprobante.");
        receiptPath = path;
      }
      const r = await createPayment({ plan: planId as "repaso" | "repaso_plus", months, method, reference, payerName, payerIdDoc, payerPhone, receiptPath });
      if (!r.ok) throw new Error(r.error);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <legend className="sr-only">Elige tu plan</legend>
        {plans.map((p) => (
          <label
            key={p.id}
            className={`flex cursor-pointer flex-col gap-1 rounded-[16px] border p-4 transition-colors ${planId === p.id ? "border-text bg-white" : "border-line bg-white hover:border-control"}`}
          >
            <input type="radio" name="plan" value={p.id} checked={planId === p.id} onChange={() => setPlanId(p.id)} className="sr-only" />
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-[16px] font-semibold">{p.name}</span>
              <span className="num text-[16px]">{formatUsd(p.priceUsd)} al mes</span>
            </span>
            <span className="text-[13px] text-soft">{p.blurb}</span>
            <ul className="mt-2 flex flex-col gap-1 text-[13px]">
              {p.features.slice(0, 4).map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </label>
        ))}
      </fieldset>

      <div className="panel flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="p-months" className="field-label">
              Meses
            </label>
            <select id="p-months" className="field" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "mes" : "meses"} · {formatUsd(plan.priceUsd * n)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="field-label">Método de pago</span>
            <div className="flex gap-1 rounded-[10px] bg-white p-1 ring-1 ring-control" role="radiogroup" aria-label="Método de pago">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={method === m.id}
                  onClick={() => setMethod(m.id)}
                  className={`h-9 flex-1 rounded-[8px] text-[13px] font-medium transition-colors ${method === m.id ? "bg-ink text-white" : "text-soft hover:text-text"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Datos para pagar */}
        <div className="rounded-[12px] bg-white p-4 ring-1 ring-line">
          <p className="text-[13px] text-soft">Monto a pagar</p>
          <p className="num mt-1 text-[28px] leading-none tracking-[-0.02em]">
            {method === "pago_movil" && bs > 0 ? formatBs(bs) : formatUsd(usd)}
          </p>
          {method === "pago_movil" && bs > 0 && (
            <p className="num mt-1 text-[13px] text-soft">
              {formatUsd(usd)} a {rate.toLocaleString("es-VE", { maximumFractionDigits: 2 })} Bs/$ (BCV{rateUpdated ? `, ${formatDate(rateUpdated, { day: "numeric", month: "short" })}` : ""})
            </p>
          )}
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-[14px]">
            {method === "pago_movil" &&
              (pmReady ? (
                <>
                  <dt className="text-soft">Banco</dt>
                  <dd>{pm.bank}</dd>
                  <dt className="text-soft">Teléfono</dt>
                  <dd className="num">{pm.phone}</dd>
                  <dt className="text-soft">Cédula / RIF</dt>
                  <dd className="num">{pm.id_doc}</dd>
                  {pm.holder && (
                    <>
                      <dt className="text-soft">Titular</dt>
                      <dd>{pm.holder}</dd>
                    </>
                  )}
                </>
              ) : (
                <dd className="col-span-2 text-soft">Los datos de Pago Móvil aún no están configurados. Escríbenos para pagar.</dd>
              ))}
            {method === "binance" && (
              <>
                <dt className="text-soft">Binance Pay ID</dt>
                <dd className="num">{methods.binance.pay_id || "—"}</dd>
                {methods.binance.email && (
                  <>
                    <dt className="text-soft">Correo</dt>
                    <dd>{methods.binance.email}</dd>
                  </>
                )}
                <dt className="text-soft">Moneda</dt>
                <dd>USDT</dd>
              </>
            )}
            {method === "zelle" && (
              <>
                <dt className="text-soft">Correo Zelle</dt>
                <dd>{methods.zelle.email || "—"}</dd>
                {methods.zelle.holder && (
                  <>
                    <dt className="text-soft">Titular</dt>
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
          <div className={method === "pago_movil" ? "" : "sm:col-span-1"}>
            <span className="field-label">
              Capture del pago <span className="font-normal text-soft">(opcional)</span>
            </span>
            <input id="p-receipt" type="file" accept="image/*,.pdf" className="sr-only" onChange={(e) => setReceipt(e.target.files?.[0] ?? null)} />
            <label htmlFor="p-receipt" className="app-btn app-btn-secondary w-full">
              {receipt ? receipt.name.slice(0, 28) : "Adjuntar capture"}
            </label>
          </div>
        </div>

        {error && (
          <p className="rounded-[10px] bg-[#ffedea] px-3 py-2 text-[13px] text-[#831c1e]" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-soft">Activamos tu plan cuando verificamos el pago, normalmente el mismo día.</p>
          <button type="submit" className="app-btn" disabled={busy}>
            {busy ? "Enviando…" : "Ya pagué, registrar pago"}
          </button>
        </div>
      </div>
    </form>
  );
}
