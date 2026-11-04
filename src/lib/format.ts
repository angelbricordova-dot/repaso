const usd = new Intl.NumberFormat("es-VE", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 2 });
const bs = new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatUsd = (n: number) => usd.format(n);
export const formatBs = (n: number) => `Bs. ${bs.format(n)}`;

export function formatDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-VE", { timeZone: "America/Caracas", ...opts }).format(new Date(iso));
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "hace un momento";
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d === 1) return "ayer";
  if (d < 30) return `hace ${d} días`;
  return formatDate(iso, { day: "numeric", month: "short", year: "numeric" });
}

export function formatBytes(n: number | null | undefined) {
  if (!n) return "—";
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function formatMinutes(seconds: number | null | undefined) {
  if (!seconds) return "—";
  const m = Math.round(seconds / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
}

export const KIND_LABEL: Record<string, string> = {
  pdf: "PDF",
  slides: "Láminas",
  doc: "Documento",
  image: "Foto",
  audio: "Audio",
  video: "Video",
  text: "Texto",
};
