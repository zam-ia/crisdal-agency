import type { MetadataRoute } from "next";
import {safePublicPortfolio} from "./lib/commercial/portfolio-repository";
import { SITE_URL } from "./lib/config";

export const dynamic="force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    { path: "", priority: 1 },
    { path: "/eventos", priority: 0.95 },
    { path: "/portafolio", priority: 0.9 },
    { path: "/paquetes", priority: 0.9 },
    { path: "/consultar-fecha", priority: 0.95 },
    { path: "/contacto", priority: 0.85 },
    { path: "/contenido", priority: 0.65 },
    { path: "/planes", priority: 0.6 },
    { path: "/ruta-crisdal", priority: 0.7 },
  ];

  const published=await safePublicPortfolio();
  const base:MetadataRoute.Sitemap=routes.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority,
  }));
  return [...base,...published.filter(p=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)).map(p=>({url:new URL("/portafolio/"+p.slug,SITE_URL).href,changeFrequency:"monthly" as const,priority:.8}))];
}
