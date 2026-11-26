"use client";

import { useRef, useState } from "react";
import { calculateDraft } from "../../lib/os/quotes/draft";
import type { DraftDiscount, DraftLine } from "../../lib/os/quotes/draft";
import type { QuoteCurrency } from "../../lib/os/quotes/pricing";
import styles from "./quotes.module.css";

const money = (value: number, currency: QuoteCurrency) => {
  const integer = Math.trunc(value / 100);
  const fraction = String(value % 100).padStart(2, "0");
  return (currency === "PEN" ? "S/" : "US$") + " " + new Intl.NumberFormat("es-PE").format(integer) + "." + fraction;
};
const fields = [
  { key: "description", label: "Concepto", mode: "text", placeholder: "Ej. Cobertura audiovisual" },
  { key: "quantity", label: "Cantidad", mode: "numeric", placeholder: "1" },
  { key: "unit", label: "Precio unitario", mode: "decimal", placeholder: "0.00" },
  { key: "discount", label: "Descuento (%)", mode: "decimal", placeholder: "0" },
] as const;

export function QuoteEditor() {
  const sequence = useRef(0);
  const [currency, setCurrency] = useState<QuoteCurrency>("PEN");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [discount, setDiscount] = useState<DraftDiscount>({ kind: "none", value: "" });
  const [edited, setEdited] = useState<Record<string, boolean>>({});
  const { prices, errors, summaryError } = calculateDraft(currency, lines, discount);
  return (
    <div className={styles.screen}>
      <header className={styles.heading}>
        <span className={styles.tag}>CRISDAL OS / VENTAS</span>
        <h1>Cotizaciones</h1>
        <p>Arma una propuesta y revisa sus importes antes de cotizar.</p>
      </header>
      <p className={styles.notice}><strong>Borrador temporal.</strong> No se guarda ni se envía. El cálculo no incluye impuestos ni convierte monedas.</p>
      <div className={styles.layout}>
        <section className={styles.card} aria-labelledby="quote-items">
          <div className={styles.cardHeader}><div><h2 id="quote-items">Conceptos</h2><p>Agrega los servicios que incluirá la propuesta.</p></div>
            <label className={styles.field}>Moneda<select value={currency} onChange={(event) => setCurrency(event.target.value === "USD" ? "USD" : "PEN")}><option value="PEN">PEN · Soles</option><option value="USD">USD · Dólares</option></select></label>
          </div>
          {!lines.length && <p className={styles.empty}>Todavía no hay conceptos.</p>}
          {lines.map((line, index) => (
            <fieldset key={line.id} className={styles.line}>
              <legend>Concepto {index + 1}</legend>
              <div className={styles.fields}>
                {fields.map(({ key, label, mode, placeholder }) => {
                  const id = line.id + "-" + key;
                  const error = edited[id] ? errors[id] : undefined;
                  return <label className={styles.field} key={key}>{label}
                    <input value={line[key]} inputMode={mode} placeholder={placeholder} maxLength={key === "description" ? 120 : 20}
                      aria-invalid={error ? true : undefined} aria-describedby={error ? id + "-error" : undefined}
                      onChange={(event) => setLines(lines.map((current) => current.id === line.id ? { ...current, [key]: event.target.value } : current))}
                      onBlur={() => setEdited((current) => ({ ...current, [id]: true }))} />
                    {error && <small id={id + "-error"} className={styles.error}>{error}</small>}
                  </label>;
                })}
              </div>
              <div className={styles.lineFooter}>
                <span>{prices ? money(prices.lines[index].totalMinor, currency) : "Sin calcular"}</span>
                <button type="button" className={styles.remove} aria-label={"Quitar concepto " + (index + 1)} onClick={() => setLines(lines.filter((current) => current.id !== line.id))}>Quitar</button>
              </div>
            </fieldset>
          ))}
          <button type="button" className={styles.add} disabled={lines.length >= 200} onClick={() => {
            sequence.current += 1;
            setLines([...lines, { id: "quote-line-" + sequence.current, description: "", quantity: "1", unit: "", discount: "" }]);
          }}>+ Agregar concepto</button>
        </section>
        <aside className={styles.card} aria-labelledby="quote-totals">
          <h2 id="quote-totals">Resumen</h2>
          <div className={styles.adjustment}>
            <label className={styles.field}>Descuento general<select value={discount.kind} onChange={(event) => {
              const kind = event.target.value;
              setDiscount({ kind: kind === "fixed" || kind === "percent" ? kind : "none", value: "" });
            }}><option value="none">Sin descuento</option><option value="percent">Porcentaje</option><option value="fixed">Monto fijo</option></select></label>
            {discount.kind !== "none" && <label className={styles.field}>{discount.kind === "percent" ? "Porcentaje (%)" : "Monto (" + currency + ")"}
              <input inputMode="decimal" value={discount.value} placeholder="0.00" maxLength={20} aria-invalid={Boolean(discount.value && errors.general)} aria-describedby={discount.value && errors.general ? "quote-discount-error" : undefined} onChange={(event) => setDiscount({ ...discount, value: event.target.value })} />
              {discount.value && errors.general && <small id="quote-discount-error" className={styles.error}>{errors.general}</small>}
            </label>}
          </div>
          <div aria-live="polite" aria-atomic="true">
            {prices ? <dl className={styles.totals}>
              <div><dt>Subtotal</dt><dd>{money(prices.subtotalMinor, currency)}</dd></div>
              <div><dt>Descuento por conceptos</dt><dd>{money(prices.lineDiscountsMinor, currency)}</dd></div>
              <div><dt>Descuento general</dt><dd>{money(prices.globalDiscountMinor, currency)}</dd></div>
              <div className={styles.total}><dt>Total estimado</dt><dd>{money(prices.totalMinor, currency)}</dd></div>
            </dl> : <p className={summaryError ? styles.error : styles.empty}>{summaryError || (lines.length ? "Completa los conceptos y descuentos para calcular el total." : "Agrega un concepto para ver el total.")}</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
