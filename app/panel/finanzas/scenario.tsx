"use client";

import { useState } from "react";
import { emptyScenario, formatScenarioMoney, simulateFinance } from "../../lib/os/finance/scenario";
import type { FinanceCurrency } from "../../lib/os/finance/ledger";
import type { ScenarioField } from "../../lib/os/finance/scenario";
import styles from "./scenario.module.css";

const fields: [ScenarioField, string, string][] = [
  ["due", "Importe total por cobrar", "Monto acordado para un servicio."],
  ["collected", "Cobros", "Pagos del escenario, incluidos anticipos."],
  ["refunded", "Devoluciones", "Montos devueltos de esos cobros."],
  ["expenses", "Gastos pagados", "Egresos asociados al servicio."],
];
const statuses = { paid: "Sin saldo pendiente", partial: "Parcialmente cobrado", unpaid: "Pendiente de cobro" };

export function FinanceScenario() {
  const [currency, setCurrency] = useState<FinanceCurrency>("PEN");
  const [input, setInput] = useState(emptyScenario);
  const { result, errors } = simulateFinance(currency, input);
  return (
    <div className={styles.screen}>
      <header className={styles.heading}>
        <p className={styles.kicker}>CRISDAL OS / FINANZAS</p>
        <h1>Simulador de cobros y caja</h1>
        <p>Calcula cuánto queda por cobrar y cómo afectarían a caja los movimientos de un servicio.</p>
      </header>
      <p className={styles.notice}><strong>Solo simulación.</strong> No carga ni guarda movimientos reales. El efecto en caja no es utilidad contable.</p>
      <div className={styles.layout}>
        <section className={styles.card} aria-labelledby="scenario-data">
          <h2 id="scenario-data">Datos del escenario</h2>
          <label className={styles.field}>Moneda
            <select value={currency} onChange={(e) => {
              setCurrency(e.target.value === "USD" ? "USD" : "PEN");
              setInput(emptyScenario);
            }}><option value="PEN">Soles · PEN</option><option value="USD">Dólares · USD</option></select>
            <small>Cambiar de moneda limpia el escenario. No se aplican conversiones.</small>
          </label>
          <div className={styles.fields}>
            {fields.map(([key, label, hint]) => (
              <div className={styles.field} key={key}>
                <label htmlFor={"sim-" + key}>{label}</label>
                <input id={"sim-" + key} value={input[key]} autoComplete="off" inputMode="decimal" maxLength={20} placeholder="0.00"
                  aria-describedby={"sim-hint-" + key + (errors[key] ? " sim-error-" + key : "")} aria-invalid={errors[key] ? true : undefined}
                  onChange={(e) => setInput({ ...input, [key]: e.target.value })} />
                <small id={"sim-hint-" + key}>{hint}</small>
                {errors[key] && <small className={styles.error} id={"sim-error-" + key}>{errors[key]}</small>}
              </div>
            ))}
          </div>
          <button className={styles.reset} type="button" disabled={!Object.values(input).some(Boolean)} onClick={() => setInput(emptyScenario)}>Limpiar escenario</button>
        </section>
        <section className={styles.card} aria-labelledby="scenario-results">
          <h2 id="scenario-results">Resultado estimado</h2>
          <div aria-live="polite" aria-atomic="true">
            {result ? <>
              <p className={styles.badge}>{statuses[result.status]}</p>
              <dl className={styles.totals}>
                <div><dt>Cobrado neto</dt><dd>{formatScenarioMoney(result.netReceivedMinor, currency)}</dd></div>
                <div><dt>Saldo pendiente</dt><dd>{formatScenarioMoney(result.pendingMinor, currency)}</dd></div>
                <div className={styles.net}><dt>Efecto en caja</dt><dd>{formatScenarioMoney(result.cashEffectMinor, currency)}</dd></div>
              </dl>
              <p className={styles.hint}>Cobros menos devoluciones y gastos. El saldo pendiente no cuenta como efectivo.</p>
            </> : <p className={styles.empty}>{Object.keys(errors).length ? "Corrige los importes marcados para ver el resultado." : "Ingresa el importe por cobrar para empezar."}</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
