"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { peruToday } from "../../lib/availability/public-calendar";
import {
  agendaCategoryLabels, agendaStatusLabels, agendaTime, dayOfItem, itemsForDay, monthBounds, monthCells, offsetMonth,
} from "../../lib/os/agenda-calendar";
import type { AgendaInput, AgendaItem } from "../../lib/os/agenda";
import { OsDialog } from "../../ui/os/os-dialog";
import styles from "./agenda.module.css";

const monthLabel = new Intl.DateTimeFormat("es-PE", { month: "long", year: "numeric", timeZone: "UTC" });
const fullDay = new Intl.DateTimeFormat("es-PE", { dateStyle: "full", timeZone: "UTC" });
const dateAtNoon = (day: string) => new Date(day + "T12:00:00Z");
const categories = Object.entries(agendaCategoryLabels) as [AgendaInput["category"], string][];
const statuses = Object.entries(agendaStatusLabels) as [AgendaInput["status"], string][];
const daysOfWeek = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

type Draft = Omit<AgendaInput, "startsAt" | "endsAt"> & { startsAt: string; endsAt: string };
const blank = (day: string): Draft => ({ title: "", category: "produccion", startsAt: day + "T09:00", endsAt: day + "T10:00", status: "pending", notes: "", projectId: null });
const asDraft = (item: AgendaItem): Draft => ({ ...item, startsAt: dayOfItem(item.startsAt) + "T" + agendaTime(item.startsAt), endsAt: dayOfItem(item.endsAt) + "T" + agendaTime(item.endsAt) });

