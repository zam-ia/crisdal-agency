"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useState } from "react";
import { EVENT_TYPES, type EventType } from "../lib/availability/public-calendar";
import { eventTypeForCategory, inquiryHref } from "../lib/availability/inquiry-context";
import { contextualQuoteMessage, formatPackagePrice, type PublicPackage } from "../lib/commercial/packages";
import { publicSite } from "../lib/public-site-content";
import { WhatsAppLink } from "../ui/whatsapp-link";
import styles from "./packages.module.css";

type Category = "events" | "content" | EventType;
const categoryNames: Record<EventType, string> = {
  Boda: "Bodas",
  Quinceaños: "Quinceaños",
  "Evento corporativo": "Eventos corporativos",
  "Cumpleaños o celebración": "Celebraciones",
  Bautizo: "Bautizos",
  "Pedida de mano": "Pedidas de mano",
  "Sesión fotográfica": "Sesiones fotográficas",
  "Otro evento": "Otros eventos",
};

export function PackageCatalog({ packages, compact = false }: { packages: PublicPackage[]; compact?: boolean }) {
  const [category, setCategory] = useState<Category>(packages.some((item) => item.line === "events") ? "events" : "content");
  const [selected, setSelected] = useState<string | null>(null);
  const eventType = EVENT_TYPES.find((event) => event === category);
  const events = packages.filter((item) => item.line === "events");
  const visible = compact ? packages : category === "content" ? packages.filter((item) => item.line === "content") :
    category === "events" ? events : events.filter((item) => eventTypeForCategory(item.category) === eventType);
  const choice = visible.find((item) => item.id === selected);
  const chosenType = eventType ?? (choice ? eventTypeForCategory(choice.category) : undefined);
  const general = eventType ? events.filter((item) => !eventTypeForCategory(item.category)) : [];
  const display = !compact && !visible.length && general.length ? general : visible;
  const selection = choice ?? display.find((item) => item.id === selected);

  function changeCategory(next: Category) {
    setCategory(next);
    setSelected(null);
  }

  return <section className={compact ? styles.compactCatalog : styles.catalog}>
    {!compact && <section aria-label="Tipos de evento" className={styles.categorySection}>
      <div className={styles.wizardHeading}><p>01 / Tu evento</p><h2>¿Qué tipo de evento estás organizando?</h2></div>
      <div className={styles.eventOptions}>
        {EVENT_TYPES.map((event) => {
          const count = events.filter((item) => eventTypeForCategory(item.category) === event).length;
          return <button type="button" key={event} aria-pressed={category === event} className={styles.eventOption} onClick={() => changeCategory(event)}>
            <span><strong>{categoryNames[event]}</strong><small>{count ? count + (count === 1 ? " paquete publicado" : " paquetes publicados") : "Consulta tu cobertura"}</small></span>
          </button>;
        })}
      </div>
      <div className={styles.linePicker}><button type="button" aria-pressed={category === "events"} onClick={() => changeCategory("events")}>Todos los paquetes de eventos</button>
        {packages.some((item) => item.line === "content") && <button type="button" aria-pressed={category === "content"} onClick={() => changeCategory("content")}>Contenido para negocios</button>}
      </div>
    </section>}

    {!compact && <div className={styles.wizardHeading}><p>02 / Tu cobertura</p><h2>{category === "content" ? "Paquetes para negocios" : "Elige tu cobertura"}</h2></div>}
    {!visible.length && <p className={styles.noPackages}>{display.length ? "Te mostramos coberturas generales. Consulta el alcance para tu evento." : "Puedes solicitar una cobertura personalizada para este evento."}</p>}
    <div className={styles.cards}>{display.map((item) => <article key={item.id} data-recommended={item.recommended}>
      {item.imageUrl ? <img src={item.imageUrl} alt="" loading="lazy" /> : <div className={styles.visual} data-line={item.line}><span>{item.line === "content" ? "Contenido" : "Eventos"}</span></div>}
      <div className={styles.cardBody}>
        {item.recommended && <strong>Recomendado</strong>}
        <small>{item.category}</small>
        <h3>{item.name}</h3>
        <p>{item.description}</p>
        {formatPackagePrice(item) && <b>{formatPackagePrice(item)}</b>}
        {item.deliverablesApproved && item.deliverables.length ? <ul>{item.deliverables.map((entry) => <li key={entry}>{entry}</li>)}</ul> : <em>Alcance y condiciones sujetos a confirmación.</em>}
        <button type="button" aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}>{selected === item.id ? "Seleccionado" : "Me interesa este paquete"}</button>
      </div>
    </article>)}</div>

    {(selection || (!compact && category !== "content")) && <aside className={styles.selection} aria-label="Continuar con la consulta">
      <div><span>03 / Consulta tu fecha</span><strong>{selection?.name ?? "Cobertura personalizada"}</strong><p>{chosenType ? categoryNames[chosenType] + " · " : ""}La consulta no confirma una reserva.</p></div>
      {selection?.line !== "content" && <Link href={inquiryHref({ eventType: chosenType, packageName: selection?.name })}>{selection ? "Consultar fecha" : "Quiero una cobertura personalizada"}</Link>}
      {selection && <WhatsAppLink placement="public_packages_fallback" eventName="click_whatsapp_package_selected" phone={publicSite.brand.whatsapp} message={contextualQuoteMessage(selection.name)} redirectAfterClick={false}>Continuar por WhatsApp</WhatsAppLink>}
    </aside>}
  </section>;
}
