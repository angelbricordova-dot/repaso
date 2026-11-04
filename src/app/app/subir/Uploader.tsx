"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { createMaterial } from "@/app/app/actions";
import { Icon } from "@/components/app/Icon";
import { kindFromName, processMaterial, safeName } from "@/lib/client-upload";
import { createClient } from "@/lib/supabase/client";
import type { MaterialKind, StoredFile, Subject } from "@/lib/types";

type Mode = "file" | "photos" | "text";
const MAX_MB = 50;

export function Uploader({
  userId,
  subjects,
  initialSubject,
  allowRecordings,
  maxPdfPages,
}: {
  userId: string;
  subjects: Subject[];
  initialSubject: string;
  allowRecordings: boolean;
  maxPdfPages: number;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("file");
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const matched = subjects.find((s) => s.name.toLowerCase() === initialSubject.toLowerCase());
  const [subjectId, setSubjectId] = useState<string>(matched?.id ?? (initialSubject ? "__new" : subjects[0]?.id ?? "__new"));
  const [newSubject, setNewSubject] = useState(matched ? "" : initialSubject);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const kind: MaterialKind | null = useMemo(() => {
    if (mode === "text") return "text";
    if (mode === "photos") return files.length ? "image" : null;
    return files[0] ? kindFromName(files[0].name, files[0].type) : null;
  }, [mode, files]);

  const accept =
    mode === "photos"
      ? "image/jpeg,image/png,image/webp"
      : ".pdf,.pptx,.docx,.txt,.md,audio/*,video/*,.mp3,.m4a,.wav,.ogg,.opus,.mp4,.mov,.webm";

  function pick(list: FileList | null) {
    setError(null);
    if (!list?.length) return;
    const arr = Array.from(list);
    if (mode === "photos") {
      const imgs = arr.filter((f) => f.type.startsWith("image/")).slice(0, 20);
      setFiles((prev) => [...prev, ...imgs].slice(0, 20));
      if (!title) setTitle("Fotos de apuntes");
      return;
    }
    const f = arr[0];
    const k = kindFromName(f.name, f.type);
    if (!k || k === "image") {
      setError(k === "image" ? "Para fotos usa la pestaña «Fotos del cuaderno»." : "Ese tipo de archivo no lo leemos todavía. Usa PDF, PowerPoint (.pptx), Word (.docx), audio o video.");
      return;
    }
    if ((k === "audio" || k === "video") && !allowRecordings) {
      setError("Las clases grabadas están en los planes Repaso y Repaso+.");
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(
        k === "video"
          ? `El video pesa ${(f.size / 1048576).toFixed(0)} MB y el máximo es ${MAX_MB} MB. Sube solo el audio de la clase (.m4a o .mp3): pesa mucho menos.`
          : `El archivo pesa ${(f.size / 1048576).toFixed(0)} MB y el máximo es ${MAX_MB} MB.`,
      );
      return;
    }
    setFiles([f]);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").slice(0, 140));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!kind) return setError(mode === "text" ? "Pega el texto de la clase." : "Elige un archivo.");
    if (!title.trim()) return setError("Ponle un título.");
    if (subjectId === "__new" && !newSubject.trim()) return setError("Escribe el nombre de la materia o elige una.");

    setBusy(true);
    try {
      const supabase = createClient();
      const stored: StoredFile[] = [];
      if (mode !== "text") {
        for (let i = 0; i < files.length; i++) {
          let f = files[i];
          setStage(files.length > 1 ? `Subiendo foto ${i + 1} de ${files.length}…` : "Subiendo archivo…");
          if (mode === "photos") f = await compressImage(f);
          const path = `${userId}/${Date.now()}-${i}-${safeName(f.name)}`;
          const { error: upErr } = await supabase.storage.from("materials").upload(path, f, { contentType: f.type || undefined, upsert: false });
          if (upErr) throw new Error("No se pudo subir el archivo. Revisa tu conexión e intenta de nuevo.");
          stored.push({ path, name: f.name, size: f.size, type: f.type });
        }
      }

      setStage("Guardando…");
      const res = await createMaterial({
        title: title.trim(),
        kind,
        subjectId: subjectId === "__new" ? null : subjectId,
        newSubject: subjectId === "__new" ? newSubject.trim() : undefined,
        files: stored,
        text: mode === "text" ? text : undefined,
      });
      if (!res.ok || !res.id) throw new Error(res.ok ? "No pudimos guardar el material." : res.error);

      await processMaterial(res.id, setStage);
      router.push(`/app/m/${res.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal.");
      setBusy(false);
      setStage(null);
    }
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <div role="tablist" aria-label="Tipo de material" className="mb-4 flex gap-1 rounded-[12px] bg-panel p-1">
          {(
            [
              ["file", "Archivo"],
              ["photos", "Fotos del cuaderno"],
              ["text", "Pegar texto"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              disabled={busy}
              onClick={() => {
                setMode(m);
                setFiles([]);
                setError(null);
              }}
              className={`h-9 flex-1 rounded-[9px] text-[14px] font-medium transition-colors ${mode === m ? "bg-white text-text shadow-[0_1px_2px_rgba(0,0,0,0.06)]" : "text-soft hover:text-text"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "text" ? (
          <div>
            <label htmlFor="texto" className="field-label">
              Texto de la clase
            </label>
            <textarea
              id="texto"
              className="field min-h-[320px]"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Pega aquí tus apuntes, el contenido de una guía o la transcripción de la clase."
              disabled={busy}
              aria-describedby="texto-hint"
            />
            <p id="texto-hint" className="hint num">
              {text.length.toLocaleString("es-VE")} caracteres · mínimo 80
            </p>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              pick(e.dataTransfer.files);
            }}
            className={`flex min-h-[260px] flex-col items-center justify-center rounded-[16px] border-2 border-dashed px-6 py-10 text-center transition-colors ${
              drag ? "border-data bg-[#fff5f8]" : "border-control bg-panel"
            }`}
          >
            <Icon name={mode === "photos" ? "image" : "upload"} className="size-6 text-soft" />
            <p className="mt-3 text-[16px] font-medium">{mode === "photos" ? "Arrastra tus fotos o elígelas" : "Arrastra el archivo de tu clase o elígelo"}</p>
            <p id="file-hint" className="mt-1 max-w-[46ch] text-[14px] text-soft">
              {mode === "photos"
                ? "JPG, PNG o WebP, hasta 20 fotos. Las comprimimos antes de subirlas."
                : `PDF (hasta ${maxPdfPages} páginas), PowerPoint .pptx, Word .docx${allowRecordings ? ", audio o video" : ""}. Máximo ${MAX_MB} MB.`}
            </p>
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              multiple={mode === "photos"}
              className="sr-only"
              id="archivo"
              aria-describedby="file-hint"
              onChange={(e) => {
                pick(e.target.files);
                e.target.value = "";
              }}
              disabled={busy}
            />
            <label htmlFor="archivo" className="app-btn app-btn-secondary mt-5">
              {mode === "photos" ? "Elegir fotos" : "Elegir archivo"}
            </label>
            {!allowRecordings && mode === "file" && (
              <p className="mt-4 text-[13px] text-soft">
                ¿Clase grabada en Zoom o Meet?{" "}
                <Link href="/app/plan" className="font-medium text-text underline underline-offset-4">
                  Disponible en Repaso
                </Link>
              </p>
            )}
          </div>
        )}

        {files.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="card flex items-center gap-3 px-4 py-3">
                <Icon name={mode === "photos" ? "image" : kind === "audio" ? "mic" : kind === "video" ? "video" : "file"} className="size-4 text-soft" />
                <span className="min-w-0 flex-1 truncate text-[14px]">{f.name}</span>
                <span className="num text-[13px] text-soft">{(f.size / 1048576).toFixed(1)} MB</span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setFiles((prev) => prev.filter((_, n) => n !== i))}
                  className="grid size-8 place-items-center rounded-[8px] text-soft hover:bg-panel"
                  aria-label={`Quitar ${f.name}`}
                >
                  <Icon name="x" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-4 lg:col-span-4">
        <div className="panel flex flex-col gap-4">
          <div>
            <label htmlFor="titulo" className="field-label">
              Título
            </label>
            <input id="titulo" className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Clase 5: Elasticidad" maxLength={140} disabled={busy} />
          </div>
          <div>
            <label htmlFor="materia" className="field-label">
              Materia
            </label>
            <select id="materia" className="field" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={busy}>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
              <option value="__new">Nueva materia…</option>
            </select>
          </div>
          {subjectId === "__new" && (
            <div>
              <label htmlFor="nueva" className="field-label">
                Nombre de la materia
              </label>
              <input id="nueva" className="field" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Microeconomía I" maxLength={80} disabled={busy} />
            </div>
          )}
          <button type="submit" className="app-btn mt-1 w-full" disabled={busy}>
            {busy ? "Preparando…" : "Preparar mi repaso"}
          </button>
          {stage && (
            <p className="text-[13px] text-soft" role="status" aria-live="polite">
              {stage}
            </p>
          )}
          {error && (
            <p className="rounded-[10px] bg-[#ffedea] px-3 py-2 text-[13px] text-[#831c1e]" role="alert">
              {error}
            </p>
          )}
        </div>
        <p className="px-1 text-[13px] leading-[1.5] text-soft">
          Sube solo material que puedas usar para estudiar. Tus archivos son privados.{" "}
          <Link href="/terminos" className="underline underline-offset-4">
            Términos
          </Link>
        </p>
      </div>
    </form>
  );
}

async function compressImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const max = 2000;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob: Blob = await new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("blob"))), "image/jpeg", 0.82));
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}
