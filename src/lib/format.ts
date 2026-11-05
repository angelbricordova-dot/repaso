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

export function formatDue(iso: string) {
  return new Intl.DateTimeFormat("es-VE", { timeZone: "America/Caracas", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

/** «en 3 h», «mañana 6:00 p. m.», «vencida hace 2 h» */
export function dueIn(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  const h = ms / 3_600_000;
  if (h < 0) return `vencida hace ${Math.max(1, Math.round(-h))} h`;
  if (h < 1) return `en ${Math.max(1, Math.round(h * 60))} min`;
  if (h < 24) return `en ${Math.round(h)} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "mañana" : `en ${d} días`;
}

/** ¿Ya pasó esa fecha? (en el servidor se evalúa una vez por petición) */
export function isPast(iso: string) {
  return new Date(iso).getTime() < Date.now();
}

export function isFuture(iso: string | null | undefined) {
  return Boolean(iso) && new Date(iso!).getTime() > Date.now();
}
