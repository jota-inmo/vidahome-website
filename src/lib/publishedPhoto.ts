/**
 * Qué copia de cada foto se enseña en la web pública. ESPEJO de la regla del CRM
 * (`vidahome-encargo/api/_lib/publishedPhoto.ts`): mantener las dos en sync.
 *
 *  - Foto hecha con IA (`generada_ia`): solo su copia con el rótulo «Recreación
 *    virtual» (`url_storage_ia`); si no existe, la foto NO se enseña.
 *  - Ficha con marca de agua activada (`fotos_marca_agua`): la copia con marca
 *    (`url_storage_wm`) si existe; si no, el original.
 *  - Resto: el original (`url_storage`), o la URL legacy (`url_cloudinary`).
 *
 * Antes (hasta 2026-11-26) la ficha leía `url_storage` a secas y enseñaba el
 * original aunque la foto fuera de IA o la ficha tuviera marca de agua.
 */

export interface PublicPhotoRow {
    url_storage?: string | null;
    url_cloudinary?: string | null;
    url_storage_wm?: string | null;
    url_storage_ia?: string | null;
    generada_ia?: boolean | null;
}

/** Columnas de `fotos_inmuebles` que necesita la regla. */
export const PUBLIC_PHOTO_COLUMNS = 'url_cloudinary, url_storage, url_storage_wm, url_storage_ia, generada_ia';

/** URL pública de la foto, o null si no debe enseñarse. Pura. */
export function publicPhotoUrl(row: PublicPhotoRow, marcaAgua: boolean, supabaseUrl: string): string | null {
    const toUrl = (path: string) => `${supabaseUrl}/storage/v1/object/public/property-photos/${path}`;
    if (row.generada_ia === true) {
        return row.url_storage && row.url_storage_ia && supabaseUrl ? toUrl(row.url_storage_ia) : null;
    }
    if (row.url_storage && supabaseUrl) {
        return toUrl(marcaAgua && row.url_storage_wm ? row.url_storage_wm : row.url_storage);
    }
    return row.url_cloudinary || null;
}

/** Aplica la regla a una lista ordenada: quita las que no se enseñan. */
export function publicPhotoUrls(rows: readonly PublicPhotoRow[], marcaAgua: boolean, supabaseUrl: string): string[] {
    const out: string[] = [];
    for (const row of rows) {
        const url = publicPhotoUrl(row, marcaAgua, supabaseUrl);
        if (url) out.push(url);
    }
    return out;
}
