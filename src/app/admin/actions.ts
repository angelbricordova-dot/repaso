"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import type { ActionResult } from "@/app/app/actions";
import { requireAdmin, requireStaff } from "@/lib/auth";
import { REFERRAL_REWARD, REFERRED_REWARD } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Task } from "@/lib/types";

const DAY = 86_400_000;
const fileSchema = z.object({ path: z.string().min(3).max(400), name: z.string().max(200), size: z.number().int().nonnegative(), type: z.string().max(120) });

async function getTask(id: string) {
  const { data } = await createAdminClient().from("tasks").select("*").eq("id", id).maybeSingle<Task>();
  return data;
}

// ─────────────────────────── Equipo: tareas ───────────────────────────

export async function takeTask(id: string): Promise<ActionResult> {
  const { user } = await requireStaff();
  const task = await getTask(id);
  if (!task) return { ok: false, error: "No encontrada." };
  if (task.assigned_to && task.assigned_to !== user.id && task.status !== "recibida") return { ok: false, error: "Otra persona del equipo ya la tomó." };
  await createAdminClient()
    .from("tasks")
    .update({ assigned_to: user.id, status: task.status === "recibida" ? "en_proceso" : task.status, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function setTaskStatus(id: string, status: "en_proceso" | "necesita_info" | "recibida" | "cerrada"): Promise<ActionResult> {
  await requireStaff();
  await createAdminClient().from("tasks").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function staffMessage(id: string, body: string, files: z.input<typeof fileSchema>[] = [], askInfo = false): Promise<ActionResult> {
  const { user } = await requireStaff();
  const task = await getTask(id);
  if (!task) return { ok: false, error: "No encontrada." };
  const parsed = z.array(fileSchema).max(10).safeParse(files);
  if (!parsed.success || parsed.data.some((f) => !f.path.startsWith(`${task.user_id}/`))) return { ok: false, error: "Archivo no válido." };
  const text = body.trim().slice(0, 4000);
  if (!text && !parsed.data.length) return { ok: false, error: "Escribe un mensaje." };
  const db = createAdminClient();
  await db.from("task_messages").insert({ task_id: id, author_id: user.id, from_staff: true, body: text, files: parsed.data });
  if (askInfo) await db.from("tasks").update({ status: "necesita_info", updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath(`/admin/tareas/${id}`);
  return { ok: true };
}

export async function deliverTask(id: string, note: string, files: z.input<typeof fileSchema>[]): Promise<ActionResult> {
  const { user } = await requireStaff();
  const task = await getTask(id);
  if (!task) return { ok: false, error: "No encontrada." };
  const parsed = z.array(fileSchema).max(20).safeParse(files);
  if (!parsed.success || parsed.data.some((f) => !f.path.startsWith(`${task.user_id}/`))) return { ok: false, error: "Archivos no válidos." };
  const all = [...task.delivery_files, ...parsed.data];
  if (!all.length && note.trim().length < 20) return { ok: false, error: "Adjunta la tarea resuelta o escribe la solución." };
  await createAdminClient()
    .from("tasks")
    .update({
      status: "entregada",
      delivery_note: note.trim().slice(0, 20000) || task.delivery_note,
      delivery_files: all,
      delivered_at: new Date().toISOString(),
      assigned_to: task.assigned_to ?? user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Entregada. Avísale al estudiante por WhatsApp." };
}

// ─────────────────────────── Admin: pagos ───────────────────────────

async function extendPlan(userId: string, plan: string, months: number) {
  const db = createAdminClient();
  const { data: p } = await db.from("profiles").select("plan, plan_expires_at").eq("id", userId).single();
  const current = p?.plan === plan && p?.plan_expires_at ? new Date(p.plan_expires_at).getTime() : 0;
  const base = Math.max(Date.now(), current);
  await db.from("profiles").update({ plan, plan_expires_at: new Date(base + months * 30 * DAY).toISOString() }).eq("id", userId);
}

export async function approvePayment(id: string): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const db = createAdminClient();
  // Se marca primero, solo si sigue pendiente: así un doble clic no activa dos veces.
  const { data: pay } = await db
    .from("payments")
    .update({ status: "aprobado", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pendiente")
    .select("*")
    .maybeSingle();
  if (!pay) return { ok: false, error: "Ese pago ya fue revisado." };

  if (pay.kind === "plan") await extendPlan(pay.user_id, pay.plan, pay.months);
  else await db.rpc("add_credits", { p_user: pay.user_id, p_amount: pay.quantity });

  // Premio por invitación: el primer pago aprobado de un invitado.
  const { data: buyer } = await db.from("profiles").select("referred_by, referral_rewarded").eq("id", pay.user_id).single();
  if (buyer?.referred_by && !buyer.referral_rewarded && pay.kind === "plan") {
    await db.from("profiles").update({ referral_rewarded: true }).eq("id", pay.user_id);
    await db.rpc("add_credits", { p_user: buyer.referred_by, p_amount: REFERRAL_REWARD });
    await db.rpc("add_credits", { p_user: pay.user_id, p_amount: REFERRED_REWARD });
  }
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function rejectPayment(id: string, note: string): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const { error } = await createAdminClient()
    .from("payments")
    .update({ status: "rechazado", admin_note: note.trim().slice(0, 300) || "No encontramos el pago.", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pendiente");
  if (error) return { ok: false, error: "No se pudo rechazar." };
  revalidatePath("/admin", "layout");
  return { ok: true };
}

// ─────────────────────────── Admin: usuarios ───────────────────────────

export async function setUserPlan(userId: string, plan: "gratis" | "basico" | "pro" | "full", months: number): Promise<ActionResult> {
  await requireAdmin();
  if (plan === "gratis") await createAdminClient().from("profiles").update({ plan: "gratis", plan_expires_at: null }).eq("id", userId);
  else await extendPlan(userId, plan, Math.min(Math.max(months, 1), 12));
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function giveCredits(userId: string, amount: number): Promise<ActionResult> {
  await requireAdmin();
  if (!Number.isInteger(amount) || amount < 1 || amount > 50) return { ok: false, error: "Entre 1 y 50." };
  await createAdminClient().rpc("add_credits", { p_user: userId, p_amount: amount });
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function setRole(userId: string, role: "student" | "staff"): Promise<ActionResult> {
  const { user } = await requireAdmin();
  if (userId === user.id) return { ok: false, error: "No puedes cambiar tu propio rol." };
  await createAdminClient().from("profiles").update({ role }).eq("id", userId).neq("role", "admin");
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

// ─────────────────────────── Admin: ajustes ───────────────────────────

export async function saveRate(bsPerUsd: number): Promise<ActionResult> {
  await requireAdmin();
  if (!Number.isFinite(bsPerUsd) || bsPerUsd <= 0 || bsPerUsd > 1_000_000) return { ok: false, error: "Escribe una tasa válida." };
  const { error } = await createAdminClient()
    .from("app_settings")
    .upsert({ key: "rate", value: { bs_per_usd: bsPerUsd, source: "BCV", updated: new Date().toISOString() }, updated_at: new Date().toISOString() });
  if (error) return { ok: false, error: "No se pudo guardar." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Tasa guardada" };
}

const Methods = z.object({
  pago_movil: z.object({ bank: z.string().max(80), phone: z.string().max(30), id_doc: z.string().max(30), holder: z.string().max(120) }),
  binance: z.object({ pay_id: z.string().max(60), email: z.string().max(120) }),
  zelle: z.object({ email: z.string().max(120), holder: z.string().max(120) }),
});

export async function saveMethods(input: z.input<typeof Methods>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = Methods.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisa los datos." };
  const { error } = await createAdminClient().from("app_settings").upsert({ key: "payment_methods", value: parsed.data, updated_at: new Date().toISOString() });
  if (error) return { ok: false, error: "No se pudo guardar." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Datos de pago guardados" };
}
