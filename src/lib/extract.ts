import "server-only";
import JSZip from "jszip";

/** Texto de un .pptx, lámina por lámina, con las notas del orador si existen. */
export async function extractPptx(buf: ArrayBuffer): Promise<{ text: string; slides: number }> {
  const zip = await JSZip.loadAsync(buf);
  const slideNames = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => Number(a.match(/(\d+)\.xml$/)![1]) - Number(b.match(/(\d+)\.xml$/)![1]));

  const parts: string[] = [];
  for (const name of slideNames) {
    const n = name.match(/(\d+)\.xml$/)![1];
    const xml = await zip.files[name].async("string");
    const text = textRuns(xml);
    const notesFile = zip.files[`ppt/notesSlides/notesSlide${n}.xml`];
    const notes = notesFile ? textRuns(await notesFile.async("string")) : "";
    parts.push(`[Lámina ${n}]\n${text}${notes ? `\nNotas: ${notes}` : ""}`);
  }
  return { text: parts.join("\n\n"), slides: slideNames.length };
}

function textRuns(xml: string): string {
  const paragraphs = xml.split(/<\/a:p>/);
  return paragraphs
    .map((p) =>
      Array.from(p.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g))
        .map((m) => decodeXml(m[1]))
        .join(""),
    )
    .map((s) => s.trim())
    .filter(Boolean)
    .join("\n");
}

function decodeXml(s: string) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

export async function extractDocx(buf: ArrayBuffer): Promise<string> {
  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({ buffer: Buffer.from(buf) });
  return value.trim();
}

/** Texto y número de páginas de un PDF. El texto puede venir vacío si es escaneado. */
export async function extractPdf(buf: ArrayBuffer): Promise<{ text: string; pages: number }> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const { totalPages, text } = await extractText(pdf, { mergePages: true });
  return { text: (Array.isArray(text) ? text.join("\n") : text).trim(), pages: totalPages };
}
