import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
    // A list of all locales that are supported
    locales: ['es', 'en', 'fr', 'de', 'pl'],

    // Used when no locale matches
    defaultLocale: 'es',

    // Optional: Always use a prefix (e.g. /es, /en, /fr, /de, /pl)
    localePrefix: 'always'
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
    createNavigation(routing);
