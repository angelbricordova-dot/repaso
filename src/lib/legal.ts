export const TERMS_VERSION = "2026-11-05";
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hola@tareaya.app";
export const CONTACT_WHATSAPP = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || "";

/** Enlace wa.me a partir de un teléfono venezolano (0412-1234567 → 584121234567). */
export function waLink(phone: string, text?: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "58" + digits.slice(1);
  else if (digits.length === 10) digits = "58" + digits;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
