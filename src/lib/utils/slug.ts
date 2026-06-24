/**
 * Property slug helpers — SINGLE source of composition for descriptive,
 * language-neutral property URLs.
 *
 *   /propiedades/{tipo}-{poblacion}-{ref}   (e.g. piso-gandia-2975)
 *
 * The SAME slug is emitted for the 6 locales (only the /xx prefix changes).
 * This module feeds, without divergence:
 *   - the card title parts (LuxuryPropertyCard)
 *   - the slug in the card link
 *   - sitemap.ts
 *   - the canonical + hreflang in propiedades/[id]/page.tsx
 *
 * INVARIANT: the slug emitted by sitemap.ts MUST be byte-identical to the
 * canonical computed by [id]/page.tsx for the same property — otherwise a
 * 308 loop / wasted crawl. Both call buildPropertySlug() on the same
 * already-resolved fields, so they cannot diverge.
 *
 * Language-neutral rule: NEVER slugify the translated title. The slug base
 * is always Spanish (tipo_nombre is langue-neutre, resolved upstream).
 */

interface PropertyLabelSource {
    tipo_nombre?: string | null;
    poblacion?: string | null;
    ref?: string | null;
    cod_ofer?: number | string | null;
}

/**
 * Normalize a free-text fragment into a URL-safe slug segment.
 * NFD-decompose, strip diacritics, lowercase, map any non-[a-z0-9] run to a
 * single '-', then trim leading/trailing '-'. Never applied to the ref.
 */
export function slugify(s: string | null | undefined): string {
    if (!s) return '';
    return s
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '') // strip diacritics (á→a, ñ→n base + tilde)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // any non-alnum run → single hyphen
        .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
}

/**
 * Resolve the raw label parts from already-resolved fields. tipoEs is the
 * langue-neutre Spanish type name (tipo_nombre); poblacion is the resolved
 * city; ref is the CRM ref (falls back to cod_ofer for legacy rows).
 */
export function propertyLabelParts(prop: PropertyLabelSource): {
    tipoEs: string;
    poblacion: string;
    ref: string;
} {
    const tipoEs = (prop.tipo_nombre ?? '').toString().trim();
    const poblacion = (prop.poblacion ?? '').toString().trim();
    const ref = (prop.ref ?? '').toString().trim() || (prop.cod_ofer ?? '').toString().trim();
    return { tipoEs, poblacion, ref };
}

/**
 * Compose the canonical, language-neutral property slug.
 *
 * The ref is appended VERBATIM (no slugify) and ALWAYS LAST — this preserves
 * its case (T2785) and guarantees robust extraction even when the poblacion
 * itself contains hyphens ("La Font d'En Carros" → la-font-d-en-carros-2975).
 */
export function buildPropertySlug(prop: PropertyLabelSource): string {
    const { tipoEs, poblacion, ref } = propertyLabelParts(prop);
    const tipoSlug = slugify(tipoEs);
    const pobSlug = slugify(poblacion);

    if (tipoSlug && pobSlug) return `${tipoSlug}-${pobSlug}-${ref}`;
    if (tipoSlug) return `${tipoSlug}-${ref}`;
    if (pobSlug) return `${pobSlug}-${ref}`;
    return `${ref}`;
}

/**
 * Extract the ref from a slug param: everything after the LAST '-'. If there
 * is no '-', return the whole param (compat with bare-ref / legacy cod_ofer
 * URLs). The lookup downstream stays case-sensitive, hence verbatim ref.
 */
export function extractRef(slugParam: string): string {
    const idx = slugParam.lastIndexOf('-');
    return idx === -1 ? slugParam : slugParam.slice(idx + 1);
}
