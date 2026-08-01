// Reseñas reales del perfil de Google Business de Vida Home, copiadas a mano
// (capturadas 2026-08-01, las 10 más recientes con texto, orden cronológico
// inverso). Se muestran en su idioma ORIGINAL y con el apellido reducido a
// inicial — nunca publicar el nombre completo del autor.
// Para refrescarlas: perfil de Google → Reseñas → ordenar por "Más recientes",
// actualizar también GOOGLE_REVIEW_COUNT si ha cambiado.

export interface GoogleReview {
  id: string;
  /** Nombre de pila + inicial del apellido. Nunca el apellido completo. */
  author: string;
  /** Idioma original de la reseña (atributo lang del blockquote). */
  lang: 'es' | 'en' | 'fr' | 'de' | 'it' | 'pl';
  /** Estrellas 1-5 tal y como aparecen en Google. */
  rating: number;
  /** Mes aproximado de publicación, formato YYYY-MM. */
  date: string;
  /** Texto de la reseña. Solo limpieza tipográfica; recortes marcados con […]. */
  text: string;
}

export const GOOGLE_RATING_DISPLAY = '5,0';
export const GOOGLE_REVIEW_COUNT = 145;
// Enlace estable al perfil de empresa en Google Maps (CID del listing).
export const GOOGLE_PROFILE_URL = 'https://maps.google.com/?cid=14909886010106056076';

export const GOOGLE_REVIEWS: GoogleReview[] = [
  {
    id: 'fernando-2026-07',
    author: 'Fernando S.',
    lang: 'es',
    rating: 5,
    date: '2026-07',
    text: 'Excelente trato personal, cercano y agradable. Gran equipo de profesionales, nos han asesorado muy bien, nos han facilitado todas las gestiones y nos han acompañado durante todo el proceso.',
  },
  {
    id: 'dely-2026-07',
    author: 'Dely',
    lang: 'es',
    rating: 5,
    date: '2026-07',
    text: 'Trato excelente. Grandes profesionales, no es solo una agencia, se preocupan por el cliente y su bien estar, solucionan cualquier incidencia, cambian contratos de servicios, te acompañan en todo el proceso de compra venta. Calidad en el trato. Un diez',
  },
  {
    id: 'magdalena-2026-07',
    author: 'Magdalena G.',
    lang: 'pl',
    rating: 5,
    date: '2026-07',
    text: 'Chciałabym serdecznie podziękować Biuru Nieruchomości Vida Home, a w szczególności Pani Ewelinie, której profesjonalizm, zaangażowanie i indywidualne podejście do klienta były kluczowe w całym procesie sprzedaży mojego domu. Pani Ewelina była niezwykle pomocna i profesjonalna na każdym etapie. Gorąco polecam jej usługi!',
  },
  {
    id: 'viktorija-2026-07',
    author: 'Viktorija',
    lang: 'en',
    rating: 5,
    date: '2026-07',
    text: 'We had a great experience working with this real estate agency. They helped us purchase our apartment smoothly and made the entire process easy and stress-free. Special thanks to Evelyn for her professionalism, friendliness, and support throughout every step of the journey. We highly recommend their services!',
  },
  {
    id: 'anapaula-2026-06',
    author: 'Ana Paula S.',
    lang: 'es',
    rating: 5,
    date: '2026-06',
    text: 'Inmobiliaria de confianza, trato inmejorable por todos y en especial Evelin, una profesional muy competente, nos transmitió Segurança todo el tiempo. Gratitud por todo, Evelin.',
  },
  {
    id: 'tomas-2026-06',
    author: 'Tomas A.',
    lang: 'es',
    rating: 5,
    date: '2026-06',
    text: 'Rápidos y atentos, saben escuchar y atender tus necesidades. Recomiendo 100/100.',
  },
  {
    id: 'luiza-2026-06',
    author: 'Luiza S.',
    lang: 'es',
    rating: 5,
    date: '2026-06',
    text: 'Muchas gracias a todo el equipo de Vida Home, y en especial a la Sra. Ewelina, cuya profesionalidad nos ha dejado impresionados :)',
  },
  {
    id: 'lucia-2026-06',
    author: 'Lucía B.',
    lang: 'es',
    rating: 5,
    date: '2026-06',
    text: '¡Encantada con esta inmobiliaria! Se lo toman muy en serio, entienden lo que buscas, te aconsejan y asesoran de maravilla. En mi caso les pedí que gestionaran un piso en alquiler. Muchas gracias 😊😊',
  },
  {
    id: 'iwona-2026-06',
    author: 'Iwona',
    lang: 'es',
    rating: 5,
    date: '2026-06',
    text: 'Sinceramente, no sé cómo agradecer a la agencia inmobiliaria Vida Home. Son un equipo excepcional de personas atentas, empáticas y comprometidas, cuyo apoyo va mucho más allá de los negocios. […] Quiero agradecer especialmente a Evelin. Es una agente inmobiliaria increíblemente profesional, que siempre cuida cada detalle y se asegura de que todo esté perfectamente gestionado.',
  },
  {
    id: 'michal-2026-06',
    author: 'Michał P.',
    lang: 'pl',
    rating: 5,
    date: '2026-06',
    text: 'Jesteśmy bardzo zadowoleni z profesjonalnej pomocy przy spełnieniu formalności związanych z zakupem apartamentu w Hiszpanii, jaką uzyskaliśmy od firmy Vida Home! W szczególności współpraca z Panią Eweliną była bardzo owocna, a ona sama niesamowicie skuteczna i kompetentna. Gorąco polecamy zaufać firmie Vida Home i spełnić swoje marzenia :-)',
  },
];
