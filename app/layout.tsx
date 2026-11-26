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
    default: "Crisdal Agency | Fotografía y video de eventos",
    template: "%s",
  },
  description:
    "Fotografía y video profesional de bodas, quinceaños, celebraciones y eventos corporativos en Huancayo.",
  alternates: { canonical: "/" },
  icons: { icon: { url: "/brand/crisdal-symbol.svg", type: "image/svg+xml" } },
  openGraph: {
    title: "Crisdal Agency | Fotografía y video de eventos",
    description:
      "Coberturas audiovisuales para bodas, quinceaños y eventos corporativos.",
    url: SITE_URL,
    type: "website",
    locale: "es_PE",
    images: [
      {
        url: "/brand/os-icon-512.png",
        width: 512,
        height: 512,
        alt: "Crisdal Agency",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crisdal Agency | Producción audiovisual",
    description:
      "Fotografía y video profesional para eventos.",
    images: ["/brand/os-icon-512.png"],
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
