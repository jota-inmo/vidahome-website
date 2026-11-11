import React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from '@/i18n/routing';
import { LOCALES } from '@/i18n/locales';

const LOCALE_PREFIX = new RegExp(`^/(${LOCALES.join('|')})(?=/|$)`);

/**
 * Los enlaces internos se escriben sin idioma (`/propiedades`, `/vender`):
 * `Link` de next-intl añade el prefijo del idioma del artículo. Si alguien
 * escribe `/es/propiedades` se quita el prefijo para no duplicarlo.
 */
function internalPath(href: string): string {
    return href.replace(LOCALE_PREFIX, '') || '/';
}

const components: Components = {
    // El título de la página ya es el único h1: un `#` dentro del texto baja a h2.
    h1: ({ children }) => <h2 className="text-3xl font-serif mt-14 mb-5 leading-tight">{children}</h2>,
    h2: ({ children }) => <h2 className="text-3xl font-serif mt-14 mb-5 leading-tight">{children}</h2>,
    h3: ({ children }) => <h3 className="text-xl font-serif mt-8 mb-3 leading-snug">{children}</h3>,
    h4: ({ children }) => <h4 className="text-lg font-semibold mt-6 mb-2">{children}</h4>,
    p: ({ children }) => <p className="my-5">{children}</p>,
    ul: ({ children }) => <ul className="my-5 list-disc pl-6 space-y-2">{children}</ul>,
    ol: ({ children }) => <ol className="my-5 list-decimal pl-6 space-y-2">{children}</ol>,
    blockquote: ({ children }) => (
        <blockquote className="my-8 border-l-4 border-slate-300 dark:border-slate-700 pl-6 italic text-slate-600 dark:text-slate-400">
            {children}
        </blockquote>
    ),
    hr: () => <hr className="my-12 border-slate-200 dark:border-slate-800" />,
    strong: ({ children }) => <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>,
    code: ({ children }) => (
        <code className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-base">{children}</code>
    ),
    table: ({ children }) => (
        <div className="my-8 overflow-x-auto">
            <table className="w-full border-collapse text-base">{children}</table>
        </div>
    ),
    th: ({ children }) => (
        <th className="border-b-2 border-slate-300 dark:border-slate-700 px-3 py-2 text-left font-semibold">
            {children}
        </th>
    ),
    td: ({ children }) => (
        <td className="border-b border-slate-200 dark:border-slate-800 px-3 py-2 align-top">{children}</td>
    ),
    a: ({ href, children }) => {
        if (!href) return <>{children}</>;
        const className = 'underline underline-offset-4 decoration-slate-400 hover:decoration-current';
        if (href.startsWith('/') && !href.startsWith('//')) {
            return (
                <Link href={internalPath(href)} className={className}>
                    {children}
                </Link>
            );
        }
        if (/^https?:\/\//i.test(href)) {
            return (
                <a href={href} className={className} target="_blank" rel="noopener noreferrer">
                    {children}
                </a>
            );
        }
        // mailto:, tel:, #ancla
        return (
            <a href={href} className={className}>
                {children}
            </a>
        );
    },
    // `![texto alternativo](url "pie de foto")`. Se usa <span> y no <figure>
    // porque react-markdown deja la imagen dentro de un <p>.
    img: ({ src, alt, title }) => {
        if (typeof src !== 'string' || !src) return null;
        return (
            <span className="block my-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={src}
                    alt={alt ?? ''}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-auto rounded-lg"
                />
                {title ? (
                    <span className="block mt-2 text-sm text-slate-500 dark:text-slate-400">{title}</span>
                ) : null}
            </span>
        );
    },
};

/**
 * Cuerpo de un artículo del blog. Sin HTML crudo (react-markdown no lo
 * interpreta) y con los protocolos de enlace que filtra por defecto.
 */
export function BlogMarkdown({ content }: { content: string }) {
    return (
        <div className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {content}
            </ReactMarkdown>
        </div>
    );
}
