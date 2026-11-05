"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CREDIT_PRICE_USD, effectivePlan, PLANS, startOfMonthIso } from "@/lib/plans";
import { getSettings } from "@/lib/settings";
import { URGENT_HOURS } from "@/lib/tasks";
import type { Task } from "@/lib/types";

export type ActionResult = { ok: true; id?: string; message?: string } | { ok: false; error: string; needsPlan?: boolean };

const fileSchema = z.object({
  path: z.string().min(3).max(400),
  name: z.string().max(200),
  size: z.number().int().nonnegative(),
  type: z.string().max(120),
});

function ownsPath(userId: string, path: string) {
  return path.startsWith(`${userId}/`) && !path.includes("..");
}

// ─────────────────────────── Tareas ───────────────────────────

const TaskInput = z.object({
  level: z.enum(["bachillerato", "diversificado", "universidad"]),
  subject: z.string().trim().min(1).max(80),
  taskType: z.enum(["ejercicios", "informe", "ensayo", "presentacion", "resumen", "mapa", "ingles", "otro"]),
  title: z.string().trim().min(3).max(140),
  instructions: z.string().trim().max(6000).default(""),
  files: z.array(fileSchema).max(15).default([]),
  links: z.array(z.url().max(500)).max(10).default([]),
  dueAt: z.iso.datetime({ offset: true }),
});

/** Cuánto del cupo mensual del plan ya se usó (las urgentes cuentan doble). */
async function planUsage(userId: string) {
  const db = createAdminClient();
  const { data } = await db
    .from("tasks")
    .select("cost")
    .eq("user_id", userId)
    .eq("paid_with", "plan")
    .neq("status", "cancelada")
    .gte("created_at", startOfMonthIso());
  return (data ?? []).reduce((a, t) => a + (t.cost as number), 0);
}

export async function createTask(input: z.input<typeof TaskInput>): Promise<ActionResult> {
  const { user, profile } = await requireUser();
  const parsed = TaskInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisa los datos de la tarea: materia, título y fecha de entrega." };
  const t = parsed.data;
  if (t.files.some((f) => !ownsPath(user.id, f.path))) return { ok: false, error: "Archivo no válido." };
  if (!t.files.length && !t.links.length && t.instructions.length < 15) {
    return { ok: false, error: "Sube una foto o archivo del enunciado, o escribe las instrucciones." };
  }

  const plan = effectivePlan(profile.plan, profile.plan_expires_at);
  const hours = (new Date(t.dueAt).getTime() - Date.now()) / 3_600_000;
  if (hours < 3) return { ok: false, error: "La entrega debe ser dentro de 3 horas o más." };
  if (hours > 24 * 60) return { ok: false, error: "La entrega no puede ser a más de 60 días." };
  const urgent = hours < URGENT_HOURS;
  if (urgent && !plan.urgent) {
    return { ok: false, error: "Las entregas en menos de 24 horas están en los planes Pro y Full.", needsPlan: true };
  }
  if (hours < plan.minHours) {
    return { ok: false, error: `Con tu plan, la entrega debe ser con ${plan.minHours} horas o más.`, needsPlan: true };
  }
  const cost = urgent ? 2 : 1;

  const db = createAdminClient();
  let paidWith: "plan" | "creditos";
  const used = await planUsage(user.id);
  if (plan.tasksPerMonth - used >= cost) {
    paidWith = "plan";
  } else {
    const { data: spent } = await db.rpc("spend_credits", { p_user: user.id, p_amount: cost });
    if (!spent) {
      return {
        ok: false,
        needsPlan: true,
        error:
          plan.tasksPerMonth > 0
            ? `Ya usaste las ${plan.tasksPerMonth} tareas de tu plan este mes. Compra tareas sueltas o mejora tu plan.`
            : "No te quedan tareas disponibles. Elige un plan o compra tareas sueltas.",
      };
    }
    paidWith = "creditos";
  }

  const { data, error } = await db
    .from("tasks")
    .insert({
      user_id: user.id,
      level: t.level,
      subject: t.subject,
      task_type: t.taskType,
      title: t.title,
      instructions: t.instructions,
      files: t.files,
      links: t.links,
      due_at: t.dueAt,
      urgent,
      cost,
      paid_with: paidWith,
    })
    .select("id")
    .single();
  if (error || !data) {
    if (paidWith === "creditos") await db.rpc("add_credits", { p_user: user.id, p_amount: cost });
    return { ok: false, error: "No pudimos registrar tu tarea. Intenta de nuevo." };
  }
  revalidatePath("/app", "layout");
  return { ok: true, id: data.id };
}

