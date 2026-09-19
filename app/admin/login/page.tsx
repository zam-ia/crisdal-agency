import Image from "next/image";
import { redirect } from "next/navigation";
import { loginAction } from "../actions";
import {
  adminAuthConfigured,
  isAdminAuthenticated,
} from "../../lib/admin-auth";

export const metadata = {
  title: "Acceso administrativo | Crisdal Agency",
  robots: { index: false, follow: false },
};

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAdminAuthenticated()) redirect("/admin");
  const { error } = await searchParams;
  const configured = adminAuthConfigured();

  return (
    <main className="admin-login">
      <section className="admin-login-card" aria-labelledby="admin-login-title">
        <Image
          src="/brand/crisdal-imagotipo.png"
          alt=""
          width={56}
          height={64}
          className="admin-logo"
        />
        <p className="admin-kicker">CRISDAL AGENCY</p>
        <h1 id="admin-login-title">Panel de la landing</h1>
        <p>
          Accede para actualizar textos, planes, imágenes y la VSL publicada.
        </p>
        {!configured ? (
          <div className="admin-alert admin-alert-error" role="alert">
            Configura ADMIN_PASSWORD y un ADMIN_SESSION_SECRET de al menos 32
            caracteres.
          </div>
        ) : null}
        {error ? (
          <div className="admin-alert admin-alert-error" role="alert">
            La contraseña no es correcta.
          </div>
        ) : null}
        <form action={loginAction} className="admin-login-form">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={!configured}
          />
          <button type="submit" disabled={!configured}>
            Entrar al panel
          </button>
        </form>
      </section>
    </main>
  );
}
