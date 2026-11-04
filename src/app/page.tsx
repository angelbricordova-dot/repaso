import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/landing/Header";
import { HeroSlot } from "@/components/landing/HeroSlot";
import { LandingMotion } from "@/components/landing/LandingMotion";
import { Showcase } from "@/components/landing/Showcase";
import { PHOTO_CREDITS } from "@/lib/credits";
import { CONTACT_EMAIL, CONTACT_WHATSAPP } from "@/lib/legal";
import { PLANS } from "@/lib/plans";
import { formatBs } from "@/lib/format";
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

const STEPS = [
  {
    line: "Primero subes la clase.",
    note: "El PDF, las láminas en PowerPoint, un Word, fotos del cuaderno o la grabación de Zoom o Meet.",
  },
  {
    line: "Luego la IA la desarma.",
    note: "Lee todo, separa lo importante del relleno y lo ordena como lo explicaría un buen preparador.",
  },
  {
    line: "Tú repasas a tu manera.",
    note: "Resumen por secciones, fichas para memorizar, quiz con explicaciones y preguntas de desarrollo.",
  },
  {
    line: "Y llegas tranquilo.",
    note: "Con un tutor que responde sobre tu clase a cualquier hora, incluso la noche antes del parcial.",
  },
];

const FIELDS = [
  {
    phrase: "Clases de Zoom",
    text: "¿El profe grabó la clase y dura hora y media? Súbela. Repaso la transcribe, salta los «¿me escuchan?» y se queda con el contenido.",
    bg: "var(--field-1)",
    ink: "#ff87ab",
    mirror: false,
  },
  {
    phrase: "Fotos del cuaderno",
    text: "Toma fotos de tus apuntes o del pizarrón con el teléfono, hasta 20 por material. Se comprimen antes de subir para gastar pocos datos.",
    bg: "var(--accent)",
    ink: "#0a0a0a",
    mirror: true,
  },
  {
    phrase: "Tutor a las 3\u00a0a.\u00a0m.",
    text: "Pregúntale a tu clase lo que no entendiste. El tutor responde con base en tu material, y te avisa cuando algo no está en él.",
    bg: "var(--surface)",
    ink: "#0a0a0a",
    mirror: false,
  },
  {
    phrase: "Alguien de verdad",
    text: "Si aún no lo entiendes, mándanos la clase, las láminas o el enlace de la grabación. Una persona del equipo te prepara la explicación.",
    bg: "var(--field-1)",
    ink: "#def915",
    mirror: true,
  },
];

const FAQ = [
  {
    q: "¿Funciona con cualquier carrera?",
    a: "Sí. Derecho, Medicina, Ingeniería, Administración, Comunicación Social… Repaso trabaja con lo que subes, así que se adapta a tu materia y a cómo la da tu profesor.",
  },
  {
    q: "¿Qué tan confiable es lo que arma la IA?",
    a: "Se basa en tu material y suele acertar, pero puede equivocarse. Úsalo para estudiar, no como única fuente: si algo no te cuadra, revísalo contra la clase o pregúntale al tutor.",
  },
  {
    q: "¿Cómo pago desde Venezuela?",
    a: "Por Pago Móvil en bolívares a la tasa BCV del día, por Binance (USDT) o por Zelle. Envías la referencia desde la app y activamos tu plan, normalmente el mismo día.",
  },
  {
    q: "¿Alguien más ve mis archivos?",
    a: "No. Tus materiales son privados. El equipo de Repaso solo ve lo que tú mismo envías en la sección «Pide una explicación».",
  },
  {
    q: "¿Puedo subir las láminas de mi profesor?",
    a: "Sí, para tu estudio personal. Lo que no puedes es usar Repaso para redistribuir material de otros. Si eres autor y ves un uso indebido, escríbenos y lo retiramos.",
  },
  {
    q: "¿Se renueva solo? ¿Puedo cancelar?",
    a: "No hay cobros automáticos. Pagas el mes que quieras usar; si no renuevas, tu cuenta pasa al plan gratis y conservas tus materiales.",
  },
];

