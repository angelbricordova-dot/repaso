export type Level = "bachillerato" | "diversificado" | "universidad";
export type Role = "student" | "staff" | "admin";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  whatsapp: string;
  level: Level;
  institution: string;
  career: string;
  role: Role;
  plan: "gratis" | "basico" | "pro" | "full";
  plan_expires_at: string | null;
  credits: number;
  referral_code: string | null;
  referred_by: string | null;
  referral_rewarded: boolean;
  terms_version: string | null;
  terms_accepted_at: string | null;
  created_at: string;
};

export type StoredFile = { path: string; name: string; size: number; type: string };

export type TaskType = "ejercicios" | "informe" | "ensayo" | "presentacion" | "resumen" | "mapa" | "ingles" | "otro";
export type TaskStatus = "recibida" | "en_proceso" | "necesita_info" | "entregada" | "corrigiendo" | "cerrada" | "cancelada";

export type Task = {
  id: string;
  number: number;
  user_id: string;
  level: Level;
  subject: string;
  task_type: TaskType;
  title: string;
  instructions: string;
  files: StoredFile[];
  links: string[];
  due_at: string;
  urgent: boolean;
  cost: number;
  paid_with: "plan" | "creditos";
  status: TaskStatus;
  assigned_to: string | null;
  delivery_note: string | null;
  delivery_files: StoredFile[];
  delivered_at: string | null;
  revision_requests: number;
  rating: number | null;
  rating_comment: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskMessage = {
  id: string;
  task_id: string;
  author_id: string | null;
  from_staff: boolean;
  body: string;
  files: StoredFile[];
  created_at: string;
};

export type PaymentMethod = "pago_movil" | "binance" | "zelle" | "efectivo";

export type Payment = {
  id: string;
  user_id: string;
  kind: "plan" | "creditos";
  plan: "basico" | "pro" | "full" | null;
  months: number;
  quantity: number;
  amount_usd: number;
  amount_bs: number | null;
  rate_bs: number | null;
  method: PaymentMethod;
  reference: string;
  payer_name: string;
  payer_id_doc: string;
  payer_phone: string;
  receipt_path: string | null;
  status: "pendiente" | "aprobado" | "rechazado";
  admin_note: string | null;
  reviewed_by: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export type RateSetting = { bs_per_usd: number; source: string; updated: string | null };
export type PaymentMethodsSetting = {
  pago_movil: { bank: string; phone: string; id_doc: string; holder: string };
  binance: { pay_id: string; email: string };
  zelle: { email: string; holder: string };
};
