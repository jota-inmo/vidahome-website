/**
 * Utilidades para limpiar y formatear textos provenientes de Inmovilla
 * siguiendo estándares de diseño de lujo y minimalismo.
 */

export function cleanDescription(text: string | undefined | null): string {
    if (!text) return '';

    let cleaned = text;

    // 1. Eliminar marcadores de sección de Inmovilla (~~) 
    cleaned = cleaned.replace(/~~+/g, '\n\n');

    // 2. Eliminar asteriscos de formato de portales (** o *) 
    cleaned = cleaned.replace(/\*\*/g, '');
    cleaned = cleaned.replace(/\*/g, '');

    // 3. Eliminar artefactos de portales como [portal] o similar
    cleaned = cleaned.replace(/\[.*?\]/g, '');

    // 4. Limpiar emoticonos excesivos o "chillones"
    // Regex mejorada para cubrir más rangos de emojis incluyendo casas y símbolos varios
    cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{27BF}]/gu, '');

    // 5. Normalizar espacios en blanco (colapsar múltiples espacios a uno solo)
    cleaned = cleaned.replace(/[ ]{2,}/g, ' ');

    // 6. Normalizar saltos de línea múltiples
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.trim();

    return cleaned;
}
