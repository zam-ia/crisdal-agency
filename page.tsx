import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:4173";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    title: "CartaLista 24h | Crisdal Agency",
    description: "Carta digital con QR y pedidos por WhatsApp. Lista en 24 horas en Huancayo.",
    icons: { icon: "/brand/crisdal-imagotipo.png" },
    openGraph: {
      title: "CartaLista 24h | Crisdal Agency",
      description: "Tu carta vende, aunque tú estés cocinando.",
      type: "website",
      locale: "es_PE",
      images: [{ url: `${origin}/og.png`, width: 1200, height: 630, alt: "CartaLista 24h por Crisdal Agency" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "CartaLista 24h | Crisdal Agency",
      description: "Menú digital con QR y pedidos por WhatsApp.",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
