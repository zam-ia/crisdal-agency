"use client";

import { useSyncExternalStore, type ReactNode } from "react";

import { OsConnectivity } from "./install-guide";

type Preference = "system" | "light" | "dark";
const storageKey = "crisdal-os-theme";
const eventName = "crisdal-os-theme-change";
const systemPreference = (): Preference => "system";

function readPreference(): Preference {
  try {
    const value = window.localStorage.getItem(storageKey);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function subscribe(callback: () => void) {
  window.addEventListener(eventName, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(eventName, callback);
    window.removeEventListener("storage", callback);
  };
}

export function OsTheme({ children }: { children: ReactNode }) {
  const preference = useSyncExternalStore(subscribe, readPreference, systemPreference);
  return <div className="crisdal-os-theme" data-os-theme={preference}><OsConnectivity />{children}</div>;
}

export function ThemePicker() {
  const preference = useSyncExternalStore(subscribe, readPreference, systemPreference);
  return <label className="crisdal-theme-picker">
    <span>Tema</span>
    <select value={preference} onChange={(event) => {
      try {
        window.localStorage.setItem(storageKey, event.target.value);
        window.dispatchEvent(new Event(eventName));
      } catch {
        // The system preference remains available when the browser blocks storage.
      }
    }}>
      <option value="system">Sistema</option>
      <option value="light">Claro</option>
      <option value="dark">Oscuro</option>
    </select>
  </label>;
}
