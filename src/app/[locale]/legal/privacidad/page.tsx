import React from 'react';
import { getLegalPageAction } from '@/app/actions/legal';

export const metadata = {
    title: 'Política de Privacidad | Vidahome',
    description: 'Información sobre el tratamiento de datos personales de acuerdo con el RGPD.',
};

// El contenido vive en `legal_pages` (Supabase) y se edita desde
// /[locale]/admin/legal. Cache de 60s garantiza que ediciones (vía UI o
// SQL directo) se reflejen en producción sin necesidad de redeploy.
export const revalidate = 60;

export default async function PrivacidadPage({ params }: { params: { locale: string } }) {
    const locale = params.locale;
    const page = await getLegalPageAction('privacy');

    if (!page) {
        return (
            <article>
                <h1 className="font-serif text-4xl mb-12">Política de Privacidad</h1>
                <section>
                    <h2 className="text-xl font-semibold">1. Información al Usuario</h2>
                    <p>Vidahome, como responsable del tratamiento, informa de que de acuerdo con el RGPD...</p>
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
