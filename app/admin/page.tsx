import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "../lib/admin-auth";
import { getSiteContent, isCmsConfigured } from "../lib/site-content";
import { AdminForm } from "./admin-form";
import { logoutAction } from "./actions";

export const metadata = {
  title: "Administrar landing | Crisdal Agency",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const [content, params] = await Promise.all([getSiteContent(), searchParams]);
  const configured = isCmsConfigured();

  return (
    <main className="admin-page">
      <header className="admin-topbar">
        <div>
          <p className="admin-kicker">CRISDAL AGENCY</p>
          <h1>Contenido de la landing</h1>
        </div>
        <nav aria-label="Acciones administrativas">
          <Link href="/" target="_blank">Ver landing</Link>
          <form action={logoutAction}><button type="submit">Cerrar sesión</button></form>
        </nav>
      </header>
      <div className="admin-intro">
        <p>
          Edita cada bloque y sube imágenes o video. Los casos y métricas deben
          publicarse solo con evidencia y autorización.
        </p>
        {params.saved ? <div className="admin-alert admin-alert-success" role="status">Cambios guardados y publicados.</div> : null}
        {params.error ? <div className="admin-alert admin-alert-error" role="alert">No se pudieron guardar los cambios. Revisa los campos y la conexión con Supabase.</div> : null}
        {!configured ? <div className="admin-alert" role="status">El panel está en modo lectura. Configura Supabase Database y Storage para persistir contenido y archivos.</div> : null}
      </div>
      <AdminForm initialContent={content} cmsConfigured={configured} />
    </main>
  );
}
