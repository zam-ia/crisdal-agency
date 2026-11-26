import type { Metadata } from "next";
import { safePublicPackages } from "../lib/commercial/package-repository";
import { MarketingShell } from "../ui/marketing/marketing-shell";
import { PackageCatalog } from "./package-catalog";
import styles from "./packages.module.css";
export const metadata:Metadata={title:"Paquetes audiovisuales | Crisdal Agency",description:"Explora opciones de contenido para negocios y producción audiovisual para eventos.",alternates:{canonical:"/paquetes"}};
export const dynamic="force-dynamic";
export default async function PackagesPage(){const packages=await safePublicPackages();return <MarketingShell><section className={styles.hero}><p>Experiencia comercial</p><h1>¿Qué necesitas producir?</h1><span>Elige una línea, revisa opciones vigentes y continúa la conversación por WhatsApp. La consulta no reserva fechas ni confirma una contratación.</span></section><PackageCatalog packages={packages}/></MarketingShell>;}
