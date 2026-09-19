import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { TrackingConsent } from "./ui/tracking-consent";
import { SITE_URL } from "./lib/config";
import "./globals.css";
const displayFont = localFont({
  src: "../public/fonts/barlow-condensed-800.ttf",
  weight: "800",
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Crisdal Agency | Contenido, Meta Ads y WhatsApp",
  description:
    "Conecta contenido, campañas en Meta y WhatsApp con una ruta de captación clara para tu negocio.",
  alternates: { canonical: "/" },
  icons: { icon: "/brand/crisdal-imagotipo.png" },
  openGraph: {
    title: "Crisdal Agency | Sistema de Captación Directa",
    description:
      "Contenido, Meta Ads y WhatsApp conectados en una ruta comercial.",
    url: SITE_URL,
    type: "website",
    locale: "es_PE",
    images: [
      {
        url: "/brand/plan-380.webp",
        width: 1080,
        height: 1440,
        alt: "Crisdal Agency",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crisdal Agency | Sistema de Captación Directa",
    description:
      "Contenido, Meta Ads y WhatsApp conectados en una ruta comercial.",
    images: ["/brand/plan-380.webp"],
  },
};
export const viewport: Viewport = {
  themeColor: "#111210",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-PE" data-scroll-behavior="smooth">
      <body className={displayFont.variable}>
        <TrackingConsent />
        {children}
      </body>
    </html>
  );
}
