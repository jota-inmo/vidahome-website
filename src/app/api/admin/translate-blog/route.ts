import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

const LOCALE_NAMES: Record<string, string> = {
    es: 'SPANISH',
    en: 'ENGLISH',
    fr: 'FRENCH',
    de: 'GERMAN',
    it: 'ITALIAN',
    pl: 'POLISH',
};

async function translateContent(
    text: string,
    sourceLocale: string,
    targetLocale: string
): Promise<string> {
    if (!PERPLEXITY_API_KEY) {
        throw new Error('PERPLEXITY_API_KEY no configurada');
    }

    const prompt = `Translate the following text from ${LOCALE_NAMES[sourceLocale]} to ${LOCALE_NAMES[targetLocale]}.
    
Keep the same tone and style. This is for a luxury real estate website.
Do NOT include any explanations or metadata, just the translated text.

TEXT:
${text}`;

    try {
        const response = await fetch(PERPLEXITY_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'sonar-pro',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert translator for luxury real estate content. Maintain tone and formality.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                max_tokens: 5000,
            }),
        });

        if (!response.ok) {
            throw new Error(`Perplexity API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Translation error:', error);
        throw error;
    }
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
