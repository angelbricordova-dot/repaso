import { z } from "zod/v4";
import type Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { effectivePlan } from "@/lib/plans";
import { AI_MODEL, anthropic } from "@/lib/ai/kit";
import type { Material } from "@/lib/types";

export const maxDuration = 120;

const Body = z.object({ materialId: z.uuid(), message: z.string().trim().min(1).max(2000) });

const SYSTEM = `Eres el tutor de Repaso para estudiantes universitarios en Venezuela.
Respondes preguntas sobre UNA clase concreta, cuyo material tienes abajo.
- Explica como un buen preparador: claro, paso a paso, con ejemplos cotidianos cuando ayuden.
- Básate en el material. Si la pregunta se sale del material, puedes responder con conocimiento general de la materia, y dilo ("esto no está en tu material, pero…").
- Si el estudiante te pide que le hagas la tarea o un examen en curso, ayúdalo a entender cómo resolverlo en lugar de darle solo la respuesta.
- Respuestas breves por defecto (3 a 8 oraciones). Usa listas cortas o pasos numerados solo si ayudan. Sin títulos.
- Matemáticas en texto plano legible (x^2, raíz(x), ∫, Σ).`;

function textResponse(message: string, status: number) {
  return new Response(message, { status, headers: { "content-type": "text/plain; charset=utf-8" } });
}

export async function POST(req: Request) {
  const { user, profile } = await getSession();
  if (!user || !profile) return textResponse("Inicia sesión para continuar.", 401);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return textResponse("Escribe una pregunta de hasta 2000 caracteres.", 400);

  const db = createAdminClient();
  const { data: material } = await db
    .from("materials")
    .select("id, title, kit, source_text, status")
    .eq("id", parsed.data.materialId)
    .eq("user_id", user.id)
    .maybeSingle<Pick<Material, "id" | "title" | "kit" | "source_text" | "status">>();
  if (!material || material.status !== "ready") return textResponse("Este material todavía no está listo.", 404);

  const plan = effectivePlan(profile.plan, profile.plan_expires_at);
  const { count } = await db
    .from("tutor_messages")
    .select("id", { count: "exact", head: true })
    .eq("material_id", material.id)
    .eq("role", "user");
  if ((count ?? 0) >= plan.tutorQuestionsPerMaterial) {
    return textResponse(
      `Llegaste a las ${plan.tutorQuestionsPerMaterial} preguntas de tu plan para este material. Mejora tu plan para seguir preguntando.`,
      402,
    );
  }

  const { data: history } = await db
    .from("tutor_messages")
    .select("role, content")
    .eq("material_id", material.id)
    .order("created_at", { ascending: true })
    .limit(30);

  const context =
    material.source_text && material.source_text.length > 300
      ? material.source_text
      : (material.kit?.summary ?? []).map((s) => `${s.heading}\n${s.body}`).join("\n\n");

  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...(history ?? []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content as string })),
    { role: "user", content: parsed.data.message },
  ];

  const stream = anthropic().beta.messages.stream({
    model: AI_MODEL,
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low" },
    system: [
      { type: "text", text: SYSTEM },
      // El material va en un bloque cacheado: las preguntas siguientes cuestan mucho menos.
      {
        type: "text",
        text: `<clase titulo="${material.title.replace(/"/g, "'")}">\n${context}\n</clase>`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages,
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";
      try {
        stream.on("text", (delta) => {
          full += delta;
          controller.enqueue(encoder.encode(delta));
        });
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          const note = full ? "" : "No puedo ayudarte con esa pregunta. Prueba a reformularla sobre el tema de la clase.";
          full += note;
          if (note) controller.enqueue(encoder.encode(note));
        }
        // La pregunta solo cuenta para el cupo si hubo respuesta.
        if (full.trim()) {
          await db.from("tutor_messages").insert({ material_id: material.id, user_id: user.id, role: "user", content: parsed.data.message });
          await db.from("tutor_messages").insert({ material_id: material.id, user_id: user.id, role: "assistant", content: full });
        }
      } catch (err) {
        console.error("[tutor]", err);
        controller.enqueue(encoder.encode(full ? "\n\n(Se cortó la respuesta. Intenta de nuevo.)" : "El tutor no está disponible ahora. Intenta en un momento."));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}
