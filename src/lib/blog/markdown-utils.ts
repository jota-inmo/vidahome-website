/**
 * Utilidades puras para el texto markdown de los artículos del blog.
 * Sin dependencias de React ni de Next para poder testearlas sin más.
 */

export interface FaqItem {
    question: string;
    answer: string;
}

/**
 * Títulos que marcan la sección de preguntas frecuentes, ya normalizados
 * (minúsculas, sin tildes, sin signos). Cubre los 6 idiomas de la web.
 */
const FAQ_HEADINGS = new Set([
    'preguntas frecuentes',
    'faq',
    'frequently asked questions',
    'questions frequentes',
    'haufige fragen',
    'haeufige fragen',
    'domande frequenti',
    'najczesciej zadawane pytania',
    'czesto zadawane pytania',
]);

function normalizeHeading(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/ł/g, 'l')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/** Quita la sintaxis markdown y deja texto plano en una sola línea. */
export function stripMarkdown(markdown: string): string {
    return markdown
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/^\s{0,3}#{1,6}\s+/gm, '')
        .replace(/^\s*>\s?/gm, '')
        .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, '')
        .replace(/(\*\*|__|\*|_|`)/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Descripción de respaldo: texto plano del artículo recortado sin partir
 * palabras. Se usa solo cuando el artículo no trae `meta_description` ni extracto.
 */
export function plainDescription(markdown: string, maxLength = 160): string {
    const text = stripMarkdown(markdown);
    if (text.length <= maxLength) return text;
    const cut = text.slice(0, maxLength - 1);
    const lastSpace = cut.lastIndexOf(' ');
    return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * Extrae las preguntas frecuentes del artículo.
 *
 * Convención: un título `##` con el nombre de la sección ("Preguntas
 * frecuentes", "FAQ", …) y debajo un `###` por pregunta; el texto hasta el
 * siguiente `###` es la respuesta.
 */
export function extractFaq(markdown: string): FaqItem[] {
    const lines = markdown.split(/\r?\n/);
    const items: FaqItem[] = [];

    let inFaq = false;
    let question: string | null = null;
    let answerLines: string[] = [];

    const flush = () => {
        if (question) {
            const answer = stripMarkdown(answerLines.join('\n'));
            if (answer) items.push({ question, answer });
        }
        question = null;
        answerLines = [];
    };

    for (const line of lines) {
        const h2 = /^\s{0,3}##\s+(.+?)\s*#*\s*$/.exec(line);
        if (h2) {
            flush();
            inFaq = FAQ_HEADINGS.has(normalizeHeading(h2[1]));
            continue;
        }
        if (!inFaq) continue;

        const h3 = /^\s{0,3}###\s+(.+?)\s*#*\s*$/.exec(line);
        if (h3) {
            flush();
            question = stripMarkdown(h3[1]);
            continue;
        }
        if (question) answerLines.push(line);
    }
    flush();

    return items;
}
