"use client";

import styles from "./panel.module.css";

export default function PanelError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className={styles.loginPage}><section className={styles.loginCard}><p className={styles.eyebrow}>CRISDAL OS</p><h1>No pudimos cargar esta vista</h1><p>La sesión o la conexión segura pueden requerir una nueva verificación.</p><button className={styles.retry} onClick={reset}>Intentar de nuevo</button></section></main>;
}
