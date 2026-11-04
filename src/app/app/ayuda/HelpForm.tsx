"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createHelpRequest } from "@/app/app/actions";
import { Icon } from "@/components/app/Icon";
import { safeName } from "@/lib/client-upload";
import { createClient } from "@/lib/supabase/client";
import type { StoredFile } from "@/lib/types";

export function HelpForm({ userId, left, total, subjects }: { userId: string; left: number; total: number; subjects: string[] }) {
  const router = useRouter();
  const [subject, setSubject] = useState(subjects[0] ?? "");
  const [topic, setTopic] = useState("");
  const [details, setDetails] = useState("");
  const [links, setLinks] = useState("");
  const [examDate, setExamDate] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(null);
    const linkList = links
      .split(/\s+/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (linkList.some((l) => !/^https?:\/\//i.test(l))) return setError("Los enlaces deben empezar por https://");
    setBusy(true);
    try {
      const supabase = createClient();
      const stored: StoredFile[] = [];
      for (const [i, f] of files.entries()) {
        if (f.size > 50 * 1024 * 1024) throw new Error(`«${f.name}» pesa más de 50 MB. Compártelo como enlace de Drive.`);
        const path = `${userId}/${Date.now()}-${i}-${safeName(f.name)}`;
        const { error: upErr } = await supabase.storage.from("requests").upload(path, f, { contentType: f.type || undefined });
        if (upErr) throw new Error("No se pudo subir un archivo. Revisa tu conexión.");
        stored.push({ path, name: f.name, size: f.size, type: f.type });
      }
      const r = await createHelpRequest({ subject, topic, details, links: linkList, files: stored, examDate: examDate || null });
      if (!r.ok) throw new Error(r.error);
      setDone(r.message ?? "Enviado.");
      setTopic("");
      setDetails("");
      setLinks("");
      setFiles([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="panel flex flex-col gap-4">
      <p className="num text-[13px] text-soft">
        Te quedan {left} de {total} envíos este mes.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="h-subject" className="field-label">
            Materia
          </label>
          <input id="h-subject" className="field" list="h-subjects" value={subject} onChange={(e) => setSubject(e.target.value)} required maxLength={120} placeholder="Física I" />
          <datalist id="h-subjects">
            {subjects.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="h-date" className="field-label">
            Fecha del examen <span className="font-normal text-soft">(opcional)</span>
          </label>
          <input id="h-date" type="date" className="field" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
        </div>
      </div>
      <div>
        <label htmlFor="h-topic" className="field-label">
          Tema que no entendiste
        </label>
        <input id="h-topic" className="field" value={topic} onChange={(e) => setTopic(e.target.value)} required minLength={3} maxLength={200} placeholder="Leyes de Newton aplicadas a planos inclinados" />
      </div>
      <div>
        <label htmlFor="h-details" className="field-label">
          ¿Qué parte se te complica?
        </label>
        <textarea
          id="h-details"
          className="field"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          maxLength={4000}
          placeholder="Entiendo la teoría pero no sé cómo plantear los ejercicios cuando hay fricción…"
        />
      </div>
      <div>
        <label htmlFor="h-links" className="field-label">
          Enlaces <span className="font-normal text-soft">(opcional)</span>
        </label>
        <textarea
          id="h-links"
          className="field !min-h-[72px]"
          value={links}
          onChange={(e) => setLinks(e.target.value)}
          placeholder="Grabación de Zoom, carpeta de Drive o video de YouTube. Uno por línea."
          aria-describedby="h-links-hint"
        />
        <p id="h-links-hint" className="hint">
          Si la grabación es privada, dale acceso a cualquiera con el enlace.
        </p>
      </div>
      <div>
        <span className="field-label">Archivos <span className="font-normal text-soft">(opcional)</span></span>
        <input
          id="h-files"
          type="file"
          multiple
          className="sr-only"
          accept=".pdf,.pptx,.docx,image/*,audio/*,video/*"
          onChange={(e) => {
            // Copiamos la lista antes de vaciar el input: al vaciarlo, e.target.files queda vacío.
            const picked = Array.from(e.target.files ?? []);
            setFiles((prev) => [...prev, ...picked].slice(0, 10));
            e.target.value = "";
          }}
          aria-describedby="h-files-hint"
        />
        <label htmlFor="h-files" className="app-btn app-btn-secondary">
          <Icon name="plus" />
          Adjuntar láminas, PDF o audio
        </label>
        <p id="h-files-hint" className="hint">
          Hasta 10 archivos de 50 MB cada uno.
        </p>
        {files.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 text-[14px]">
                <span className="truncate">{f.name}</span>
                <button type="button" className="text-[13px] text-soft underline" onClick={() => setFiles((p) => p.filter((_, n) => n !== i))}>
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && (
        <p className="rounded-[10px] bg-[#ffedea] px-3 py-2 text-[13px] text-[#831c1e]" role="alert">
          {error}
        </p>
      )}
      {done && (
        <p className="rounded-[10px] bg-[#dcfae5] px-3 py-2 text-[13px] text-[#04250e]" role="status">
          {done}
        </p>
      )}
      <button type="submit" className="app-btn self-start" disabled={busy || left === 0}>
        <Icon name="send" />
        {busy ? "Enviando…" : left === 0 ? "Sin envíos este mes" : "Enviar al equipo"}
      </button>
    </form>
  );
}
