import { parseSpanishNumber } from '@/lib/utils/parse-spanish-number';

// `encargos.precio` (y otras cols numéricas tipo `text`) acepta formato ES
// con punto como separador de miles ("320.000" = 320 mil). `Number()` raw lo
// parsea como decimal US y devuelve 320 — bug que se materializaba en la web
// como "€ 320" en lugar de "€ 320.000". Delegamos en `parseSpanishNumber`.
export function numOrUndef(v: unknown): number | undefined {
    return parseSpanishNumber(v);
}

export function parseSiNo(v: unknown): boolean | undefined {
    if (v === null || v === undefined || v === '') return undefined;
    if (typeof v === 'boolean') return v;
    const s = String(v).toLowerCase().trim();
    if (s === 'sí' || s === 'si' || s === 'true' || s === '1') return true;
    if (s === 'no' || s === 'false' || s === '0') return false;
    return undefined;
}

/**
 * Flag de presencia estilo falsy-list para los `res_*` de equipamiento
 * (garaje/trastero/ascensor). Espejo del `hasEncargoFlag` del CRM (regla
 * 10 de su CLAUDE.md) pero TRI-ESTADO, porque aquí somos un MERGER sobre
 * full_data, no un productor:
 *   - `'—'` / `''` / null = "sin especificar" → undefined (gana full_data)
 *   - `'No'` / `'0'` / `'false'` = no explícito → false
 *   - cualquier otro texto no vacío → true — cubre las variantes legacy
 *     `'Incluido'` / `'Aparcamiento incluido'` / `'Opcional'` que
 *     `parseSiNo` devolvía como undefined → el icono de garaje no salía
 *     para refs CRM-only (bug 3026/2998, 2026-08-03).
 */
export function presentFlag(v: unknown): boolean | undefined {
    if (typeof v === 'boolean') return v;
    if (v === null || v === undefined) return undefined;
    if (typeof v === 'number') return v > 0;
    const s = String(v).trim().toLowerCase();
    if (s === '' || s === '—' || s === '-') return undefined;
    if (s === 'no' || s === '0' || s === 'false') return false;
    return true;
}

export function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(obj)) {
        if (obj[k] !== undefined) out[k] = obj[k];
    }
    return out as Partial<T>;
}

/**
 * Mapea una fila de `encargos` (+ pub_overrides) a la forma que usa
 * `property_metadata.full_data` (campos Inmovilla). Pensado para refs
 * CRM-only donde `full_data` está vacío, o para refs Inmovilla cuyos
 * datos CRM son más recientes que el último pull.
 *
 * Prioridad segun CLAUDE.md: pub_overrides > encargo > full_data. Este
 * helper devuelve el merge de (encargo + overrides). El caller mergeá
 * después sobre full_data.
 *
 * Inmovilla divide "habitaciones" en sencillas vs dobles:
 *   - full_data.habitaciones = num_hab_simples
 *   - full_data.habdobles   = num_hab_dobles
 * La UI suma ambos para mostrar el total.
 */
export function encargoToFullDataShape(
    enc: Record<string, unknown> | null,
    overrides: Record<string, unknown> | null = null,
): Record<string, unknown> {
    if (!enc && !overrides) return {};
    const merged = { ...(enc || {}), ...(overrides || {}) };
    // contractType → keyacci de Inmovilla (1 = venta/traspaso, 2 = alquiler).
    // Sin esto el filtro Comprar/Alquilar del catálogo trata el keyacci
    // undefined como "pasa en ambos" y el inmueble aparece en las dos
    // pestañas (regresión vista en 2980 tras la fusión).
    const ct = (merged.contractType as string) || '';
    const keyacci = ct.startsWith('alquiler') ? 2 : (ct ? 1 : undefined);
    return stripUndefined({
        keyacci,
        precio: numOrUndef(merged.precio),
        // Inmovilla guarda el precio en `precioinmo` (ventas) o `precioalq`
        // (alquileres). Refs CRM-only que nunca pasaron por el pull de
        // Inmovilla no tienen ninguno de los dos en full_data. Rellenamos
        // ambos desde encargos.precio:
        //  - precioinmo siempre, porque PropertyDetailClient lo usa como
        //    fuente única sin distinguir keyacci.
        //  - precioalq solo cuando keyacci===2, porque
        //    LuxuryPropertyCard (listado) y effectivePrice (sort) leen
        //    de un campo u otro según keyacci. Sin esto, los alquileres
        //    CRM-only muestran "Precio bajo consulta" en el listado.
        precioinmo: numOrUndef(merged.precio),
        precioalq: keyacci === 2 ? numOrUndef(merged.precio) : undefined,
        habitaciones: numOrUndef(merged.num_hab_simples),
        habdobles: numOrUndef(merged.num_hab_dobles),
        banyos: numOrUndef(merged.num_banos),
        aseos: numOrUndef(merged.num_aseos),
        m_cons: numOrUndef(merged.loc_m2_const),
        m_util: numOrUndef(merged.loc_m2_util),
        // Clave `antiguedad`: el resto del repo (PropertyDetailClient,
        // page.tsx JSON-LD) lee `antiguedad` como el AÑO de construcción
        // — misnomer histórico de Inmovilla, conservado por compat. El
        // productor emitía `ano_cons`, que ningún consumidor leía → el
        // año nunca aparecía para refs CRM-only. Alineado al consumidor.
        antiguedad: numOrUndef(merged.edi_ano_construccion),
        tipo_nombre: (merged.tipo_vivienda as string) || undefined,
        // `ciudad` es el campo legacy del formulario, `poblacion` es el
        // split nuevo. Muchos encargos solo tienen `ciudad` — fallback.
        poblacion: (merged.poblacion as string) || (merged.ciudad as string) || undefined,
        orientacion: (merged.res_ori as string) || undefined,
        ascensor: presentFlag(merged.res_asc),
        // res_gar_numero poblado también señala garaje (mismo criterio que
        // el cartel y buildFullData del CRM).
        garaje: presentFlag(merged.res_gar) === true || presentFlag(merged.res_gar_numero) === true
            ? true
            : presentFlag(merged.res_gar),
        trastero: presentFlag(merged.res_tras),
        // res_t1/t2/t3 son M² ("70", "40"), no Sí/No — parseSiNo("70") daba
        // undefined y la terraza desaparecía para refs CRM-only.
        terraza: ((numOrUndef(merged.res_t1) || 0) + (numOrUndef(merged.res_t2) || 0) + (numOrUndef(merged.res_t3) || 0)) > 0
            ? true
            : undefined,
        patio: (() => {
            const n = numOrUndef(merged.res_patio);
            if (n === undefined) return undefined;
            return n > 0 ? true : false;
        })(),
        jardin: parseSiNo(merged.jardin_propio),
        piscina: parseSiNo(merged.piscina_comunitaria) || parseSiNo(merged.piscina_privada) || undefined,
        amueblado: (merged.amueblado as string) || undefined,
        calefaccion: (merged.calefaccion as string) || undefined,
        aire_acondicionado: (merged.aire_acondicionado as string) || undefined,
        armarios: parseSiNo(merged.armarios_empotrados),
        balcon: parseSiNo(merged.balcon),
        cocina_independiente: parseSiNo(merged.cocina_independiente),
        adaptado_movilidad: parseSiNo(merged.adaptado_movilidad),
        com_mes: numOrUndef(merged.com_mes),
        ibi_anual: numOrUndef(merged.ibi_anual),
        estado_conservacion: (merged.edi_estado_conservacion as string) || undefined,
        planta: numOrUndef(merged.planta) ?? ((merged.planta as string) || undefined),
    });
}
