/**
 * ESPEJO de `api/_lib/publicAddress.ts` del CRM (vida-home-encargo). Mantener en
 * sync — si tocas uno, toca el otro (mismo patrón que `coords.ts` ↔ `geocode.ts`).
 * Aún NO cableado en la web: creado para que `getPropertyDetailAction`/JSON-LD lo
 * adopten (item 6 del spec address-capture-and-masking-investigation §k) cuando JC
 * dé el OK a mostrar calle aproximada en la ficha pública.
 *
 * getPublicAddress — punto único de decisión "qué TEXTO de ubicación se publica".
 *
 * Gemelo de `getPublicCoords` (geocode.ts) para el lado textual. Función PURA,
 * server-side, sin acceso a BD ni red. Devuelve el string para
 * `<location_detail>` de Kyero v3 (texto libre ≤50 chars) o `''` (omitir el nodo).
 *
 * Decisión de producto (JC 2026-06-04): publicar UBICACIÓN TEXTUAL APROXIMADA =
 * nombre de calle SIN número (o zona, según tipo de bien). El número NUNCA salvo
 * opt-in exacto explícito (`ubicacion_exacta_publica=true ∧ visibilidad='exacta'`).
 *
 * Invariantes de seguridad RGPD (cubiertos por tests):
 *  1. Ningún path salvo el opt-in exacto incluye el número de portal.
 *  2. Los tipos `zone` (unifamiliar/rústico aislado) NUNCA emiten calle.
 *  3. Si el parser de `dir` falla en un tipo `street`, degrada a zona/'' limpio —
 *     nunca un string a medias ni un dígito.
 *  4. Tipo desconocido → `zone` (fail-safe). Espejo en coords:
 *     `jitterRadiusForType` default desconocido = 500m (geocode.ts).
 *
 * La granularidad por tipo coincide con el split de jitter de coordenadas
 * (200m street / 500m zone) para que TEXTO y PIN tengan el mismo umbral de
 * anonimato. Excepción documentada: `adosado` es `street` para texto pero 500m
 * para jitter — es SEGURO porque un pin más grueso que el texto nunca filtra de
 * más (decisión JC: adosado = hilera urbana, no aislado).
 */

export type VisibilidadDireccion = 'exacta' | 'solo_calle' | 'ocultar';

const MAX_LEN = 50; // Kyero <location_detail>: max 50 chars (spec v3.6).

/**
 * Tipos cuya VÍA no desanonimiza (multi-vivienda o local urbano). Confirmado
 * por JC 2026-06-04. Match por keyword normalizado para cubrir variantes
 * ("Local comercial", "Plaza de garaje", "Oficinas"…). Todo lo que NO matchee
 * (unifamiliar, rústico, desconocido) cae a `zone` (fail-safe, sin calle).
 */
const STREET_KEYWORDS = [
    'piso', 'apartamento', 'atico', 'duplex', 'entresuelo', 'estudio', 'bajo', 'loft',
    'adosado', 'local', 'comercial', 'garaje', 'oficina', 'trastero',
    // En `zone` (fail-safe, sin calle): nave, edificio, hotel, solar — únicos/
    // identificables o sin portal al que apuntar (verificado con dato vivo, JC 2026-06-04).
];

