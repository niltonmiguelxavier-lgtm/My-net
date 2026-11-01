import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title: { default: "My Net — Internet em Moçambique", template: "%s | My Net" }, description: "Descobre, compara e contacta fornecedores de Internet em Moçambique.", applicationName: "My Net", icons: { icon: "/icons/mynet.svg" } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0b6258" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-MZ"><body>{children}</body></html>; }
