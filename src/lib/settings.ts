import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PaymentMethodsSetting, RateSetting } from "@/lib/types";

const EMPTY_METHODS: PaymentMethodsSetting = {
  pago_movil: { bank: "", phone: "", id_doc: "", holder: "" },
  binance: { pay_id: "", email: "" },
  zelle: { email: "", holder: "" },
};

export async function getSettings(): Promise<{ rate: RateSetting; methods: PaymentMethodsSetting }> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("app_settings").select("key, value");
    const map = new Map((data ?? []).map((r) => [r.key as string, r.value]));
    return {
      rate: (map.get("rate") as RateSetting) ?? { bs_per_usd: 0, source: "BCV", updated: null },
      methods: { ...EMPTY_METHODS, ...((map.get("payment_methods") as PaymentMethodsSetting) ?? {}) },
    };
  } catch {
    return { rate: { bs_per_usd: 0, source: "BCV", updated: null }, methods: EMPTY_METHODS };
  }
}
