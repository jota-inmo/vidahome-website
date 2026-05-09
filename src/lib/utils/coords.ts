/**
 * Coords públicas con jitter determinista por tipo de vivienda.
 *
 * Espejo del helper `api/_lib/geocode.ts` del CRM. Si tocas uno, toca
 * el otro — la web pública debe aplicar el MISMO jitter para que el
 * mapa que ve el visitante esté siempre en el mismo punto aunque la
 * coord exacta interna se actualice.
 *
 * Fuente de verdad: `encargos.lat_exacta` + `encargos.lng_exacta`. El
 * flag `encargos.ubicacion_exacta_publica` (default false) decide si
 * el visitor ve la coord exacta (rounded a 6 decimales) o jittered.
 *
 * Decisión 2026-05-08:
 *   - Pisos / áticos / dúplex / lofts → 200 m
 *   - Casas / chalets / villas / parcelas / solares / hoteles → 500 m
 *   - Resto (locales, oficinas, garajes, edificios) → 200 m default
 *
 * Las viviendas unifamiliares son más identificables por su footprint
 * en imagen aérea, así que necesitan más ofuscación. Los pisos en
 * bloque son anónimos en planta.
 */

const DEFAULT_RADIUS_METERS = 200;
const METERS_PER_DEG_LAT = 111_320;

const JITTER_RADIUS_BY_TYPE: Record<string, number> = {
    'piso': 200,
    'apartamento': 200,
    'estudio': 200,
    'atico': 200,
    'ático': 200,
    'duplex': 200,
    'dúplex': 200,
    'loft': 200,
    'entresuelo': 200,
    'bajo': 200,
    'casa/chalet': 500,
    'casa': 500,
    'chalet': 500,
    'villa': 500,
    'adosado': 500,
    'pareado': 500,
    'masia': 500,
    'masía': 500,
    'finca': 500,
    'parcela': 500,
    'solar': 500,
    'hotel': 500,
};

export function jitterRadiusForType(tipo: string | null | undefined): number {
    if (!tipo) return DEFAULT_RADIUS_METERS;
    const key = tipo.toLowerCase().trim();
    return JITTER_RADIUS_BY_TYPE[key] ?? DEFAULT_RADIUS_METERS;
}

function fnv1a(input: string): number {
    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = (hash * 0x01000193) >>> 0;
    }
    return hash >>> 0;
}

function rand2(seed: string): [number, number] {
    const a = fnv1a(seed + ':lat') / 0xffffffff;
    const b = fnv1a(seed + ':lng') / 0xffffffff;
    return [a, b];
}

export function applyJitter(
    lat: number,
    lng: number,
    seed: string,
    radiusMeters: number = DEFAULT_RADIUS_METERS,
): { lat: number; lng: number } {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error('applyJitter: lat/lng must be finite numbers');
    }
    if (!seed) {
        throw new Error('applyJitter: seed required (use the property ref)');
    }
    if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
        throw new Error('applyJitter: radiusMeters must be positive');
    }
    const [u, v] = rand2(seed);
    const r = Math.sqrt(u) * radiusMeters;
    const theta = v * 2 * Math.PI;

    const dx = r * Math.cos(theta);
    const dy = r * Math.sin(theta);

    const dLat = dy / METERS_PER_DEG_LAT;
    const dLng = dx / (METERS_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180));

    return {
        lat: Math.round((lat + dLat) * 1e6) / 1e6,
        lng: Math.round((lng + dLng) * 1e6) / 1e6,
    };
}

export function getPublicCoords(args: {
    lat: number | null | undefined;
    lng: number | null | undefined;
    seed: string;
    exposeExact: boolean;
    tipoVivienda?: string | null;
}): { lat: number; lng: number } | null {
    const { lat, lng, seed, exposeExact, tipoVivienda } = args;
    if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
    }
    // Defense in depth: requerimos exactamente `=== true`. Cualquier
    // otro valor truthy (string "true", 1, objeto) cae al jitter — un
    // descuido en el caller no puede expoer la coord exacta.
    if (exposeExact === true) {
        return {
            lat: Math.round(lat * 1e6) / 1e6,
            lng: Math.round(lng * 1e6) / 1e6,
        };
    }
    return applyJitter(lat, lng, seed, jitterRadiusForType(tipoVivienda));
}

/**
 * Coerce un valor que puede ser number | string (Postgres numeric →
 * text via supabase-js) a number, devolviendo null si no es finito.
 */
export function coerceCoord(v: unknown): number | null {
    if (v == null) return null;
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return Number.isFinite(n) ? n : null;
}
