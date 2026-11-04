"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/app/app/actions";
import type { StoredFile } from "@/lib/types";

const DAY = 86_400_000;

/** Extiende el plan desde hoy o desde su vencimiento actual, lo que sea más tarde. */
async function extendPlan(userId: string, plan: string, months: number) {
  const db = createAdminClient();
  const { data: p } = await db.from("profiles").select("plan, plan_expires_at").eq("id", userId).single();
  const current = p?.plan === plan && p?.plan_expires_at ? new Date(p.plan_expires_at).getTime() : 0;
  const base = Math.max(Date.now(), current);
  const expires = new Date(base + months * 30 * DAY).toISOString();
  await db.from("profiles").update({ plan, plan_expires_at: expires }).eq("id", userId);
  return expires;
}

export async function approvePayment(id: string): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const db = createAdminClient();
  const { data: pay } = await db.from("payments").select("*").eq("id", id).single();
  if (!pay || pay.status !== "pendiente") return { ok: false, error: "Ese pago ya fue revisado." };
  await extendPlan(pay.user_id, pay.plan, pay.months);
  await db.from("payments").update({ status: "aprobado", reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function rejectPayment(id: string, note: string): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const db = createAdminClient();
  const { error } = await db
    .from("payments")
    .update({ status: "rechazado", admin_note: note.trim().slice(0, 300) || "No encontramos el pago.", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pendiente");
  if (error) return { ok: false, error: "No se pudo rechazar." };
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function setUserPlan(userId: string, plan: "gratis" | "repaso" | "repaso_plus", months: number): Promise<ActionResult> {
  await requireAdmin();
  const db = createAdminClient();
  if (plan === "gratis") {
    await db.from("profiles").update({ plan: "gratis", plan_expires_at: null }).eq("id", userId);
  } else {
    await extendPlan(userId, plan, Math.min(Math.max(months, 1), 12));
  }
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function setRequestStatus(id: string, status: "recibido" | "en_revision" | "respondido" | "cerrado"): Promise<ActionResult> {
  await requireAdmin();
  const db = createAdminClient();
  const { error } = await db.from("help_requests").update({ status }).eq("id", id);
  if (error) return { ok: false, error: "No se pudo actualizar." };
  revalidatePath("/admin", "layout");
  return { ok: true };
}

const fileSchema = z.object({ path: z.string().min(3).max(400), name: z.string().max(200), size: z.number().int().nonnegative(), type: z.string().max(120) });

export async function respondRequest(id: string, response: string, files: StoredFile[]): Promise<ActionResult> {
  await requireAdmin();
  const parsedFiles = z.array(fileSchema).max(10).safeParse(files);
  if (!parsedFiles.success) return { ok: false, error: "Archivos no válidos." };
  const text = response.trim();
  if (text.length < 10 && !parsedFiles.data.length) return { ok: false, error: "Escribe la explicación o adjunta un archivo." };
  const db = createAdminClient();
  const { data: req } = await db.from("help_requests").select("user_id, response_files").eq("id", id).single();
  if (!req) return { ok: false, error: "No encontrado." };
  if (parsedFiles.data.some((f) => !f.path.startsWith(`${req.user_id}/`))) return { ok: false, error: "Ruta de archivo no válida." };
  const { error } = await db
    .from("help_requests")
    .update({
      admin_response: text.slice(0, 20000),
      response_files: [...((req.response_files as StoredFile[]) ?? []), ...parsedFiles.data],
      status: "respondido",
      responded_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: "No se pudo guardar la respuesta." };
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function saveRate(bsPerUsd: number): Promise<ActionResult> {
  await requireAdmin();
  if (!Number.isFinite(bsPerUsd) || bsPerUsd <= 0 || bsPerUsd > 1_000_000) return { ok: false, error: "Escribe una tasa válida." };
  const db = createAdminClient();
  const { error } = await db
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
  const db = createAdminClient();
  const { error } = await db.from("app_settings").upsert({ key: "payment_methods", value: parsed.data, updated_at: new Date().toISOString() });
  if (error) return { ok: false, error: "No se pudo guardar." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Datos de pago guardados" };
}
