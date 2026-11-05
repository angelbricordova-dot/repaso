import Link from "next/link";
import { Header } from "@/components/landing/Header";
import { HeroForm } from "@/components/landing/HeroForm";
import { Logo } from "@/components/landing/Logo";
import { Motion } from "@/components/landing/Motion";
import { ShareWhatsApp } from "@/components/landing/ShareWhatsApp";
import { TicketDemo } from "@/components/landing/TicketDemo";
import { BRAND, SITE_URL } from "@/lib/brand";
import { formatBs } from "@/lib/format";
import { CONTACT_EMAIL, CONTACT_WHATSAPP, waLink } from "@/lib/legal";
import { CREDIT_PRICE_USD, PAID_PLANS, REFERRAL_REWARD } from "@/lib/plans";
import { getSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";

async function isSignedIn() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return Boolean(data.user);
  } catch {
    return false;
  }
}

const usd = (n: number) => `$${n.toFixed(2).replace(".", ",").replace(",00", "")}`;

const WHAT = [
  "Ejercicios de matemática",
  "Física",
  "Química",
  "Biología",
  "Informes",
  "Ensayos",
  "Trabajos escritos",
  "Presentaciones en PowerPoint",
  "Resúmenes",
  "Mapas mentales",
  "Inglés",
  "Castellano y literatura",
  "Historia y GHC",
  "Contabilidad",
  "Estadística",
  "Programación básica",
];

const PLAN_LOOK: Record<string, { bg: string; ink: string; soft: string }> = {
  basico: { bg: "var(--celeste)", ink: "var(--marino)", soft: "#2f3f66" },
  pro: { bg: "var(--beige)", ink: "var(--marino)", soft: "#4a4130" },
  full: { bg: "var(--papel)", ink: "var(--marino)", soft: "var(--ink-soft)" },
};

const FAQ = [
  {
    q: "¿Quién hace las tareas?",
    a: `Personas del equipo de ${BRAND}, no un bot. Cada tarea la toma alguien que conoce la materia, y si le falta información te escribe por el chat de la tarea antes de empezar.`,
  },
  {
    q: "¿Cuánto tardan?",
    a: "Tú eliges la fecha y la hora de entrega. Con el plan Básico pide la tarea con 24 horas o más; con Pro y Full puedes pedir entregas urgentes, que cuentan como 2 tareas.",
  },
  {
    q: "¿Y si no me gusta cómo quedó?",
    a: "Pide una corrección desde la tarea diciendo qué cambiar. Cada plan incluye al menos una corrección por tarea sin costo.",
  },
  {
    q: "¿Cómo pago desde Venezuela?",
    a: "Por Pago Móvil en bolívares a la tasa BCV del día, por Binance (USDT) o por Zelle. Registras la referencia en la web y activamos tu plan, normalmente el mismo día.",
  },
  {
    q: "¿Se renueva solo?",
    a: "No. No guardamos tarjetas ni cobramos nada automático. Pagas el mes que quieras usar; si no renuevas, tu cuenta queda sin plan y conservas tus tareas.",
  },
  {
    q: "¿Mis archivos son privados?",
    a: "Sí. Solo tú y el equipo que trabaja tu tarea ven lo que subes. No publicamos ni compartimos tus tareas.",
  },
];

