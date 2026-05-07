import React from 'react';

export function GlobalSchema() {
    const agentSchema = {
        "@context": "https://schema.org",
        "@type": ["RealEstateAgent", "LocalBusiness"],
        "@id": "https://www.vidahome.es/#agencia",
        "name": "VidaHome Inmobiliaria",
        "alternateName": "VidaHome Gandía",
        "description": "Inmobiliaria en Gandía especializada en compraventa y alquiler de propiedades en Grau, Playa de Gandía, La Safor y Costa Valenciana. Equipo APIVA con +25 años de experiencia.",
        "url": "https://www.vidahome.es",
        "logo": "https://www.vidahome.es/vidahome-logo.png",
        "image": "https://www.vidahome.es/vidahome-logo.png",
        "telephone": "+34659027512",
        "email": "info@vidahome.es",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Carrer Joan XXIII, 1",
            "addressLocality": "Gandia",
            "addressRegion": "Valencia",
            "postalCode": "46730",
            "addressCountry": "ES"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": 38.9967,
            "longitude": -0.1847
        },
        "hasMap": "https://www.google.com/maps/search/?api=1&query=VidaHome+Inmobiliaria+Gandia",
        "areaServed": [
            { "@type": "City", "name": "Gandía" },
            { "@type": "Place", "name": "Grau de Gandía" },
            { "@type": "Place", "name": "Playa de Gandía" },
            { "@type": "Place", "name": "La Safor" },
            { "@type": "Place", "name": "Costa Valenciana" },
            { "@type": "City", "name": "Oliva" },
            { "@type": "City", "name": "Daimús" },
            { "@type": "City", "name": "Bellreguard" },
            { "@type": "City", "name": "Piles" },
            { "@type": "City", "name": "Miramar" }
        ],
        "knowsLanguage": ["es", "en", "fr", "de", "it", "pl"],
        "priceRange": "€€€",
        "currenciesAccepted": "EUR",
        "openingHoursSpecification": [
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "opens": "09:00",
                "closes": "20:00"
            }
        ],
        "sameAs": ["https://www.instagram.com/vidahome/"]
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(agentSchema) }}
        />
    );
}
