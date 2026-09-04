import Link from "next/link";
import type { Metadata } from "next";
import { WhatsAppLink } from "../ui/whatsapp-link";
import { Icon } from "../ui/symbol";
export const metadata: Metadata = {
  title: "Un paso más: envía tu mensaje | Crisdal Agency",
  robots: { index: false, follow: false },
  alternates: { canonical: "/gracias" },
};
export default function Thanks() {
  return (
    <main className="shell thanks">
      <span className="thanks-icon">
        <Icon name="whatsapp" />
      </span>
      <p className="eyebrow">GRACIAS POR INTERESARTE EN IMPULSO LOCAL</p>
      <h1>
        Un paso más.
        <br />
        Conversemos de tu negocio.
      </h1>
      <p>
        Si ya se abrió WhatsApp, envíanos el mensaje para iniciar la
        conversación. Cuéntanos qué vendes y en qué ciudad estás.
      </p>
      <WhatsAppLink placement="thanks" className="button button-gold">
        <Icon name="whatsapp" /> Abrir WhatsApp <Icon name="arrow" />
      </WhatsAppLink>
      <p className="thanks-note">
        ¿No se abrió? Usa el botón o escríbenos al +51 992 566 725.
        <br />
        Tu consulta llega cuando envías el mensaje en WhatsApp.
      </p>
      <Link href="/" className="thanks-back">
        ← Volver a Impulso Local
      </Link>
    </main>
  );
}
