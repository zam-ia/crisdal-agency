import type { ReactNode } from "react";
import type { OsSession } from "../../lib/os/auth-types";
import { hasCapability, ROLE_LABELS } from "../../lib/os/capabilities";
import { panelLogoutAction } from "../../panel/actions";
import { AppShell, type OsNavigationItem } from "./app-shell";
import styles from "./panel-shell.module.css";

export function PanelShell({
  session,
  currentPath,
  children,
}: {
  session: OsSession;
  currentPath: string;
  children: ReactNode;
}) {
  const navigation: OsNavigationItem[] = [
    { href: "/panel", label: "Inicio", active: currentPath === "/panel" },
    ...(hasCapability(session.capabilities, "portfolio.manage")
      ? [{ href: "/panel/portafolio", label: "Portafolio", active: currentPath === "/panel/portafolio" }]
      : []),
    ...(hasCapability(session.capabilities, "packages.read")
      ? [{ href: "/panel/paquetes", label: "Paquetes", active: currentPath === "/panel/paquetes" }]
      : []),
    ...(hasCapability(session.capabilities, "users.manage")
      ? [{ href: "/panel/usuarios", label: "Usuarios", active: currentPath === "/panel/usuarios" }]
      : []),
    {
      href: "/panel/configuracion",
      label: "Configuración",
      active: currentPath === "/panel/configuracion",
    },
  ];

  return (
    <AppShell navigation={navigation}>
      <header className={styles.topbar}>
        <div>
          <strong>{session.displayName}</strong>
          <span>{ROLE_LABELS[session.role]}</span>
        </div>
        <form action={panelLogoutAction}>
          <button type="submit">Cerrar sesión</button>
        </form>
      </header>
      {children}
    </AppShell>
  );
}
