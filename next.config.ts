import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin(
  './src/i18n/request.ts'
);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'fotos15.inmovilla.com',
      },
      {
        protocol: 'https',
        hostname: 'crm.inmovilla.com',
      }
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  async redirects() {
    return [
      // ═══════════════════════════════════════════════════════════════
      // REDIRECCIONES CRM INMOVILLA → NUEVA WEB (URLs antiguas → nuevas)
      // ═══════════════════════════════════════════════════════════════
      // El CRM de Inmovilla sigue generando enlaces en formato antiguo
      // Estas redirecciones (301) los redirigen a la nueva estructura
      // sin perder SEO. Default locale es 'es'
      
      // /ficha.php?cod=XXXXX → /es/propiedades/XXXXX
      {
        source: '/ficha.php',
        has: [{ type: 'query', key: 'cod' }],
        destination: '/es/propiedades/:cod',
        permanent: true,
      },
      
      // /ficha.php?id=XXXXX → /es/propiedades/XXXXX
      {
        source: '/ficha.php',
        has: [{ type: 'query', key: 'id' }],
        destination: '/es/propiedades/:id',
        permanent: true,
      },
      
      // /listado.php → /es/propiedades
      {
        source: '/listado.php',
        destination: '/es/propiedades',
        permanent: true,
      },
      
      // /contacto.php → /es/contacto
      {
        source: '/contacto.php',
        destination: '/es/contacto',
        permanent: true,
      },
      
      // /index.php → / (automáticamente redirige a /es)
      {
        source: '/index.php',
        destination: '/',
        permanent: true,
      },
      
      // /propiedades/XXXXX → /es/propiedades/XXXXX
      // Por si acaso usan formato sin locale
      {
        source: '/propiedades/:cod',
        destination: '/es/propiedades/:cod',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://wa.me; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://fotos15.inmovilla.com https://crm.inmovilla.com https://*.supabase.co https://api.ipify.org; media-src 'self' https://*.supabase.co; frame-src 'self' https://www.google.com https://maps.google.com; frame-ancestors 'none';",
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
