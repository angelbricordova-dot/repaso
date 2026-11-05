"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveMethods, saveRate } from "@/app/admin/actions";
import type { PaymentMethodsSetting } from "@/lib/types";

export function RateForm({ current }: { current: number }) {
  const router = useRouter();
  const [v, setV] = useState(current ? String(current) : "");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await saveRate(Number(v.replace(",", ".")));
          setMsg(r.ok ? r.message ?? "Guardado" : r.error);
          router.refresh();
        });
      }}
    >
      <div>
        <label htmlFor="rate" className="field-label">
          Bs por 1 USD
        </label>
        <input id="rate" className="field num" inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} placeholder="Ej. 245,67" required />
      </div>
      <div className="flex items-center justify-end gap-3">
        {msg && (
          <span className="text-[13px] text-ink-soft" role="status">
            {msg}
          </span>
        )}
        <button className="app-btn" type="submit" disabled={pending}>
          Guardar tasa
        </button>
      </div>
    </form>
  );
}

export function MethodsForm({ initial }: { initial: PaymentMethodsSetting }) {
  const router = useRouter();
  const [m, setM] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const field = <K extends keyof PaymentMethodsSetting>(group: K, key: keyof PaymentMethodsSetting[K], label: string, placeholder = "") => (
    <div>
      <label htmlFor={`${group}-${String(key)}`} className="field-label">
        {label}
      </label>
      <input
        id={`${group}-${String(key)}`}
        className="field"
        value={String(m[group][key] ?? "")}
        placeholder={placeholder}
        onChange={(e) => setM({ ...m, [group]: { ...m[group], [key]: e.target.value } })}
      />
    </div>
  );
  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await saveMethods(m);
          setMsg(r.ok ? r.message ?? "Guardado" : r.error);
          router.refresh();
        });
      }}
    >
      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-[14px] font-semibold">Pago Móvil</legend>
        {field("pago_movil", "bank", "Banco", "Banesco (0134)")}
        {field("pago_movil", "phone", "Teléfono", "0412-0000000")}
        {field("pago_movil", "id_doc", "Cédula o RIF", "V-12345678")}
        {field("pago_movil", "holder", "Titular")}
      </fieldset>
      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-[14px] font-semibold">Binance</legend>
        {field("binance", "pay_id", "Binance Pay ID")}
        {field("binance", "email", "Correo de Binance")}
      </fieldset>
      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-[14px] font-semibold">Zelle</legend>
        {field("zelle", "email", "Correo de Zelle")}
        {field("zelle", "holder", "Titular")}
      </fieldset>
      <div className="flex items-center justify-end gap-3">
        {msg && (
          <span className="text-[13px] text-ink-soft" role="status">
            {msg}
          </span>
        )}
        <button className="app-btn" type="submit" disabled={pending}>
          Guardar datos de pago
        </button>
      </div>
    </form>
  );
}
