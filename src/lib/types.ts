export type Profile = {
  id: string;
  email: string;
  full_name: string;
  university: string;
  career: string;
  semester: string;
  phone: string;
  role: "student" | "admin";
  plan: "gratis" | "repaso" | "repaso_plus";
  plan_expires_at: string | null;
  terms_version: string | null;
  terms_accepted_at: string | null;
  created_at: string;
};

export type Subject = { id: string; user_id: string; name: string; exam_date: string | null; created_at: string };

export type MaterialKind = "pdf" | "slides" | "doc" | "image" | "audio" | "video" | "text";
export type MaterialStatus = "pending" | "processing" | "ready" | "error";

export type Flashcard = { front: string; back: string };
export type QuizQuestion = { question: string; options: string[]; correct: number; explanation: string };
export type OpenQuestion = { question: string; answer_guide: string };
export type KeyConcept = { term: string; definition: string };
export type SummarySection = { heading: string; body: string };

export type StudyKit = {
  title: string;
  one_line: string;
  summary: SummarySection[];
  key_concepts: KeyConcept[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  open_questions: OpenQuestion[];
  likely_exam_topics: string[];
};

export type MaterialProgress = {
  /** índice de ficha → caja de Leitner (0 = nueva, 1..4) */
  cards?: Record<string, number>;
  quiz_best?: number;
  quiz_last?: number;
  quiz_attempts?: number;
  last_studied_at?: string;
};

export type Material = {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  kind: MaterialKind;
  storage_path: string | null;
  files: StoredFile[];
  mime_type: string | null;
  size_bytes: number | null;
  source_text: string | null;
  duration_seconds: number | null;
  status: MaterialStatus;
  error: string | null;
  kit: StudyKit | null;
  progress: MaterialProgress;
  ai_model: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
  created_at: string;
  processing_started_at: string | null;
  processed_at: string | null;
};

export type StoredFile = { path: string; name: string; size: number; type: string };

export type HelpRequest = {
  id: string;
  user_id: string;
  subject: string;
  topic: string;
  details: string;
  links: string[];
  files: StoredFile[];
  exam_date: string | null;
  status: "recibido" | "en_revision" | "respondido" | "cerrado";
  admin_response: string | null;
  response_files: StoredFile[];
  created_at: string;
  responded_at: string | null;
};

export type PaymentMethod = "pago_movil" | "binance" | "zelle" | "efectivo";

export type Payment = {
  id: string;
  user_id: string;
  plan: "repaso" | "repaso_plus";
  months: number;
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
