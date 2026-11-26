"use client";

import { useState } from "react";
import styles from "./portfolio.module.css";

export function ProjectShare({ title, url, collection = false }: { title: string; url: string; collection?: boolean }) {
  const [message, setMessage] = useState("");
  const [showUrl, setShowUrl] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Enlace copiado.");
      setShowUrl(false);
    } catch {
      setShowUrl(true);
      setMessage("No se pudo copiar automáticamente. Puedes copiar el enlace aquí.");
    }
  }
  async function share() {
    if (!navigator.share) return copy();
    try { await navigator.share({ title, url }); }
    catch (error) { if (!(error instanceof Error) || error.name !== "AbortError") await copy(); }
  }
  return <div className={styles.shareActions}>
    <button type="button" onClick={() => void share()}>{collection ? "Compartir portafolio" : "Compartir proyecto"}</button>
    <button type="button" onClick={() => void copy()}>Copiar enlace</button>
    <span className={styles.shareStatus} role="status">{message}</span>
    {showUrl ? <input className={styles.manualLink} aria-label="Enlace para compartir" readOnly value={url} onFocus={(event) => event.currentTarget.select()} /> : null}
  </div>;
}