async function ownTask(taskId: string, userId: string) {
  const db = createAdminClient();
  const { data } = await db.from("tasks").select("*").eq("id", taskId).eq("user_id", userId).maybeSingle<Task>();
  return data;
}

export async function cancelTask(taskId: string): Promise<ActionResult> {
  const { user } = await requireUser();
  const task = await ownTask(taskId, user.id);
  if (!task) return { ok: false, error: "No encontramos la tarea." };
  if (task.status !== "recibida") return { ok: false, error: "Solo puedes cancelar una tarea que nadie ha empezado." };
  const db = createAdminClient();
  const { error } = await db.from("tasks").update({ status: "cancelada", updated_at: new Date().toISOString() }).eq("id", taskId).eq("status", "recibida");
  if (error) return { ok: false, error: "No pudimos cancelarla." };
  if (task.paid_with === "creditos") await db.rpc("add_credits", { p_user: user.id, p_amount: task.cost });
  revalidatePath("/app", "layout");
  return { ok: true, message: "Tarea cancelada. Te devolvimos la tarea a tu cupo." };
}

export async function sendMessage(taskId: string, body: string, files: z.input<typeof fileSchema>[] = []): Promise<ActionResult> {
  const { user } = await requireUser();
  const text = body.trim().slice(0, 4000);
  const parsedFiles = z.array(fileSchema).max(10).safeParse(files);
  if (!parsedFiles.success || parsedFiles.data.some((f) => !ownsPath(user.id, f.path))) return { ok: false, error: "Archivo no válido." };
  if (!text && !parsedFiles.data.length) return { ok: false, error: "Escribe un mensaje." };
  const task = await ownTask(taskId, user.id);
  if (!task || task.status === "cancelada") return { ok: false, error: "No puedes escribir en esta tarea." };
  const db = createAdminClient();
  await db.from("task_messages").insert({ task_id: taskId, author_id: user.id, from_staff: false, body: text, files: parsedFiles.data });
  // Si el equipo pidió información, la respuesta devuelve la tarea al proceso.
  if (task.status === "necesita_info") await db.from("tasks").update({ status: "en_proceso", updated_at: new Date().toISOString() }).eq("id", taskId);
  revalidatePath(`/app/tareas/${taskId}`);
  return { ok: true };
}

export async function requestRevision(taskId: string, reason: string): Promise<ActionResult> {
  const { user, profile } = await requireUser();
  const text = reason.trim();
  if (text.length < 10) return { ok: false, error: "Cuéntanos qué hay que corregir (al menos una frase)." };
  const task = await ownTask(taskId, user.id);
  if (!task || task.status !== "entregada") return { ok: false, error: "Solo puedes pedir corrección de una tarea entregada." };
  const plan = effectivePlan(profile.plan, profile.plan_expires_at);
  const allowed = Math.max(plan.revisions, PLANS.basico.revisions);
  if (task.revision_requests >= allowed) return { ok: false, error: `Ya usaste las ${allowed} correcciones de esta tarea.` };
  const db = createAdminClient();
  await db
    .from("tasks")
    .update({ status: "corrigiendo", revision_requests: task.revision_requests + 1, updated_at: new Date().toISOString() })
    .eq("id", taskId);
  await db.from("task_messages").insert({ task_id: taskId, author_id: user.id, from_staff: false, body: `Pedí una corrección: ${text.slice(0, 3000)}` });
  revalidatePath(`/app/tareas/${taskId}`);
  return { ok: true, message: "Pedimos la corrección. Te avisamos cuando esté lista." };
}

