import type { Metadata } from "next";
import type { ReactNode } from "react";
import AppShell from "@/app/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "GKDS Fitness", template: "%s | GKDS Fitness" },
  description: "Plataforma de gestión del gimnasio GKDS Fitness.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
