import { listPanelUsers, requirePanelSession } from "../../lib/os/dal";
import { ROLE_LABELS } from "../../lib/os/capabilities";
import { PanelShell } from "../../ui/os/panel-shell";
import styles from "../panel.module.css";

export const metadata = { title: "Usuarios | Crisdal OS", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const [session, users] = await Promise.all([requirePanelSession("users.manage"), listPanelUsers()]);
  return (
    <PanelShell session={session} currentPath="/panel/usuarios">
      <section className={styles.heading}><p className={styles.eyebrow}>Control de acceso</p><h1>Usuarios nominales</h1><p>Solo se muestran perfiles reales vinculados a Supabase Auth. Esta interfaz no crea usuarios ni expone credenciales.</p></section>
      <div className={styles.tableWrap}><table><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td>{user.displayName}</td><td>{user.email}</td><td>{ROLE_LABELS[user.role]}</td><td>{user.active ? "Activo" : "Inactivo"}</td></tr>)}</tbody></table></div>
    </PanelShell>
  );
}
