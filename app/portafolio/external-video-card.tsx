"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { parseExternalVideoUrl, type PortfolioMedia } from "../lib/commercial/portfolio";
import styles from "./portfolio-interactive.module.css";
const labels={youtube:"YouTube",vimeo:"Vimeo",tiktok:"TikTok",facebook:"Facebook",instagram:"Instagram"} as const;

function trustedPoster(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".supabase.co") ? value : null;
  } catch { return null; }
}

export function ExternalVideoCard({media}:{media:PortfolioMedia}){
  const[authorized,setAuthorized]=useState(false);
  const info=parseExternalVideoUrl(media.url);
  if(!info)return <a className={styles.externalFallback} href={media.url} target="_blank" rel="noopener noreferrer">Abrir publicación original</a>;
  const label=labels[info.provider];
  const canEmbed=media.embedMode!=="external"&&Boolean(info.embedUrl);
  const poster=trustedPoster(media.posterUrl);
  return <article className={styles.videoCard} data-orientation={media.orientation} data-provider={info.provider}>
    {authorized&&canEmbed?<div className={styles.embedFrame}><iframe src={info.embedUrl!} title={media.title||media.alt} loading="lazy" sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation" referrerPolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen/><a href={info.canonicalUrl} target="_blank" rel="noopener noreferrer">Abrir original en {label}</a></div>:<>{poster?<img src={poster} alt="" loading="lazy"/>:<div className={styles.videoPoster}><span>{label}</span><small>{info.contentType === "reel" ? "Reel" : info.kind === "social" ? "Publicación" : "Video"}</small></div>}<div className={styles.videoOverlay}><strong>{media.title||media.alt}</strong>{canEmbed?<><p>Al continuar se cargará contenido y medición de {label}. No se reproduce ni activa sonido automáticamente.</p><button type="button" onClick={()=>setAuthorized(true)}>Cargar desde {label}</button></>:<p>Esta publicación se abre en {label}; su disponibilidad depende de la plataforma.</p>}<a href={info.canonicalUrl} target="_blank" rel="noopener noreferrer">Ver original en {label}</a></div></>}
  </article>;
}
