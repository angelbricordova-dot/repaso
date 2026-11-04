import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Repaso · Tus clases, listas para el parcial",
    template: "%s · Repaso",
  },
  description:
    "Sube el PDF, las láminas, fotos del cuaderno o la grabación de tu clase y Repaso te prepara resumen, fichas y quiz en español. Hecho para universitarios en Venezuela.",
  openGraph: {
    title: "Repaso · Tus clases, listas para el parcial",
    description: "Resumen, fichas y quiz de cualquier clase. Pagas en bolívares por Pago Móvil.",
    locale: "es_VE",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#ff87ab",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-VE">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="" />
        <link href="https://api.fontshare.com/v2/css?f[]=switzer@400,500,600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
