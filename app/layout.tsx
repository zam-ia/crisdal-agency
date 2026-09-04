/* eslint-disable @next/next/no-img-element -- Meta requires an unoptimized 1px noscript beacon. */
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { MetaPixel } from "./ui/meta-pixel";
import { PIXEL_ID, SITE_URL } from "./lib/config";
import "./globals.css";
const displayFont = localFont({
  src: "../public/fonts/barlow-condensed-800.ttf",
  weight: "800",
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Impulso Local · S/380 pago único | Crisdal Agency",
  description:
    "1 video, 6 flyers, monitoreo de una campaña y asesoramiento. Impulsa tu negocio con Crisdal. S/380 pago único; inversión en Meta Ads aparte.",
  alternates: { canonical: "/" },
  icons: { icon: "/brand/crisdal-imagotipo.png" },
  openGraph: {
    title: "Impulso Local | Crisdal Agency",
    description:
      "Empieza con una oferta real y mide resultados. S/380 pago único. Meta Ads aparte.",
    url: SITE_URL,
    type: "website",
    locale: "es_PE",
    images: [
      {
        url: "/brand/plan-380.webp",
        width: 1080,
        height: 1440,
        alt: "Impulso Local, el plan de S/380 de Crisdal Agency",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Impulso Local | Crisdal Agency",
    description:
      "Tu negocio local, en el radar correcto. S/380 pago único. Meta Ads aparte.",
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
    <html lang="es-PE">
      <body className={displayFont.variable}>
        <MetaPixel />
        {children}
        <noscript>
          {/* The 1px Meta fallback must not use the Next image optimizer. */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>
      </body>
    </html>
  );
}
