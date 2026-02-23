/**
 * Maps Spanish property type names from Inmovilla API to localized versions.
 * Inmovilla always returns tipo_nombre in Spanish regardless of the requested language.
 */

const typeTranslations: Record<string, Record<string, string>> = {
    // Residencial
    'Piso': { en: 'Apartment', fr: 'Appartement', de: 'Wohnung' },
    'Apartamento': { en: 'Apartment', fr: 'Appartement', de: 'Wohnung' },
    'Chalet': { en: 'Villa', fr: 'Villa', de: 'Villa' },
    'Chalet Adosado': { en: 'Townhouse', fr: 'Maison de ville', de: 'Reihenhaus' },
    'Adosado': { en: 'Townhouse', fr: 'Maison de ville', de: 'Reihenhaus' },
    'Casa': { en: 'House', fr: 'Maison', de: 'Haus' },
    'Villa': { en: 'Villa', fr: 'Villa', de: 'Villa' },
    'Ático': { en: 'Penthouse', fr: 'Penthouse', de: 'Penthouse' },
    'Atico': { en: 'Penthouse', fr: 'Penthouse', de: 'Penthouse' },
    'Duplex': { en: 'Duplex', fr: 'Duplex', de: 'Duplex' },
    'Dúplex': { en: 'Duplex', fr: 'Duplex', de: 'Duplex' },
    'Estudio': { en: 'Studio', fr: 'Studio', de: 'Studio' },
    'Loft': { en: 'Loft', fr: 'Loft', de: 'Loft' },
    'Bungalow': { en: 'Bungalow', fr: 'Bungalow', de: 'Bungalow' },
    'Mansión': { en: 'Mansion', fr: 'Manoir', de: 'Anwesen' },
    'Residencia': { en: 'Residence', fr: 'Résidence', de: 'Residenz' },
    // Comercial
    'Local Comercial': { en: 'Commercial Space', fr: 'Local commercial', de: 'Gewerberaum' },
    'Local': { en: 'Commercial Space', fr: 'Local commercial', de: 'Gewerberaum' },
    'Oficina': { en: 'Office', fr: 'Bureau', de: 'Büro' },
    'Nave Industrial': { en: 'Industrial Unit', fr: 'Entrepôt industriel', de: 'Industriegebäude' },
    'Nave': { en: 'Warehouse', fr: 'Entrepôt', de: 'Lagerhalle' },
    // Terreno
    'Parcela': { en: 'Plot', fr: 'Parcelle', de: 'Parzelle' },
    'Solar': { en: 'Building Plot', fr: 'Terrain à bâtir', de: 'Baugrundstück' },
    'Terreno': { en: 'Land', fr: 'Terrain', de: 'Grundstück' },
    'Finca': { en: 'Country Estate', fr: 'Propriété rurale', de: 'Landgut' },
    // Otros
    'Garaje': { en: 'Garage', fr: 'Garage', de: 'Garage' },
    'Trastero': { en: 'Storage Room', fr: 'Débarras', de: 'Abstellraum' },
    'Hotel': { en: 'Hotel', fr: 'Hôtel', de: 'Hotel' },
};

/**
 * Returns the localized property type name.
 * Falls back to the original Spanish name if no translation is found.
 */
export function translatePropertyType(tipoNombre: string | undefined | null, locale: string): string {
    if (!tipoNombre) return '';
    if (locale === 'es') return tipoNombre;

    const translation = typeTranslations[tipoNombre];
    if (translation && translation[locale]) {
        return translation[locale];
    }

    // Try case-insensitive match
    const key = Object.keys(typeTranslations).find(
        k => k.toLowerCase() === tipoNombre.toLowerCase()
    );
    if (key && typeTranslations[key][locale]) {
        return typeTranslations[key][locale];
    }

    // Return original if no translation found
    return tipoNombre;
}
