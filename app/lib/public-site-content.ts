import { WHATSAPP_NUMBER } from "./config";

export type CommercialPlan = {
  slug: "impulso" | "crecimiento" | "dominio-digital";
  name: string;
  price: string;
  summary: string;
  recommended: boolean;
  message: string;
};

export type EventPackage = {
  slug: "momento" | "historia" | "cinema";
  name: string;
  summary: string;
  message: string;
};

export const publicSite = {
  brand: {
    name: "Crisdal Agency",
    whatsapp: WHATSAPP_NUMBER,
    positioning: "Creación de contenido y producción audiovisual",
  },
  messages: {
    content:
      "Hola, vi los servicios de creación de contenido de Crisdal Agency. Quiero conversar sobre una producción para mi negocio.",
    photography:
      "Hola, quiero cotizar una producción de fotografía comercial con Crisdal Agency.",
    events:
      "Hola, quiero cotizar fotografía o video profesional para un evento. Quisiera consultar disponibilidad.",
    general:
      "Hola, visité la web de Crisdal Agency y quiero conversar sobre una producción audiovisual.",
  },
  contentPlans: [
    {
      slug: "impulso",
      name: "Impulso",
      price: "S/899",
      summary:
        "Una entrada profesional para negocios que necesitan empezar a comunicar con una dirección visual clara.",
      recommended: false,
      message:
        "Hola, quiero confirmar el alcance y las condiciones vigentes del plan Impulso de S/899.",
    },
    {
      slug: "crecimiento",
      name: "Crecimiento",
      price: "S/1,199",
      summary:
        "La opción recomendada para marcas que buscan sostener una presencia visual más consistente.",
      recommended: true,
      message:
        "Hola, quiero confirmar el alcance y las condiciones vigentes del plan Crecimiento de S/1,199.",
    },
    {
      slug: "dominio-digital",
      name: "Dominio Digital",
      price: "S/1,599",
      summary:
        "Una conversación de mayor alcance para negocios que necesitan una producción audiovisual más completa.",
      recommended: false,
      message:
        "Hola, quiero confirmar el alcance y las condiciones vigentes del plan Dominio Digital de S/1,599.",
    },
  ] satisfies CommercialPlan[],
  eventPackages: [
    {
      slug: "momento",
      name: "Momento",
      summary:
        "Una cobertura esencial cuya disponibilidad, duración y entregables se confirman antes de reservar.",
      message:
        "Hola, quiero consultar las condiciones vigentes y la disponibilidad del paquete Momento.",
    },
    {
      slug: "historia",
      name: "Historia",
      summary:
        "Una propuesta narrativa para documentar el evento con mayor amplitud. Alcance sujeto a validación.",
      message:
        "Hola, quiero consultar las condiciones vigentes y la disponibilidad del paquete Historia.",
    },
    {
      slug: "cinema",
      name: "Cinema",
      summary:
        "Una propuesta audiovisual de mayor producción. El equipo y los entregables se cotizan según el evento.",
      message:
        "Hola, quiero consultar las condiciones vigentes y la disponibilidad del paquete Cinema.",
    },
  ] satisfies EventPackage[],
  portfolio: [] as Array<{
    slug: string;
    title: string;
    category: "Reels" | "Fotografía" | "Producto" | "Eventos" | "Corporativo";
    cover: string;
    ratio: "9:16" | "4:5" | "16:9";
    description: string;
  }>,
};

export const contentFormats = [
  { title: "Reels y video vertical", text: "Piezas pensadas para presentar, explicar y mostrar tu negocio con claridad." },
  { title: "Fotografía comercial", text: "Retratos, producto, espacios y equipo con una dirección visual coherente." },
  { title: "Producción de campaña", text: "Una narrativa visual coordinada para lanzamientos, anuncios y activos comerciales." },
  { title: "Cobertura audiovisual", text: "Fotografía y video profesional para documentar eventos y momentos relevantes." },
];
export const productionSteps = [
  { number: "01", title: "Entendemos", text: "Aterrizamos el objetivo, el público y el uso real de cada pieza." },
  { number: "02", title: "Diseñamos", text: "Definimos enfoque, guion, referencias, locación y plan de producción." },
  { number: "03", title: "Producimos", text: "Grabamos o fotografiamos con una dirección visual consistente." },
  { number: "04", title: "Entregamos", text: "Editamos y preparamos los activos acordados para su uso final." },
];

export const publicFaq = [
  {
    question: "¿Los planes incluyen siempre la misma cantidad de piezas?",
    answer:
      "El nombre y precio de referencia están publicados, pero el alcance, los entregables y las condiciones vigentes se confirman por escrito antes de iniciar.",
  },
  {
    question: "¿Puedo contratar solamente fotografía comercial?",
    answer:
      "Sí. Podemos conversar sobre fotografía de producto, espacios, equipo o una necesidad comercial específica.",
  },
  {
    question: "¿Cómo se reserva una fecha para un evento?",
    answer:
      "Primero validamos disponibilidad, alcance y condiciones. Una consulta por WhatsApp no constituye por sí sola una reserva confirmada.",
  },
  {
    question: "¿Trabajan fuera de Huancayo?",
    answer:
      "La disponibilidad y los costos asociados a desplazamiento se revisan según la fecha, la ubicación y las necesidades de producción.",
  },
];
