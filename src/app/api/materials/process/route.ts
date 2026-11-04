import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { effectivePlan, startOfMonthIso } from "@/lib/plans";
import { extractDocx, extractPdf, extractPptx } from "@/lib/extract";
import { transcribeFromUrl } from "@/lib/transcribe";
import { AiRefusalError, generateKit, type KitInput } from "@/lib/ai/kit";
import { KIND_LABEL } from "@/lib/format";
import type { Material } from "@/lib/types";

// Transcribir y generar puede tardar. En Vercel Hobby el máximo es 300 s.
export const maxDuration = 300;

const Body = z.object({ materialId: z.uuid() });
const STALE_MS = 6 * 60 * 1000;
const MAX_SOURCE_CHARS = 600_000;

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: Request) {
  const { user, profile } = await getSession();
  if (!user || !profile) return fail("Inicia sesión para continuar.", 401);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Petición inválida.");

  const db = createAdminClient();
  const { data: material } = await db
    .from("materials")
    .select("*")
    .eq("id", parsed.data.materialId)
    .eq("user_id", user.id)
    .maybeSingle<Material>();
  if (!material) return fail("No encontramos ese material.", 404);
  if (material.status === "ready") return NextResponse.json({ ok: true, stage: "ready" });

  const startedAt = material.processing_started_at ? new Date(material.processing_started_at).getTime() : 0;
  if (material.status === "processing" && Date.now() - startedAt < STALE_MS) {
    return fail("Este material ya se está procesando. Espera un momento.", 409);
  }

  const plan = effectivePlan(profile.plan, profile.plan_expires_at);
  const monthStart = startOfMonthIso();
  const isRecording = material.kind === "audio" || material.kind === "video";

  // Cupo mensual de materiales
  const { count: usedThisMonth } = await db
    .from("materials")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "ready")
    .gte("processed_at", monthStart);
  if ((usedThisMonth ?? 0) >= plan.materialsPerMonth) {
    return fail(
      `Ya usaste los ${plan.materialsPerMonth} materiales de tu plan ${plan.name} este mes. Mejora tu plan para seguir.`,
      402,
    );
  }

  // Cupo de minutos de grabación
  if (isRecording && !material.source_text) {
    if (plan.recordingMinutesPerMonth === 0) {
      return fail("Las clases grabadas están en los planes Repaso y Repaso+.", 402);
    }
    const { data: recs } = await db
      .from("materials")
      .select("duration_seconds")
      .eq("user_id", user.id)
      .in("kind", ["audio", "video"])
      .gte("created_at", monthStart);
    const usedMin = Math.round((recs ?? []).reduce((a, r) => a + (r.duration_seconds ?? 0), 0) / 60);
    if (usedMin >= plan.recordingMinutesPerMonth) {
      return fail(`Ya usaste tus ${plan.recordingMinutesPerMonth / 60} horas de grabaciones de este mes.`, 402);
    }
  }

  await db
    .from("materials")
    .update({ status: "processing", error: null, processing_started_at: new Date().toISOString() })
    .eq("id", material.id);

  try {
    let subjectName: string | null = null;
    if (material.subject_id) {
      const { data: s } = await db.from("subjects").select("name").eq("id", material.subject_id).maybeSingle();
      subjectName = s?.name ?? null;
    }

    const input: KitInput = { title: material.title, subjectName, kindLabel: KIND_LABEL[material.kind] ?? material.kind };
    let sourceText = material.source_text;

    const paths = material.files?.length ? material.files.map((f) => f.path) : material.storage_path ? [material.storage_path] : [];

    if (isRecording) {
      if (!sourceText) {
        // Etapa 1: transcribir y guardar. El cliente vuelve a llamar para la etapa 2.
        if (!paths[0]) throw new Error("No encontramos el archivo de la grabación.");
        const { data: signed, error } = await db.storage.from("materials").createSignedUrl(paths[0], 60 * 60);
        if (error || !signed) throw new Error("No pudimos leer la grabación.");
        const { text, durationSeconds } = await transcribeFromUrl(signed.signedUrl);
        if (text.length < 80) throw new Error("La grabación no tiene suficiente voz para transcribir.");
        await db
          .from("materials")
          .update({
            source_text: text.slice(0, MAX_SOURCE_CHARS),
            duration_seconds: durationSeconds,
            status: "pending",
            processing_started_at: null,
          })
          .eq("id", material.id);
        return NextResponse.json({ ok: true, stage: "transcribed" });
      }
      input.text = sourceText;
    } else if (material.kind === "text") {
      if (!sourceText) throw new Error("El texto está vacío.");
      input.text = sourceText;
    } else {
      const buffers: { buf: ArrayBuffer; type: string }[] = [];
      for (const p of paths) {
        const { data, error } = await db.storage.from("materials").download(p);
        if (error || !data) throw new Error("No pudimos leer el archivo subido.");
        buffers.push({ buf: await data.arrayBuffer(), type: data.type });
      }
      if (!buffers.length) throw new Error("No hay archivo para procesar.");

      if (material.kind === "pdf") {
        const { buf } = buffers[0];
        const { text, pages } = await extractPdf(buf);
        if (pages > plan.maxPdfPages) {
          throw new Error(`El PDF tiene ${pages} páginas y tu plan permite hasta ${plan.maxPdfPages}. Divídelo o mejora tu plan.`);
        }
        sourceText = text;
        const textRich = pages > 0 && text.length / pages >= 400;
        // Con texto suficiente mandamos solo el texto (más barato). Si es escaneado o
        // muy visual (láminas exportadas, diagramas), mandamos el PDF para que la IA lo vea.
        if (textRich || pages > 80 || buf.byteLength > 24 * 1024 * 1024) {
          if (text.length < 200) throw new Error("No pudimos leer texto en este PDF. Si es escaneado, súbelo en partes de hasta 80 páginas.");
          input.text = text;
        } else {
          input.pdfBase64 = Buffer.from(buf).toString("base64");
        }
      } else if (material.kind === "slides") {
        const { text } = await extractPptx(buffers[0].buf);
        if (text.length < 40) throw new Error("Las láminas no tienen texto. Expórtalas a PDF y súbelas de nuevo.");
        sourceText = text;
        input.text = text;
      } else if (material.kind === "doc") {
        const text = await extractDocx(buffers[0].buf);
        if (text.length < 40) throw new Error("El documento está vacío.");
        sourceText = text;
        input.text = text;
      } else if (material.kind === "image") {
        input.images = buffers.slice(0, 20).map(({ buf, type }) => ({
          mediaType: (["image/png", "image/webp", "image/gif"].includes(type) ? type : "image/jpeg") as
            | "image/jpeg"
            | "image/png"
            | "image/webp"
            | "image/gif",
          data: Buffer.from(buf).toString("base64"),
        }));
      }
    }

    const { kit, tokensIn, tokensOut, model } = await generateKit(input);

    // Para fotos, el texto fuente es el resumen (sirve de contexto al tutor).
    if (!sourceText && material.kind === "image") {
      sourceText = kit.summary.map((s) => `${s.heading}\n${s.body}`).join("\n\n");
    }

    await db
      .from("materials")
      .update({
        status: "ready",
        kit,
        source_text: sourceText ? sourceText.slice(0, MAX_SOURCE_CHARS) : null,
        ai_model: model,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        processed_at: new Date().toISOString(),
        processing_started_at: null,
        error: null,
      })
      .eq("id", material.id);

    return NextResponse.json({ ok: true, stage: "ready" });
  } catch (err) {
    // Los errores del proveedor de IA no se muestran tal cual al estudiante.
    const message =
      err instanceof Anthropic.RateLimitError
        ? "Hay mucha demanda en este momento. Intenta de nuevo en unos minutos."
        : err instanceof Anthropic.AnthropicError
          ? "El servicio de IA no está disponible en este momento. Intenta de nuevo en unos minutos."
          : err instanceof AiRefusalError || err instanceof Error
            ? err.message
            : "Algo salió mal procesando el material.";
    console.error("[process]", material.id, err);
    await db
      .from("materials")
      .update({ status: "error", error: message.slice(0, 500), processing_started_at: null })
      .eq("id", material.id);
    return fail(message, 500);
  }
}