export function AgendaClient({ initialDay, startCreating, canWrite, canReadProjects }: {
  initialDay: string;
  startCreating: boolean;
  canWrite: boolean;
  canReadProjects: boolean;
}) {
  const [selected, setSelected] = useState(initialDay);
  const [month, setMonth] = useState(initialDay.slice(0, 7));
  const [refresh, setRefresh] = useState(0);
  const [snapshot, setSnapshot] = useState<{ key: string; items: AgendaItem[]; error?: string } | null>(null);
  const [draft, setDraft] = useState<Draft | null>(() => startCreating ? blank(initialDay) : null);
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const requestInFlight = useRef(false);
  const key = month + ":" + refresh;
  const current = snapshot?.key === key ? snapshot : null;
  const today = peruToday();
  const cells = useMemo(() => monthCells(month), [month]);
  const index = useMemo(() => new Map(cells.flatMap((day) => day ? [[day, itemsForDay(current?.items ?? [], day)] as const] : [])), [cells, current]);
  const dayItems = index.get(selected) ?? [];

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams(monthBounds(month));
    void fetch("/api/panel/agenda?" + query, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok || !Array.isArray(body.items)) throw new Error("No se pudo leer la agenda.");
        setSnapshot({ key, items: body.items });
      }).catch((error) => {
        if (!controller.signal.aborted) setSnapshot({ key, items: [], error: error instanceof Error ? error.message : "Agenda no disponible." });
      });
    return () => controller.abort();
  }, [month, key]);

  function showDay(day: string) {
    setSelected(day);
    setMonth(day.slice(0, 7));
  }

  function open(editor: Draft) {
    setFormError("");
    setDraft(editor);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || !canWrite || requestInFlight.current) return;
    const startsAt = new Date(draft.startsAt + ":00-05:00");
    const endsAt = new Date(draft.endsAt + ":00-05:00");
    if (!Number.isFinite(+startsAt) || !Number.isFinite(+endsAt) || endsAt <= startsAt) {
      setFormError("La hora final debe ser posterior a la inicial.");
      return;
    }
    requestInFlight.current = true;
    setSaving(true);
    setFormError("");
    try {
      const response = await fetch("/api/panel/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, title: draft.title.trim(), startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "No se pudo guardar.");
      showDay(draft.startsAt.slice(0, 10));
      setDraft(null);
      setRefresh((current) => current + 1);
      setNotice("Actividad guardada.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo guardar.");
    } finally {
      requestInFlight.current = false;
      setSaving(false);
    }
  }

  return <div className={styles.page}>
    <header className={styles.header}>
      <div><p>{monthLabel.format(dateAtNoon(month + "-01"))}</p><h1>Agenda</h1></div>
      {canWrite && <button type="button" className={styles.primary} onClick={() => open(blank(selected))}>Agendar evento</button>}
    </header>
    {notice && <p role="status">{notice}</p>}
    <div className={styles.layout}>
      <section className={styles.month} aria-label="Calendario mensual" aria-busy={!current}>
        <div className={styles.monthToolbar}>
          <button type="button" aria-label="Mes anterior" onClick={() => showDay(offsetMonth(month, -1) + "-01")}>‹</button>
          <h2 aria-live="polite">{monthLabel.format(dateAtNoon(month + "-01"))}</h2>
          <button type="button" aria-label="Mes siguiente" onClick={() => showDay(offsetMonth(month, 1) + "-01")}>›</button>
        </div>
        <button type="button" className={styles.today} onClick={() => showDay(today)}>Hoy</button>
        <div className={styles.grid}>
          {daysOfWeek.map((day) => <span className={styles.weekday} key={day}>{day}</span>)}
          {cells.map((day, position) => {
            if (!day) return <div key={"espacio-" + position} aria-hidden="true" />;
            const activities = index.get(day) ?? [];
            const colors = [...new Set(activities.filter((item) => item.status !== "cancelled").map((item) => item.category))];
            return <button type="button" className={styles.day} key={day} aria-current={day === today ? "date" : undefined}
              aria-pressed={selected === day} aria-label={fullDay.format(dateAtNoon(day)) + (current?.error ? "" : " · " + activities.length + (activities.length === 1 ? " actividad" : " actividades"))}
              onClick={() => setSelected(day)}>
              <span>{Number(day.slice(-2))}</span>
              <span className={styles.dots} aria-hidden="true">{colors.map((color) => <span key={color} className={styles.dot} data-category={color} />)}</span>
            </button>;
          })}
        </div>
        <ul className={styles.legend} aria-label="Categorías de actividades">{categories.map(([category, label]) => <li key={category}><span aria-hidden="true" className={styles.dot} data-category={category} />{label}</li>)}</ul>
      </section>
      <section className={styles.detail} aria-label="Actividades del día">
        <h2>{fullDay.format(dateAtNoon(selected))}</h2>
        {!current ? <p role="status">Cargando actividades…</p> : current.error ? <><p role="alert">{current.error}</p><button type="button" onClick={() => setRefresh((current) => current + 1)}>Reintentar</button></> :
          dayItems.length === 0 ? <p>Sin actividades registradas para este día.</p> :
            dayItems.map((item) => <article className={styles.event} key={item.id}>
              <span className={styles.eventTime}>{agendaTime(item.startsAt)}–{agendaTime(item.endsAt)} · Lima</span>
              <h3>{item.title}</h3>
              <span className={styles.eventType}><span aria-hidden="true" className={styles.dot} data-category={item.category} />{agendaCategoryLabels[item.category]}</span>
              <span className={styles.status} data-status={item.status}>{agendaStatusLabels[item.status]}</span>
              {item.notes && <p>{item.notes}</p>}
              <div className={styles.links}>
                {canWrite && <button type="button" onClick={() => open(asDraft(item))}>Editar actividad</button>}
                {canReadProjects && item.projectId && <Link href="/panel/produccion">Ir a producción</Link>}
              </div>
            </article>)}
        {canWrite && current && !current.error && <button type="button" className={styles.primary} onClick={() => open(blank(selected))}>Agendar en esta fecha</button>}
      </section>
    </div>
    <OsDialog open={Boolean(draft)} locked={saving} onClose={() => { if (!requestInFlight.current) setDraft(null); }} title={draft?.id ? "Editar actividad" : "Agendar actividad"}>
      {draft && <form onSubmit={save}>
        <fieldset className={styles.form} disabled={saving}>
          <label>Título<input required minLength={3} maxLength={180} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
          <label>Categoría<select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as Draft["category"] })}>{categories.map(([key, value]) => <option value={key} key={key}>{value}</option>)}</select></label>
          <label>Inicio · Lima<input required type="datetime-local" value={draft.startsAt} onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })} /></label>
          <label>Fin · Lima<input required type="datetime-local" value={draft.endsAt} onChange={(event) => setDraft({ ...draft, endsAt: event.target.value })} /></label>
          <label>Estado<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Draft["status"] })}>{statuses.map(([key, value]) => <option value={key} key={key}>{value}</option>)}</select></label>
          <label className={styles.full}>Notas<textarea maxLength={2000} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></label>
          {formError && <p role="alert" className={styles.formError}>{formError}</p>}
          <button type="submit" className={styles.primary}>{saving ? "Guardando…" : "Guardar actividad"}</button>
        </fieldset>
      </form>}
    </OsDialog>
  </div>;
}
