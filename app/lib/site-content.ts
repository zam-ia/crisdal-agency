import { z } from "zod";
import {
  getSupabaseAdmin,
  isSupabaseConfigured,
} from "./supabase-admin";

const text = (max = 500) => z.string().trim().min(1).max(max);
const optionalText = (max = 500) => z.string().trim().max(max);
const mediaUrl = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) =>
      value === "" || value.startsWith("/") || /^https:\/\//i.test(value),
    "La URL debe ser una ruta local o una dirección HTTPS.",
  );

const stepSchema = z.object({
  title: text(80),
  text: text(320),
});

const imageSchema = z.object({
  url: mediaUrl,
  alt: optionalText(180),
});

const planSchema = z.object({
  slug: z.enum(["activacion", "traccion", "crecimiento"]),
  name: text(50),
  price: text(30),
  period: text(30),
  audience: text(240),
  description: text(420),
  features: z.array(text(180)).min(1).max(12),
  highlighted: z.boolean(),
  badge: optionalText(40),
  disclaimer: text(180),
  cta: text(70),
  whatsappMessage: text(500),
});

const faqSchema = z.object({
  question: text(180),
  answer: text(900),
});

const caseSchema = z.object({
  title: text(100),
  before: text(360),
  intervention: text(360),
  result: text(360),
  proof: text(240),
});

export const siteContentSchema = z.object({
  brand: z.object({
    logoUrl: mediaUrl,
    whatsappNumber: z.string().regex(/^\d{8,15}$/),
    headerLabel: text(80),
  }),
  hero: z.object({
    eyebrow: text(90),
    title: text(140),
    accent: text(100),
    description: text(520),
    cta: text(70),
    microcopy: text(220),
    proof: text(180),
  }),
  vsl: z.object({
    eyebrow: text(90),
    title: text(140),
    description: text(420),
    url: mediaUrl,
    posterUrl: mediaUrl,
    posterAlt: optionalText(180),
    captionsUrl: mediaUrl,
  }),
  pain: z.object({
    eyebrow: text(90),
    title: text(140),
    intro: text(420),
    symptoms: z.array(text(240)).min(2).max(6),
    closing: text(420),
  }),
  paradigm: z.object({
    eyebrow: text(90),
    title: text(140),
    description: text(520),
    steps: z.array(stepSchema).min(3).max(4),
  }),
  authority: z.object({
    eyebrow: text(90),
    title: text(160),
    description: text(760),
    note: text(320),
    image: imageSchema,
  }),
  origin: z.object({
    eyebrow: text(90),
    title: text(140),
    description: text(900),
    image: imageSchema,
  }),
  cases: z.object({
    enabled: z.boolean(),
    eyebrow: text(90),
    title: text(140),
    intro: text(420),
    items: z.array(caseSchema).max(6),
  }),
  mechanism: z.object({
    eyebrow: text(90),
    title: text(140),
    description: text(520),
    steps: z.array(stepSchema).min(4).max(5),
  }),
  benefits: z.object({
    eyebrow: text(90),
    title: text(140),
    items: z.array(text(240)).min(3).max(8),
  }),
  plans: z.object({
    eyebrow: text(90),
    title: text(140),
    intro: text(420),
    items: z.array(planSchema).length(3),
  }),
  process: z.object({
    eyebrow: text(90),
    title: text(140),
    intro: text(420),
    steps: z.array(stepSchema).min(4).max(8),
  }),
  faq: z.object({
    eyebrow: text(90),
    title: text(140),
    intro: text(320),
    items: z.array(faqSchema).min(3).max(12),
  }),
  finalCta: z.object({
    eyebrow: text(90),
    title: text(140),
    description: text(420),
    cta: text(70),
    whatsappMessage: text(500),
  }),
  footer: z.object({
    tagline: text(120),
    legal: text(180),
    privacy: text(1200),
  }),
  seo: z.object({
    title: text(80),
    description: text(180),
    ogImageUrl: mediaUrl,
  }),
});

export type SiteContent = z.infer<typeof siteContentSchema>;

