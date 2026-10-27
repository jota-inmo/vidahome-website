import { describe, it, expect } from 'vitest';
import { stripPrivateFields, PRIVATE_FIELDS } from './privateFields';

describe('stripPrivateFields', () => {
    const sample = {
        ref: '3001', poblacion: 'Oliva', habitaciones: 3,
        dir: 'Calle Mayor 5', calle: 'Mayor', cp: '46780', numero: '5',
        tipo_via: 'Calle', nombre_via: 'Mayor', bloque: '1', escalera: 'A', puerta: '2',
        latitud: 38.9, longitud: -0.1, lat: 38.9, lng: -0.1,
        lat_exacta: 38.9, lng_exacta: -0.1, coordenadas: '38.9,-0.1', ubicacion: 'x',
    };

    it('elimina todas las claves privadas', () => {
        const out = stripPrivateFields(sample);
        for (const k of PRIVATE_FIELDS) expect(out).not.toHaveProperty(k);
    });

    it('conserva los campos públicos', () => {
        expect(stripPrivateFields(sample)).toEqual({ ref: '3001', poblacion: 'Oliva', habitaciones: 3 });
    });

    it('no muta el original', () => {
        const copy = { ...sample };
        stripPrivateFields(sample);
        expect(sample).toEqual(copy);
    });
});