function normalize(s: string): string {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** 'street' (calle permitida) | 'zone' (solo zona). Desconocido → 'zone'. */
export function granularityForType(tipo: string | null | undefined): 'street' | 'zone' {
    if (!tipo) return 'zone';
    const k = normalize(tipo);
    return STREET_KEYWORDS.some(kw => k.includes(kw)) ? 'street' : 'zone';
}

/**
 * Trunca `s` a ≤max SIN cortar a media palabra: corta en el último espacio
 * antes de `max`. Si la primera palabra ya excede `max`, corte duro (último
 * recurso). Evita "Avenida de la Constituc" a media palabra.
 */
export function truncateAtWord(s: string, max: number): string {
    const t = s.trim();
    if (t.length <= max) return t;
    const cut = t.slice(0, max);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim();
}

/**
 * Une las partes no vacías con `sep` mientras quepan en `max`. Prioriza la
 * primera (la calle): si "calle – zona" excede, DESCARTA la zona entera y deja
 * la calle íntegra. Si la calle sola excede, la trunca por palabra (no a media).
 */
export function joinWithinLimit(
    parts: Array<string | null | undefined>,
    sep: string,
    max: number,
): string {
    const clean = parts.map(p => (p ?? '').trim()).filter(Boolean);
    if (clean.length === 0) return '';
    let out = truncateAtWord(clean[0], max);
    for (let i = 1; i < clean.length; i++) {
        const cand = out + sep + clean[i];
        if (cand.length <= max) out = cand;
    }
    return out;
}

/**
 * Tokens de UNIDAD (planta/puerta/escalera/bloque/bajo) — cortan el nombre y
 * disparan el fail-closed. Incluye codificados (Es:/Pl:/Pt:/Bl:) y libres.
 * `\b...\b` standalone — "Plaza"/"Espinardo" no matchean. Lista cerrada (JC).
 */
// Tokens libres (esc/piso/puerta/bloque/bajo…) + formas codificadas con dos
// puntos (es:/pl:/pt:/bl:). NO bare es/pl/pt/bl (false-positives en valenciano).
const UNIT_TOKEN_RE = /\b(?:esc|escalera|pis|piso|planta|pta|puerta|bloque|bj|bajo)\b|\b(?:es|pl|pt|bl)\s*:/i;
/** FAIL-CLOSED (prioridad #1): cualquier dígito o token de unidad = potencial fuga. */
function streetHasLeak(s: string): boolean {
    return /\d/.test(s) || UNIT_TOKEN_RE.test(s);
}

/**
 * Prefijos de vía → forma canónica. Cubre abreviaturas Inmovilla (CL/AV/PS…)
 * y palabras completas (incl. valencianas: Carrer/Avinguda/Camí).
 */
const VIA_ABBREV: Record<string, string> = {
    cl: 'Calle', c: 'Calle', av: 'Avenida', avda: 'Avenida', avgda: 'Avenida',
    ps: 'Passeig', cr: 'Carrer', ctra: 'Carretera', pd: 'Partida', ptda: 'Partida',
    pz: 'Plaza', plza: 'Plaza', cm: 'Camino', tr: 'Travesía', rd: 'Ronda', gv: 'Gran Vía',
};
const VIA_FULL: Record<string, string> = {
    calle: 'Calle', avenida: 'Avenida', paseo: 'Paseo', carretera: 'Carretera',
    partida: 'Partida', plaza: 'Plaza', camino: 'Camino', travesia: 'Travesía',
    ronda: 'Ronda', carrer: 'Carrer', avinguda: 'Avinguda', cami: 'Camí',
    placa: 'Plaça', passeig: 'Passeig', ronda_va: 'Ronda',
};
const SMALL_WORDS = new Set(['de', 'del', 'dels', 'la', 'las', 'los', 'el', 'les', 'i', 'y', 'da', 'do']);

function titlecaseStreet(name: string): string {
    return name.split(/\s+/).filter(Boolean).map((w) => {
        const lw = w.toLowerCase();
        if (SMALL_WORDS.has(lw)) return lw; // de/la/del… siempre minúscula (incl. inicio)
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(' ');
}

/**
 * Extrae el nombre de calle (SIN número/planta/puerta/CP/town) de un `dir`.
 *
 * Estrategia robusta (cubre formato legacy "Nombre, nº, CP, ciudad" Y formato
 * abreviado Inmovilla "CL NOMBRE Nº TOWN (PROV)"):
 *  1. Detecta y normaliza el prefijo de vía inicial (CL→Calle…), deduplicando
 *     un abreviado redundante tras palabra completa ("Calle CL X" → "Calle X").
 *  2. Corta el resto en el PRIMER número, token de unidad o "(" → descarta nº,
 *     CP, esc/planta/puerta y la cola town (provincia).
 *  3. FAIL-CLOSED: si el resultado AÚN tiene dígito o token de unidad → null.
 *     "Mejor publicar de menos que filtrar" (incidente RGPD 2026-06-04).
 *
 * Devuelve `null` si no hay nombre limpio o si `dir` == población. El número de
 * portal NUNCA sobrevive (se pierde incluso si es parte del nombre, p.ej.
 * "Avinguda 9 d'Octubre" → null — degradación segura aceptada).
 */
export function parseStreetName(
    dir: string | null | undefined,
    poblacion?: string | null,
): string | null {
    if (!dir) return null;
    const tokens = dir.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    if (tokens.length === 0) return null;

    // 1) Prefijo de vía (incluye forma "C/" → strip de /). Dedup abreviado redundante.
    let prefix = '';
    const t0 = normalize(tokens[0]).replace(/[.:/]/g, '');
    if (VIA_FULL[t0]) { prefix = VIA_FULL[t0]; tokens.shift(); }
    else if (VIA_ABBREV[t0]) { prefix = VIA_ABBREV[t0]; tokens.shift(); }
    if (prefix && tokens.length) {
        const t1 = normalize(tokens[0]).replace(/[.:/]/g, '');
        if (VIA_ABBREV[t1]) tokens.shift();
    }

    // 2) Cortar el resto en el primer número / token de unidad / "(" / "[".
    const rest = tokens.join(' ');
    const cutMatch = rest.match(/[\d([]|\b(?:es|esc|escalera|pl|pis|piso|planta|pt|pta|puerta|bloque|bl|bj|bajo)\b/i);
    let name = (cutMatch ? rest.slice(0, cutMatch.index) : rest)
        .replace(/[\s,;.\-]+$/, '')   // limpia cola de puntuación
        .replace(/\s+/g, ' ')
        .trim();
    if (!name) return null;
    name = titlecaseStreet(name);
    // Trim de conectores finales colgando ("Cuc de Seda del" → "Cuc de Seda";
    // "Republica Argentina de la" → "Republica Argentina").
    const words = name.split(' ');
    while (words.length > 1 && SMALL_WORDS.has(words[words.length - 1].toLowerCase())) words.pop();
    name = words.join(' ');
    if (!name) return null;

    const result = (prefix ? `${prefix} ${name}` : name).trim();
    // 3) FAIL-CLOSED + sanity.
    if (!/[a-záéíóúñ]/i.test(result)) return null;
    if (streetHasLeak(result)) return null;
    if (poblacion && normalize(result) === normalize(poblacion)) return null;
    return truncateAtWord(result, MAX_LEN);
}

/** Resuelve la calle: `nombre_via` (+ `tipo_via`) si poblado, si no parsea `dir`. */
function resolveStreet(args: {
    nombre_via?: string | null;
    tipo_via?: string | null;
    dir?: string | null;
    poblacion?: string | null;
}): string | null {
    const nv = (args.nombre_via ?? '').trim();
    if (nv) {
        const tv = (args.tipo_via ?? '').trim();
        return tv ? `${tv} ${nv}` : nv;
    }
    return parseStreetName(args.dir, args.poblacion);
}

export interface PublicAddressArgs {
    dir?: string | null;
    nombre_via?: string | null;
    tipo_via?: string | null;
    /** Solo se usa en el opt-in exacto. NUNCA en los demás paths. */
    numero?: string | null;
    /** Urbanización / zona (de-facto place name). */
    residencial?: string | null;
    poblacion?: string | null;
    tipoVivienda?: string | null;
    visibilidad?: VisibilidadDireccion | string | null;
    /** = `encargos.ubicacion_exacta_publica === true`. */
    exposeExact: boolean;
}

/**
 * Devuelve el string para `<location_detail>` (≤50 chars) o '' (omitir el nodo).
 */
export function getPublicAddress(args: PublicAddressArgs): string {
    const cap = (s: string) => truncateAtWord(s ?? '', MAX_LEN);

    // 1) OCULTAR → nada de calle. Solo zona/urbanización (town ya lleva población).
    if (args.visibilidad === 'ocultar') return cap(args.residencial ?? '');

    // 2) OPT-IN EXACTO (único path con número): flag true + visibilidad 'exacta'.
    //    `=== true` estricto: defense-in-depth (igual que getPublicCoords).
    if (args.exposeExact === true && args.visibilidad === 'exacta') {
        const street = resolveStreet(args);
        if (street) return joinWithinLimit([street, args.numero], ' ', MAX_LEN);
        return cap(args.residencial ?? '');
    }

    // 3) DEFAULT (flag false, incl. los 181 actuales): calle SIN número por tipo.
    if (granularityForType(args.tipoVivienda) === 'street') {
        const street = resolveStreet(args);
        // FAIL-CLOSED (red de seguridad RGPD, prioridad #1): emite la calle SOLO si
        // está limpia (sin dígito ni token de unidad). Cubre tanto el parser de `dir`
        // (que ya self-guarda) como la rama `nombre_via` (que podría traer "Mayor 5").
        if (street && !streetHasLeak(street)) {
            return joinWithinLimit([street, args.residencial], ' – ', MAX_LEN);
        }
        // Sin calle limpia → degrada a zona limpia (NUNCA número ni string a medias).
        return cap(args.residencial ?? '');
    }

    // 'zone' (aislados + desconocido): NUNCA calle. Solo urbanización/zona; si no, ''.
    return cap(args.residencial ?? '');
}
