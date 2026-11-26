import type { Metadata } from "next";
import { safePublicPackages } from "../lib/commercial/package-repository";
import { MarketingShell } from "../ui/marketing/marketing-shell";
import { PackageCatalog } from "./package-catalog";
import styles from "./packages.module.css";
import stateStyles from "./package-state.module.css";
import { PromotionSlot } from "../ui/marketing/promotion-slot";
export const metadata:Metadata={title:"Paquetes audiovisuales | Crisdal Agency",description:"Explora opciones de contenido para negocios y producción audiovisual para eventos.",alternates:{canonical:"/paquetes"}};
export const dynamic="force-dynamic";
const messages={unconfigured:["Catálogo en activación","La base comercial todavía no está configurada en este entorno."],empty:["Paquetes en preparación","Aún no hay paquetes publicados. Escríbenos para revisar una cobertura personalizada."],unavailable:["Servicio temporalmente no disponible","No mostramos ofertas guardadas durante una interrupción. Intenta nuevamente o consulta por WhatsApp."]} as const;
export default async function PackagesPage(){const state=await safePublicPackages();return <MarketingShell><section className={styles.hero}><p>Fotografía y video para eventos</p><h1>Coberturas para volver a vivir cada momento.</h1><span>Explora únicamente paquetes publicados y continúa la conversación por WhatsApp. La consulta no reserva fechas ni confirma una contratación.</span></section><PromotionSlot page="packages" />{state.status==="ready"?<PackageCatalog packages={state.packages}/>:<section className={stateStyles.state}><p>{messages[state.status][0]}</p><h2>{messages[state.status][1]}</h2><a href="https://wa.me/51992566725?text=Hola%2C%20quiero%20consultar%20una%20cobertura%20para%20mi%20evento." target="_blank" rel="noopener noreferrer">Consultar por WhatsApp</a></section>}</MarketingShell>;}
