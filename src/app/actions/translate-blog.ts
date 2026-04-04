'use server';

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

interface BlogTranslateResult {
  success: boolean;
  translated: number;
  errors: number;
  error_details?: Array<{ id: string; error: string }>;
  cost_estimate: string;
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  locale: string;
}

/**
 * Translate a single text using Gemini
 */
async function translateWithGemini(
  apiKey: string,
  text: string,
  sourceLocale: string,
  targetLocale: string
): Promise<string> {
  const systemPrompt = BLOG_SYSTEM_PROMPTS[targetLocale] ||
    `You are an expert translator for luxury real estate blog content. Translate to ${LOCALE_NAMES[targetLocale]}. Return ONLY the translated text.`;

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
        parts: [{ text: `Translate from ${LOCALE_NAMES[sourceLocale]} to ${LOCALE_NAMES[targetLocale]}:\n\n${text}` }],
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

/**
 * Translate blog posts to multiple languages using Gemini AI.
 * Translates: title, excerpt, and content.
 */
export async function translateBlogPostAction(
  postIds?: string[]
): Promise<BlogTranslateResult> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    return {
      success: false,
      translated: 0,
      errors: 1,
      error_details: [{ id: 'gemini', error: 'GOOGLE_GENERATIVE_AI_API_KEY not configured' }],
      cost_estimate: '0€',
    };
  }

  try {
    // Fetch Spanish blog posts
    let query = supabaseAdmin.from('blog_posts').select('id, title, excerpt, content, locale');

    if (postIds && postIds.length > 0) {
      query = query.in('id', postIds);
    } else {
      query = query.eq('locale', 'es').order('created_at', { ascending: false }).limit(10);
    }

    const { data: blogPosts, error: fetchError } = await query;

    if (fetchError) throw new Error(`Failed to fetch blog posts: ${fetchError.message}`);

    if (!blogPosts || blogPosts.length === 0) {
      return { success: true, translated: 0, errors: 0, cost_estimate: '0€' };
    }

    const locales = ['en', 'fr', 'de', 'it', 'pl'];
    let successCount = 0;
    let errorCount = 0;
    const errorDetails: Array<{ id: string; error: string }> = [];

    for (const post of blogPosts) {
      try {
        for (const locale of locales) {
          // Translate title
          const translatedTitle = await translateWithGemini(apiKey, post.title, 'es', locale);
          await new Promise(r => setTimeout(r, 2000));

          // Translate excerpt
          const translatedExcerpt = post.excerpt
            ? await translateWithGemini(apiKey, post.excerpt, 'es', locale)
            : '';
          await new Promise(r => setTimeout(r, 2000));

          // Translate content (in chunks if large)
          let translatedContent = '';
          const chunkSize = 3000;
          for (let i = 0; i < post.content.length; i += chunkSize) {
            const chunk = post.content.substring(i, i + chunkSize);
            const translatedChunk = await translateWithGemini(apiKey, chunk, 'es', locale);
            translatedContent += translatedChunk;
            await new Promise(r => setTimeout(r, 2000));
          }

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
          const { error: insertError } = await supabaseAdmin
            .from('blog_posts')
            .insert({
              title: translatedTitle,
              slug: translatedSlug,
              excerpt: translatedExcerpt,
              content: translatedContent,
              locale,
              author: 'Vidahome',
              is_published: false, // Draft for review
              category_id: null,
            });

          if (insertError) throw insertError;
        }

        // Log success
        await supabaseAdmin.from('translation_log').insert({
          property_id: `blog_${post.id}`,
          status: 'success',
          source_language: 'es',
          target_languages: locales,
          tokens_used: 0,
          cost_estimate: 0,
          created_at: new Date().toISOString(),
        });

        successCount++;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errorDetails.push({ id: post.id, error: message });
        errorCount++;

        await supabaseAdmin.from('translation_log').insert({
          property_id: `blog_${post.id}`,
          status: 'error',
          error_message: message,
          created_at: new Date().toISOString(),
        });
      }
    }

    return {
      success: true,
      translated: successCount,
      errors: errorCount,
      error_details: errorDetails.length > 0 ? errorDetails : undefined,
      cost_estimate: '0€ (Gemini free tier)',
    };
  } catch (error: any) {
    console.error('[translateBlogPost] Error:', error);
    return {
      success: false,
      translated: 0,
      errors: 1,
      error_details: [{ id: 'error', error: error.message || 'Unknown error' }],
      cost_estimate: '0€',
    };
  }
}

/**
 * Translate only the content of a specific blog post.
 * Useful for long posts that need separate content translation.
 */
export async function translateBlogContentAction(
  originalPostId: string
): Promise<{
  success: boolean;
  translations?: Record<string, string>;
  error?: string;
  cost_estimate: string;
}> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    return { success: false, error: 'GOOGLE_GENERATIVE_AI_API_KEY not configured', cost_estimate: '0€' };
  }

  try {
    const { data: post, error: fetchError } = await supabaseAdmin
      .from('blog_posts')
      .select('id, title, content, locale')
      .eq('id', originalPostId)
      .single();

    if (fetchError) throw new Error(`Failed to fetch blog post: ${fetchError.message}`);
    if (!post) throw new Error('Blog post not found');

    // Split content into chunks
    const contentChunks = post.content.split('\n\n');
    const maxChunkSize = 3000;
    let currentChunk = '';
    const chunks: string[] = [];

    for (const para of contentChunks) {
      if (currentChunk.length + para.length > maxChunkSize) {
        chunks.push(currentChunk);
        currentChunk = para;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + para;
      }
    }
    if (currentChunk) chunks.push(currentChunk);

    const locales = ['en', 'fr', 'de', 'it', 'pl'];
    const translations: Record<string, string[]> = { en: [], fr: [], de: [], it: [], pl: [] };

    for (const chunk of chunks) {
      for (const locale of locales) {
        const translated = await translateWithGemini(apiKey, chunk, 'es', locale);
        translations[locale].push(translated);
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    const finalTranslations: Record<string, string> = {};
    for (const locale of locales) {
      finalTranslations[locale] = translations[locale].join('\n\n');
    }

    return {
      success: true,
      translations: finalTranslations,
      cost_estimate: '0€ (Gemini free tier)',
    };
  } catch (error: any) {
    console.error('[translateBlogContent] Error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
      cost_estimate: '0€',
    };
  }
}
