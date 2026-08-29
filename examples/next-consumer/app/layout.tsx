import type { Metadata } from "next";
import "@mithtech-bengaluru/tonaldepth-react/styles.css";

export const metadata: Metadata = { title: "TonalDepth Next consumer" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-theme="light" data-density="comfortable"><body className="td-root">{children}</body></html>;
}
