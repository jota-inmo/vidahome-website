import type { MetadataRoute } from 'next';

// Sin este manifest, "Añadir a pantalla de inicio" en Android no tenía
// ningún icono curado que ofrecer — Chrome caía a una captura de pantalla
// de la página en vez del logo de VidaHome (favicon.ico/apple-icon.png ya
// llevaban el mark correcto, pero eso solo cubre iOS y la pestaña del
// navegador). Ver CLAUDE.md → "PWA/favicon del CRM" para el incidente
// gemelo ya resuelto en el CRM (2026-09-04).
//
// Los 4 PNG de /public/pwa-icon-*.png están generados a partir del mismo
// círculo+"Λ" recortado de /public/vidahome-logo.png (negro plano, el logo
// oficial vigente) — no es un logo nuevo, solo el icono aislado sin el
// texto "VIDA | HOME". Dos variantes por tamaño:
//   · purpose "any"       — fondo transparente, el mark ocupa ~90% del
//     lienzo. Se usa tal cual, sin recortes de forma.
//   · purpose "maskable"  — fondo blanco, el mark ocupa ~62.5% (misma
//     proporción que el icon-512.png del CRM) para quedar dentro de la
//     "safe zone" del 80% y que el círculo no se corte cuando Android le
//     aplique su máscara (circular/squircle/rounded-square).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VidaHome — tu asesor inmobiliario',
    short_name: 'VidaHome',
    description: 'Encuentra tu próxima vivienda en Gandia y la Safor con VidaHome.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0a192f',
    icons: [
      { src: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/pwa-icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
