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
};

export default nextConfig;
