"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod/v4";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { effectivePlan, PLANS, startOfMonthIso } from "@/lib/plans";
import { getSettings } from "@/lib/settings";
import type { MaterialProgress, StoredFile } from "@/lib/types";

export type ActionResult = { ok: true; id?: string; message?: string } | { ok: false; error: string };

const fileSchema = z.object({
  path: z.string().min(3).max(400),
  name: z.string().max(200),
  size: z.number().int().nonnegative(),
  type: z.string().max(120),
});

function ownsPath(userId: string, path: string) {
  return path.startsWith(`${userId}/`) && !path.includes("..");
}

// ─────────────────────────── Materias ───────────────────────────

export async function createSubject(name: string, examDate?: string | null): Promise<ActionResult> {
  const { user, supabase } = await requireUser();
  const clean = name.trim().slice(0, 80);
  if (!clean) return { ok: false, error: "Escribe el nombre de la materia." };
  const { data, error } = await supabase
    .from("subjects")
    .insert({ user_id: user.id, name: clean, exam_date: examDate || null })
    .select("id")
    .single();
  if (error) return { ok: false, error: "No pudimos crear la materia." };
  revalidatePath("/app", "layout");
  return { ok: true, id: data.id };
}

export async function updateSubject(id: string, fields: { name?: string; exam_date?: string | null }): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const patch: Record<string, unknown> = {};
  if (fields.name !== undefined) patch.name = fields.name.trim().slice(0, 80);
  if (fields.exam_date !== undefined) patch.exam_date = fields.exam_date || null;
  const { error } = await supabase.from("subjects").update(patch).eq("id", id);
  if (error) return { ok: false, error: "No pudimos guardar los cambios." };
  revalidatePath("/app", "layout");
  return { ok: true };
}

export async function deleteSubject(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (error) return { ok: false, error: "No pudimos borrar la materia." };
  revalidatePath("/app", "layout");
  return { ok: true };
}

// ─────────────────────────── Materiales ───────────────────────────

const MaterialInput = z.object({
  title: z.string().trim().min(1).max(140),
  kind: z.enum(["pdf", "slides", "doc", "image", "audio", "video", "text"]),
  subjectId: z.uuid().nullable().optional(),
  newSubject: z.string().trim().max(80).optional(),
  files: z.array(fileSchema).max(20).default([]),
  text: z.string().max(400_000).optional(),
});

export async function createMaterial(input: z.input<typeof MaterialInput>): Promise<ActionResult> {
  const { user, profile, supabase } = await requireUser();
  const parsed = MaterialInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisa los datos del material." };
  const m = parsed.data;

  if (m.files.some((f) => !ownsPath(user.id, f.path))) return { ok: false, error: "Archivo no válido." };
  if (m.kind === "text" && (!m.text || m.text.trim().length < 80)) {
    return { ok: false, error: "Pega al menos un párrafo de texto (80 caracteres)." };
  }
  if (m.kind !== "text" && m.files.length === 0) return { ok: false, error: "Sube un archivo." };

  const plan = effectivePlan(profile.plan, profile.plan_expires_at);
  if ((m.kind === "audio" || m.kind === "video") && plan.recordingMinutesPerMonth === 0) {
    return { ok: false, error: "Las clases grabadas están en los planes Repaso y Repaso+." };
  }

  let subjectId = m.subjectId ?? null;
  if (!subjectId && m.newSubject) {
    const { data } = await supabase.from("subjects").insert({ user_id: user.id, name: m.newSubject }).select("id").single();
    subjectId = data?.id ?? null;
  }

  const first = m.files[0];
  const { data, error } = await supabase
    .from("materials")
    .insert({
      user_id: user.id,
      subject_id: subjectId,
      title: m.title,
      kind: m.kind,
      storage_path: first?.path ?? null,
      files: m.files,
      mime_type: first?.type ?? "text/plain",
      size_bytes: m.files.reduce((a, f) => a + f.size, 0) || (m.text?.length ?? 0),
      source_text: m.kind === "text" ? m.text!.trim() : null,
      status: "pending",
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "No pudimos guardar el material." };
  revalidatePath("/app", "layout");
  return { ok: true, id: data.id };
}

export async function renameMaterial(id: string, title: string, subjectId: string | null): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const clean = title.trim().slice(0, 140);
  if (!clean) return { ok: false, error: "El título no puede estar vacío." };
  const { error } = await supabase.from("materials").update({ title: clean, subject_id: subjectId }).eq("id", id);
  if (error) return { ok: false, error: "No pudimos guardar." };
  revalidatePath("/app", "layout");
  return { ok: true };
}

