/**
 * Las fotos de `fotos_lista` (Storage/Cloudinary) son originales sin
 * redimensionar — algunas vienen directo de la cámara del móvil (hasta
 * 4000×2252, 2+ MB) porque la migración Cloudinary→Storage (A1, 2026-05-06)
 * copió el fichero tal cual, sin pasar por el pipeline de compresión del
 * wizard. Usarlas como `og:image` crudas hacía que la previsualización de
 * WhatsApp se quedara solo con título+descripción, sin foto — el fetcher de
 * WhatsApp descarta imágenes así de grandes en silencio (incidente JC
 * 2026-11-05, ref 2998: foto de 2,48 MB / 4000×2252, Cache-Control
 * "private, no-cache" del Storage de Supabase, sin og:image:width/height).
 *
 * Fix: servir el og:image a través del optimizador de imágenes de Next
 * (`/_next/image`), que reduce a ~100 KB con `Cache-Control: public,
 * max-age=31536000` sin tocar el fichero original (la galería sigue
 * mostrando la foto a tamaño completo). `remotePatterns` en next.config.ts
 * ya incluye los hosts de Storage/Cloudinary/Inmovilla que puede traer
 * `fotos_lista`, así que el optimizador puede leerlos todos.
 */
export function toOgImageUrl(siteUrl: string, originalUrl: string, width = 1200, quality = 75): string {
    if (!originalUrl) return originalUrl;
    const params = new URLSearchParams({ url: originalUrl, w: String(width), q: String(quality) });
    return `${siteUrl}/_next/image?${params.toString()}`;
}
