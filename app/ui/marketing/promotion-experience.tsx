"use client";

import { useEffect, useRef, useState } from "react";
import type { Promotion } from "../../lib/commercial/promotions";
import styles from "./promotion.module.css";

export function PromotionExperience({ promotion }: { promotion: Promotion }) {
  const [open, setOpen] = useState(promotion.placement !== "modal");
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (promotion.placement !== "modal") return;
    const key = `crisdal-promo-${promotion.id}`;
    if (sessionStorage.getItem(key)) return;
    const show = () => {
      if (scrollY > innerHeight * 0.35) {
        sessionStorage.setItem(key, "shown"); setOpen(true); removeEventListener("scroll", show);
      }
    };
    addEventListener("scroll", show, { passive: true });
    return () => removeEventListener("scroll", show);
  }, [promotion]);
  useEffect(() => { if (open && promotion.placement === "modal") closeRef.current?.focus(); }, [open, promotion.placement]);
  if (!open) return null;
  const visibility = `${promotion.showMobile ? styles.showMobile : styles.hideMobile} ${promotion.showDesktop ? styles.showDesktop : styles.hideDesktop}`;
  const content = <><div><small>Consulta de evento</small><h2>{promotion.title}</h2><p>{promotion.description}</p></div><a href={promotion.destination} target="_blank" rel="noopener noreferrer">{promotion.ctaLabel}</a></>;
  return promotion.placement === "modal"
    ? <div className={`${styles.backdrop} ${visibility}`}><section role="dialog" aria-modal="true" aria-label={promotion.title} className={styles.modal}><button ref={closeRef} className={styles.close} onClick={() => setOpen(false)} aria-label="Cerrar promoción">Cerrar</button>{content}</section></div>
    : <section className={`${promotion.placement === "banner" ? styles.banner : styles.card} ${visibility}`}>{content}<button className={styles.close} onClick={() => setOpen(false)} aria-label="Cerrar promoción">Cerrar</button></section>;
}
