// Planes de TareaYa. Cambia precios y cupos aquí; todo lo demás los lee de este archivo.

export type PlanId = "gratis" | "basico" | "pro" | "full";

export type Plan = {
  id: PlanId;
  name: string;
  priceUsd: number;
  /** Tareas incluidas por mes calendario */
  tasksPerMonth: number;
  /** Horas mínimas de anticipación para una tarea normal */
  minHours: number;
  /** Puede pedir entregas urgentes (menos de 24 h; cuentan doble) */
  urgent: boolean;
  /** Correcciones incluidas por tarea */
  revisions: number;
  blurb: string;
  features: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  gratis: {
    id: "gratis",
    name: "Sin plan",
    priceUsd: 0,
    tasksPerMonth: 0,
    minHours: 24,
    urgent: false,
    revisions: 1,
    blurb: "Pagas solo las tareas que mandes.",
    features: ["1 tarea gratis al registrarte", "Tareas sueltas a $1,49", "1 corrección por tarea"],
  },
  basico: {
    id: "basico",
    name: "Básico",
    priceUsd: 5.99,
    tasksPerMonth: 10,
    minHours: 24,
    urgent: false,
    revisions: 1,
    blurb: "Para las tareas de la semana.",
    features: ["10 tareas al mes", "Entrega con 24 horas o más", "1 corrección por tarea", "Chat con quien resuelve tu tarea"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceUsd: 9.99,
    tasksPerMonth: 25,
    minHours: 12,
    urgent: true,
    revisions: 2,
    blurb: "Para épocas de entregas y parciales.",
    features: ["25 tareas al mes", "Entregas urgentes en menos de 24 horas", "2 correcciones por tarea", "Prioridad en la cola"],
  },
  full: {
    id: "full",
    name: "Full",
    priceUsd: 16.99,
    tasksPerMonth: 60,
    minHours: 6,
    urgent: true,
    revisions: 3,
    blurb: "Para carreras pesadas o varios hermanos.",
    features: ["60 tareas al mes", "Entregas urgentes desde 6 horas", "3 correcciones por tarea", "Primera prioridad en la cola"],
  },
};

export const PAID_PLANS = [PLANS.basico, PLANS.pro, PLANS.full];

/** Precio de una tarea suelta (crédito), en USD. */
export const CREDIT_PRICE_USD = 1.49;
export const CREDIT_PACKS = [1, 3, 5, 10];

/** Créditos que gana quien invita cuando su invitado hace su primer pago. */
export const REFERRAL_REWARD = 2;
/** Créditos extra para el invitado en su primer pago. */
export const REFERRED_REWARD = 1;

export function effectivePlan(plan: string | null | undefined, expiresAt: string | null | undefined): Plan {
  const id = (plan ?? "gratis") as PlanId;
  if (id === "gratis" || !PLANS[id]) return PLANS.gratis;
  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) return PLANS.gratis;
  return PLANS[id];
}

export function startOfMonthIso(d = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

/** Prioridad en la cola: más alto va primero. */
export const PLAN_PRIORITY: Record<PlanId, number> = { full: 3, pro: 2, basico: 1, gratis: 0 };
