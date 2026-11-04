import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod/v4";
import type { StudyKit } from "@/lib/types";

export const AI_MODEL = process.env.REPASO_AI_MODEL || "claude-opus-5-5";
type Effort = "low" | "medium" | "high";
export const AI_EFFORT: Effort = (["low", "medium", "high"] as const).includes(process.env.REPASO_AI_EFFORT as Effort)
  ? (process.env.REPASO_AI_EFFORT as Effort)
  : "medium";

let _client: Anthropic | null = null;
export function anthropic() {
  if (!_client) _client = new Anthropic();
  return _client;
}

const KitSchema = z.object({
  title: z.string().describe("Título corto y claro del tema, en español"),
  one_line: z.string().describe("Una oración que diga de qué trata la clase"),
  summary: z
    .array(z.object({ heading: z.string(), body: z.string().describe("Explicación en párrafos cortos. Puede usar listas con guiones.") }))
    .describe("Resumen por secciones, en el orden lógico del tema"),
  key_concepts: z.array(z.object({ term: z.string(), definition: z.string() })),
  flashcards: z.array(z.object({ front: z.string().describe("Pregunta o concepto"), back: z.string().describe("Respuesta breve") })),
  quiz: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()).describe("Exactamente 4 opciones"),
      correct: z.number().int().describe("Índice (0-3) de la opción correcta"),
      explanation: z.string().describe("Por qué es la correcta y por qué las otras no"),
    }),
  ),
  open_questions: z.array(
    z.object({ question: z.string(), answer_guide: z.string().describe("Puntos que debe tener una buena respuesta") }),
  ),
  likely_exam_topics: z.array(z.string()).describe("Lo que más probablemente evalúen en un parcial"),
});

const SYSTEM = `Eres el preparador de estudio de Repaso, una plataforma para estudiantes universitarios en Venezuela.
Recibes el material de una clase (PDF, láminas, apuntes, fotos del pizarrón o la transcripción de una clase grabada) y preparas un kit de repaso.

Reglas:
- Escribe en español claro, como lo explicaría un buen preparador venezolano: directo, cercano y preciso. Nada de relleno.
- Básate en el material. Si añades contexto general para que algo se entienda, que sea correcto y breve, y no inventes datos, fechas, autores ni fórmulas que no estén o no sean de conocimiento estándar de la materia.
- Si el material es una transcripción, ignora saludos, problemas de conexión, chistes y logística de la clase; quédate con el contenido.
- Si el material está incompleto o ilegible en partes, trabaja con lo que hay y dilo en el resumen.
- Conserva la notación del área (fórmulas, artículos de leyes, nombres técnicos). Para matemáticas usa notación en texto plano legible (x^2, raíz(x), ∫, Σ).
- Cantidades orientativas según la extensión del material: resumen de 3 a 8 secciones; 6 a 15 conceptos clave; 12 a 30 fichas; 8 a 15 preguntas de quiz con exactamente 4 opciones y una sola correcta (varía la posición de la correcta); 3 a 6 preguntas de desarrollo; 3 a 6 temas probables de examen.
- Las preguntas del quiz deben medir comprensión, no memoria de detalles triviales. Las opciones incorrectas deben ser plausibles.`;

export type KitInput = {
  title: string;
  subjectName?: string | null;
  text?: string | null;
  pdfBase64?: string | null;
  images?: { mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"; data: string }[];
  kindLabel: string;
};

export class AiRefusalError extends Error {}

export async function generateKit(input: KitInput): Promise<{ kit: StudyKit; tokensIn: number; tokensOut: number; model: string }> {
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];

  if (input.pdfBase64) {
    content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: input.pdfBase64 } });
  }
  for (const img of input.images ?? []) {
    content.push({ type: "image", source: { type: "base64", media_type: img.mediaType, data: img.data } });
  }
  if (input.text) {
    content.push({ type: "text", text: `<material tipo="${input.kindLabel}">\n${input.text}\n</material>` });
  }
  content.push({
    type: "text",
    text: `Materia: ${input.subjectName || "sin indicar"}\nTítulo que puso el estudiante: ${input.title}\n\nPrepara el kit de repaso de este material.`,
  });

  const stream = anthropic().beta.messages.stream({
    model: AI_MODEL,
    max_tokens: 32000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM,
    output_config: { effort: AI_EFFORT, format: zodOutputFormat(KitSchema) },
    messages: [{ role: "user", content }],
  });

  const msg = await stream.finalMessage();

  if (msg.stop_reason === "refusal") {
    throw new AiRefusalError("La IA no pudo procesar este material. Si crees que es un error, escríbenos.");
  }
  if (msg.stop_reason === "max_tokens") {
    throw new Error("El material es muy largo para un solo kit. Divídelo en partes (por ejemplo, por capítulos).");
  }
  const parsed = msg.parsed_output;
  if (!parsed) throw new Error("La IA devolvió una respuesta incompleta. Intenta de nuevo.");

  const kit: StudyKit = {
    ...parsed,
    quiz: parsed.quiz
      .filter((q) => q.options.length >= 2)
      .map((q) => ({ ...q, options: q.options.slice(0, 4), correct: Math.min(Math.max(q.correct, 0), Math.min(q.options.length, 4) - 1) })),
  };

  return {
    kit,
    tokensIn: (msg.usage.input_tokens ?? 0) + (msg.usage.cache_read_input_tokens ?? 0) + (msg.usage.cache_creation_input_tokens ?? 0),
    tokensOut: msg.usage.output_tokens ?? 0,
    model: msg.model,
  };
}