export async function rateTask(taskId: string, rating: number, comment: string): Promise<ActionResult> {
  const { user } = await requireUser();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { ok: false, error: "Elige de 1 a 5." };
  const task = await ownTask(taskId, user.id);
  if (!task || !["entregada", "cerrada"].includes(task.status)) return { ok: false, error: "Solo puedes calificar una tarea entregada." };
  const db = createAdminClient();
  await db
    .from("tasks")
    .update({ rating, rating_comment: comment.trim().slice(0, 500) || null, status: "cerrada", updated_at: new Date().toISOString() })
    .eq("id", taskId);
  revalidatePath(`/app/tareas/${taskId}`);
  return { ok: true, message: "¡Gracias! Tu calificación nos ayuda a mejorar." };
}

// ─────────────────────────── Pagos ───────────────────────────

const PaymentInput = z.object({
  kind: z.enum(["plan", "creditos"]),
  plan: z.enum(["basico", "pro", "full"]).optional(),
  months: z.number().int().min(1).max(6).default(1),
  quantity: z.number().int().min(1).max(50).default(1),
  method: z.enum(["pago_movil", "binance", "zelle", "efectivo"]),
  reference: z.string().trim().min(3).max(80),
  payerName: z.string().trim().max(120).default(""),
  payerIdDoc: z.string().trim().max(20).default(""),
  payerPhone: z.string().trim().max(20).default(""),
  receiptPath: z.string().max(400).optional().nullable(),
});

export async function createPayment(input: z.input<typeof PaymentInput>): Promise<ActionResult> {
  const { user } = await requireUser();
  const parsed = PaymentInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisa los datos del pago." };
  const p = parsed.data;
  if (p.kind === "plan" && !p.plan) return { ok: false, error: "Elige un plan." };
  if (p.receiptPath && !ownsPath(user.id, p.receiptPath)) return { ok: false, error: "Comprobante no válido." };

  const { rate } = await getSettings();
  const usd = Math.round((p.kind === "plan" ? PLANS[p.plan!].priceUsd * p.months : CREDIT_PRICE_USD * p.quantity) * 100) / 100;
  const bs = rate.bs_per_usd > 0 ? Math.round(usd * rate.bs_per_usd * 100) / 100 : null;

  const db = createAdminClient();
  const { count } = await db.from("payments").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "pendiente");
  if ((count ?? 0) >= 3) return { ok: false, error: "Tienes pagos por verificar. Espera a que los revisemos." };

  const { error } = await db.from("payments").insert({
    user_id: user.id,
    kind: p.kind,
    plan: p.kind === "plan" ? p.plan : null,
    months: p.kind === "plan" ? p.months : 1,
    quantity: p.kind === "creditos" ? p.quantity : 0,
    amount_usd: usd,
    amount_bs: p.method === "pago_movil" ? bs : null,
    rate_bs: rate.bs_per_usd || null,
    method: p.method,
    reference: p.reference,
    payer_name: p.payerName,
    payer_id_doc: p.payerIdDoc,
    payer_phone: p.payerPhone,
    receipt_path: p.receiptPath || null,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Esa referencia ya fue registrada." };
    return { ok: false, error: "No pudimos registrar el pago." };
  }
  revalidatePath("/app/plan");
  return { ok: true, message: "Recibimos tu pago. Lo verificamos y lo activamos, normalmente el mismo día." };
}

// ─────────────────────────── Perfil ───────────────────────────

const ProfileInput = z.object({
  full_name: z.string().trim().max(120),
  whatsapp: z.string().trim().max(30),
  level: z.enum(["bachillerato", "diversificado", "universidad"]),
  institution: z.string().trim().max(120),
  career: z.string().trim().max(120),
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
  for (const bucket of ["tasks", "receipts"]) {
    for (const folder of [user.id, `${user.id}/entregas`]) {
      for (let i = 0; i < 20; i++) {
        const { data } = await admin.storage.from(bucket).list(folder, { limit: 100 });
        const files = (data ?? []).filter((f) => f.id);
        if (!files.length) break;
        await admin.storage.from(bucket).remove(files.map((f) => `${folder}/${f.name}`));
        if (files.length < 100) break;
      }
    }
  }
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { ok: false, error: "No pudimos borrar tu cuenta. Escríbenos y lo hacemos a mano." };
  return { ok: true };
}
