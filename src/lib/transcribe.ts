import "server-only";

/**
 * Transcribe una clase grabada con ElevenLabs Speech-to-Text (Scribe).
 * Recibe una URL firmada de Supabase Storage, así el archivo no pasa por Vercel.
 */
export async function transcribeFromUrl(url: string): Promise<{ text: string; durationSeconds: number | null }> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("La transcripción de clases grabadas no está configurada (falta ELEVENLABS_API_KEY).");

  const form = new FormData();
  form.append("model_id", "scribe_v2");
  form.append("cloud_storage_url", url);
  form.append("language_code", "spa");
  form.append("tag_audio_events", "false");
  form.append("diarize", "true");

  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": key },
    body: form,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`No pudimos transcribir la grabación (${res.status}). ${detail.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    text?: string;
    words?: { start?: number; end?: number; speaker_id?: string; text?: string; type?: string }[];
  };

  const words = data.words ?? [];
  const last = words.length ? words[words.length - 1] : undefined;
  const durationSeconds = last?.end ? Math.round(last.end) : null;

  // Con diarización, separa por hablante para que la IA distinga profesor y estudiantes.
  let text = data.text ?? "";
  if (words.some((w) => w.speaker_id)) {
    const lines: string[] = [];
    let current = "";
    let speaker = "";
    for (const w of words) {
      if (w.type === "audio_event") continue;
      if (w.speaker_id && w.speaker_id !== speaker) {
        if (current.trim()) lines.push(`${speakerLabel(speaker)}: ${current.trim()}`);
        speaker = w.speaker_id;
        current = "";
      }
      current += w.text ?? "";
    }
    if (current.trim()) lines.push(`${speakerLabel(speaker)}: ${current.trim()}`);
    if (lines.length) text = lines.join("\n");
  }
  return { text: text.trim(), durationSeconds };
}

function speakerLabel(id: string) {
  const n = Number(id.replace(/\D/g, ""));
  return Number.isFinite(n) ? `Voz ${n + 1}` : "Voz";
}
