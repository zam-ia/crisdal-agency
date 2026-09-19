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
    headerLabel: "Contenido, Meta Ads y WhatsApp",
  },
  hero: {
    eyebrow: "SISTEMA DE CAPTACIÓN DIRECTA",
    title: "Tu negocio no necesita publicar más.",
    accent: "Necesita convertir atención en conversaciones de venta.",
    description:
      "Creamos contenido, lo conectamos con campañas en Meta y llevamos a tus potenciales clientes directamente a WhatsApp para que tu marketing deje de sentirse como piezas sueltas.",
    cta: "Quiero una ruta para mi negocio",
    microcopy:
      "Te llevamos a WhatsApp. Cuéntanos qué vendes y revisamos qué plan encaja.",
    proof: "Una ruta clara desde el contenido hasta la conversación comercial.",
  },
  vsl: {
    eyebrow: "MIRA CÓMO FUNCIONA",
    title: "Contenido, distribución y WhatsApp en una sola ruta",
    description:
      "La VSL explica el problema, el mecanismo y qué plan tiene sentido según el momento de tu negocio.",
    url: "",
    posterUrl: "/brand/asesora-impulso.webp",
    posterAlt: "Presentación de Crisdal Agency",
    captionsUrl: "/captions/empty.vtt",
  },
  pain: {
    eyebrow: "EL MARKETING SE SIENTE DESCONECTADO",
    title: "¿Te pasa algo de esto?",
    intro:
      "Publicas, quizá impulsas anuncios, pero el cliente no encuentra un camino claro para comprarte.",
    symptoms: [
      "Subes contenido, pero no sabes qué pieza realmente ayuda a vender.",
      "Has pagado publicidad, pero los mensajes que llegan son pocos, caros o poco claros.",
      "Tu Instagram se ve activo, pero no conduce al cliente a una acción concreta.",
      "Tienes un buen producto o servicio, pero el marketing depende de improvisar cada semana.",
    ],
    closing:
      "El problema no siempre es tu producto. Muchas veces es que contenido, publicidad y atención están trabajando por separado.",
  },
  paradigm: {
    eyebrow: "UNA RUTA SIMPLE",
    title: "No necesitas veinte tácticas aisladas",
    description:
      "Conectamos las piezas que ya necesita tu negocio para que cada acción tenga una función dentro del proceso comercial.",
    steps: [
      {
        title: "Contenido que atrae",
        text: "Piezas creadas para explicar, demostrar y provocar interés real.",
      },
      {
        title: "Meta Ads que distribuye",
        text: "Campañas que ponen el mensaje frente a audiencias relevantes.",
      },
      {
        title: "WhatsApp que recibe",
        text: "Una ruta directa y con contexto para iniciar la conversación.",
      },
    ],
  },
  authority: {
    eyebrow: "CRISDAL AGENCY",
    title: "Marketing pensado para negocios que necesitan movimiento",
    description:
      "Trabajamos la producción y la pauta como un mismo sistema. Cada pieza debe cumplir una función: atraer, explicar, demostrar o abrir una conversación comercial.",
    note:
      "La experiencia, cantidad de proyectos y resultados se publicarán únicamente cuando exista evidencia verificable.",
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
    eyebrow: "CASOS REALES",
    title: "Resultados con contexto y evidencia",
    intro:
      "Publicaremos cada caso con situación inicial, intervención, periodo, resultado y prueba autorizada.",
    items: [],
  },
  mechanism: {
    eyebrow: "SISTEMA DE CAPTACIÓN DIRECTA",
    title: "Cuatro pasos conectados",
    description:
      "El sistema permite entender qué mensaje se usa, cómo se distribuye y dónde se pierde una oportunidad.",
    steps: [
      {
        title: "Mensaje",
        text: "Definimos qué comunicar y qué acción queremos provocar.",
      },
      {
        title: "Contenido",
        text: "Grabamos piezas verticales que explican, demuestran y venden.",
      },
      {
        title: "Distribución",
        text: "Configuramos u optimizamos Meta Ads para mostrar las piezas a audiencias relevantes.",
      },
      {
        title: "WhatsApp",
        text: "Reducimos fricción y llevamos al prospecto a una conversación comercial.",
      },
    ],
  },
  benefits: {
    eyebrow: "LO QUE CAMBIA PARA TU NEGOCIO",
    title: "Beneficios antes que entregables",
    items: [
      "Una ruta comercial más fácil de entender y medir.",
      "Mejor percepción de tu negocio mediante creativos y un perfil más claros.",
      "Menos improvisación al decidir qué publicar o promocionar.",
      "Más oportunidades de conversación sin depender solo del alcance orgánico.",
      "Piezas reutilizables en anuncios, perfil y seguimiento comercial.",
    ],
  },
  plans: {
    eyebrow: "ELIGE SEGÚN TU MOMENTO",
    title: "Tres rutas para avanzar",
    intro:
      "La inversión en Meta Ads se define y paga por separado. Antes de contratar, revisamos si el alcance del plan encaja con tu negocio.",
    items: [
      {
        slug: "activacion",
        name: "Activación",
        price: "S/420",
        period: "por mes",
        audience:
          "Para negocios que quieren validar una primera ruta de captación sin contratar una estructura grande.",
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
        cta: "Consultar Activación",
        whatsappMessage:
          "Hola, estoy viendo el Plan Activación de S/420 y quiero saber si encaja con mi negocio.",
      },
      {
        slug: "traccion",
        name: "Tracción",
        price: "S/820",
        period: "por mes",
        audience:
          "Para negocios que ya venden y necesitan mayor frecuencia creativa, mejor perfil y optimización continua.",
        description:
          "Más consistencia creativa y aprendizaje continuo para una ruta que ya está en movimiento.",
        features: [
          "4 videos con grabación y edición",
          "Optimización del perfil y su CTA",
          "Monitoreo y optimización de campañas",
          "3 visitas presenciales",
          "Ruta directa hacia WhatsApp Business",
          "Asesoramiento continuo",
        ],
        highlighted: true,
        badge: "PLAN CENTRAL",
        disclaimer: "Inversión en pauta no incluida.",
        cta: "Consultar Tracción",
        whatsappMessage:
          "Hola, estoy viendo el Plan Tracción de S/820 y quiero saber si encaja con mi negocio.",
      },
      {
        slug: "crecimiento",
        name: "Crecimiento",
        price: "S/1,500",
        period: "por mes",
        audience:
          "Para negocios que necesitan construir autoridad, variedad creativa y una estrategia mensual más completa.",
        description:
          "Una operación de contenido y pauta con más activos, seguimiento y dirección mensual.",
        features: [
          "6 videos verticales",
          "10 fotografías editadas de producto o servicio",
          "Perfil optimizado y CTA",
          "Monitoreo y optimización de campaña",
          "4 visitas presenciales",
          "Ruta directa a WhatsApp Business",
          "Estrategia mensual de contenido",
        ],
        highlighted: false,
        badge: "",
        disclaimer: "Inversión en pauta no incluida.",
        cta: "Consultar Crecimiento",
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
    title: "Lo que conviene aclarar antes de empezar",
    intro: "Queremos que sepas qué incluye la propuesta y qué depende de cada negocio.",
    items: [
      {
        question: "¿La inversión en Meta Ads está incluida?",
        answer:
          "No. El precio del plan corresponde al trabajo de estrategia, producción y gestión indicado. El presupuesto que Meta cobra por mostrar los anuncios se define y paga aparte.",
      },
      {
        question: "¿Necesito tener Instagram y WhatsApp Business configurados?",
        answer:
          "No necesariamente. Revisamos el estado actual y definimos qué ajustes son necesarios para que la ruta funcione correctamente.",
      },
      {
        question: "¿Ustedes garantizan ventas?",
        answer:
          "No prometemos una cifra garantizada. La agencia trabaja estrategia, creativos, configuración y optimización; el resultado también depende de la oferta, el precio, el mercado, el presupuesto, la atención comercial y la capacidad de cierre.",
      },
      {
        question: "¿Qué necesito para empezar?",
        answer:
          "Información del negocio, oferta principal, accesos necesarios para pauta, disponibilidad para grabaciones y una persona responsable de atender los contactos.",
      },
      {
        question: "¿Cuánto tarda en activarse?",
        answer:
          "La fecha se define después del diagnóstico, según el plan, la disponibilidad para grabar y los materiales necesarios. Confirmamos el calendario antes de iniciar.",
      },
      {
        question: "¿Puedo cambiar de plan?",
        answer:
          "Revisamos el alcance antes de cada contratación. Cualquier cambio, permanencia o renovación se confirma de forma explícita antes del pago.",
      },
    ],
  },
  finalCta: {
    eyebrow: "EL SIGUIENTE PASO ES UNA CONVERSACIÓN",
    title: "Cuéntanos qué vendes y te diremos qué ruta tiene más sentido",
    description:
      "Escríbenos por WhatsApp con tu ciudad, tu oferta principal y qué estás haciendo hoy para conseguir clientes.",
    cta: "Quiero revisar mi ruta",
    whatsappMessage:
      "Hola, vi la landing de Crisdal Agency. Quiero saber qué ruta de captación encaja con mi negocio.",
  },
  footer: {
    tagline: "Contenido, distribución y conversación comercial.",
    legal: "© 2026 Crisdal Agency · Perú",
    privacy:
      "Usamos medición para entender visitas, reproducción de la VSL y clics hacia WhatsApp. No recibimos el contenido de tus conversaciones desde esta web. Al abrir WhatsApp, tú decides qué información enviar.",
  },
  seo: {
    title: "Contenido, Meta Ads y WhatsApp | Crisdal Agency",
    description:
      "Conecta contenido, campañas en Meta y WhatsApp con un plan de captación para tu negocio. Conoce los planes de Crisdal Agency.",
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
