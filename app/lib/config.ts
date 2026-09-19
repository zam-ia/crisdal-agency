export const PIXEL_ID = "3971063776548749";
export const OFFER_EVENT_DATA = {
  content_name: "Sistema de Captación Directa",
  content_category: "Contenido, Meta Ads y WhatsApp",
};
export const SITE_URL = "https://crisdal-agency.vercel.app";
export const WHATSAPP_NUMBER = "51992566725";
export const WHATSAPP_MESSAGE =
  "Hola, vi la landing de Crisdal Agency. Quiero saber qué ruta de captación encaja con mi negocio.";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;
export const PLACEMENTS = [
  "header",
  "hero",
  "plan_420",
  "plan_820",
  "plan_1500",
  "final",
  "sticky",
  "thanks",
] as const;
export type Placement = (typeof PLACEMENTS)[number];
