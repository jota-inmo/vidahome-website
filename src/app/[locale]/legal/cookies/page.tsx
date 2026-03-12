import React from 'react';
import { getLegalPageAction } from '@/app/actions/legal';

export const metadata = {
    title: 'Política de Cookies | Vidahome',
    description: 'Información sobre el uso de cookies en la web de Vidahome.',
};

export default async function CookiesPage({ params }: { params: { locale: string } }) {
    const locale = params.locale;
    const page = await getLegalPageAction('cookies');

    if (!page) {
        return (
            <article>
                <h1 className="font-serif text-4xl mb-12">Política de Cookies</h1>
                <section>
                    <h2 className="text-xl font-semibold">1. ¿Qué son las cookies?</h2>
                    <p>Una cookie es un pequeño fragmento de texto...</p>
                </section>
            </article>
        );
    }

    const title = (page as any)[`title_${locale}`] || page.title_es;
    const content = (page as any)[`content_${locale}`] || page.content_es;

    return (
        <article>
            <h1 className="font-serif text-4xl mb-12">{title}</h1>
            <div 
                className="prose prose-slate max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: content }} 
            />
        </article>
    );
}
