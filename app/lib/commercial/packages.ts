import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

export const packageLineSchema = z.enum(["content", "events"]);
export const packageStatusSchema = z.enum(["draft", "published", "archived"]);
export const priceVisibilitySchema = z.enum(["public", "hidden", "consult"]);
export const commercialPackageSchema = z.object({
  id: z.string().uuid(), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120), line: packageLineSchema,
  category: z.string().min(2).max(120), name: z.string().min(2).max(120), description: z.string().min(10).max(1000),
  imageUrl: z.string().url().nullable(), priceMinor: z.number().int().nonnegative().nullable(), currency: z.literal("PEN"),
  priceVisibility: priceVisibilitySchema, deliverables: z.array(z.string().min(2).max(300)).max(30), deliverablesApproved: z.boolean(),
  recommended: z.boolean(), status: packageStatusSchema, sortOrder: z.number().int().nonnegative(), internalNotes: z.string().max(2000),
  createdAt: z.string().datetime({ offset: true }), updatedAt: z.string().datetime({ offset: true }),
});
export const packageInputSchema = commercialPackageSchema.omit({ id:true,createdAt:true,updatedAt:true }).extend({ id:z.string().uuid().optional() });
export type CommercialPackage = z.infer<typeof commercialPackageSchema>;
export type CommercialPackageInput = z.infer<typeof packageInputSchema>;
export type PublicPackage = Omit<CommercialPackage,"internalNotes">;

export const FALLBACK_PUBLIC_PACKAGES: PublicPackage[] = [
  ["impulso","content","Creación de reels","Impulso","Una entrada profesional para negocios que necesitan empezar a comunicar con una dirección visual clara.",89900,"public",false],
  ["crecimiento","content","Contenido mensual","Crecimiento","La opción recomendada para marcas que buscan sostener una presencia visual más consistente.",119900,"public",true],
  ["dominio-digital","content","Producción puntual","Dominio Digital","Una conversación de mayor alcance para negocios que necesitan una producción audiovisual más completa.",159900,"public",false],
  ["momento","events","Eventos sociales","Momento","Una cobertura esencial cuya disponibilidad, duración y entregables se confirman antes de reservar.",null,"consult",false],
  ["historia","events","Eventos sociales","Historia","Una propuesta narrativa para documentar el evento con mayor amplitud. Alcance sujeto a validación.",null,"consult",true],
  ["cinema","events","Eventos sociales","Cinema","Una propuesta audiovisual de mayor producción. El equipo y los entregables se cotizan según el evento.",null,"consult",false],
].map(([slug,line,category,name,description,priceMinor,priceVisibility,recommended],index)=>({id:`00000000-0000-4000-8000-${String(index+1).padStart(12,"0")}`,slug,line,category,name,description,imageUrl:null,priceMinor,currency:"PEN",priceVisibility,deliverables:[],deliverablesApproved:false,recommended,status:"published",sortOrder:index*10,createdAt:"2026-11-25T00:00:00.000Z",updatedAt:"2026-11-25T00:00:00.000Z"} as PublicPackage));

export function toPublicPackage(value: CommercialPackage): PublicPackage { const { internalNotes: _internal, ...safe } = value; void _internal; return safe; }
export function packagePublicationIssues(value: CommercialPackage) { const issues:string[]=[]; if(value.priceVisibility==="public"&&value.priceMinor===null)issues.push("Un precio público necesita un importe."); if(value.deliverables.length&&!value.deliverablesApproved)issues.push("Los entregables deben estar aprobados antes de publicarse."); return issues; }
export function formatPackagePrice(value: PublicPackage) { if(value.priceVisibility==="hidden")return null;if(value.priceVisibility==="consult")return "Consultar precio";return new Intl.NumberFormat("es-PE",{style:"currency",currency:"PEN",maximumFractionDigits:0}).format((value.priceMinor||0)/100); }
export function newShareToken(){return randomBytes(24).toString("base64url");}
export function hashShareToken(token:string){return createHash("sha256").update(token).digest("hex");}
export function contextualQuoteMessage(name:string){return `Hola, vengo de la web de Crisdal Agency.\n\nMe interesa el paquete ${name}.\n\nTipo de servicio:\nFecha aproximada, si aplica:\nLugar:\nComentarios adicionales:`;}
