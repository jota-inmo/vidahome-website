import { describe, it, expect } from 'vitest';
import { extractFaq, plainDescription, stripMarkdown } from './markdown-utils';

describe('stripMarkdown', () => {
    it('quita enlaces, énfasis, títulos, listas y imágenes', () => {
        const md = [
            '## Título',
            'Texto con **negrita**, _cursiva_ y un [enlace](https://vidahome.es/es/contacto).',
            '- punto uno',
            '1. punto dos',
            '![foto](https://x.test/a.jpg)',
        ].join('\n');
        expect(stripMarkdown(md)).toBe('Título Texto con negrita, cursiva y un enlace. punto uno punto dos');
    });
});

describe('plainDescription', () => {
    it('devuelve el texto entero si cabe', () => {
        expect(plainDescription('Hola **mundo**')).toBe('Hola mundo');
    });

    it('recorta sin partir palabras y añade puntos suspensivos', () => {
        const long = 'palabra '.repeat(60);
        const out = plainDescription(long, 100);
        expect(out.length).toBeLessThanOrEqual(100);
        expect(out.endsWith('…')).toBe(true);
        expect(out).not.toMatch(/palab…$/);
    });
});

describe('extractFaq', () => {
    const es = [
        '## Cómo comprar',
        'Texto normal.',
        '### ¿Esto no es una pregunta frecuente?',
        'Está fuera de la sección FAQ.',
        '## Preguntas frecuentes',
        '### ¿Necesito NIE para comprar?',
        'Sí. Es obligatorio para **cualquier** compra.',
        '',
        'Se pide en la policía o en el consulado.',
        '### ¿Puedo pagar con transferencia?',
        'Sí, desde una cuenta a tu nombre.',
        '## Contacto',
        '### ¿Hablamos?',
        'Escríbenos.',
    ].join('\n');

    it('extrae solo las preguntas de la sección FAQ', () => {
        const faq = extractFaq(es);
        expect(faq).toHaveLength(2);
        expect(faq[0].question).toBe('¿Necesito NIE para comprar?');
        expect(faq[0].answer).toBe('Sí. Es obligatorio para cualquier compra. Se pide en la policía o en el consulado.');
        expect(faq[1]).toEqual({
            question: '¿Puedo pagar con transferencia?',
            answer: 'Sí, desde una cuenta a tu nombre.',
        });
    });

    it.each([
        ['## FAQ'],
        ['## Frequently asked questions'],
        ['## Questions fréquentes'],
        ['## Häufige Fragen'],
        ['## Domande frequenti'],
        ['## Najczęściej zadawane pytania'],
    ])('reconoce el título %s', (heading) => {
        const md = `${heading}\n### P1\nR1\n### P2\nR2`;
        expect(extractFaq(md)).toHaveLength(2);
    });

    it('devuelve vacío si no hay sección FAQ', () => {
        expect(extractFaq('## Otra cosa\n### ¿Algo?\nSí.')).toEqual([]);
    });

    it('ignora preguntas sin respuesta', () => {
        expect(extractFaq('## FAQ\n### Sin respuesta\n### Con respuesta\nHola')).toEqual([
            { question: 'Con respuesta', answer: 'Hola' },
        ]);
    });
});
