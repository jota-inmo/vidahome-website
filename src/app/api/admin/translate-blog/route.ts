import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { GEMINI_CONFIG, getGeminiApiKey } from '@/config/gemini';

const LOCALE_NAMES: Record<string, string> = {
    es: 'español',
    en: 'English',
    fr: 'français',
    de: 'Deutsch',
    it: 'italiano',
    pl: 'polski',
};

const BLOG_SYSTEM_PROMPTS: Record<string, string> = {
    en: 'You are an expert British English copywriter for a luxury real estate blog on the Costa Blanca, Spain. Write polished, engaging prose that appeals to international readers. Maintain the same tone, style and length as the original. Return ONLY the translated text.',
    fr: 'Tu es un rédacteur expert pour un blog immobilier de prestige sur la Costa Blanca, Espagne. Rédige un texte élégant et captivant pour les lecteurs français. Conserve le même ton, style et longueur que l\'original. Retourne UNIQUEMENT le texte traduit.',
    de: 'Du bist ein erfahrener Redakteur für einen Premium-Immobilienblog an der Costa Blanca, Spanien. Schreibe professionelle, ansprechende Texte für deutschsprachige Leser. Behalte Ton, Stil und Länge des Originals bei. Gib NUR den übersetzten Text zurück.',
    it: 'Sei un copywriter esperto per un blog immobiliare di lusso sulla Costa Blanca, Spagna. Scrivi testi eleganti e coinvolgenti per lettori italiani. Mantieni lo stesso tono, stile e lunghezza dell\'originale. Restituisci SOLO il testo tradotto.',
    pl: 'Jesteś ekspertem copywriterem dla luksusowego bloga nieruchomości na Costa Blanca, Hiszpania. Pisz profesjonalne, angażujące teksty dla polskich czytelników. Zachowaj ten sam ton, styl i długość co oryginał. Zwróć TYLKO przetłumaczony tekst.',
};

async function translateContent(
    text: string,
    sourceLocale: string,
    targetLocale: string
): Promise<string> {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
        throw new Error('GOOGLE_GENERATIVE_AI_API_KEY no configurada');
    }

    const systemPrompt = BLOG_SYSTEM_PROMPTS[targetLocale] ||
        `You are an expert translator for luxury real estate blog content. Translate from ${LOCALE_NAMES[sourceLocale]} to ${LOCALE_NAMES[targetLocale]}. Maintain tone and formality. Return ONLY the translated text.`;

    const url = `${GEMINI_CONFIG.apiUrl}/${GEMINI_CONFIG.model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            systemInstruction: {
                parts: [{ text: systemPrompt }],
            },
            contents: [{
                role: 'user',
                parts: [{ text: `Translate the following blog text from ${LOCALE_NAMES[sourceLocale]} to ${LOCALE_NAMES[targetLocale]}. Keep the same tone, style and structure. This is for a luxury real estate website blog.\n\nTEXT:\n${text}` }],
            }],
            generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 4096,
            },
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    if (!content) throw new Error('Gemini returned empty content');

    // Strip accidental markdown wrapper
    let cleaned = content;
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\w*\n?/, '').replace(/\n?```$/, '').trim();
    }

    return cleaned;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { postId, sourceLocale, targetLocales } = body;

        if (!postId || !sourceLocale || !targetLocales) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get source post
        const { data: sourcePost, error: fetchError } = await supabaseAdmin
            .from('blog_posts')
            .select('*')
            .eq('id', postId)
            .eq('locale', sourceLocale)
            .single();

        if (fetchError || !sourcePost) {
            return NextResponse.json(
                { error: 'Source post not found' },
                { status: 404 }
            );
        }

        // Log translation start
        const logEntry = {
            source_post_id: postId,
            source_locale: sourceLocale,
            target_locale: targetLocales[0],
            status: 'in_progress',
        };

        const { data: logData } = await supabaseAdmin
            .from('blog_translation_log')
            .insert([logEntry])
            .select()
            .single();

        // Translate and create posts for each target locale
        const createdPosts = [];

        for (const targetLocale of targetLocales) {
            try {
                // Translate title
                const translatedTitle = await translateContent(
                    sourcePost.title,
                    sourceLocale,
                    targetLocale
                );

                // Translate excerpt
                const translatedExcerpt = await translateContent(
                    sourcePost.excerpt,
                    sourceLocale,
                    targetLocale
                );

                // Translate content (in chunks if large)
                let translatedContent = '';
                const chunkSize = 2000;
                for (let i = 0; i < sourcePost.content.length; i += chunkSize) {
                    const chunk = sourcePost.content.substring(i, i + chunkSize);
                    const translatedChunk = await translateContent(
                        chunk,
                        sourceLocale,
                        targetLocale
                    );
                    translatedContent += translatedChunk;
                }

                // Translate meta fields
                const translatedMetaDescription = await translateContent(
                    sourcePost.meta_description,
                    sourceLocale,
                    targetLocale
                );

                // Generate slug from translated title
                const translatedSlug = translatedTitle
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^\w\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .substring(0, 255);

                // Create post in target locale
                const { data: newPost, error: createError } = await supabaseAdmin
                    .from('blog_posts')
                    .insert([
                        {
                            title: translatedTitle,
                            slug: translatedSlug,
                            excerpt: translatedExcerpt,
                            content: translatedContent,
                            meta_description: translatedMetaDescription,
                            meta_keywords: sourcePost.meta_keywords,
                            locale: targetLocale,
                            author: sourcePost.author,
                            featured_image_url: sourcePost.featured_image_url,
                            featured_image_alt: sourcePost.featured_image_alt,
                            category_id: sourcePost.category_id,
                            is_published: false, // Draft for review
                        },
                    ])
                    .select()
                    .single();

                if (createError) throw createError;

                // Update translation log
                if (logData) {
                    await supabaseAdmin
                        .from('blog_translation_log')
                        .update({
                            target_post_id: newPost.id,
                            status: 'completed',
                            completed_at: new Date().toISOString(),
                        })
                        .eq('id', logData.id);
                }

                createdPosts.push(newPost);
            } catch (error) {
                console.error(`Error translating to ${targetLocale}:`, error);

                // Update log with error
                if (logData) {
                    await supabaseAdmin
                        .from('blog_translation_log')
                        .update({
                            status: 'failed',
                            error_message: error instanceof Error ? error.message : 'Unknown error',
                        })
                        .eq('id', logData.id);
                }
            }

            // Add delay to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        return NextResponse.json(
            {
                success: true,
                message: `Traducción completada. ${createdPosts.length} idiomas traducidos.`,
                posts: createdPosts,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Internal server error',
            },
            { status: 500 }
        );
    }
}
