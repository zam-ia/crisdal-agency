"use client";
import { useEffect, useMemo, useState } from "react";
import { monthDates, monthShift, peruToday, withinPublicHorizon } from "../../lib/availability/public-calendar";
import styles from "./availability-admin.module.css";
type AdminDay = { day: string; status: "available" | "unavailable"; verified_until: string; source: string };
const monthLabel = (month: string) => new Intl.DateTimeFormat("es-PE", { timeZone: "UTC", month: "long", year: "numeric" }).format(new Date(`${month}-01T12:00:00Z`));

export function PublicAvailabilityAdmin() {
  const today = peruToday();
  const [month, setMonth] = useState(today.slice(0,7));
  const [days, setDays] = useState<AdminDay[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<"available" | "clear">("clear");
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const lookup = useMemo(() => new Map(days.map((d)=>[d.day,d])), [days]);
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/panel/public-availability?month=${month}`, { cache: "no-store", signal: controller.signal })
      .then(async (res) => { const body = await res.json(); if(!res.ok)throw new Error(body.error||"Error de conexión");return body; })
      .then((body)=>{if(!controller.signal.aborted)setDays(body.days||[]);})
      .catch((e)=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Error de conexión");});
    return ()=>controller.abort();
  },[month]);

  function changeMonth(direction:-1|1){const next=monthShift(month,direction);setNotice("");setError("");setDays([]);setSelected(null);setAcknowledged(false);setMonth(next);}

  function choose(day:string){const record=lookup.get(day);setSelected(day);setAcknowledged(false);setNotice("");setStatus(record?.status==="available"&&new Date(record.verified_until)>new Date()?"available":"clear");}
  async function save(){if(!selected||!acknowledged)return;setBusy(true);setError("");setNotice("");try{
    const response=await fetch("/api/panel/public-availability",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({day:selected,status,acknowledged})});
    const result=await response.json();if(!response.ok)throw new Error(result.error||"No se guardó.");
    const refreshed=await fetch(`/api/panel/public-availability?month=${month}`,{cache:"no-store"});
    const data=await refreshed.json();if(!refreshed.ok)throw new Error(data.error||"Error al verificar guardado.");
    setDays(data.days||[]);setNotice("Cambio guardado. La disponibilidad pública caducará en 12 horas si no se vuelve a verificar.");setAcknowledged(false);
  }catch(e){setError(e instanceof Error?e.message:"No se pudo guardar.");}finally{setBusy(false);}}
  return <div className={styles.page}><header><p>CRISDAL OS · CALENDARIO COMERCIAL</p><h1>Disponibilidad pública</h1><span>Publica solamente el estado general de una fecha, sin nombres de clientes ni datos internos.</span></header>
    <div className={styles.notice}><strong>Agenda como fuente única</strong><p>Las actividades confirmadas bloquean automáticamente sus fechas. Aquí solo verificas una fecha como disponible durante 12 horas o la dejas en “Consultar”. Una solicitud no confirma reserva.</p></div>
    {error&&<div role="alert" className={styles.error}>{error}</div>}{notice&&<div role="status" className={styles.success}>{notice}</div>}
    <section className={styles.panel}><div className={styles.month}><h2>{monthLabel(month)}</h2><div><button type="button" aria-label="Mes anterior" onClick={()=>changeMonth(-1)} disabled={!withinPublicHorizon(monthShift(month,-1),today)}>‹</button><button type="button" aria-label="Mes siguiente" onClick={()=>changeMonth(1)} disabled={!withinPublicHorizon(monthShift(month,1),today)}>›</button></div></div>
      <div className={styles.days}>{monthDates(month).map((day)=>{const item=lookup.get(day);const fresh=item&&new Date(item.verified_until)>new Date();const label=fresh?item!.status:"inquiry";return <button key={day} type="button" data-status={label} data-selected={selected===day} onClick={()=>choose(day)} disabled={day<today} aria-label={`${day}: ${label}`}><span>{Number(day.slice(-2))}</span><small>{label==="available"?"Disponible":label==="unavailable"?"Ocupado":"Consultar"}</small></button>;})}</div>
      {selected?<div className={styles.editor}><h3>Fecha: {selected}</h3>{lookup.get(selected)?.source==="agenda"?<p>Esta fecha está bloqueada por una actividad confirmada. Para liberarla, cancela o modifica esa actividad desde Agenda.</p>:<><p>Confirma el estado con información real de la agenda y disponibilidad de personal y equipo.</p><label>Estado público<select value={status} onChange={(e)=>{setStatus(e.target.value as typeof status);setAcknowledged(false);}}><option value="clear">Consultar (sin confirmación)</option><option value="available">Disponible (verificado)</option></select></label><label className={styles.check}><input type="checkbox" checked={acknowledged} onChange={(e)=>setAcknowledged(e.target.checked)} /> He verificado este día con la agenda y los recursos reales de Crisdal. Comprendo que el estado caducará y no confirma reservas automáticamente.</label><button type="button" onClick={()=>void save()} disabled={!acknowledged||busy}>{busy?"Guardando…":"Publicar estado"}</button></>}</div>:<p className={styles.hint}>Selecciona un día para verificar el estado público.</p>}
    </section>
  </div>;
}
