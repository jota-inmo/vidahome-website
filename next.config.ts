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
};


export default nextConfig;
