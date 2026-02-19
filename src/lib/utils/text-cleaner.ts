/**
 * Utilidades para limpiar y formatear textos provenientes de Inmovilla
 * siguiendo estándares de diseño de lujo y minimalismo.
 */

export function cleanDescription(text: string | undefined | null): string {
    if (!text) return '';

    let cleaned = text;

    // 1. Eliminar marcadores de sección de Inmovilla (~~) 
    // y sustituirlos por un espacio o salto de línea limpio
    cleaned = cleaned.replace(/~~+/g, '\n\n');

    // 2. Eliminar asteriscos de formato de portales (** o *) 
    // que ensucian la tipografía premium
    cleaned = cleaned.replace(/\*\*/g, '');
    cleaned = cleaned.replace(/\*/g, '');

    // 3. Limpiar emoticonos excesivos o "chillones"
    // Mantiene el texto puramente profesional.
    // Esta regex cubre la mayoría de emojis comunes.
    cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

    // 4. Normalizar espacios y saltos de línea múltiples
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.trim();

    return cleaned;
}
