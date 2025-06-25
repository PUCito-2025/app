import { esES } from "@clerk/localizations";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import Navbar from "@/components/Navbar";
import { cn } from "@/utils/cn";
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
        <body className={cn(inter.className, "flex h-screen w-screen flex-col")}>
          <Navbar />
          <main className="flex w-full flex-grow flex-col">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
