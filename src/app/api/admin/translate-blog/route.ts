import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { GEMINI_CONFIG, getGeminiApiKey } from '@/config/gemini';

export const maxDuration = 300; // 5 min — Vercel Pro

const LOCALE_NAMES: Record<string, string> = {
    es: 'español',
    en: 'English',
    fr: 'français',
    de: 'Deutsch',
    it: 'italiano',
    pl: 'polski',
};

const BLOG_SYSTEM_PROMPTS: Record<string, string> = {
    en: 'You are an expert British English copywriter for a luxury real estate blog on the Costa Blanca, Spain. Write polished, engaging prose that appeals to international readers. Maintain the same tone, style and length as the original.',
    fr: 'Tu es un rédacteur expert pour un blog immobilier de prestige sur la Costa Blanca, Espagne. Rédige un texte élégant et captivant pour les lecteurs français. Conserve le même ton, style et longueur que l\'original.',
    de: 'Du bist ein erfahrener Redakteur für einen Premium-Immobilienblog an der Costa Blanca, Spanien. Schreibe professionelle, ansprechende Texte für deutschsprachige Leser. Behalte Ton, Stil und Länge des Originals bei.',
    it: 'Sei un copywriter esperto per un blog immobiliare di lusso sulla Costa Blanca, Spagna. Scrivi testi eleganti e coinvolgenti per lettori italiani. Mantieni lo stesso tono, stile e lunghezza dell\'originale.',
    pl: 'Jesteś ekspertem copywriterem dla luksusowego bloga nieruchomości na Costa Blanca, Hiszpania. Pisz profesjonalne, angażujące teksty dla polskich czytelników. Zachowaj ten sam ton, styl i długość co oryginał.',
};

/**
 * Translate all blog fields in a SINGLE API call per language.
 * Returns JSON with title, excerpt, content, meta_description.
 */
async function translateAllFields(
    apiKey: string,
    sourceLocale: string,
    targetLocale: string,
    title: string,
    excerpt: string,
    content: string,
    metaDescription: string
): Promise<{ title: string; excerpt: string; content: string; meta_description: string }> {
    const systemPrompt = BLOG_SYSTEM_PROMPTS[targetLocale] ||
        `You are an expert translator for luxury real estate blog content. Translate to ${LOCALE_NAMES[targetLocale]}.`;

    const url = `${GEMINI_CONFIG.apiUrl}/${GEMINI_CONFIG.model}:generateContent?key=${apiKey}`;

    const userMessage = `Translate ALL of the following blog article fields from ${LOCALE_NAMES[sourceLocale]} to ${LOCALE_NAMES[targetLocale]}.

Return ONLY a valid JSON object with these 4 fields (no markdown, no code blocks, no explanation):
{
  "title": "translated title",
  "excerpt": "translated excerpt",
  "content": "translated full content (preserve markdown formatting)",
  "meta_description": "translated meta description"
}

ORIGINAL ARTICLE:

TITLE: ${title}

EXCERPT: ${excerpt}

META DESCRIPTION: ${metaDescription}

CONTENT:
${content}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            systemInstruction: {
                parts: [{ text: systemPrompt + ' Return ONLY valid JSON with keys: title, excerpt, content, meta_description. No markdown wrappers.' }],
            },
            contents: [{
                role: 'user',
                parts: [{ text: userMessage }],
            }],
            generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 8192,
            },
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    if (!raw) throw new Error('Gemini returned empty content');

    // Strip markdown wrapper if present
    let cleaned = raw;
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\w*\n?/, '').replace(/\n?```$/, '').trim();
    }

    const parsed = JSON.parse(cleaned);

    return {
        title: parsed.title || title,
        excerpt: parsed.excerpt || excerpt,
        content: parsed.content || content,
        meta_description: parsed.meta_description || metaDescription,
    };
}

function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 255);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { postId, sourceLocale, targetLocales } = body;

        if (!postId || !sourceLocale || !targetLocales) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const apiKey = getGeminiApiKey();
        if (!apiKey) {
            return NextResponse.json({ error: 'GOOGLE_GENERATIVE_AI_API_KEY no configurada' }, { status: 500 });
        }

        // Get source post
        const { data: sourcePost, error: fetchError } = await supabaseAdmin
            .from('blog_posts')
            .select('*')
            .eq('id', postId)
            .eq('locale', sourceLocale)
            .single();

        if (fetchError || !sourcePost) {
            return NextResponse.json({ error: 'Source post not found' }, { status: 404 });
        }

        const createdPosts = [];
        const errors: string[] = [];

        for (const targetLocale of targetLocales) {
            try {
                console.log(`[Blog translate] ${sourceLocale} → ${targetLocale}...`);

                // ONE API call per language (all fields at once)
                const translated = await translateAllFields(
                    apiKey,
                    sourceLocale,
                    targetLocale,
                    sourcePost.title,
                    sourcePost.excerpt || '',
                    sourcePost.content,
                    sourcePost.meta_description || '',
                );

                // Create post in target locale
                const { data: newPost, error: createError } = await supabaseAdmin
                    .from('blog_posts')
                    .insert({
                        title: translated.title,
                        slug: generateSlug(translated.title),
                        excerpt: translated.excerpt,
                        content: translated.content,
                        meta_description: translated.meta_description,
                        meta_keywords: sourcePost.meta_keywords,
                        locale: targetLocale,
                        author: sourcePost.author,
                        featured_image_url: sourcePost.featured_image_url,
                        featured_image_alt: sourcePost.featured_image_alt,
                        category_id: sourcePost.category_id,
                        is_published: false,
                    })
                    .select()
                    .single();

                if (createError) throw createError;

                createdPosts.push(newPost);
                console.log(`[Blog translate] ${targetLocale} OK`);
            } catch (error: any) {
                const msg = error?.message || String(error);
                console.error(`[Blog translate] ${targetLocale} FAILED:`, msg);
                errors.push(`${targetLocale}: ${msg}`);
            }

            // 7 second delay between languages (Gemini free: 10 RPM)
            await new Promise((resolve) => setTimeout(resolve, 7000));
        }

        return NextResponse.json({
            success: true,
            message: `${createdPosts.length} idiomas traducidos${errors.length ? `, ${errors.length} errores` : ''}.`,
            posts: createdPosts,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error: any) {
        console.error('[Blog translate] Error:', error);
        return NextResponse.json(
            { error: error?.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
