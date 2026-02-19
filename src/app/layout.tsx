import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Toaster } from "sonner";
import { GlobalSchema } from "@/components/GlobalSchema";
import { CookieConsent } from "@/components/CookieConsent";
import { Footer } from "@/components/Footer";




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
  openGraph: {
    title: "Vidahome | Experiencia Inmobiliaria de Lujo en Gandia",
    description: "Especialistas en la gestión de propiedades exclusivas en la zona de Gandia y alrededores.",
    url: "https://vidahome.es",
    siteName: "Vidahome",
    images: [
      {
        url: "/MARCA OK.png",
        width: 1200,
        height: 630,
        alt: "Vidahome Logo",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vidahome | Experiencia Inmobiliaria de Lujo en Gandia",
    description: "Especialistas en la gestión de propiedades exclusivas en la zona de Gandia y alrededores.",
    images: ["/MARCA OK.png"],
  },
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
        <GlobalSchema />
        <CookieConsent />
        <Navbar />


        <div className="pt-24 italic">
          {children}
        </div>
        <Footer />
        <WhatsAppButton />

        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
