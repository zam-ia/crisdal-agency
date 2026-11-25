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
  title: {
    default: "Crisdal Agency | Producción audiovisual",
    template: "%s",
  },
  description:
    "Creación de contenido, fotografía comercial, video profesional y cobertura audiovisual para negocios y eventos.",
  alternates: { canonical: "/" },
  icons: { icon: "/brand/crisdal-imagotipo.png" },
  openGraph: {
    title: "Crisdal Agency | Creación de contenido y producción audiovisual",
    description:
      "Reels, fotografía comercial, video profesional y cobertura de eventos.",
    url: SITE_URL,
    type: "website",
    locale: "es_PE",
    images: [
      {
        url: "/brand/asesora-impulso.webp",
        width: 1000,
        height: 1250,
        alt: "Crisdal Agency",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crisdal Agency | Producción audiovisual",
    description:
      "Contenido visual profesional para negocios y eventos.",
    images: ["/brand/asesora-impulso.webp"],
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
