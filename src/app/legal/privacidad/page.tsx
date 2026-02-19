import React from 'react';

export const metadata = {
    title: 'Política de Privacidad | Vidahome',
    description: 'Información sobre el tratamiento de datos personales de acuerdo con el RGPD.',
};

export default function PrivacidadPage() {
    return (
        <article>
            <h1 className="font-serif text-4xl mb-12">Política de Privacidad</h1>

            <section>
                <h2 className="text-xl font-semibold">1. Información al Usuario</h2>
                <p>
                    Vidahome, como responsable del tratamiento, informa de que de acuerdo con el Reglamento (UE) 2016/679 de 27 de abril de 2016 (RGPD)
                    relativo a la protección de las personas físicas en lo que respecta al tratamiento de datos personales, sus datos serán tratados
                    de forma lícita, leal y transparente.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-semibold">2. Finalidad del Tratamiento</h2>
                <p>
                    Mantener una relación comercial con el Usuario. Las operaciones previstas para realizar el tratamiento son:
                </p>
                <ul>
                    <li>Tramitación de encargos, solicitudes o cualquier tipo de petición que sea realizada por el usuario a través de cualquiera de las formas de contacto.</li>
                    <li>Envío de comunicaciones comerciales publicitarias por email, WhatsApp u otro medio electrónico o físico, presente o futuro, que posibilite realizar comunicaciones comerciales.</li>
                    <li>Realización de estudios estadísticos.</li>
                    <li>Gestión de la solicitud de valoración de propiedades enviada por el usuario.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-semibold">3. Conservación de los Datos</h2>
                <p>
                    Se conservarán mientras exista un interés mutuo para mantener el fin del tratamiento y cuando ya no sea necesario para tal fin,
                    se suprimirán con medidas de seguridad adecuadas para garantizar la seudonimización de los datos o la destrucción total de los mismos.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-semibold">4. Derechos del Usuario</h2>
                <ul>
                    <li>Derecho a retirar el consentimiento en cualquier momento.</li>
                    <li>Derecho de acceso, rectificación, portabilidad y supresión de sus datos.</li>
                    <li>Derecho de limitación u oposición a su tratamiento.</li>
                    <li>Derecho a presentar una reclamación ante la autoridad de control (aepd.es) si considera que el tratamiento no se ajusta a la normativa vigente.</li>
                </ul>
                <p><strong>Datos de contacto para ejercer sus derechos:</strong> info@vidahome.es</p>
            </section>
        </article>
    );
}
