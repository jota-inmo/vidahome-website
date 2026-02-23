/**
 * Translates Spanish schedule/hours text to the target locale.
 * Works on free-form strings stored in Supabase like "Lunes - Viernes: 09:00 - 14:00 y 17:00 - 19:00"
 */

type TranslationMap = Record<string, string>;

const dayReplacements: Record<string, TranslationMap> = {
    en: {
        'Lunes - Viernes': 'Monday - Friday',
        'Lunes a Viernes': 'Monday to Friday',
        'Lunes–Viernes': 'Monday–Friday',
        'Lunes': 'Monday',
        'Martes': 'Tuesday',
        'Miércoles': 'Wednesday',
        'Miercoles': 'Wednesday',
        'Jueves': 'Thursday',
        'Viernes': 'Friday',
        'Sábado': 'Saturday',
        'Sabado': 'Saturday',
        'Domingo': 'Sunday',
        // Keywords
        ' y ': ' and ',
        'Cerrado': 'Closed',
        'Bajo cita': 'By appointment',
        'bajo cita': 'by appointment',
        'Cita previa': 'By appointment',
        'cita previa': 'by appointment',
    },
    fr: {
        'Lunes - Viernes': 'Lundi - Vendredi',
        'Lunes a Viernes': 'Lundi à Vendredi',
        'Lunes–Viernes': 'Lundi–Vendredi',
        'Lunes': 'Lundi',
        'Martes': 'Mardi',
        'Miércoles': 'Mercredi',
        'Miercoles': 'Mercredi',
        'Jueves': 'Jeudi',
        'Viernes': 'Vendredi',
        'Sábado': 'Samedi',
        'Sabado': 'Samedi',
        'Domingo': 'Dimanche',
        ' y ': ' et ',
        'Cerrado': 'Fermé',
        'Bajo cita': 'Sur rendez-vous',
        'bajo cita': 'sur rendez-vous',
        'Cita previa': 'Sur rendez-vous',
        'cita previa': 'sur rendez-vous',
    },
    de: {
        'Lunes - Viernes': 'Montag - Freitag',
        'Lunes a Viernes': 'Montag bis Freitag',
        'Lunes–Viernes': 'Montag–Freitag',
        'Lunes': 'Montag',
        'Martes': 'Dienstag',
        'Miércoles': 'Mittwoch',
        'Miercoles': 'Mittwoch',
        'Jueves': 'Donnerstag',
        'Viernes': 'Freitag',
        'Sábado': 'Samstag',
        'Sabado': 'Samstag',
        'Domingo': 'Sonntag',
        ' y ': ' und ',
        'Cerrado': 'Geschlossen',
        'Bajo cita': 'Nach Vereinbarung',
        'bajo cita': 'nach Vereinbarung',
        'Cita previa': 'Nach Vereinbarung',
        'cita previa': 'nach Vereinbarung',
    },
};

/**
 * Translates a Spanish schedule string (hours_week, hours_sat) to the given locale.
 * Falls back to the original text if locale is 'es' or no mapping available.
 */
export function translateSchedule(text: string | undefined | null, locale: string): string {
    if (!text) return '';
    if (locale === 'es' || !dayReplacements[locale]) return text;

    const map = dayReplacements[locale];
    let result = text;

    // Sort by length descending to avoid partial replacement (e.g., 'Lunes' before 'Lunes - Viernes')
    const sortedKeys = Object.keys(map).sort((a, b) => b.length - a.length);

    for (const spanish of sortedKeys) {
        result = result.split(spanish).join(map[spanish]);
    }

    return result;
}
