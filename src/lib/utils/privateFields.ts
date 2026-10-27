// Denylist de claves que NUNCA deben llegar al cliente en datos de propiedad.
// Defensa en profundidad: `full_data` ya no debería traer dirección (strip SQL
// 2026-08-03), pero este filtro evita que una regresión del CRM la reabra.
// Las coordenadas públicas se añaden después, ya con jitter (getPublicCoords).
export const PRIVATE_FIELDS = [
    'dir', 'calle', 'cp', 'numero', 'tipo_via', 'nombre_via', 'bloque', 'escalera', 'puerta',
    'latitud', 'longitud', 'lat', 'lng', 'lat_exacta', 'lng_exacta', 'coordenadas', 'ubicacion',
] as const;

export function stripPrivateFields<T extends Record<string, any>>(obj: T): Record<string, any> {
    const out: Record<string, any> = { ...obj };
    for (const k of PRIVATE_FIELDS) delete out[k];
    return out;
}
