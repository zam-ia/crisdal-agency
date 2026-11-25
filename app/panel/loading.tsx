import { LoadingSkeleton } from "../ui/os/app-shell";
import styles from "./panel.module.css";

export default function PanelLoading() { return <main className={styles.loading}><LoadingSkeleton label="Cargando Crisdal OS" /><LoadingSkeleton /></main>; }
