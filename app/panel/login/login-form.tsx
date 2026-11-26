"use client";

import { useActionState } from "react";
import { panelLoginAction, type PanelLoginState } from "../actions";
import styles from "../panel.module.css";

const initialState: PanelLoginState = { error: null };

export function PanelLoginForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(panelLoginAction, initialState);
  return (
    <form action={action} className={styles.loginForm}>
      <label htmlFor="panel-email">Correo nominal</label>
      <input id="panel-email" name="email" type="email" autoComplete="username" required disabled={!configured || pending} />
      <label htmlFor="panel-password">Contraseña</label>
      <input id="panel-password" name="password" type="password" autoComplete="current-password" required disabled={!configured || pending} />
      {state.error ? <p className={styles.error} role="alert">{state.error}</p> : null}
      <button type="submit" disabled={!configured || pending}>{pending ? "Verificando…" : "Ingresar"}</button>
    </form>
  );
}
