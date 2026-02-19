import React from 'react';

export const metadata = {
    title: 'Aviso Legal | Vidahome',
    description: 'Información legal y términos de uso de la web oficial de Vidahome.',
};

export default function AvisoLegalPage() {
    return (
        <article>
            <h1 className="font-serif text-4xl mb-12">Aviso Legal</h1>

            <section>
                <h2 className="text-xl font-semibold">1. Datos Identificativos</h2>
                <p>
                    En cumplimiento con el deber de información recogido en artículo 10 de la Ley 34/2002, de 11 de julio,
                    de Servicios de la Sociedad de la Información y del Comercio Electrónico, a continuación se reflejan los siguientes datos:
                </p>
                <ul className="list-none pl-0">
                    <li><strong>Titular:</strong> Vidahome (Responsable a definir por el cliente)</li>
                    <li><strong>CIF/NIF:</strong> [A completar por el cliente]</li>
                    <li><strong>Domicilio Social:</strong> Carrer Joan XXIII, 1, 46730 Grau i Platja, Gandia, Valencia</li>
                    <li><strong>Email:</strong> info@vidahome.es</li>
                    <li><strong>Teléfono:</strong> +34 659 02 75 12</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-semibold">2. Usuarios</h2>
                <p>
                    El acceso y/o uso de este portal de Vidahome atribuye la condición de USUARIO, que acepta, desde dicho acceso y/o uso,
                    las Condiciones Generales de Uso aquí reflejadas. Las citadas Condiciones serán de aplicación independientemente de las
                    Condiciones Generales de Contratación que en su caso resulten de obligado cumplimiento.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-semibold">3. Uso del Portal</h2>
                <p>
                    https://vidahome.es proporciona el acceso a multitud de informaciones, servicios, programas o datos (en adelante, "los contenidos")
                    en Internet pertenecientes a Vidahome o a sus licenciantes a los que el USUARIO pueda tener acceso.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-semibold">4. Propiedad Intelectual e Industrial</h2>
                <p>
                    Vidahome por sí o como cesionaria, es titular de todos los derechos de propiedad intelectual e industrial de su página web,
                    así como de los elementos contenidos en la misma (a título enunciativo, imágenes, sonido, audio, vídeo, software o textos;
                    marcas o logotipos, combinaciones de colores, estructura y diseño, selección de materiales usados, programas de ordenador
                    necesarios para su funcionamiento, acceso y uso, etc.).
                </p>
            </section>
        </article>
    );
}
