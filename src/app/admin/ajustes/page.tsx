import { Page, TitleRow } from "@/components/app/Page";
import { requireAdmin } from "@/lib/auth";
import { formatBs, formatDate } from "@/lib/format";
import { PLANS } from "@/lib/plans";
import { getSettings } from "@/lib/settings";
import { MethodsForm, RateForm } from "./SettingsForms";

export const metadata = { title: "Tasa y datos de pago" };

export default async function SettingsAdmin() {
  await requireAdmin();
  const { rate, methods } = await getSettings();
  return (
    <Page>
      <TitleRow title="Tasa y datos de pago" subtitle="Lo que ven los estudiantes al pagar y en la página de inicio." />
      <div className="flex flex-col">
        <section className="grid grid-cols-1 gap-4 border-b border-line pb-8 md:grid-cols-[minmax(0,360px)_minmax(0,1fr)] md:gap-10">
          <div className="md:pt-2">
            <h2 className="text-[16px] font-medium">Tasa BCV</h2>
            <p className="mt-1 text-[14px] text-ink-soft">
              Bolívares por dólar. Actualízala cada día hábil con la tasa oficial publicada por el BCV.
              {rate.updated ? ` Última actualización: ${formatDate(rate.updated, { day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })}.` : " Aún no la has configurado."}
            </p>
            {rate.bs_per_usd > 0 && (
              <p className="mt-3 text-[14px]">
                Hoy: Básico <span className="num font-semibold">{formatBs(PLANS.basico.priceUsd * rate.bs_per_usd)}</span>, Pro{" "}
                <span className="num font-semibold">{formatBs(PLANS.pro.priceUsd * rate.bs_per_usd)}</span> y Full{" "}
                <span className="num font-semibold">{formatBs(PLANS.full.priceUsd * rate.bs_per_usd)}</span>.
              </p>
            )}
          </div>
          <div className="rounded-[16px] bg-surface p-4 md:p-5">
            <RateForm current={rate.bs_per_usd} />
          </div>
        </section>
        <section className="grid grid-cols-1 gap-4 py-8 md:grid-cols-[minmax(0,360px)_minmax(0,1fr)] md:gap-10">
          <div className="md:pt-2">
            <h2 className="text-[16px] font-medium">Datos para recibir pagos</h2>
            <p className="mt-1 text-[14px] text-ink-soft">Aparecen en «Plan y pagos» cuando el estudiante elige el método. Deja vacío lo que no uses.</p>
          </div>
          <div className="rounded-[16px] bg-surface p-4 md:p-5">
            <MethodsForm initial={methods} />
          </div>
        </section>
      </div>
    </Page>
  );
}
