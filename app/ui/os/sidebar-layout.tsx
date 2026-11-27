"use client";

import { useState, useSyncExternalStore, type FocusEvent, type PointerEvent, type ReactNode } from "react";
import { OsIcon } from "./os-icon";
import styles from "./app-shell.module.css";

const storageKey = "crisdal-os-sidebar-collapsed";
const eventName = "crisdal-os-sidebar-change";
let fallback = false;

function subscribe(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener(eventName, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(eventName, notify);
  };
}

function readCollapsed() {
  try { return localStorage.getItem(storageKey) === "true"; }
  catch { return fallback; }
}

const expanded = () => false;
type Tip = { label: string; left: number; top: number };

export function SidebarLayout({ brand, sidebar, children }: {
  brand: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}) {
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, expanded);
  const [tip, setTip] = useState<Tip | null>(null);
  const toggleLabel = collapsed ? "Expandir barra lateral" : "Contraer barra lateral";

  function toggle() {
    fallback = !collapsed;
    try { localStorage.setItem(storageKey, String(fallback)); }
    catch { /* The preference still works for this page. */ }
    setTip(null);
    window.dispatchEvent(new Event(eventName));
  }

  function positionTip(anchor: HTMLElement | null) {
    const label = anchor?.dataset.sidebarTooltip;
    if (!collapsed || !anchor || !label) {
      setTip(null);
      return;
    }
    const { right, top, bottom, height } = anchor.getBoundingClientRect();
    if (bottom <= 0 || top >= window.innerHeight) {
      setTip(null);
      return;
    }
    setTip({ label, left: right + 14, top: Math.max(20, Math.min(window.innerHeight - 20, top + height / 2)) });
  }

  function showTip(event: FocusEvent<HTMLElement> | PointerEvent<HTMLElement>) {
    if (!collapsed || !(event.target instanceof Element)) return;
    if ("pointerType" in event && event.pointerType === "touch") return;
    positionTip(event.target.closest<HTMLElement>("[data-sidebar-tooltip]"));
  }

  function hideTip(event: FocusEvent<HTMLElement> | PointerEvent<HTMLElement>) {
    if (event.target instanceof Element && event.relatedTarget instanceof Node &&
        event.target.closest("[data-sidebar-tooltip]")?.contains(event.relatedTarget)) return;
    setTip(null);
  }

  return <div className={styles.shell} data-sidebar-collapsed={collapsed}>
    <a className={styles.skipLink} href="#os-main">Saltar al contenido</a>
    <aside className={styles.sidebar} aria-label="Barra lateral de Crisdal OS"
      onFocus={showTip} onBlur={hideTip} onPointerOver={showTip} onPointerOut={hideTip} onScroll={(event) => {
        const focused = document.activeElement;
        positionTip(focused instanceof HTMLElement && event.currentTarget.contains(focused) ? focused.closest("[data-sidebar-tooltip]") : null);
      }}>
      <div className={styles.sidebarHead}>
        {brand}
        <button type="button" className={styles.sidebarToggle} aria-label={toggleLabel}
          aria-expanded={!collapsed} aria-controls="os-sidebar-nav" data-sidebar-tooltip={toggleLabel}
          title={collapsed ? undefined : toggleLabel} onClick={toggle}>
          <OsIcon name={collapsed ? "sidebarExpand" : "sidebarCollapse"} />
        </button>
      </div>
      {sidebar}
    </aside>
    {children}
    {collapsed && tip && <span className={styles.sidebarTooltip} aria-hidden="true" style={{ left: tip.left, top: tip.top }}>{tip.label}</span>}
  </div>;
}
