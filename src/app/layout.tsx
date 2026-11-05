import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { BRAND, SITE_URL } from "@/lib/brand";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND} · Tu tarea, resuelta a tiempo`, template: `%s · ${BRAND}` },
  description:
    "Personas reales resuelven tu tarea y te la entregan antes de tu hora de entrega. Bachillerato y universidad. 10 tareas por $5,99 al mes, pagables en bolívares por Pago Móvil.",
  openGraph: {
    title: `${BRAND} · Tu tarea, resuelta a tiempo`,
    description: "Mándala hoy, te llega resuelta. Tu primera tarea es gratis. Pagas en bolívares a tasa BCV.",
    locale: "es_VE",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#a9d2f0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-VE" className={`${bricolage.variable} ${figtree.variable}`}>
      <body>{children}</body>
    </html>
  );
}
