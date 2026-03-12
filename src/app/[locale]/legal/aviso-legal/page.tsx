import React from 'react';
import { getLegalPageAction } from '@/app/actions/legal';
import { notFound } from 'next/navigation';

export const metadata = {
    title: 'Aviso Legal | Vidahome',
    description: 'Información legal y términos de uso de la web oficial de Vidahome.',
};

export default async function AvisoLegalPage({ params }: { params: { locale: string } }) {
    const locale = params.locale;
    const page = await getLegalPageAction('legal');

    if (!page) {
        // Fallback static version if DB is not ready or page missing
        return (
            <article>
                <h1 className="font-serif text-4xl mb-12">Aviso Legal</h1>
                <section>
                    <h2 className="text-xl font-semibold">1. Datos Identificativos</h2>
                    <p>En cumplimiento con el deber de información recogido en artículo 10 de la Ley 34/2002...</p>
                    <ul className="list-none pl-0">
                        <li><strong>Titular:</strong> Vidahome Gandia S.L.</li>
                        <li><strong>Email:</strong> info@vidahome.es</li>
                    </ul>
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
