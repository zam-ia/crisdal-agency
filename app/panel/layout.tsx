import type { Metadata } from "next";
import type { ReactNode } from "react";
import { OsTheme } from "../ui/os/os-theme";
import "../ui/os/os-tokens.css";

export const metadata: Metadata = {
  manifest: "/crisdal-os.webmanifest",
  robots: { index: false, follow: false },
  applicationName: "Crisdal OS",
};

export default function PanelLayout({ children }: { children: ReactNode }) {
  return <OsTheme>{children}</OsTheme>;
}
