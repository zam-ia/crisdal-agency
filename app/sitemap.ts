import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
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

  return routes.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority,
  }));
}
