import type { Metadata } from "next";
export const metadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true, noimageindex: true },
  referrer: "no-referrer",
};
export default function PrivateDeliveriesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
