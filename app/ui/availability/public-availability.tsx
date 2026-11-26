"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  EVENT_TYPES, monthShift, peruToday, statusText, withinPublicHorizon,
  type EventType, type PublicDateStatus, type PublicMonth,
} from "../../lib/availability/public-calendar";
import { inquiryWhatsAppUrl, validateInquiry } from "../../lib/availability/inquiry";
import { WhatsAppLink } from "../whatsapp-link";
import styles from "./public-availability.module.css";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
const dateLabel = (day: string) => new Intl.DateTimeFormat("es-PE", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${day}T12:00:00Z`));
const monthLabel = (month: string) => new Intl.DateTimeFormat("es-PE", { timeZone: "UTC", month: "long", year: "numeric" }).format(new Date(`${month}-01T12:00:00Z`));
const initialForm = { eventType: "Boda" as EventType, contactName: "", contactPhone: "", city: "", message: "", consent: false, website: "" };

type FormError = Record<string,string>;

export function PublicAvailabilityExperience() {
  const today = peruToday();
  const startMonth = today.slice(0,7);
  const [month, setMonth] = useState(startMonth);
  const [loaded, setLoaded] = useState<PublicMonth | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<FormError>({});
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ reference: string; message: string } | null>(null);
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    const abort = new AbortController();
    void fetch(`/api/public/availability?month=${encodeURIComponent(month)}`, { signal: abort.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("No se pudo consultar disponibilidad.");
        return response.json() as Promise<PublicMonth>;
      })
      .then((value) => { if (!abort.signal.aborted) setLoaded(value); })
      .catch(() => { if (!abort.signal.aborted) setFailed(true); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [month]);

  const dayMap = useMemo(() => new Map(loaded?.month === month ? loaded.days.map((item) => [item.day, item.status] as const) : []), [loaded, month]);
  const dayCount = new Date(Date.UTC(Number(month.slice(0,4)), Number(month.slice(5,7)), 0)).getUTCDate();
  const firstWeekday = (new Date(`${month}-01T12:00:00Z`).getUTCDay() + 6) % 7;
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: dayCount }, (_, i) => `${month}-${String(i+1).padStart(2,"0")}` as string)];
  const selectedStatus: PublicDateStatus = selected && dayMap.get(selected) ? dayMap.get(selected)! : "inquiry";
  const selectedEditable = Boolean(selected && selectedStatus !== "past" && selectedStatus !== "unavailable");
  const fields = { ...form, preferredDay: selected || "" };
  const validForm = selectedEditable && validateInquiry(fields, today).ok;
  const waUrl = selected ? inquiryWhatsAppUrl(fields) : null;

  const changeMonth = (direction: -1 | 1) => {
    const next = monthShift(month, direction);
    if (withinPublicHorizon(next, today)) {
      setLoading(true); setFailed(false); setLoaded(null); setSelected(null); setResult(null);
      setMonth(next);
    }
  };
  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => { const next = { ...current }; delete next[key]; return next; });
    setRequestError("");
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateInquiry(fields, peruToday());
    if (!selectedEditable || !validation.ok) {
      setErrors(validation.ok ? { preferredDay: "Selecciona otra fecha." } : validation.errors);
      return;
    }
    setSending(true); setRequestError(""); setErrors({});
    try {
      const response = await fetch("/api/public/date-requests", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.value), cache: "no-store",
      });
      const data: { reference?: string; message?: string; error?: string; errors?: FormError } = await response.json();
      if (!response.ok || !data.reference) {
        setErrors(data.errors || {});
        throw new Error(data.error || "La solicitud no pudo guardarse.");
      }
      setResult({ reference: data.reference, message: data.message || "Solicitud recibida; fecha no reservada." });
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "No pudimos registrar la consulta. Usa WhatsApp como alternativa.");
    } finally { setSending(false); }
  }

  return <section className={styles.stage} aria-labelledby="availability-title">
    <div className={styles.ambient} aria-hidden="true" />
    <header className={styles.heading}>
      <div><span className={styles.kicker}>CRISDAL · DISPONIBILIDAD</span><h1 id="availability-title">Elige una fecha. <em>Lo demás lo hacemos juntos.</em></h1></div>
      <p>Revisa el calendario y cuéntanos sobre tu evento. Una consulta no bloquea ni confirma la fecha.</p>
    </header>
    <div className={styles.columns}>
      <div className={styles.calendarCard}>
        <div className={styles.calendarHeader}>
          <div><span className={styles.overline}>Calendario de eventos</span><h2>{monthLabel(month)}</h2></div>
          <div className={styles.monthActions}>
            <button type="button" onClick={() => changeMonth(-1)} disabled={!withinPublicHorizon(monthShift(month,-1),today)} aria-label="Mes anterior">‹</button>
            <button type="button" onClick={() => changeMonth(1)} disabled={!withinPublicHorizon(monthShift(month,1),today)} aria-label="Mes siguiente">›</button>
          </div>
        </div>
        <div className={styles.weekdays} aria-hidden="true">{WEEKDAYS.map((name,index)=><span key={index}>{name}</span>)}</div>
        <div className={styles.days} aria-label={`Fechas de ${monthLabel(month)}`}>
          {cells.map((day,index) => {
            if (!day) return <span aria-hidden="true" key={`empty-${index}`} />;
            const status = day < today ? "past" : dayMap.get(day) || "inquiry";
            const active = selected === day;
            return <button type="button" key={day} className={styles.day} data-status={status} data-selected={active} disabled={status === "past" || status === "unavailable" || loading} aria-pressed={active} aria-label={`${dateLabel(day)}: ${statusText(status)}`} onClick={() => { setSelected(day); setResult(null); setRequestError(""); }}>
              <span>{Number(day.slice(-2))}</span><i aria-hidden="true" />
            </button>;
          })}
        </div>
        {loading ? <p className={styles.availabilityNotice} role="status">Consultando disponibilidad…</p> : failed || loaded?.source === "unavailable" ? <p className={styles.availabilityNotice}>No podemos verificar el calendario ahora. Puedes seleccionar una fecha y consultarla.</p> : <p className={styles.availabilityNotice}>Disponibilidad sujeta a confirmación del equipo. Puede cambiar antes de contratar.</p>}
        <div className={styles.legend} aria-label="Leyenda"><span><i data-dot="available" /> Disponible</span><span><i data-dot="unavailable" /> Sin disponibilidad</span><span><i data-dot="inquiry" /> Consultar</span></div>
      </div>
      <div className={styles.inquiryCard}>
        <div className={styles.cardTop}><span className={styles.overline}>Tu evento comienza aquí</span><span className={styles.step}>02 / 02</span></div>
        <h2>Cuéntanos <em>tu idea.</em></h2>
        <p className={styles.summary}>{selected ? `${dateLabel(selected)} · ${statusText(selectedStatus)}` : "Selecciona un día del calendario para comenzar."}</p>
        {result ? <div className={styles.success} role="status"><strong>Solicitud recibida</strong><p>{result.message}</p><small>Referencia: {result.reference}</small><p>Esta solicitud no constituye una reserva ni un pago.</p></div> : <form onSubmit={(event) => void submit(event)} noValidate>
          <div className={styles.formRow}><label>Tipo de evento<select value={form.eventType} onChange={(event) => update("eventType",event.target.value as EventType)}>{EVENT_TYPES.map((type)=><option key={type}>{type}</option>)}</select></label></div>
          <div className={styles.formRow}><label>Tu nombre<input autoComplete="name" placeholder="¿Cómo te llamas?" value={form.contactName} maxLength={120} onChange={(event)=>update("contactName", event.target.value)} required /></label>{errors.contactName?<small role="alert">{errors.contactName}</small>:null}</div>
          <div className={styles.formTwo}><div className={styles.formRow}><label>WhatsApp<input autoComplete="tel" inputMode="tel" placeholder="987 654 321" value={form.contactPhone} maxLength={32} onChange={(event)=>update("contactPhone",event.target.value)} required /></label>{errors.contactPhone?<small role="alert">{errors.contactPhone}</small>:null}</div><div className={styles.formRow}><label>Ciudad del evento<input autoComplete="address-level2" placeholder="Huancayo, Lima…" value={form.city} maxLength={120} onChange={(event)=>update("city",event.target.value)} required /></label>{errors.city?<small role="alert">{errors.city}</small>:null}</div></div>
          <div className={styles.formRow}><label>Detalles opcionales<textarea rows={3} placeholder="¿Qué te gustaría conservar de ese día?" value={form.message} maxLength={1000} onChange={(event)=>update("message",event.target.value)} /></label>{errors.message?<small role="alert">{errors.message}</small>:null}</div>
          <label className={styles.consent}><input type="checkbox" checked={form.consent} onChange={(event)=>update("consent",event.target.checked)} /><span>Autorizo que Crisdal use estos datos solo para responder mi solicitud de información.</span></label>
          {errors.consent?<small className={styles.error} role="alert">{errors.consent}</small>:null}
          {errors.preferredDay?<small className={styles.error} role="alert">{errors.preferredDay}</small>:null}
          <label className={styles.honeypot} aria-hidden="true">Dejar vacío<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(event)=>update("website",event.target.value)} /></label>
          {requestError ? <p className={styles.error} role="alert">{requestError} No se ha registrado tu solicitud.</p> : null}
          <button type="submit" className={styles.primary} disabled={sending || !validForm}>{sending ? "Registrando solicitud…" : "Solicitar esta fecha"}<span aria-hidden="true">↗</span></button>
          {waUrl ? <WhatsAppLink className={styles.secondary} placement="public_date_fallback" customHref={waUrl} redirectAfterClick={false}>Prefiero consultar por WhatsApp</WhatsAppLink> : <p className={styles.subtle}>Primero selecciona una fecha para continuar.</p>}
          <p className={styles.privacy}>Sin pagos ni reserva automática. Te contactamos para confirmar disponibilidad, cobertura y condiciones.</p>
        </form>}
      </div>
    </div>
  </section>;
}
