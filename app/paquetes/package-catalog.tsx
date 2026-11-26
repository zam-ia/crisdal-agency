"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import {inquiryHref} from "../lib/availability/inquiry-context";
import { useMemo,useState } from "react";
import { contextualQuoteMessage,formatPackagePrice,type PublicPackage } from "../lib/commercial/packages";
import styles from "./packages.module.css";
import { publicSite } from "../lib/public-site-content";
import { WhatsAppLink } from "../ui/whatsapp-link";
export function PackageCatalog({packages,compact=false}:{packages:PublicPackage[];compact?:boolean}){const[line,setLine]=useState<"all"|"content"|"events">(packages.some((item)=>item.line==="events")?"events":"all");const[selected,setSelected]=useState<string|null>(null);const visible=useMemo(()=>line==="all"?packages:packages.filter((item)=>item.line===line),[line,packages]);const choice=visible.find((item)=>item.id===selected);return <section className={compact?styles.compactCatalog:styles.catalog}>
  {!compact?<div className={styles.steps}><span>1 · Elige una línea</span><span>2 · Explora paquetes</span><span>3 · Consulta tu fecha o escríbenos</span></div>:null}
  {!compact?<div className={styles.linePicker}><button aria-pressed={line==="events"} type="button" onClick={()=>{setLine("events");setSelected(null);}}>Eventos</button><button aria-pressed={line==="all"} type="button" onClick={()=>{setLine("all");setSelected(null);}}>Todas las opciones</button><button aria-pressed={line==="content"} type="button" onClick={()=>{setLine("content");setSelected(null);}}>Contenido para negocios</button></div>:null}
  {!visible.length?<p className={styles.noPackages}>No hay paquetes publicados para esta categoría. Puedes consultar una cobertura personalizada.</p>:null}
  <div className={styles.cards}>{visible.map((item)=><article key={item.id} data-recommended={item.recommended}>{item.imageUrl?<img src={item.imageUrl} alt="" loading="lazy"/>:<div className={styles.visual} data-line={item.line}><span>{item.line==="content"?"Contenido":"Eventos"}</span></div>}<div className={styles.cardBody}>{item.recommended?<strong>Recomendado</strong>:null}<small>{item.category}</small><h2>{item.name}</h2><p>{item.description}</p>{formatPackagePrice(item)?<b>{formatPackagePrice(item)}</b>:null}{item.deliverablesApproved&&item.deliverables.length?<ul>{item.deliverables.map((entry)=><li key={entry}>{entry}</li>)}</ul>:<em>Alcance y condiciones sujetos a confirmación.</em>}<button type="button" aria-pressed={selected===item.id} onClick={()=>setSelected(item.id)}>{selected===item.id?"Seleccionado":"Me interesa este paquete"}</button></div></article>)}</div>
  {choice?<aside className={styles.selection}><div><span>Paquete seleccionado</span><strong>{choice.name}</strong><p>Elige cómo continuar. La consulta no confirma disponibilidad ni reserva.</p></div>{choice.line==="events"&&<Link href={inquiryHref({packageName:choice.name})}>Consultar fecha</Link>}<WhatsAppLink placement="public_packages_fallback" eventName="click_whatsapp_package_selected" phone={publicSite.brand.whatsapp} message={contextualQuoteMessage(choice.name)} redirectAfterClick={false}>Continuar por WhatsApp</WhatsAppLink></aside>:null}
 </section>;}
