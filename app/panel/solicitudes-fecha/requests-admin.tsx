"use client";
import { useCallback, useEffect, useState } from "react";
import styles from "./requests-admin.module.css";

type DateRequest = { id: string; requested_day: string; event_type: string; contact_name: string; contact_phone: string; city: string; message: string; state: "new" | "contacted" | "closed" | "spam"; created_at: string };
const STATES = { new: "Nueva", contacted: "Contactada", closed: "Cerrada", spam: "Descartada" } as const;

export function DateRequestsAdmin({ canWrite }: { canWrite: boolean }) {
  const [items, setItems] = useState<DateRequest[]>([]);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("all");
  const load = useCallback(async () => {
    const response = await fetch("/api/panel/date-requests", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "No se pudieron cargar las solicitudes.");
    setItems(data.items || []);
  }, []);
  useEffect(() => { let cancelled = false; void load().catch((error) => { if (!cancelled) setFailed(error instanceof Error ? error.message : "Sin conexión."); }); return () => { cancelled = true; }; }, [load]);
  async function changeState(id: string, state: DateRequest["state"]) {
    setPending(true); setFailed(""); setNotice("");
    try {
      const response = await fetch("/api/panel/date-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, state }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se actualizó la solicitud.");
      await load(); setNotice("Estado guardado y auditado.");
    } catch (error) { setFailed(error instanceof Error ? error.message : "No se pudo guardar."); }
    finally { setPending(false); }
  }
  const visible = items.filter((item)=>filter==="all"||item.state===filter);
  return <main className={styles.page}>
    <header className={styles.header}><div><p>CRISDAL OS · COMERCIAL</p><h1>Solicitudes de fechas</h1><span>Consultas recibidas. Ninguna equivale a una reserva confirmada.</span></div><a href="/consultar-fecha" target="_blank" rel="noopener noreferrer">Ver experiencia pública ↗</a></header>
    {failed && <div role="alert" className={styles.error}><strong>Atención</strong><p>{failed} Si no se aplicaron las migraciones, la bandeja permanecerá desactivada.</p></div>}
    {notice && <p role="status" className={styles.notice}>{notice}</p>}
    <div className={styles.toolbar}><label>Filtrar <select value={filter} onChange={(e)=>setFilter(e.target.value)}><option value="all">Todas las solicitudes</option>{Object.entries(STATES).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><button type="button" onClick={()=>void load().catch((error)=>setFailed(String(error)))}>Actualizar</button></div>
    <section className={styles.items} aria-label="Solicitudes privadas">{visible.map((item)=><article className={styles.card} key={item.id}>
      <div className={styles.meta}><span data-status={item.state}>{STATES[item.state]}</span><time>{item.requested_day}</time></div>
      <h2>{item.event_type}</h2><p><strong>{item.contact_name}</strong> · {item.city}</p><p className={styles.note}>{item.message || "Sin comentarios adicionales."}</p>
      <div className={styles.actions}><a href={`https://wa.me/${(() => { const digits=item.contact_phone.replace(/\D/g,"");return digits.length===9?`51${digits}`:digits; })()}`} target="_blank" rel="noopener noreferrer">Contactar por WhatsApp</a>{canWrite&&<select aria-label={`Cambiar estado de ${item.contact_name}`} disabled={pending} value={item.state} onChange={(e)=>void changeState(item.id,e.target.value as DateRequest["state"])}>{Object.entries(STATES).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select>}</div>
      <small>Recibida {new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}</small>
    </article>)}{!failed&&visible.length===0&&<div className={styles.empty}>No hay solicitudes en esta vista.</div>}</section>
  </main>;
}
