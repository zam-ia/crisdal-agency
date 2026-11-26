"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CommercialPackage, CommercialPackageInput } from "../../lib/commercial/packages";
import styles from "./package-admin.module.css";

type Filter = "Todos" | "Contenido" | "Fotografía" | "Bodas" | "Quinceaños" | "Eventos";
type ShareResult = { token: string; message: string; packages: CommercialPackage[] };

const emptyPackage: CommercialPackageInput = { slug: "", line: "content", category: "Contenido", name: "", description: "", imageUrl: null, priceMinor: null, currency: "PEN", priceVisibility: "consult", deliverables: [], deliverablesApproved: false, recommended: false, status: "draft", sortOrder: 0, internalNotes: "" };

async function request<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : undefined);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "No se pudo completar la operación.");
  return result as T;
}

function slugify(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120); }
function matchesFilter(item: CommercialPackage, filter: Filter) {
  if (filter === "Todos") return true;
  const source = `${item.line} ${item.category} ${item.name}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (filter === "Contenido") return item.line === "content";
  if (filter === "Fotografía") return source.includes("fotograf");
  if (filter === "Bodas") return source.includes("boda");
  if (filter === "Quinceaños") return source.includes("quince");
  return item.line === "events";
}

export function PackageAdmin({ canWrite }: { canWrite: boolean }) {
  const [packages, setPackages] = useState<CommercialPackage[]>([]);
  const [editor, setEditor] = useState<CommercialPackageInput | null>(null);
  const [notice, setNotice] = useState("");
  const [unavailable, setUnavailable] = useState("");
  const [busy, setBusy] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("Todos");
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("Hola, te comparto una selección de paquetes de Crisdal Agency. Revisa las opciones y conversemos por WhatsApp para confirmar alcance y disponibilidad.");
  const [share, setShare] = useState<ShareResult | null>(null);
  const load = useCallback(async () => { try { const result = await request<{ packages: CommercialPackage[] }>("/api/panel/packages"); setPackages(result.packages); setUnavailable(""); } catch (error) { setUnavailable(error instanceof Error ? error.message : "Módulo no disponible."); } }, []);
  useEffect(() => {
    let active = true;
    void request<{ packages: CommercialPackage[] }>("/api/panel/packages").then((result) => { if (active) { setPackages(result.packages); setUnavailable(""); } }).catch((error) => { if (active) setUnavailable(error instanceof Error ? error.message : "Módulo no disponible."); });
    return () => { active = false; };
  }, []);
  const filtered = useMemo(() => packages.filter((item) => matchesFilter(item, filter)), [packages, filter]);

  async function mutate(body: unknown, success: string) { setBusy(true); setNotice(""); try { await request("/api/panel/packages", body); setNotice(success); await load(); } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo guardar."); } finally { setBusy(false); } }
  async function save() { if (!editor) return; setBusy(true); setNotice(""); try { const result = await request<{ item: CommercialPackage }>("/api/panel/packages", { action: "save", item: editor }); setEditor(result.item); setNotice("Paquete guardado como borrador."); await load(); } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo guardar."); } finally { setBusy(false); } }
  async function createShare() { setBusy(true); setNotice(""); try { const result = await request<{ share: ShareResult }>("/api/panel/package-links", { packageIds: selected, message }); setShare(result.share); setNotice("Enlace privado listo para compartir."); } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo crear el enlace."); } finally { setBusy(false); } }
  const shareToken = share?.token || "";
  const shareUrl = shareToken && typeof window !== "undefined" ? `${window.location.origin}/paquetes/compartir/${shareToken}` : "";
  const shareText = shareUrl ? `${message}\n\n${shareUrl}` : message;

  return <main className={styles.page}>
    <header className={styles.header}><div><p>CRISDAL OS · COMERCIAL</p><h1>Paquetes</h1><span>Catálogo aprobado, precios controlados y enlaces privados para WhatsApp.</span></div><div>{canWrite ? <button type="button" onClick={() => setEditor({ ...emptyPackage, sortOrder: packages.length * 10 })}>Nuevo paquete</button> : null}<button type="button" className={styles.secondary} onClick={() => { setShareOpen(true); setShare(null); }}>Compartir selección</button></div></header>
    {unavailable ? <div className={styles.warning}><strong>Activación pendiente</strong><p>{unavailable} El módulo no simula persistencia ni publica datos ficticios.</p></div> : null}
    {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
    <section className={styles.list} aria-label="Paquetes administrables">{packages.map((item, index) => <article key={item.id}><div><span data-status={item.status}>{item.status}</span><small>{item.line === "content" ? "Contenido" : "Eventos"} · {item.category}</small><h2>{item.name}</h2><p>{item.priceVisibility === "public" && item.priceMinor !== null ? `S/ ${(item.priceMinor / 100).toLocaleString("es-PE")}` : item.priceVisibility === "consult" ? "Consultar precio" : "Precio oculto"}</p></div><div className={styles.rowActions}>{canWrite ? <><button type="button" onClick={() => setEditor({ ...item })}>Editar</button><button type="button" disabled={busy || index === 0} onClick={() => { const ids = packages.map((entry) => entry.id); [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]]; void mutate({ action: "reorder", ids }, "Orden actualizado."); }}>↑</button><button type="button" disabled={busy || index === packages.length - 1} onClick={() => { const ids = packages.map((entry) => entry.id); [ids[index + 1], ids[index]] = [ids[index], ids[index + 1]]; void mutate({ action: "reorder", ids }, "Orden actualizado."); }}>↓</button></> : null}<a href="/paquetes" target="_blank" rel="noopener noreferrer">Ver catálogo</a></div></article>)}{!unavailable && !packages.length ? <div className={styles.empty}><h2>Sin paquetes</h2><p>Crea el primero únicamente con información comercial aprobada.</p></div> : null}</section>

    {editor ? <section className={styles.modal} aria-label="Editor de paquete"><div className={styles.modalHead}><div><p>{editor.id ? "Editar paquete" : "Nuevo paquete"}</p><h2>{editor.name || "Paquete sin nombre"}</h2></div><button type="button" onClick={() => setEditor(null)}>Cerrar</button></div><div className={styles.grid}>
      <label>Nombre<input value={editor.name} onChange={(event) => setEditor({ ...editor, name: event.target.value, slug: editor.id ? editor.slug : slugify(event.target.value) })} /></label><label>Slug<input value={editor.slug} onChange={(event) => setEditor({ ...editor, slug: slugify(event.target.value) })} /></label>
      <label>Línea<select value={editor.line} onChange={(event) => setEditor({ ...editor, line: event.target.value as CommercialPackageInput["line"] })}><option value="content">Contenido para negocios</option><option value="events">Fotografía y video para eventos</option></select></label><label>Categoría<input value={editor.category} onChange={(event) => setEditor({ ...editor, category: event.target.value })} /></label>
      <label className={styles.wide}>Descripción<textarea value={editor.description} onChange={(event) => setEditor({ ...editor, description: event.target.value })} /></label><label>Imagen aprobada (URL)<input type="url" value={editor.imageUrl || ""} onChange={(event) => setEditor({ ...editor, imageUrl: event.target.value || null })} /></label>
      <label>Visibilidad del precio<select value={editor.priceVisibility} onChange={(event) => setEditor({ ...editor, priceVisibility: event.target.value as CommercialPackageInput["priceVisibility"] })}><option value="public">Mostrar precio</option><option value="consult">Consultar precio</option><option value="hidden">Ocultar precio</option></select></label><label>Precio en soles<input type="number" min="0" step="1" disabled={editor.priceVisibility !== "public"} value={editor.priceMinor === null ? "" : editor.priceMinor / 100} onChange={(event) => setEditor({ ...editor, priceMinor: event.target.value ? Math.round(Number(event.target.value) * 100) : null })} /></label>
      <label className={styles.wide}>Entregables aprobados, uno por línea<textarea value={editor.deliverables.join("\n")} onChange={(event) => setEditor({ ...editor, deliverables: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean) })} /></label><label className={styles.check}><input type="checkbox" checked={editor.deliverablesApproved} onChange={(event) => setEditor({ ...editor, deliverablesApproved: event.target.checked })} /> Entregables revisados y aprobados</label><label className={styles.check}><input type="checkbox" checked={editor.recommended} onChange={(event) => setEditor({ ...editor, recommended: event.target.checked })} /> Recomendado</label>
      <label className={styles.wide}>Notas internas (nunca se muestran en público)<textarea value={editor.internalNotes} onChange={(event) => setEditor({ ...editor, internalNotes: event.target.value })} /></label>
    </div><div className={styles.actions}><button type="button" disabled={busy || !canWrite} onClick={() => void save()}>Guardar borrador</button>{editor.id && canWrite ? <><button type="button" disabled={busy} onClick={() => void mutate({ action: "status", id: editor.id, status: "published" }, "Paquete publicado.")}>Publicar</button><button type="button" disabled={busy} onClick={() => void mutate({ action: "status", id: editor.id, status: "draft" }, "Paquete despublicado.")}>Despublicar</button><button type="button" disabled={busy} onClick={() => void mutate({ action: "status", id: editor.id, status: "archived" }, "Paquete archivado.")}>Archivar</button></> : null}</div></section> : null}

    {shareOpen ? <section className={styles.shareSheet} aria-label="Compartir paquetes"><div className={styles.modalHead}><div><p>SELECCIÓN COMERCIAL</p><h2>Compartir por WhatsApp</h2></div><button type="button" onClick={() => setShareOpen(false)}>Cerrar</button></div><div className={styles.filters}>{(["Todos","Contenido","Fotografía","Bodas","Quinceaños","Eventos"] as Filter[]).map((item) => <button type="button" aria-pressed={filter === item} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div><div className={styles.shareList}>{filtered.filter((item) => item.status === "published").map((item) => <label key={item.id}><input aria-label={`Seleccionar ${item.name}`} type="checkbox" checked={selected.includes(item.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} /><span><strong>{item.name}</strong><small>{item.category}</small></span></label>)}</div><label className={styles.message}>Mensaje editable<textarea value={message} onChange={(event) => setMessage(event.target.value)} /></label><button className={styles.generate} type="button" disabled={busy || !selected.length || message.trim().length < 20} onClick={() => void createShare()}>Generar enlace privado</button>{shareUrl ? <div className={styles.shareActions}><a href={`/paquetes/compartir/${shareToken}`} target="_blank" rel="noopener noreferrer">Vista previa</a><button type="button" onClick={() => void navigator.clipboard.writeText(shareText)}>Copiar</button><button type="button" onClick={() => void navigator.share?.({ title: "Paquetes Crisdal Agency", text: message, url: shareUrl })}>Compartir</button><a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a></div> : null}</section> : null}
  </main>;
}