export default async function Home() {
  const [signedIn, { rate }] = await Promise.all([isSignedIn(), getSettings()]);
  const basico = PAID_PLANS[0];
  const bs = (n: number) => (rate.bs_per_usd > 0 ? formatBs(n * rate.bs_per_usd) : null);
  const priceLine = `Tu primera tarea es gratis. Luego 10 tareas por ${usd(basico.priceUsd)} al mes${bs(basico.priceUsd) ? ` (${bs(basico.priceUsd)})` : ""}.`;
  const action = signedIn ? "/app/nueva" : "/registro";

  return (
    <div data-landing data-uniform="bachillerato" className="min-h-svh bg-papel text-marino">
      <Motion />
      <Header signedIn={signedIn} />

      <main>
        {/* ───────── Portada: el campo viste el uniforme del nivel elegido ───────── */}
        <section aria-labelledby="titulo" className="field-bg pb-12 pt-6 md:pb-24 md:pt-14">
          <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 wrap md:grid-cols-[1fr_440px] md:gap-x-14 md:gap-y-10">
            <h1 id="titulo" className="display text-[clamp(44px,11.5vw,112px)] md:col-span-2">
              Tu tarea, resuelta a tiempo.
            </h1>
            <div className="md:self-start">
              <p className="max-w-[34ch] text-[18px] leading-[1.45] text-field-ink-soft md:text-[22px]">
                Personas reales la resuelven y te la entregan antes de tu hora de entrega. De 1er año a la universidad.
              </p>
              <ul className="mt-6 hidden flex-col gap-3 text-[17px] font-semibold md:flex">
                {["Personas reales, no un bot", "Pagas en bolívares a tasa BCV", "Sin cobros automáticos"].map((t) => (
                  <li key={t} className="flex items-center gap-3">
                    <span className="grid size-7 place-items-center rounded-full bg-field-ink text-field" aria-hidden="true">
                      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <path d="m5 12.5 4.5 4.5L19 7.5" />
                      </svg>
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <HeroForm signedIn={signedIn} priceLine={priceLine} />
          </div>
        </section>

        {/* ───────── Cómo funciona: un ticket real que avanza ───────── */}
        <section id="como" aria-labelledby="como-titulo" data-reveal className="bg-papel py-20 md:py-32">
          <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 wrap md:grid-cols-2 md:gap-20">
            <div>
              <h2 id="como-titulo" data-rise className="display text-[clamp(36px,7vw,64px)]">
                Mandas la foto. Te llega resuelta.
              </h2>
              <ol className="mt-8 flex flex-col gap-6">
                {[
                  ["Mandas la tarea", "Una foto del enunciado, el PDF o el Word, y la fecha y hora en que la necesitas."],
                  ["Alguien del equipo la toma", "Si falta algo, te escribe por el chat de la tarea. Ves en todo momento en qué va."],
                  ["Te llega resuelta", "Con el paso a paso para que la entiendas. Si algo no te cuadra, pides una corrección."],
                ].map(([t, d], i) => (
                  <li key={t} data-rise style={{ ["--i" as string]: i + 1 } as React.CSSProperties} className="flex gap-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-marino font-[family-name:var(--font-display)] text-[17px] font-bold text-hilo">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-[19px] font-bold">{t}</p>
                      <p className="mt-1 max-w-[42ch] text-[16px] leading-[1.5] text-ink-soft">{d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div data-rise style={{ ["--i" as string]: 2 } as React.CSSProperties} className="flex justify-center rounded-[24px] bg-celeste px-4 py-10 md:py-16">
              <TicketDemo />
            </div>
          </div>
        </section>

        {/* ───────── Qué resolvemos: cintas de nombre sobre caqui ───────── */}
        <section aria-labelledby="que-titulo" data-reveal className="bg-beige py-20 md:py-28">
          <div className="mx-auto max-w-[1200px] wrap">
            <h2 id="que-titulo" data-rise className="display max-w-[16ch] text-[clamp(36px,7vw,64px)]">
              Del liceo a la universidad.
            </h2>
            <p data-rise style={{ ["--i" as string]: 1 } as React.CSSProperties} className="mt-4 max-w-[48ch] text-[18px] leading-[1.5] text-[#4a4130]">
              Si te la mandaron a hacer, mándanosla. Estas son las que más nos llegan:
            </p>
            <ul data-rise style={{ ["--i" as string]: 2 } as React.CSSProperties} className="mt-8 flex flex-wrap gap-2 md:gap-3">
              {WHAT.map((w) => (
                <li key={w} className="tape md:!min-h-[42px] md:!text-[16px]">
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ───────── Precios: tres parches sobre azul marino ───────── */}
        <section id="precios" aria-labelledby="precios-titulo" data-reveal className="bg-marino py-20 text-papel md:py-32">
          <div className="mx-auto max-w-[1200px] wrap">
            <h2 id="precios-titulo" data-rise className="display max-w-[14ch] text-[clamp(36px,7vw,64px)]">
              10 tareas por {usd(basico.priceUsd)} al mes.
            </h2>
            <p data-rise style={{ ["--i" as string]: 1 } as React.CSSProperties} className="mt-4 max-w-[52ch] text-[18px] leading-[1.5] text-[#c9d8f0]">
              {rate.bs_per_usd > 0
                ? `A la tasa BCV de hoy son ${bs(basico.priceUsd)}. `
                : "Pagas en bolívares a la tasa BCV del día. "}
              Pago Móvil, Binance o Zelle. Sin cobros automáticos.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
              {PAID_PLANS.map((p, i) => {
                const look = PLAN_LOOK[p.id];
                return (
                  <article
                    key={p.id}
                    data-rise
                    style={{ ["--i" as string]: i + 2, background: look.bg, color: look.ink } as React.CSSProperties}
                    className="relative flex flex-col rounded-[20px] p-6"
                  >
                    <span aria-hidden="true" className="pointer-events-none absolute inset-[6px] rounded-[15px] border-[1.5px] border-dashed border-marino/25" />
                    <h3 className="font-[family-name:var(--font-display)] text-[26px] font-bold tracking-[-0.02em]">{p.name}</h3>
                    <p className="mt-1 text-[15px]" style={{ color: look.soft }}>
                      {p.blurb}
                    </p>
                    <p className="mt-5 flex items-baseline gap-2">
                      <span className="num font-[family-name:var(--font-display)] text-[44px] font-bold leading-none tracking-[-0.03em]">{usd(p.priceUsd)}</span>
                      <span className="text-[15px]" style={{ color: look.soft }}>
                        al mes
                      </span>
                    </p>
                    <p className="num mt-1 text-[15px] font-semibold" style={{ color: look.soft }}>
                      {bs(p.priceUsd) ?? "En Bs. a tasa BCV"}
                    </p>
                    <ul className="mt-5 flex flex-col gap-2 text-[15px] leading-[1.4]">
                      {p.features.map((f) => (
                        <li key={f} className="flex gap-2">
                          <svg viewBox="0 0 24 24" className="mt-[3px] size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="m5 12.5 4.5 4.5L19 7.5" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href={signedIn ? "/app/plan" : `/registro?plan=${p.id}`} className="btn btn-ink mt-6 w-full">
                      Elegir {p.name}
                    </Link>
                  </article>
                );
              })}
            </div>

            <p data-rise className="mt-8 text-[17px] text-[#c9d8f0]">
              ¿Solo una tarea? La tarea suelta cuesta {usd(CREDIT_PRICE_USD)}
              {bs(CREDIT_PRICE_USD) ? ` (${bs(CREDIT_PRICE_USD)})` : ""}, sin plan. Y la primera es gratis.
            </p>
          </div>
        </section>

        {/* ───────── Invita a tus panas ───────── */}
        <section aria-labelledby="invita-titulo" data-reveal className="bg-celeste py-20 md:py-28">
          <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-end gap-8 wrap md:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h2 id="invita-titulo" data-rise className="display max-w-[15ch] text-[clamp(36px,7vw,64px)]">
                Pásalo en el grupo del salón.
              </h2>
              <p data-rise style={{ ["--i" as string]: 1 } as React.CSSProperties} className="mt-4 max-w-[46ch] text-[18px] leading-[1.5] text-[#2f3f66]">
                Cada cuenta tiene su enlace de invitación. Cuando alguien que invitaste paga su primer plan, te regalamos {REFERRAL_REWARD} tareas.
              </p>
            </div>
            <div data-rise style={{ ["--i" as string]: 2 } as React.CSSProperties} className="flex flex-col gap-3 md:items-end">
              <ShareWhatsApp
                url={SITE_URL}
                text={`Mira ${BRAND}: mandas la tarea y te la entregan resuelta a la hora que la necesitas. La primera es gratis.`}
                className="btn btn-ink w-full md:w-auto"
              />
              <p className="text-[14px] text-[#2f3f66]">Tu enlace personal está en tu cuenta, en «Invitar».</p>
            </div>
          </div>
        </section>

        {/* ───────── Preguntas ───────── */}
        <section id="preguntas" aria-labelledby="faq-titulo" data-reveal className="bg-papel py-20 md:py-32">
          <div className="mx-auto max-w-[1200px] wrap">
            <h2 id="faq-titulo" data-rise className="display text-[clamp(36px,7vw,64px)]">
              Preguntas frecuentes
            </h2>
            <dl className="mt-10 grid grid-cols-1 gap-x-16 gap-y-10 md:grid-cols-2">
              {FAQ.map((f, i) => (
                <div key={f.q} data-rise style={{ ["--i" as string]: i % 2 } as React.CSSProperties}>
                  <dt className="text-[21px] font-bold leading-[1.25] tracking-[-0.01em]">{f.q}</dt>
                  <dd className="mt-2 max-w-[52ch] text-[17px] leading-[1.55] text-ink-soft">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ───────── Cierre ───────── */}
        <section aria-labelledby="cierre-titulo" className="field-bg py-20 md:py-28">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-6 wrap md:flex-row md:items-end md:justify-between">
            <h2 id="cierre-titulo" className="display max-w-[14ch] text-[clamp(40px,8vw,80px)]">
              ¿Tienes tarea para mañana?
            </h2>
            <Link href={action} className="btn w-full md:w-auto">
              Mandar mi tarea gratis
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-marino text-papel">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 wrap py-12 md:grid-cols-3">
          <div>
            <Logo size={22} tone="light" />
            <p className="mt-4 max-w-[30ch] text-[15px] text-[#c9d8f0]">Ayuda con tareas hecha por personas, para estudiantes en Venezuela.</p>
          </div>
          <ul className="flex flex-col gap-2 text-[15px]">
            {CONTACT_WHATSAPP && (
              <li>
                <a className="link" href={waLink(CONTACT_WHATSAPP)} target="_blank" rel="noopener">
                  WhatsApp {CONTACT_WHATSAPP}
                </a>
              </li>
            )}
            <li>
              <a className="link" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
            </li>
          </ul>
          <ul className="flex flex-col gap-2 text-[15px]">
            <li>
              <Link className="link" href="/terminos">
                Términos y condiciones
              </Link>
            </li>
            <li>
              <Link className="link" href="/privacidad">
                Privacidad
              </Link>
            </li>
            <li className="text-[13px] text-[#9fb2d6]">© {new Date().getFullYear()} {BRAND}</li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
