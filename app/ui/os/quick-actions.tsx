"use client";

import Link from "next/link";
import { useState } from "react";
import { OsDialog } from "./os-dialog";
import { OsIcon, type OsIconName } from "./os-icon";
import styles from "./app-shell.module.css";

export type OsQuickAction = { href: string; label: string; icon: OsIconName };

export function QuickActions({ actions, className, sidebar = false }: { actions: readonly OsQuickAction[]; className?: string; sidebar?: boolean }) {
  const [open, setOpen] = useState(false);
  if (!actions.length) return null;
  return <>
    <button className={className} type="button" aria-label="Crear" data-sidebar-tooltip={sidebar ? "Crear" : undefined} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
      <OsIcon name="plus" /><span>Crear</span>
    </button>
    <OsDialog open={open} onClose={() => setOpen(false)} title="Crear en Crisdal">
      <div className={styles.quickGrid}>{actions.map((action) => (
        <Link className={styles.quickLink} href={action.href} key={action.href} onClick={() => setOpen(false)}>
          <OsIcon name={action.icon} />{action.label}
        </Link>
      ))}</div>
    </OsDialog>
  </>;
}
