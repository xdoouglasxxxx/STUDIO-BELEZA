import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MH Studio - Admin",
  description: "Painel da Myleine Hofmann",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
