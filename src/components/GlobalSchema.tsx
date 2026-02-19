import React from 'react';

export function GlobalSchema() {
    const agentSchema = {
        "@context": "https://schema.org",
        "@type": "RealEstateAgent",
        "@id": "https://vidahome.es/#agencia",
        "name": "VidaHome Inmobiliaria",
        "url": "https://vidahome.es",
        "telephone": "+34 659 02 75 12",
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
        "priceRange": "€100K-€1M",
        "openingHours": "Mo-Fr 09:00-20:00",
        "sameAs": ["https://www.instagram.com/vidahome/"]
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(agentSchema) }}
        />
    );
}
