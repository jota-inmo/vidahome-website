// Fuente única de locales soportados. Sin dependencias de next-intl para que
// pueda importarse desde tests y desde el middleware (Edge).
export const LOCALES = ['es', 'en', 'fr', 'de', 'it', 'pl'] as const;
