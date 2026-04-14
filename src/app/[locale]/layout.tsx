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

// Map each next-intl locale to its OG-compliant territory code.
// Before 2026-04-14 this was `locale === 'en' ? 'en_US' : 'es_ES'` —
// so fr/de/it/pl all got served as es_ES on Facebook/LinkedIn previews.
const OG_LOCALE_MAP: Record<string, string> = {
  es: 'es_ES',
  en: 'en_US',
  fr: 'fr_FR',
  de: 'de_DE',
  it: 'it_IT',
  pl: 'pl_PL',
};

const SITE_URL = 'https://vidahome.es';
const SUPPORTED_LOCALES = ['es', 'en', 'fr', 'de', 'it', 'pl'] as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  // Use the Metadata namespace — each locale file has homeTitle / homeDescription
  // / homeOgDescription so Google.fr / .de / .it / .pl see the right language.
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  const title = t('homeTitle');
  const description = t('homeDescription');
  const ogDescription = t('homeOgDescription');
  const canonicalPath = locale === 'es' ? '/' : `/${locale}`;

  // hreflang alternates — declares the other locale versions so Google
  // can pick the right one per user region and stops the locales from
  // cannibalising each other.
  const languages: Record<string, string> = {};
  for (const l of SUPPORTED_LOCALES) {
    languages[l] = `${SITE_URL}${l === 'es' ? '' : `/${l}`}`;
  }
  languages['x-default'] = SITE_URL;

  return {
    // metadataBase lets Next.js resolve any relative URL in images /
    // openGraph / twitter to an absolute one. Without it, relative
    // paths in OG images fall back to the request host (which includes
    // Vercel preview URLs and localhost) — WhatsApp, Facebook and
    // LinkedIn ignore those and show no preview at all.
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}${canonicalPath}`,
      languages,
    },
    openGraph: {
      title,
      description: ogDescription,
      url: `${SITE_URL}${canonicalPath}`,
      siteName: 'Vidahome',
      images: [
        {
          url: `${SITE_URL}/MARCA OK.png`,
          width: 1200,
          height: 630,
          alt: 'Vidahome',
        },
      ],
      locale: OG_LOCALE_MAP[locale] || 'es_ES',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: ogDescription,
      images: [`${SITE_URL}/MARCA OK.png`],
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
