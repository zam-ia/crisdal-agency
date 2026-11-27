"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { OsIcon } from "./os-icon";
import styles from "./os-dialog.module.css";

export function OsDialog({ open, onClose, title, children, locked = false }: {
  open: boolean;
  locked?: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return <dialog ref={ref} className={styles.dialog} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); if (!locked) onClose(); }}>
    <div className={styles.head}>
      <h2 id={titleId}>{title}</h2>
      <button className={styles.close} type="button" onClick={onClose} disabled={locked} aria-label="Cerrar"><OsIcon name="close" /></button>
    </div>
    {children}
  </dialog>;
}