export const defaultSiteContent: SiteContent = {
  brand: {
    logoUrl: "/brand/crisdal-imagotipo.png",
    whatsappNumber: "51992566725",
    headerLabel: "Ruta Crisdal",
  },
  hero: {
    eyebrow: "NO PUBLICAMOS POR PUBLICAR",
    title: "Transformamos contenido y publicidad",
    accent: "en conversaciones reales para tu negocio.",
    description:
      "Creamos tus piezas, configuramos Meta Ads y conectamos todo con tu WhatsApp para que cada publicación tenga una dirección comercial.",
    cta: "Quiero atraer más clientes",
    microcopy:
      "Conversemos por WhatsApp sobre lo que vendes y la ruta que necesitas.",
    proof: "Estrategia, contenido, publicidad y WhatsApp en una sola ruta.",
  },
  vsl: {
    eyebrow: "MINI VSL · 2 MIN APROX.",
    title: "¿Cómo convertimos contenido en conversaciones?",
    description:
      "Una explicación directa de por qué publicar más no basta y cómo conectamos cada pieza de tu captación.",
    url: "",
    posterUrl: "/brand/asesora-impulso.webp",
    posterAlt: "Presentación de Crisdal Agency",
    captionsUrl: "/captions/empty.vtt",
  },
  pain: {
    eyebrow: "EL PROBLEMA NO ES PUBLICAR POCO",
    title: "Publicar más no arregla un sistema desconectado",
    intro:
      "Puedes tener buenos videos, invertir en publicidad e incluso recibir mensajes. Si cada parte funciona por separado, terminas gastando tiempo y dinero sin saber qué acerca personas a tu negocio.",
    symptoms: [
      "Publicas, pero sin una dirección comercial: el contenido existe porque hay que publicar, no porque cumpla una función.",
      "Pagas publicidad, pero el prospecto llega frío: el clic no continúa en una experiencia preparada para conversar.",
      "Recibes mensajes, pero no existe una ruta: Instagram, anuncios, perfil y WhatsApp parecen piezas separadas.",
    ],
    closing:
      "El problema no siempre es tu producto. Es que contenido, publicidad y atención todavía no trabajan como un mismo sistema.",
  },
  paradigm: {
    eyebrow: "RUTA CRISDAL",
    title: "No necesitas otra persona que solamente publique por ti",
    description:
      "Necesitas que mensaje, contenido, publicidad y conversación trabajen como un mismo sistema. Ruta Crisdal es el vehículo que conecta esas piezas.",
    steps: [
      {
        title: "Mensaje",
        text: "Aterrizamos qué vendes, para quién y qué acción queremos provocar.",
      },
      {
        title: "Contenido",
        text: "Creamos piezas que atraen, explican y mueven a la siguiente acción.",
      },
      {
        title: "Meta Ads",
        text: "Distribuimos el mensaje frente a audiencias relevantes y monitoreamos señales.",
      },
      {
        title: "WhatsApp",
        text: "Reducimos fricción para que el interés termine en una conversación con contexto.",
      },
    ],
  },
  authority: {
    eyebrow: "CRISDAL AGENCY",
    title: "Trabajo real antes que métricas de adorno",
    description:
      "La estrategia se vuelve tangible en guiones, rodajes, piezas, campañas y rutas hacia WhatsApp. Mostramos el proceso real mientras documentamos los casos que puedan publicarse con contexto.",
    note:
      "Los resultados y testimonios se publican solo con periodo, contexto, evidencia verificable y autorización del cliente.",
    image: {
      url: "/brand/asesora-impulso.webp",
      alt: "Presentación visual de Crisdal Agency",
    },
  },
  origin: {
    eyebrow: "POR QUÉ NACIÓ CRISDAL",
    title: "Ordenar el marketing que antes funcionaba por partes",
    description:
      "Vimos el mismo patrón repetirse: negocios con buenos productos contrataban diseños, videos o anuncios por separado, pero nadie conectaba las piezas. El contenido iba por un lado, la pauta por otro y WhatsApp recibía consultas sin contexto. Crisdal Agency nace para ordenar esa ruta y convertir marketing disperso en un proceso más claro y medible.",
    image: {
      url: "/brand/plan-380.webp",
      alt: "Pieza de campaña desarrollada por Crisdal Agency",
    },
  },
  cases: {
    enabled: false,
    eyebrow: "RESULTADOS Y EVIDENCIA",
    title: "Prueba real, no promesas vacías",
    intro:
      "Cada caso se publicará con situación inicial, trabajo realizado, periodo, resultado y evidencia autorizada. Mientras tanto, mostramos el trabajo que sí podemos verificar.",
    items: [],
  },
  mechanism: {
    eyebrow: "CÓMO FUNCIONA",
    title: "Así construimos tu ruta",
    description:
      "Un servicio complejo debe sentirse simple de entender. Estos cuatro pasos ordenan el trabajo desde la oferta hasta la conversación.",
    steps: [
      {
        title: "Entendemos qué vendes",
        text: "Definimos oferta, cliente, mensaje y objetivo antes de producir.",
      },
      {
        title: "Creamos el contenido",
        text: "Grabamos piezas pensadas para llamar la atención y mover a una acción.",
      },
      {
        title: "Activamos publicidad",
        text: "Configuramos y monitoreamos campañas para distribuir el mensaje.",
      },
      {
        title: "Conectamos WhatsApp",
        text: "Llevamos al prospecto a una conversación directa, clara y con contexto.",
      },
    ],
  },
  benefits: {
    eyebrow: "LO QUE CAMBIA PARA TU NEGOCIO",
    title: "Lo que cambia cuando existe una ruta",
    items: [
      "Cada pieza tiene una función dentro del proceso comercial.",
      "La campaña y el perfil conducen hacia una acción concreta.",
      "Decides qué producir y promocionar con menos improvisación.",
      "El prospecto llega a WhatsApp con más contexto.",
      "Piezas reutilizables en anuncios, perfil y seguimiento comercial.",
    ],
  },
  plans: {
    eyebrow: "SERVICIOS Y PLANES",
    title: "Elige el nivel de impulso que necesita tu negocio",
    intro:
      "Primero definimos la ruta. Después eliges el alcance de producción y acompañamiento que encaja con tu momento.",
    items: [
      {
        slug: "activacion",
        name: "Activación",
        price: "S/420",
        period: "por mes",
        audience:
          "Para negocios que necesitan empezar a atraer prospectos con una ruta clara.",
        description:
          "Una base compacta para empezar a conectar contenido, campaña y contacto.",
        features: [
          "2 videos verticales orientados a conversión",
          "Ajuste de ruta Meta a WhatsApp Business",
          "Monitoreo de 1 campaña publicitaria",
          "2 visitas presenciales",
          "Asesoramiento continuo durante el mes",
        ],
        highlighted: false,
        badge: "",
        disclaimer: "Inversión en pauta no incluida.",
        cta: "Quiero activar mi negocio",
        whatsappMessage:
          "Hola, estoy viendo el Plan Activación de S/420 y quiero saber si encaja con mi negocio.",
      },
      {
        slug: "traccion",
        name: "Tracción",
        price: "S/820",
        period: "por mes",
        audience:
          "Para negocios que quieren producir más contenido y mejorar su presencia antes de invertir más en captación.",
        description:
          "Más consistencia creativa y aprendizaje continuo para una ruta que ya está en movimiento.",
        features: [
          "4 videos estratégicos",
          "Grabación, edición y optimización",
          "Monitoreo de campañas",
          "Optimización del perfil y su CTA",
          "3 visitas presenciales y ruta hacia WhatsApp",
        ],
        highlighted: true,
        badge: "NEGOCIOS EN CRECIMIENTO",
        disclaimer: "Inversión en pauta no incluida.",
        cta: "Quiero generar tracción",
        whatsappMessage:
          "Hola, estoy viendo el Plan Tracción de S/820 y quiero saber si encaja con mi negocio.",
      },
      {
        slug: "crecimiento",
        name: "Crecimiento",
        price: "S/1,500",
        period: "por mes",
        audience:
          "Para negocios que necesitan una estrategia más completa y producción constante.",
        description:
          "Una operación de contenido y pauta con más activos, seguimiento y dirección mensual.",
        features: [
          "6 videos estratégicos",
          "10 fotografías profesionales editadas",
          "Estrategia mensual de contenido",
          "Perfil optimizado, campañas y ruta a WhatsApp",
          "4 visitas presenciales",
        ],
        highlighted: false,
        badge: "",
        disclaimer: "Inversión en pauta no incluida.",
        cta: "Quiero construir mi estrategia",
        whatsappMessage:
          "Hola, estoy viendo el Plan Crecimiento de S/1,500 y quiero saber si encaja con mi negocio.",
      },
    ],
  },
  process: {
    eyebrow: "CÓMO TRABAJAMOS",
    title: "Un proceso visible desde el diagnóstico hasta la mejora",
    intro:
      "El alcance y los tiempos definitivos se confirman antes de iniciar, según el plan y el material disponible.",
    steps: [
      { title: "Diagnóstico", text: "Revisamos negocio, oferta y ruta actual." },
      { title: "Plan y guiones", text: "Definimos mensajes, piezas y acción esperada." },
      { title: "Grabación", text: "Producimos el material acordado con el negocio." },
      { title: "Edición", text: "Preparamos las piezas para perfil y anuncios." },
      { title: "Campaña", text: "Configuramos o ajustamos la distribución en Meta." },
      { title: "Optimización", text: "Revisamos señales y documentamos los ajustes." },
    ],
  },
  faq: {
    eyebrow: "PREGUNTAS FRECUENTES",
    title: "Respuestas antes de escribirnos",
    intro: "Condiciones claras para que sepas qué hacemos, qué depende de tu negocio y qué se contrata por separado.",
    items: [
      {
        question: "¿El presupuesto de publicidad está incluido?",
        answer:
          "No. El monto destinado a Meta Ads es independiente del servicio de Crisdal. Nosotros nos encargamos de la configuración y el monitoreo correspondiente al plan contratado.",
      },
      {
        question: "¿Necesito tener mis redes sociales bien trabajadas antes de comenzar?",
        answer:
          "No necesariamente. Dependiendo del plan podemos ordenar y optimizar la presencia que recibirá a los prospectos antes de activar las campañas.",
      },
      {
        question: "¿Tengo que saber crear contenido?",
        answer:
          "No. Nosotros nos encargamos de la planificación, grabación y edición contempladas en tu plan.",
      },
      {
        question: "¿Tengo que aparecer en los videos?",
        answer:
          "Dependerá de la estrategia y de tu negocio. No todos los contenidos necesitan el mismo formato ni requieren que aparezcas frente a cámara.",
      },
      {
        question: "¿Crisdal garantiza ventas?",
        answer:
          "No sería responsable garantizar una cantidad de ventas sin conocer tu oferta, precio, presupuesto publicitario, capacidad de atención y proceso comercial. Nuestro trabajo es construir y optimizar el sistema que genera y dirige oportunidades hacia tu negocio.",
      },
    ],
  },
  finalCta: {
    eyebrow: "TU SIGUIENTE PASO",
    title: "Tu negocio ya tiene algo que vender. Ahora necesita una ruta para que más personas lleguen hasta él.",
    description:
      "Cuéntanos qué haces y te ayudaremos a identificar cuál de nuestras soluciones encaja mejor con tu negocio.",
    cta: "Hablar con Crisdal por WhatsApp",
    whatsappMessage:
      "Hola, vi la landing de Crisdal Agency. Quiero saber qué ruta de captación encaja con mi negocio.",
  },
  footer: {
    tagline: "No publicamos por publicar. Construimos rutas de captación.",
    legal: "© 2026 Crisdal Agency · Perú",
    privacy:
      "Usamos medición para entender visitas, reproducción de la VSL y clics hacia WhatsApp. No recibimos el contenido de tus conversaciones desde esta web. Al abrir WhatsApp, tú decides qué información enviar.",
  },
  seo: {
    title: "Ruta Crisdal: contenido, Meta Ads y WhatsApp",
    description:
      "Transforma contenido y publicidad en conversaciones reales con una ruta que conecta estrategia, producción, Meta Ads y WhatsApp.",
    ogImageUrl: "/brand/plan-380.webp",
  },
};

const CONTENT_TABLE = "landing_content_versions";

export async function getSiteContent(): Promise<SiteContent> {
  if (!isSupabaseConfigured()) return defaultSiteContent;

  try {
    const { data, error } = await getSupabaseAdmin()
      .from(CONTENT_TABLE)
      .select("content")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return defaultSiteContent;
    return siteContentSchema.parse(data.content);
  } catch (error) {
    console.error("No se pudo leer el contenido administrable", error);
    return defaultSiteContent;
  }
}

export async function saveSiteContent(input: unknown): Promise<SiteContent> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Falta configurar la conexión privada de Supabase antes de guardar.",
    );
  }
  const content = siteContentSchema.parse(input);
  const { error } = await getSupabaseAdmin()
    .from(CONTENT_TABLE)
    .insert({ content });
  if (error) throw error;
  return content;
}

export function isCmsConfigured() {
  return isSupabaseConfigured();
}
