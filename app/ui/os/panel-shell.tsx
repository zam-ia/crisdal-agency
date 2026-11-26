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
    ...(hasCapability(session.capabilities, "calendar.read")
      ? [
          { href: "/panel/agenda", label: "Agenda", active: currentPath === "/panel/agenda" },
          { href: "/panel/solicitudes-fecha", label: "Solicitudes", active: currentPath === "/panel/solicitudes-fecha" },
          { href: "/panel/disponibilidad-publica", label: "Disponibilidad", active: currentPath === "/panel/disponibilidad-publica" },
        ]
      : []),
    ...(hasCapability(session.capabilities, "clients.read")
      ? [{ href: "/panel/clientes", label: "Clientes", active: currentPath === "/panel/clientes" }]
      : []),
    ...(hasCapability(session.capabilities, "quotes.manage")
      ? [{ href: "/panel/cotizaciones", label: "Cotizaciones", active: currentPath === "/panel/cotizaciones" }]
      : []),
    ...(hasCapability(session.capabilities, "projects.read")
      ? [{ href: "/panel/produccion", label: "Producción", active: currentPath === "/panel/produccion" }]
      : []),
    ...(hasCapability(session.capabilities, "projects.write")
      ? [{ href: "/panel/entregas", label: "Entregas", active: currentPath === "/panel/entregas" }]
      : []),
    ...(hasCapability(session.capabilities, "finance.read")
      ? [{ href: "/panel/finanzas", label: "Finanzas", active: currentPath === "/panel/finanzas" },{ href: "/panel/indicadores", label: "Indicadores", active: currentPath === "/panel/indicadores" }]
      : []),
    ...(hasCapability(session.capabilities, "portfolio.manage")
      ? [{ href: "/panel/portafolio", label: "Portafolio", active: currentPath === "/panel/portafolio" }]
      : []),
    ...(hasCapability(session.capabilities, "packages.read")
      ? [{ href: "/panel/paquetes", label: "Paquetes", active: currentPath === "/panel/paquetes" }]
      : []),
    ...(hasCapability(session.capabilities, "promotions.manage")
      ? [{ href: "/panel/promociones", label: "Promociones", active: currentPath === "/panel/promociones" }]
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
