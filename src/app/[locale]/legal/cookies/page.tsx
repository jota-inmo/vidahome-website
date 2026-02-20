import React from 'react';

export const metadata = {
    title: 'Política de Cookies | Vidahome',
    description: 'Información sobre el uso de cookies en la web de Vidahome.',
};

export default function CookiesPage() {
    return (
        <article>
            <h1 className="font-serif text-4xl mb-12">Política de Cookies</h1>

            <section>
                <h2 className="text-xl font-semibold">1. ¿Qué son las cookies?</h2>
                <p>
                    Una cookie es un pequeño fragmento de texto que los sitios web que visitas envían al navegador y que permite que el sitio web recuerde información sobre tu visita, como tu idioma preferido y otras opciones, lo que puede facilitar tu próxima visita y hacer que el sitio te resulte más útil.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-semibold">2. Tipos de cookies utilizadas</h2>
                <p>Este sitio web utiliza los siguientes tipos de cookies:</p>
                <ul>
                    <li><strong>Cookies técnicas:</strong> Son aquellas que permiten al usuario la navegación a través de una página web y la utilización de las diferentes opciones o servicios que en ella existan.</li>
                    <li><strong>Cookies de personalización:</strong> Permiten al usuario acceder al servicio con algunas características de carácter general predefinidas.</li>
                    <li><strong>Cookies de análisis:</strong> Son aquellas que bien tratadas por nosotros o por terceros, nos permiten cuantificar el número de usuarios y realizar la medición y análisis estadístico de la utilización que hacen los usuarios del servicio ofertado.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-semibold">3. Cómo deshabilitar las cookies</h2>
                <p>
                    Puedes permitir, bloquear o eliminar las cookies instaladas en tu equipo mediante la configuración de las opciones del navegador instalado en tu ordenador:
                </p>
                <ul>
                    <li><strong>Chrome:</strong> Configuración - Mostrar opciones avanzadas - Privacidad - Configuración de contenido.</li>
                    <li><strong>Firefox:</strong> Herramientas - Opciones - Privacidad - Historial - Configuración Personalizada.</li>
                    <li><strong>Safari:</strong> Preferencias - Seguridad.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-semibold">4. Consentimiento</h2>
                <p>
                    Al navegar y continuar en nuestro sitio web estarás consintiendo el uso de las cookies antes enunciadas, en las condiciones contenidas en la presente Política de Cookies.
                </p>
            </section>
        </article>
    );
}
