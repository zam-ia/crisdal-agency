"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type InstallEvent = Event & { prompt(): Promise<unknown>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
function subscribeOnline(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}
const online = () => navigator.onLine;
const serverOnline = () => true;

export function OsConnectivity() {
  const connected = useSyncExternalStore(subscribeOnline, online, serverOnline);
  return connected ? null : <p className="crisdal-os-offline" role="status">Sin conexión. Conserva esta pantalla y vuelve a conectarte antes de guardar.</p>;
}

export function OsInstallGuide() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [feedback, setFeedback] = useState("");
  useEffect(() => {
    const capture = (current: Event) => { current.preventDefault(); setEvent(current as InstallEvent); };
    const installed = () => { setEvent(null); setFeedback("Crisdal OS está instalado en este dispositivo."); };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);
  async function install() {
    if (!event) return;
    setEvent(null);
    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === "dismissed") setFeedback("Puedes instalarlo desde el menú del navegador.");
    } catch {
      setFeedback("Usa la opción de instalación del navegador.");
    }
  }
  return <section className="crisdal-os-install">
    <h2>Instalar Crisdal OS</h2>
    <p>En Windows, abre el menú de Chrome o Edge y busca la opción de instalar o agregar esta página como aplicación. Inicia sesión normalmente al abrirla.</p>
    {event && <button type="button" onClick={() => void install()}>Instalar en este dispositivo</button>}
    {feedback && <p role="status">{feedback}</p>}
  </section>;
}