export async function deleteMaterial(id: string): Promise<void> {
  const { user, supabase } = await requireUser();
  const { data } = await supabase.from("materials").select("files, storage_path").eq("id", id).maybeSingle();
  if (data) {
    const paths = new Set<string>([...((data.files as StoredFile[]) ?? []).map((f) => f.path), ...(data.storage_path ? [data.storage_path] : [])]);
    const own = [...paths].filter((p) => ownsPath(user.id, p));
    if (own.length) await supabase.storage.from("materials").remove(own);
    await supabase.from("materials").delete().eq("id", id);
  }
  revalidatePath("/app", "layout");
  redirect("/app");
}

export async function saveProgress(id: string, patch: MaterialProgress): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("materials").select("progress").eq("id", id).maybeSingle();
  if (!data) return { ok: false, error: "No encontrado." };
  const prev = (data.progress as MaterialProgress) ?? {};
  const next: MaterialProgress = {
    ...prev,
    ...patch,
    cards: { ...(prev.cards ?? {}), ...(patch.cards ?? {}) },
    last_studied_at: new Date().toISOString(),
  };
  if (patch.quiz_last !== undefined) {
    next.quiz_best = Math.max(prev.quiz_best ?? 0, patch.quiz_last);
    next.quiz_attempts = (prev.quiz_attempts ?? 0) + 1;
  }
  const { error } = await supabase.from("materials").update({ progress: next }).eq("id", id);
  if (error) return { ok: false, error: "No pudimos guardar tu progreso." };
  return { ok: true };
}

// ─────────────────────────── Envíos al equipo ───────────────────────────

const HelpInput = z.object({
  subject: z.string().trim().min(1).max(120),
  topic: z.string().trim().min(3).max(200),
  details: z.string().trim().max(4000).default(""),
  links: z.array(z.url().max(500)).max(10).default([]),
  files: z.array(fileSchema).max(10).default([]),
  examDate: z.string().max(10).optional().nullable(),
});