export default async function Home() {
  const [signedIn, { rate }] = await Promise.all([isSignedIn(), getSettings()]);
  const priceBs = rate.bs_per_usd > 0 ? formatBs(PLANS.repaso.priceUsd * rate.bs_per_usd) : null;

  return (
    <div className="landing">
      <LandingMotion />
      <Header signedIn={signedIn} />

      <main>
        {/* ───────────── Portada: dos campos y la frase cortada por la costura ───────────── */}
        <section data-ink="#0a0a0a" data-on="light" className="hero relative h-svh min-h-[600px] overflow-hidden">
          <div className="absolute inset-x-0 top-0 bg-bg" style={{ height: "var(--seam)" }} />
          <div className="absolute inset-x-0 bottom-0 bg-field" style={{ top: "var(--seam)" }} />

          <div className="absolute inset-0 z-10" style={{ clipPath: "inset(0 0 calc(100% - var(--seam)) 0)" }}>
            <h1 className="hero-type text-ink">
              <HeadlineLines slot />
            </h1>
          </div>
          <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true" style={{ clipPath: "inset(var(--seam) 0 0 0)" }}>
            <div className="hero-type text-[var(--field-1-ink)]">
              <HeadlineLines />
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-[56px] z-20 flex flex-col items-center gap-6 wrap text-center text-[var(--field-1-ink)] max-md:bottom-[40px]">
            <p className="max-w-[30ch] text-[18px] leading-[1.4] md:max-w-[46ch] md:text-[20px]">
              Sube el PDF, las láminas o la grabación de tu clase y Repaso te devuelve resumen, fichas y quiz. Para universitarios en
              Venezuela.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
              <Link href={signedIn ? "/app/subir" : "/registro"} className="btn btn-accent">
                {signedIn ? "Subir una clase" : "Prueba gratis con tu próxima clase"}
              </Link>
              <span className="text-[15px]">Desde {`$${PLANS.repaso.priceUsd}`} al mes · Pago Móvil</span>
            </div>
          </div>
        </section>

        {/* ───────────── Cómo funciona: escalera de cuatro frases ───────────── */}
        <section id="como" data-ink="#ff87ab" data-on="dark" data-reveal className="bg-field pb-[160px] pt-[18svh] text-[var(--field-1-ink)] md:pb-[220px]">
          <ol className="grid grid-cols-12 gap-x-4 wrap">
            {STEPS.map((s, i) => {
              const Tag = i === 0 ? "h2" : "h3";
              return (
                <li
                  key={s.line}
                  className="rise col-span-12 mb-10 md:mb-14"
                  style={{ ["--i" as string]: i, ["--col" as string]: 1 + i * 2 } as React.CSSProperties}
                >
                  <div className="step" style={{ ["--indent" as string]: i } as React.CSSProperties}>
                    <Tag
                      className="display"
                      style={{ fontSize: "clamp(34px, 4.6vw, 76px)", lineHeight: 1, color: i === 3 ? "var(--accent)" : undefined }}
                    >
                      {s.line}
                    </Tag>
                    <p className="mt-3 max-w-[34ch] text-[17px] leading-[1.5] text-[#ffc2d4]">{s.note}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* ───────────── Ejemplo en vivo: una clase, tres formas ───────────── */}
        <Showcase />

        {/* ───────────── Beneficios en campos de color ───────────── */}
        <section aria-label="Qué puedes subir y pedir">
          {FIELDS.map((f, i) => {
            const Tag = i === 0 ? "h2" : "h3";
            return (
              <div
                key={f.phrase}
                data-ink={f.ink}
                data-on={f.bg === "var(--accent)" ? "lime" : f.ink === "#0a0a0a" ? "light" : "dark"}
                data-reveal
                className="relative grid h-[64svh] grid-cols-12 gap-x-4 wrap py-7 md:h-[62svh]"
                style={{ background: f.bg, color: f.ink }}
              >
                <p
                  className={`rise col-span-12 max-w-[30ch] text-[16px] leading-[1.5] md:text-[18px] ${
                    f.mirror ? "md:col-start-2 md:col-span-4 max-md:justify-self-end max-md:text-right" : "md:col-start-8 md:col-span-4"
                  }`}
                  style={{ ["--i" as string]: 1 } as React.CSSProperties}
                >
                  {f.text}
                </p>
                <Tag
                  className={`rise display absolute bottom-7 max-w-[12ch] ${f.mirror ? "md:!left-auto md:text-right" : ""}`}
                  style={
                    {
                      fontSize: "clamp(52px, 9vw, 150px)",
                      lineHeight: 0.9,
                      left: "var(--margin)",
                      right: f.mirror ? "var(--margin)" : "auto",
                      ["--i" as string]: 0,
                    } as React.CSSProperties
                  }
                >
                  {f.phrase}
                </Tag>
              </div>
            );
          })}
        </section>

        {/* ───────────── Contexto: hecho para clases que se cortan ───────────── */}
        <section data-ink="#0a0a0a" data-on="light" data-reveal aria-labelledby="contexto-title" className="relative bg-bg pb-[160px] md:pb-[220px]">
          <div className="relative flex flex-col md:block md:min-h-[calc(26svh+57.5vw+48px)]">
            <div className="relative z-10 wrap pt-[18svh] md:pt-[24svh]">
              <h2 id="contexto-title" className="rise display" style={{ fontSize: "clamp(44px, 7vw, 112px)" }}>
                <span className="block">Hecho para clases</span>
                <span className="block">que se cortan.</span>
              </h2>
              <p
                className="rise mt-8 max-w-[30ch] text-[17px] leading-[1.45] md:mt-10 md:max-w-[24ch] md:text-[22px]"
                style={{ ["--i" as string]: 1 } as React.CSSProperties}
              >
                Se fue la luz, se cayó el internet, el profe habló hora y media sin parar. Que una mala conexión no te cueste la materia.
              </p>
            </div>
            <figure className="relative mt-10 ml-auto w-[80vw] md:absolute md:right-0 md:top-[26svh] md:mt-0 md:w-[46vw]">
              <div className="overflow-hidden">
                <Image
                  src="/img/ucv-reloj.jpg"
                  alt="La torre del reloj en la Plaza del Rectorado de la Universidad Central de Venezuela, bajo un cielo con nubes"
                  width={1200}
                  height={1600}
                  sizes="(min-width: 768px) 46vw, 80vw"
                  className="drift aspect-[4/5] h-auto w-full object-cover"
                />
              </div>
              <figcaption className="wrap mt-2 text-[13px] md:px-0">Plaza del Rectorado, Universidad Central de Venezuela</figcaption>
            </figure>
          </div>

          <div className="mt-16 grid grid-cols-12 gap-x-4 wrap md:mt-20">
            <figure className="rise col-span-7 md:col-span-3" style={{ ["--i" as string]: 0 } as React.CSSProperties}>
              <Image
                src="/img/metro-ciudad-universitaria.jpg"
                alt="Entrada de la estación Ciudad Universitaria del Metro de Caracas, con gente saliendo hacia la calle"
                width={1200}
                height={1600}
                sizes="(min-width: 768px) 25vw, 58vw"
                className="aspect-[9/10] h-auto w-full object-cover"
              />
              <figcaption className="mt-2 text-[13px]">Estación Ciudad Universitaria, Metro de Caracas</figcaption>
            </figure>
            <figure
              className="rise col-span-8 col-start-5 mt-16 md:col-span-4 md:col-start-5 md:mt-40"
              style={{ ["--i" as string]: 1 } as React.CSSProperties}
            >
              <Image
                src="/img/ucv-camino.jpg"
                alt="Camino peatonal bajo los árboles en la Ciudad Universitaria de Caracas"
                width={1200}
                height={1600}
                sizes="(min-width: 768px) 33vw, 66vw"
                className="aspect-[4/5] h-auto w-full object-cover"
              />
              <figcaption className="mt-2 text-[13px]">Ciudad Universitaria de Caracas</figcaption>
            </figure>
            <div className="rise col-span-12 mt-12 self-end md:col-span-4 md:col-start-9 md:mt-0" style={{ ["--i" as string]: 2 } as React.CSSProperties}>
              <p className="text-[17px] leading-[1.5]">
                Repaso funciona con datos móviles y en cualquier teléfono. Subes la clase cuando tengas señal y repasas después, a tu ritmo.
              </p>
              <Link href={signedIn ? "/app/subir" : "/registro"} className="btn mt-6">
                Subir mi primera clase
              </Link>
            </div>
          </div>
        </section>

        {/* ───────────── Precio en una frase ───────────── */}
        <section
          id="precios"
          data-ink="#ff87ab"
          data-on="dark"
          data-reveal
          aria-labelledby="precio-title"
          className="flex min-h-[90svh] flex-col justify-center bg-field py-[140px] text-[var(--field-1-ink)] wrap"
        >
          <h2 id="precio-title" className="rise display" style={{ fontSize: "clamp(46px, 8.4vw, 140px)" }}>
            Todo Repaso por{" "}
            <span className="inline-block bg-accent px-[0.15em] text-ink" style={{ lineHeight: 0.95 }}>
              ${PLANS.repaso.priceUsd}
            </span>{" "}
            al mes.
          </h2>
          <div className="rise mt-16 grid grid-cols-12 items-end gap-x-4 gap-y-8" style={{ ["--i" as string]: 1 } as React.CSSProperties}>
            <p className="col-span-12 max-w-[44ch] text-[17px] leading-[1.5] md:col-span-6 md:text-[20px]">
              {priceBs ? `Son ${priceBs} a la tasa BCV de hoy. ` : ""}
              Pagas por Pago Móvil, Binance o Zelle y activamos tu plan el mismo día. Incluye 30 materiales al mes, 5 horas de clases
              grabadas y un envío al equipo.
            </p>
            <div className="col-span-12 flex flex-col gap-3 md:col-span-4 md:col-start-9 md:items-end">
              <Link href={signedIn ? "/app/plan" : "/registro"} className="btn btn-accent w-full md:w-auto">
                {signedIn ? "Mejorar mi plan" : "Empezar gratis"}
              </Link>
              <a href="#planes" className="link-u text-[16px]">
                O Repaso+ por ${PLANS.repaso_plus.priceUsd} al mes, con 100 materiales
              </a>
            </div>
          </div>

          <div id="planes" className="mt-24 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-4">
            {Object.values(PLANS).map((p, i) => (
              <div key={p.id} className="rise" style={{ ["--i" as string]: i } as React.CSSProperties}>
                <h3 className="text-[28px] font-semibold tracking-[-0.03em]">
                  {p.name} · {p.priceUsd === 0 ? "gratis" : `$${p.priceUsd} al mes`}
                </h3>
                <p className="mt-1 text-[16px] text-[#ffc2d4]">{p.blurb}</p>
                <ul className="mt-4 space-y-2 text-[16px] leading-[1.45]">
                  {p.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ───────────── Preguntas: grandes a la izquierda, respuestas a la derecha ───────────── */}
        <section id="preguntas" data-ink="#0a0a0a" data-on="light" data-reveal aria-labelledby="faq-title" className="bg-bg pb-[140px] pt-[160px] wrap md:pb-[160px] md:pt-[200px]">
          <div className="grid grid-cols-12 gap-x-4">
            <h2 id="faq-title" className="col-span-12 text-[24px] font-medium leading-[1.1] tracking-[-0.02em] text-muted md:col-span-6 md:text-[clamp(26px,2.6vw,40px)]">
              Preguntas frecuentes
            </h2>
          </div>
          <dl className="mt-14 space-y-14 md:mt-20 md:space-y-20">
            {FAQ.map((f, i) => (
              <div key={f.q} className="rise grid grid-cols-12 gap-x-4 gap-y-3" style={{ ["--i" as string]: i % 3 } as React.CSSProperties}>
                <dt className="col-span-12 text-[24px] font-medium leading-[1.1] tracking-[-0.02em] md:col-span-6 md:text-[clamp(26px,2.6vw,40px)]">
                  {f.q}
                </dt>
                <dd className="col-span-12 max-w-[40ch] text-[17px] leading-[1.55] md:col-span-5 md:col-start-8 md:pt-2 md:text-[18px]">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ───────────── Cierre: una frase con un hueco ───────────── */}
        <section data-ink="#0a0a0a" data-on="lime" data-reveal aria-labelledby="cta-title" className="bg-accent py-[120px] wrap md:py-[160px]">
          <form action={signedIn ? "/app/subir" : "/registro"} method="get" className="display" style={{ fontSize: "clamp(40px, 6vw, 96px)" }}>
            <h2 id="cta-title" className="inline">
              Mi próximo parcial es de{" "}
            </h2>
            <label htmlFor="materia" className="sr-only">
              Materia
            </label>
            <input
              id="materia"
              name="materia"
              required
              autoComplete="off"
              placeholder="Cálculo"
              className="inline-block bg-[#c9e40f] align-baseline text-ink outline-none placeholder:text-[#4a5402] max-md:my-2 max-md:block max-md:w-full"
              style={{ width: "7em", height: "1.05em", padding: "0 0.2em", fontSize: "1em", letterSpacing: "-0.04em", fontWeight: 600 }}
            />{" "}
            <button type="submit" className="inline-block bg-ink px-[0.2em] align-baseline text-accent transition-transform duration-150 active:scale-[0.97]" style={{ height: "1.05em", lineHeight: 1 }}>
              empezar
            </button>
          </form>
          <p className="mt-8 text-[16px]">
            Creas tu cuenta en un minuto y tu primera clase va por nuestra cuenta.
          </p>
        </section>
      </main>

      {/* ───────────── Pie: invitación sobre el nombre cortado ───────────── */}
      <footer data-ink="#ff87ab" data-on="dark" className="relative flex flex-col overflow-hidden bg-field text-[var(--field-1-ink)]">
        <div className="grid grid-cols-12 gap-x-4 gap-y-10 wrap pt-[120px]">
          <div className="col-span-12 md:col-span-7">
            <h2 className="display" style={{ fontSize: "clamp(34px, 5vw, 84px)" }}>
              ¿No la entendiste? Mándanosla.
            </h2>
            <Link href={signedIn ? "/app/ayuda" : "/registro"} className="btn btn-accent mt-8 max-md:w-full">
              Pedir una explicación
            </Link>
          </div>
          <ul className="col-span-12 flex flex-wrap gap-x-6 gap-y-2 text-[16px] md:col-span-3 md:col-start-10 md:flex-col">
            <li>
              <a className="link-u" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
            </li>
            {CONTACT_WHATSAPP && (
              <li>
                <a className="link-u" href={`https://wa.me/${CONTACT_WHATSAPP.replace(/\D/g, "")}`} rel="noopener" target="_blank">
                  WhatsApp {CONTACT_WHATSAPP}
                </a>
              </li>
            )}
            <li>
              <Link className="link-u" href="/terminos">
                Términos y condiciones
              </Link>
            </li>
            <li>
              <Link className="link-u" href="/privacidad">
                Privacidad
              </Link>
            </li>
          </ul>
        </div>

        <div className="relative mt-[clamp(120px,16vw,220px)]">
          <div className="flex flex-col gap-1 wrap pb-3 text-[13px] text-[#ffc2d4] md:flex-row md:justify-between">
            <span>© {new Date().getFullYear()} Repaso · Hecho en Venezuela</span>
            <span>
              Fotos:{" "}
              {PHOTO_CREDITS.map((c, i) => (
                <span key={c.file}>
                  <a className="link-u" href={c.page} target="_blank" rel="noopener">
                    {c.creator}
                  </a>{" "}
                  (
                  <a className="link-u" href={c.licenseUrl} target="_blank" rel="noopener">
                    {c.license}
                  </a>
                  ){i < PHOTO_CREDITS.length - 1 ? ", " : ""}
                </span>
              ))}
              , vía Wikimedia Commons
            </span>
          </div>
          <p
            aria-hidden="true"
            className="whitespace-nowrap font-semibold leading-[0.8] tracking-[-0.06em] wrap"
            style={{ fontSize: "clamp(120px, 30vw, 520px)", transform: "translateY(22%)", marginBottom: "-0.05em" }}
          >
            repaso
          </p>
        </div>
      </footer>
    </div>
  );
}

function HeadlineLines({ slot = false }: { slot?: boolean }) {
  return (
    <>
      <span className="hero-line">
        Tu clase
        {slot ? <HeroSlot /> : <span className="hero-slot-spacer" aria-hidden="true" />}
      </span>
      <span className="hero-line">repasada.</span>
    </>
  );
}
