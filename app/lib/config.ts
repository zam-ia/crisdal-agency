export const PIXEL_ID = "3971063776548749";
export const OFFER_EVENT_DATA = {
  content_name: "Impulso Local",
  content_category: "Marketing para negocios locales",
};
export const SITE_URL = "https://crisdal-agency.vercel.app";
export const WHATSAPP_NUMBER = "51992566725";
export const WHATSAPP_MESSAGE =
  "Hola, quiero información sobre Impulso Local de S/380 (pago único, inversión en Meta Ads aparte). Mi negocio es: ";
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
  "offer",
  "work",
  "closing",
  "sticky",
  "thanks",
] as const;
export type Placement = (typeof PLACEMENTS)[number];