export async function createHelpRequest(input: z.input<typeof HelpInput>): Promise<ActionResult> {
  const { user, profile, supabase } = await requireUser();
  const parsed = HelpInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisa el formulario: materia, tema y enlaces válidos." };
  const h = parsed.data;
  if (h.files.some((f) => !ownsPath(user.id, f.path))) return { ok: false, error: "Archivo no válido." };
  if (!h.files.length && !h.links.length && h.details.length < 20) {
    return { ok: false, error: "Adjunta la clase, un enlace o cuéntanos con detalle qué no entendiste." };
  }

  const plan = effectivePlan(profile.plan, profile.plan_expires_at);
  const { count } = await supabase
    .from("help_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfMonthIso());
  if ((count ?? 0) >= plan.helpRequestsPerMonth) {
    return {
      ok: false,
      error:
        plan.helpRequestsPerMonth === 0
          ? "Los envíos al equipo están en los planes Repaso y Repaso+."
          : `Ya usaste tus ${plan.helpRequestsPerMonth} envíos de este mes.`,
    };
  }

  const { data, error } = await supabase
    .from("help_requests")
    .insert({
      user_id: user.id,
      subject: h.subject,
      topic: h.topic,
      details: h.details,
      links: h.links,
      files: h.files,
      exam_date: h.examDate || null,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "No pudimos enviar tu solicitud." };
  revalidatePath("/app/ayuda");
  return { ok: true, id: data.id, message: "Recibimos tu solicitud. Te avisamos aquí cuando esté lista." };
}

// ─────────────────────────── Pagos ───────────────────────────

const PaymentInput = z.object({
  plan: z.enum(["repaso", "repaso_plus"]),
  months: z.number().int().min(1).max(6),
  method: z.enum(["pago_movil", "binance", "zelle", "efectivo"]),
  reference: z.string().trim().min(3).max(80),
  payerName: z.string().trim().max(120).default(""),
  payerIdDoc: z.string().trim().max(20).default(""),
  payerPhone: z.string().trim().max(20).default(""),
  receiptPath: z.string().max(400).optional().nullable(),
});

export async function createPayment(input: z.input<typeof PaymentInput>): Promise<ActionResult> {
  const { user, supabase } = await requireUser();
  const parsed = PaymentInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisa los datos del pago." };
  const p = parsed.data;
  if (p.receiptPath && !ownsPath(user.id, p.receiptPath)) return { ok: false, error: "Comprobante no válido." };

  const { rate } = await getSettings();
  const usd = PLANS[p.plan].priceUsd * p.months;
  const bs = rate.bs_per_usd > 0 ? Math.round(usd * rate.bs_per_usd * 100) / 100 : null;

  const { error } = await supabase.from("payments").insert({
    user_id: user.id,
    plan: p.plan,
    months: p.months,
    amount_usd: usd,
    amount_bs: p.method === "pago_movil" ? bs : null,
    rate_bs: rate.bs_per_usd || null,
    method: p.method,
    reference: p.reference,
    payer_name: p.payerName,
    payer_id_doc: p.payerIdDoc,
    payer_phone: p.payerPhone,
    receipt_path: p.receiptPath || null,
    status: "pendiente",
  });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Esa referencia ya fue registrada." };
    return { ok: false, error: "No pudimos registrar el pago." };
  }
  revalidatePath("/app/plan");
  return { ok: true, message: "Recibimos tu pago. Lo verificamos y activamos tu plan, normalmente el mismo día." };
}

// ─────────────────────────── Perfil ───────────────────────────

const ProfileInput = z.object({
  full_name: z.string().trim().max(120),
  university: z.string().trim().max(120),
  career: z.string().trim().max(120),
  semester: z.string().trim().max(40),
  phone: z.string().trim().max(30),
});

export async function updateProfile(input: z.input<typeof ProfileInput>): Promise<ActionResult> {
  const { user, supabase } = await requireUser();
  const parsed = ProfileInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisa los datos." };
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user.id);
  if (error) return { ok: false, error: "No pudimos guardar tu perfil." };
  revalidatePath("/app", "layout");
  return { ok: true, message: "Guardado" };
}

export async function deleteAccount(confirmEmail: string): Promise<ActionResult> {
  const { user } = await requireUser();
  if (confirmEmail.trim().toLowerCase() !== (user.email ?? "").toLowerCase()) {
    return { ok: false, error: "Escribe tu correo exactamente para confirmar." };
  }
  const admin = createAdminClient();
  for (const bucket of ["materials", "requests", "receipts"]) {
    // Borra los archivos en lotes (la carpeta del usuario es su id).
    for (let i = 0; i < 20; i++) {
      const { data } = await admin.storage.from(bucket).list(user.id, { limit: 100 });
      if (!data?.length) break;
      await admin.storage.from(bucket).remove(data.map((f) => `${user.id}/${f.name}`));
      if (data.length < 100) break;
    }
  }
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { ok: false, error: "No pudimos borrar tu cuenta. Escríbenos y lo hacemos a mano." };
  return { ok: true };
}
