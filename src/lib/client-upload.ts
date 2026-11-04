import type { MaterialKind } from "@/lib/types";

export function safeName(name: string) {
  return (
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .slice(-80) || "archivo"
  );
}

export function kindFromName(name: string, mime: string): MaterialKind | null {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (ext === "pptx" || mime.includes("presentationml")) return "slides";
  if (ext === "docx" || mime.includes("wordprocessingml")) return "doc";
  if (ext === "txt" || ext === "md") return "text";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/") || ["mp3", "m4a", "wav", "ogg", "opus", "aac"].includes(ext)) return "audio";
  if (mime.startsWith("video/") || ["mp4", "mov", "webm", "mkv"].includes(ext)) return "video";
  return null;
}

/** Llama al procesador hasta que el material quede listo (las grabaciones van en dos etapas). */
export async function processMaterial(id: string, onStage: (s: string) => void) {
  for (let attempt = 0; attempt < 3; attempt++) {
    onStage(attempt === 0 ? "Leyendo tu clase…" : "Preparando resumen, fichas y quiz…");
    const res = await fetch("/api/materials/process", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ materialId: id }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; stage?: string; error?: string };
    if (!res.ok || !data.ok) throw new Error(data.error || "No pudimos procesar el material.");
    if (data.stage === "ready") return;
    if (data.stage === "transcribed") {
      onStage("Clase transcrita. Preparando resumen, fichas y quiz…");
      continue;
    }
  }
}
