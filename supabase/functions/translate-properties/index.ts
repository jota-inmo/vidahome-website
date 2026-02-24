import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1"

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"
const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        if (!PERPLEXITY_API_KEY) {
            throw new Error("Missing SUPABASE_PERPLEXITY_API_KEY environment variable")
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        const { property_ids } = await req.json()

        // 1. Fetch properties to translate
        let query = supabase
            .from('properties')
            .select('property_id, description_es, description_en, description_fr, description_de, description_it, description_pl')
            .not('description_es', 'is', null)
            .neq('description_es', '')

        if (property_ids && property_ids.length > 0) {
            query = query.in('property_id', property_ids)
        } else {
            // Default: Find those with at least one target language missing
            query = query.or('description_en.is.null,description_fr.is.null,description_de.is.null,description_it.is.null,description_pl.is.null')
        }

        const { data: properties, error: fetchError } = await query.limit(10) // Batch processing: max 10

        if (fetchError) throw fetchError
        if (!properties || properties.length === 0) {
            return new Response(JSON.stringify({ message: "No properties pending translation", translated: 0 }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200
            })
        }

        let translatedCount = 0
        let totalCost = 0
        let errorsCount = 0

        for (const prop of properties) {
            try {
                const prompt = `Traduce este anuncio inmobiliario español a inglés, francés, alemán, italiano y polaco. Mantén terminología profesional (m2, dormitorios, baño, ascensor, etc.). Formato JSON:

ESPAÑOL: ${prop.description_es}

JSON:
{
"en": "...",
"fr": "...",
"de": "...",
"it": "...",
"pl": "..."
}`

                const response = await fetch(PERPLEXITY_API_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: "sonar-small-online",
                        messages: [
                            { role: "system", content: "Eres un traductor profesional experto en el sector inmobiliario de lujo en España. Tu respuesta debe ser exclusivamente un JSON válido." },
                            { role: "user", content: prompt }
                        ],
                        temperature: 0.2,
                    }),
                })

                if (!response.ok) {
                    const errorData = await response.text()
                    throw new Error(`Perplexity API error: ${response.status} - ${errorData}`)
                }

                const completion = await response.json()
                const content = completion.choices[0].message.content

                // Clean JSON if needed (Perplexity sometimes adds markdown blocks)
                const cleanJson = content.replace(/```json\n?|\n?```/g, '').trim()
                const translations = JSON.parse(cleanJson)

                // Update database
                const { error: updateError } = await supabase
                    .from('properties')
                    .update({
                        description_en: translations.en,
                        description_fr: translations.fr,
                        description_de: translations.de,
                        description_it: translations.it,
                        description_pl: translations.pl,
                        updated_at: new Date().toISOString()
                    })
                    .eq('property_id', prop.property_id)

                if (updateError) throw updateError

                // Log the translation
                const tokensUsed = completion.usage?.total_tokens ?? 0
                const costEstimate = (tokensUsed / 1000) * 0.0002 // Rough estimate for sonar-small-online
                totalCost += costEstimate

                await supabase.from('translation_log').insert({
                    property_id: prop.property_id,
                    language: 'all',
                    tokens_used: tokensUsed,
                    cost_estimate: costEstimate,
                    status: 'success'
                })

                translatedCount++

                // Rate limit delay
                await new Promise(resolve => setTimeout(resolve, 100))

            } catch (err) {
                console.error(`Error translating property ${prop.property_id}:`, err)
                errorsCount++
                await supabase.from('translation_log').insert({
                    property_id: prop.property_id,
                    language: 'all',
                    status: 'error',
                    error_message: err.message
                })
            }
        }

        return new Response(JSON.stringify({
            translated: translatedCount,
            errors: errorsCount,
            cost_estimate: `${totalCost.toFixed(4)}€`
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500
        })
    }
})
