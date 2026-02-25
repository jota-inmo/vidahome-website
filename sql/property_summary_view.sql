-- VIEW: property_summary
-- Consolidates property_metadata + property_features into a single clean view
-- Run this in: Supabase Dashboard → SQL Editor

CREATE OR REPLACE VIEW public.property_summary AS
SELECT
    -- Identification
    m.cod_ofer,
    m.ref,                                          -- Your reference (e.g. VH-001)

    -- Property attributes
    m.tipo,                                         -- Property type
    m.poblacion,                                    -- Location
    m.precio,                                       -- Price
    m.nodisponible,                                 -- Available or not

    -- Physical features (from property_features)
    f.superficie,                                   -- Built area m²
    f.habitaciones,                                 -- Total rooms
    f.habitaciones_simples,                         -- Single rooms
    f.habitaciones_dobles,                          -- Double rooms
    f.banos,                                        -- Bathrooms

    -- Descriptions in each language (extracted from the JSONB column)
    m.descriptions->>'description_es' AS description_es,
    m.descriptions->>'description_en' AS description_en,
    m.descriptions->>'description_fr' AS description_fr,
    m.descriptions->>'description_de' AS description_de,
    m.descriptions->>'description_it' AS description_it,
    m.descriptions->>'description_pl' AS description_pl,

    -- Media
    m.main_photo,

    -- Timestamps
    m.updated_at

FROM public.property_metadata m
LEFT JOIN public.property_features f ON f.cod_ofer = m.cod_ofer
WHERE m.nodisponible = false
ORDER BY m.ref;

-- Grant read access (same as other tables)
GRANT SELECT ON public.property_summary TO anon, authenticated;
