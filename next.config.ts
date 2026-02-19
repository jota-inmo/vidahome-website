import type { NextConfig } from "next";

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
  async redirects() {
    return [
      // Redirecciones de Inmovilla (comunes) para no perder SEO
      {
        source: '/ficha.php',
        has: [{ type: 'query', key: 'cod' }],
        destination: '/propiedades/:cod',
        permanent: true,
      },
      {
        source: '/ficha.php',
        has: [{ type: 'query', key: 'id' }],
        destination: '/propiedades/:id',
        permanent: true,
      },
      {
        source: '/listado.php',
        destination: '/propiedades',
        permanent: true,
      },
      {
        source: '/contacto.php',
        destination: '/contacto',
        permanent: true,
      },
      {
        source: '/index.php',
        destination: '/',
        permanent: true,
      }
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://wa.me; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://fotos15.inmovilla.com https://crm.inmovilla.com https://*.supabase.co https://api.ipify.org; media-src 'self' https://*.supabase.co; frame-ancestors 'none';",
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



export default nextConfig;
