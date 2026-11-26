import Image from "next/image";
import { redirect } from "next/navigation";
import { getPanelSession } from "../../lib/os/dal";
import { isOsAuthConfigured } from "../../lib/os/supabase-auth";
import { PanelLoginForm } from "./login-form";
import styles from "../panel.module.css";

export const metadata = { title: "Acceso | Crisdal OS", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelLoginPage() {
  if (await getPanelSession()) redirect("/panel");
  const configured = isOsAuthConfigured();
  return (
    <main className={styles.loginPage}>
      <section className={styles.loginCard} aria-labelledby="panel-login-title">
        <Image src="/brand/crisdal-imagotipo.png" width={58} height={66} alt="" priority />
        <p className={styles.eyebrow}>CRISDAL OS</p>
        <h1 id="panel-login-title">Acceso seguro</h1>
        <p>Ingresa con tu usuario nominal. Este acceso es independiente del CMS de la landing.</p>
        {!configured ? <p className={styles.error} role="alert">El acceso todavía no está configurado en este entorno.</p> : null}
        <PanelLoginForm configured={configured} />
      </section>
    </main>
  );
}
