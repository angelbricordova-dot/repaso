// Planes de Repaso. Cambia precios y límites aquí; todo lo demás los lee de este archivo.

export type PlanId = "gratis" | "repaso" | "repaso_plus";

export type Plan = {
  id: PlanId;
  name: string;
  priceUsd: number;
  /** Materiales procesados por la IA en un mes calendario */
  materialsPerMonth: number;
  /** Minutos de clases grabadas (audio o video) transcritos por mes */
  recordingMinutesPerMonth: number;
  /** Envíos al equipo de Repaso por mes ("no entendí esta clase") */
  helpRequestsPerMonth: number;
  /** Preguntas al tutor por material */
  tutorQuestionsPerMaterial: number;
  /** Páginas máximas por PDF */
  maxPdfPages: number;
  blurb: string;
  features: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  gratis: {
    id: "gratis",
    name: "Gratis",
    priceUsd: 0,
    materialsPerMonth: 3,
    recordingMinutesPerMonth: 0,
    helpRequestsPerMonth: 0,
    tutorQuestionsPerMaterial: 10,
    maxPdfPages: 30,
    blurb: "Para probar con tu próxima clase.",
    features: [
      "3 materiales al mes",
      "Resumen, fichas, quiz y preguntas de desarrollo",
      "10 preguntas al tutor por material",
      "PDF de hasta 30 páginas",
    ],
  },
  repaso: {
    id: "repaso",
    name: "Repaso",
    priceUsd: 3,
    materialsPerMonth: 30,
    recordingMinutesPerMonth: 300,
    helpRequestsPerMonth: 1,
    tutorQuestionsPerMaterial: 60,
    maxPdfPages: 150,
    blurb: "Para todo el semestre.",
    features: [
      "30 materiales al mes",
      "5 horas de clases grabadas al mes",
      "60 preguntas al tutor por material",
      "1 envío al equipo de Repaso al mes",
      "PDF de hasta 150 páginas",
    ],
  },
  repaso_plus: {
    id: "repaso_plus",
    name: "Repaso+",
    priceUsd: 7,
    materialsPerMonth: 100,
    recordingMinutesPerMonth: 1200,
    helpRequestsPerMonth: 5,
    tutorQuestionsPerMaterial: 200,
    maxPdfPages: 300,
    blurb: "Para carreras pesadas y épocas de parciales.",
    features: [
      "100 materiales al mes",
      "20 horas de clases grabadas al mes",
      "200 preguntas al tutor por material",
      "5 envíos al equipo de Repaso al mes, con prioridad",
      "PDF de hasta 300 páginas",
    ],
  },
};

export const PAID_PLANS = [PLANS.repaso, PLANS.repaso_plus];

/** El plan vigente: si el pago venció, vuelve a gratis. */
export function effectivePlan(plan: string | null | undefined, expiresAt: string | null | undefined): Plan {
  const id = (plan ?? "gratis") as PlanId;
  if (id === "gratis" || !PLANS[id]) return PLANS.gratis;
  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) return PLANS.gratis;
  return PLANS[id];
}

export function startOfMonthIso(d = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}
