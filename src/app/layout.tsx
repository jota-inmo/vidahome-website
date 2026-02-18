import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Toaster } from "sonner";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Vidahome | Experiencia Inmobiliaria de Lujo en Gandia",
  description: "Especialistas en la gestión de propiedades exclusivas en la zona de Gandia y alrededores. Tu confianza, nuestra prioridad.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${playfair.variable} ${inter.variable} font-sans antialiased bg-white dark:bg-slate-950`}
      >
        <Navbar />
        <div className="pt-24 italic">
          {children}
        </div>
        <WhatsAppButton />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
