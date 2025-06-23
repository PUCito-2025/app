import { esES } from "@clerk/localizations";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import CanvasInitializer from "@/components/CanvasInitializer";
import Navbar from "@/components/Navbar";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PUCito",
  description: "Asistente universitario PUC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider localization={esES}>
      <html lang="es">
        <body className={inter.className}>
          <Navbar />
          <CanvasInitializer />
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
