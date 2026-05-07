import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

const SITE_URL = 'https://www.vidahome.es';
const SUPPORTED_LOCALES = ['es', 'en', 'fr', 'de', 'it', 'pl'] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  const title = t('aboutTitle');
  const description = t('aboutDescription');
  const path = locale === 'es' ? '/nosotros' : `/${locale}/nosotros`;

  const languages: Record<string, string> = {};
  for (const l of SUPPORTED_LOCALES) {
    languages[l] = `${SITE_URL}${l === 'es' ? '/nosotros' : `/${l}/nosotros`}`;
  }
  languages['x-default'] = `${SITE_URL}/nosotros`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${path}`,
      siteName: 'Vidahome',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function NosotrosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
