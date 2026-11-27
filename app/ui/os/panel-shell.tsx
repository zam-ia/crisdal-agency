import type { ReactNode } from "react";
import type { OsSession } from "../../lib/os/auth-types";
import { ROLE_LABELS, type Capability } from "../../lib/os/capabilities";
import { panelLogoutAction } from "../../panel/actions";
import { AppShell, type OsNavigationItem } from "./app-shell";
import { ThemePicker } from "./os-theme";
import type { OsQuickAction } from "./quick-actions";
import styles from "./panel-shell.module.css";

const modules: ReadonlyArray<OsNavigationItem & { permission?: Capability }> = [
  { href: "/panel", label: "Inicio", group: "General", icon: "home" },
  { href: "/panel/agenda", label: "Agenda", group: "General", icon: "calendar", permission: "calendar.read" },
  { href: "/panel/solicitudes-fecha", label: "Solicitudes", group: "General", icon: "inbox", permission: "calendar.read" },
  { href: "/panel/disponibilidad-publica", label: "Disponibilidad", group: "General", icon: "calendar", permission: "calendar.read" },
  { href: "/panel/clientes", label: "Clientes", group: "Comercial", icon: "users", permission: "clients.read" },
  { href: "/panel/cotizaciones", label: "Cotizaciones", group: "Comercial", icon: "file", permission: "quotes.manage" },
  { href: "/panel/paquetes", label: "Paquetes", group: "Comercial", icon: "box", permission: "packages.read" },
  { href: "/panel/portafolio", label: "Portafolio", group: "Comercial", icon: "image", permission: "portfolio.manage" },
  { href: "/panel/promociones", label: "Promociones", group: "Comercial", icon: "spark", permission: "promotions.manage" },
  { href: "/panel/produccion", label: "Producción", group: "Operaciones", icon: "layers", permission: "projects.read" },
  { href: "/panel/entregas", label: "Entregas", group: "Operaciones", icon: "box", permission: "projects.write" },
  { href: "/panel/finanzas", label: "Finanzas", group: "Finanzas", icon: "wallet", permission: "finance.read" },
  { href: "/panel/indicadores", label: "Indicadores", group: "Finanzas", icon: "chart", permission: "finance.read" },
  { href: "/panel/usuarios", label: "Usuarios", group: "Administración", icon: "users", permission: "users.manage" },
  { href: "/panel/configuracion", label: "Configuración", group: "Administración", icon: "settings" },
];

const actions: ReadonlyArray<OsQuickAction & { permissions: Capability[] }> = [
  { href: "/panel/clientes?accion=nuevo", label: "Registrar cliente", icon: "users", permissions: ["clients.read", "clients.write"] },
  { href: "/panel/agenda?accion=nuevo", label: "Agendar evento", icon: "calendar", permissions: ["calendar.read", "calendar.write"] },
  { href: "/panel/cotizaciones?accion=nuevo", label: "Crear cotización", icon: "file", permissions: ["quotes.manage"] },
  { href: "/panel/finanzas?accion=cobro", label: "Registrar cobro", icon: "wallet", permissions: ["finance.read", "finance.write"] },
  { href: "/panel/finanzas?accion=gasto", label: "Registrar gasto", icon: "wallet", permissions: ["finance.read", "finance.write"] },
  { href: "/panel/finanzas?accion=boleta", label: "Registrar boleta", icon: "file", permissions: ["finance.read", "finance.write"] },
  { href: "/panel/portafolio?accion=nuevo", label: "Crear proyecto de portafolio", icon: "image", permissions: ["portfolio.manage"] },
  { href: "/panel/paquetes?accion=nuevo", label: "Crear paquete", icon: "box", permissions: ["packages.read", "packages.write"] },
];

export function panelQuickActions(capabilities: readonly Capability[]): OsQuickAction[] {
  return actions.filter((action) => action.permissions.every((permission) => capabilities.includes(permission)))
    .map(({ href, label, icon }) => ({ href, label, icon }));
}

export function PanelShell({ session, currentPath, children }: {
  session: OsSession;
  currentPath: string;
  children: ReactNode;
}) {
  const navigation = modules
    .filter((item) => (!item.permission || session.capabilities.includes(item.permission)) &&
      (item.href !== "/panel/solicitudes-fecha" || session.capabilities.includes("clients.read")) &&
      (item.href !== "/panel/entregas" || process.env.CRISDAL_PRIVATE_DELIVERIES_ENABLED === "true"))
    .map((item) => ({ href: item.href, label: item.label, group: item.group, icon: item.icon, active: currentPath === item.href }));
  return (
    <AppShell navigation={navigation} quickActions={panelQuickActions(session.capabilities)}>
      <header className={styles.topbar}>
        <div className={styles.user}><strong>{session.displayName}</strong><span>{ROLE_LABELS[session.role]}</span></div>
        <div className={styles.controls}><ThemePicker /><form action={panelLogoutAction} data-os-leaves-editor><button type="submit">Cerrar sesión</button></form></div>
      </header>
      {children}
    </AppShell>
  );
}
