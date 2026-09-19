"use client";

import { useEffect, useState } from "react";
import type { SiteContent } from "../lib/site-content";
import { WhatsAppLink } from "./whatsapp-link";
import { Icon } from "./symbol";

export function MobileDock({ content }: { content: SiteContent }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("inicio");
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.05 },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  if (!visible || dismissed) return null;

  return (
    <aside className="mobile-dock" aria-label="Contacto rápido">
      <button
        type="button"
        className="mobile-dock-close"
        onClick={() => setDismissed(true)}
        aria-label="Cerrar botón fijo"
      >
        ×
      </button>
      <div>
        <strong>¿Revisamos tu ruta?</strong>
        <span>Conversemos por WhatsApp</span>
      </div>
      <WhatsAppLink
        placement="sticky"
        eventName="click_whatsapp_sticky"
        phone={content.brand.whatsappNumber}
        message={content.finalCta.whatsappMessage}
        className="button button-gold"
      >
        <Icon name="whatsapp" /> Escribir
      </WhatsAppLink>
    </aside>
  );
}
