/**
 * Maps Spanish property type names from Inmovilla API to localized versions.
 * Inmovilla always returns tipo_nombre in Spanish regardless of the requested language.
 */

const typeTranslations: Record<string, Record<string, string>> = {
    // Residencial
    'Piso': { en: 'Apartment', fr: 'Appartement', de: 'Wohnung', it: 'Appartamento', pl: 'Mieszkanie' },
    'Apartamento': { en: 'Apartment', fr: 'Appartement', de: 'Wohnung', it: 'Appartamento', pl: 'Mieszkanie' },
    'Chalet': { en: 'Villa', fr: 'Villa', de: 'Villa', it: 'Villa', pl: 'Willa' },
    'Chalet Adosado': { en: 'Townhouse', fr: 'Maison de ville', de: 'Reihenhaus', it: 'Villetta a schiera', pl: 'Dom szeregowy' },
    'Adosado': { en: 'Townhouse', fr: 'Maison de ville', de: 'Reihenhaus', it: 'Villetta a schiera', pl: 'Dom szeregowy' },
    'Casa': { en: 'House', fr: 'Maison', de: 'Haus', it: 'Casa', pl: 'Dom' },
    'Villa': { en: 'Villa', fr: 'Villa', de: 'Villa', it: 'Villa', pl: 'Willa' },
    'Ático': { en: 'Penthouse', fr: 'Penthouse', de: 'Penthouse', it: 'Attico', pl: 'Penthouse' },
    'Atico': { en: 'Penthouse', fr: 'Penthouse', de: 'Penthouse', it: 'Attico', pl: 'Penthouse' },
    'Duplex': { en: 'Duplex', fr: 'Duplex', de: 'Duplex', it: 'Duplex', pl: 'Duplex' },
    'Dúplex': { en: 'Duplex', fr: 'Duplex', de: 'Duplex', it: 'Duplex', pl: 'Duplex' },
    'Estudio': { en: 'Studio', fr: 'Studio', de: 'Studio', it: 'Monolocale', pl: 'Kawalerka' },
    'Loft': { en: 'Loft', fr: 'Loft', de: 'Loft', it: 'Loft', pl: 'Loft' },
    'Bungalow': { en: 'Bungalow', fr: 'Bungalow', de: 'Bungalow', it: 'Bungalow', pl: 'Bungalow' },
    'Mansión': { en: 'Mansion', fr: 'Manoir', de: 'Anwesen', it: 'Dimora', pl: 'Rezydencja' },
    'Residencia': { en: 'Residence', fr: 'Résidence', de: 'Residenz', it: 'Residenza', pl: 'Rezydencja' },
    // Comercial
    'Local Comercial': { en: 'Commercial Space', fr: 'Local commercial', de: 'Gewerberaum', it: 'Locale commerciale', pl: 'Lokal użytkowy' },
    'Local': { en: 'Commercial Space', fr: 'Local commercial', de: 'Gewerberaum', it: 'Locale commerciale', pl: 'Lokal użytkowy' },
    'Oficina': { en: 'Office', fr: 'Bureau', de: 'Büro', it: 'Ufficio', pl: 'Biuro' },
    'Nave Industrial': { en: 'Industrial Unit', fr: 'Entrepôt industriel', de: 'Industriegebäude', it: 'Capannone industriale', pl: 'Hala przemysłowa' },
    'Nave': { en: 'Warehouse', fr: 'Entrepôt', de: 'Lagerhalle', it: 'Capannone', pl: 'Magazyn' },
    // Terreno
    'Parcela': { en: 'Plot', fr: 'Parcelle', de: 'Parzelle', it: 'Terreno', pl: 'Działka' },
    'Solar': { en: 'Building Plot', fr: 'Terrain à bâtir', de: 'Baugrundstück', it: 'Terreno edificabile', pl: 'Działka budowlana' },
    'Terreno': { en: 'Land', fr: 'Terrain', de: 'Grundstück', it: 'Terreno', pl: 'Grunt' },
    'Finca': { en: 'Country Estate', fr: 'Propriété rurale', de: 'Landgut', it: 'Tenuta', pl: 'Posiadłość wiejska' },
    // Otros
    'Garaje': { en: 'Garage', fr: 'Garage', de: 'Garage', it: 'Garage', pl: 'Garaż' },
    'Trastero': { en: 'Storage Room', fr: 'Débarras', de: 'Abstellraum', it: 'Ripostiglio', pl: 'Komórka lokatorska' },
    'Hotel': { en: 'Hotel', fr: 'Hôtel', de: 'Hotel', it: 'Hotel', pl: 'Hotel' },
    // Legacy fallback — some DB rows may have 'Property' stored from old hardcoded default
    'Property': { es: 'Propiedad', en: 'Property', fr: 'Propriété', de: 'Immobilie', it: 'Immobile', pl: 'Nieruchomość' },
};

/**
 * Returns the localized property type name.
 * Falls back to the original Spanish name if no translation is found.
 */
export function translatePropertyType(tipoNombre: string | undefined | null, locale: string): string {
    if (!tipoNombre) return '';

    // For Spanish locale, still check the map in case the stored value is English
    // (legacy rows may have "Property" instead of the Spanish name)
    if (locale === 'es') {
        const entry = typeTranslations[tipoNombre];
        if (entry && entry['es']) return entry['es'];
        return tipoNombre;
    }

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
