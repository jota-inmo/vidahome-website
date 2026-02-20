import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "../globals.css";
import { Navbar } from "@/components/Navbar";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Toaster } from "sonner";
import { GlobalSchema } from "@/components/GlobalSchema";
import { CookieConsent } from "@/components/CookieConsent";
import { Footer } from "@/components/Footer";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
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
      locale: locale === 'en' ? 'en_US' : 'es_ES',
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Vidahome | Experiencia Inmobiliaria de Lujo en Gandia",
      description: "Especialistas en la gestión de propiedades exclusivas en la zona de Gandia y alrededores.",
      images: ["/MARCA OK.png"],
    },
  };
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${playfair.variable} ${inter.variable} font-sans antialiased bg-white dark:bg-slate-950`}
      >
        <NextIntlClientProvider messages={messages}>
          <GlobalSchema />
          <CookieConsent />
          <Navbar />

          <div className="pt-24 italic">
            {children}
          </div>
          <Footer />
          <WhatsAppButton />

          <Toaster position="top-right" richColors />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
