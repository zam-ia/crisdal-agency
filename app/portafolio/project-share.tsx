"use client";

import { useState } from "react";
import styles from "./portfolio.module.css";

export function ProjectShare({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);
  function url() { return new URL(path, window.location.origin).toString(); }
  const message = () => `Hola, te comparto uno de nuestros trabajos de fotografía y producción audiovisual en Crisdal Agency: ${title}. Puedes verlo aquí: ${url()}`;
  async function share() { if (navigator.share) { await navigator.share({ title, text: message(), url: url() }); return; } await navigator.clipboard.writeText(url()); setCopied(true); }
  async function copy() { await navigator.clipboard.writeText(url()); setCopied(true); }
  return <div className={styles.shareActions}>
    <button type="button" onClick={() => void share()}>Compartir proyecto</button>
    <a href={`https://wa.me/?text=${encodeURIComponent(message())}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
    <button type="button" onClick={() => void copy()}>{copied ? "Enlace copiado" : "Copiar enlace"}</button>
  </div>;
}
