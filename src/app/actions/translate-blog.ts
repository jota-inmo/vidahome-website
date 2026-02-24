'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

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
 * Traduce posts de blog a múltiples idiomas usando Perplexity AI
 * Traduce: título, extracto (excerpt) y contenido
 */
export async function translateBlogPostAction(
  postIds?: string[]
): Promise<BlogTranslateResult> {
  const perplexityKey = process.env.PERPLEXITY_API_KEY;

  if (!perplexityKey) {
    return {
      success: false,
      translated: 0,
      errors: 1,
      error_details: [{ id: 'perplexity', error: 'PERPLEXITY_API_KEY not configured' }],
      cost_estimate: '0€',
    };
  }

  try {
    // Fetch blog posts from Supabase
    let query = supabaseAdmin.from('blog_posts').select('id, title, excerpt, content, locale');

    if (postIds && postIds.length > 0) {
      query = query.in('id', postIds);
    } else {
      // Only fetch Spanish posts for translation
      query = query.eq('locale', 'es').order('created_at', { ascending: false }).limit(10);
    }

    const { data: blogPosts, error: fetchError } = await query;

    if (fetchError) throw new Error(`Failed to fetch blog posts: ${fetchError.message}`);

    if (!blogPosts || blogPosts.length === 0) {
      return {
        success: true,
        translated: 0,
        errors: 0,
        cost_estimate: '0€',
      };
    }

    // Build prompt for Perplexity
    const prompt = `You are a professional translator for luxury real estate and travel content in Spain.

Translate the following Spanish blog posts to English, French, German, Italian, and Polish. Translation should be high-quality, maintaining tone and style.

Return ONLY a valid JSON object with this structure (no markdown, no code blocks):
{
  "translations": [
    {
      "id": "post_id",
      "title_es": "Spanish title",
      "excerpt_es": "Spanish excerpt",
      "title_en": "English translation",
      "excerpt_en": "English excerpt",
      "title_fr": "French translation",
      "excerpt_fr": "French excerpt",
      "title_de": "German translation",
      "excerpt_de": "German excerpt",
      "title_it": "Italian translation",
      "excerpt_it": "Italian excerpt",
      "title_pl": "Polish translation",
      "excerpt_pl": "Polish excerpt"
    }
  ]
}

Blog posts to translate (title, excerpt only - content will be translated separately):
${blogPosts
  .map(
    (post: BlogPost) => `
ID: ${post.id}
TITLE: ${post.title}
EXCERPT: ${post.excerpt || 'N/A'}
---`
  )
  .join('\n')}`;

    // Call Perplexity API
    const perplexityResponse = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${perplexityKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content:
              'You are a professional translator expert in luxury real estate and travel. Provide high-quality translations in JSON format only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
      }),
    });

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      throw new Error(`Perplexity API error: ${perplexityResponse.status} - ${errorText}`);
    }

    const perplexityData = await perplexityResponse.json();
    const usage = perplexityData.usage || { prompt_tokens: 0, completion_tokens: 0 };
    const totalTokens = usage.prompt_tokens + usage.completion_tokens;
    const costEstimate = (totalTokens / 1000) * 0.0002;

    // Parse translations
    let translations: any[] = [];
    try {
      const content = perplexityData.choices[0]?.message?.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
      translations = parsed.translations || [];
    } catch (parseError) {
      console.error('Failed to parse Perplexity response:', parseError);
      throw new Error('Invalid translation response format');
    }

    // For each Spanish post, create translations in other locales
    let successCount = 0;
    let errorCount = 0;
    const errorDetails: Array<{ id: string; error: string }> = [];

    for (const translation of translations) {
      try {
        const originalPost = blogPosts.find((p: BlogPost) => p.id === translation.id);
        if (!originalPost) {
          errorDetails.push({
            id: translation.id,
            error: 'Original post not found',
          });
          errorCount++;
          continue;
        }

        // Create posts in other locales
        const locales = ['en', 'fr', 'de', 'it', 'pl'];

        for (const locale of locales) {
          const titleKey = `title_${locale}`;
          const excerptKey = `excerpt_${locale}`;

          // For content, we'll use Perplexity in a separate call due to length limits
          const { error: insertError } = await supabaseAdmin.from('blog_posts').insert({
            title: translation[titleKey] || originalPost.title,
            excerpt: translation[excerptKey] || originalPost.excerpt,
            content: originalPost.content, // Will be translated separately
            locale,
            slug: `${originalPost.id}-${locale}`,
            is_published: false, // Require review before publishing
            category_id: null,
          });

          if (insertError) throw insertError;
        }

        // Log success
        await supabaseAdmin.from('translation_log').insert({
          property_id: `blog_${translation.id}`,
          status: 'success',
          source_language: 'es',
          target_languages: ['en', 'fr', 'de', 'it', 'pl'],
          tokens_used: Math.ceil(totalTokens / translations.length),
          cost_estimate: costEstimate / translations.length,
          created_at: new Date().toISOString(),
        });

        successCount++;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errorDetails.push({
          id: translation.id || 'unknown',
          error: message,
        });
        errorCount++;

        // Log error
        await supabaseAdmin.from('translation_log').insert({
          property_id: `blog_${translation.id || 'unknown'}`,
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
      cost_estimate: `${costEstimate.toFixed(4)}€`,
    };
  } catch (error: any) {
    console.error('[translateBlogPost] Error:', error);
    return {
      success: false,
      translated: 0,
      errors: 1,
      error_details: [
        {
          id: 'error',
          error: error.message || 'Unknown error during translation',
        },
      ],
      cost_estimate: '0€',
    };
  }
}

/**
 * Traduce solo el contenido de un post de blog específico
 * (útil para posts largos que requieren traducción separada)
 */
export async function translateBlogContentAction(
  originalPostId: string
): Promise<{
  success: boolean;
  translations?: Record<string, string>;
  error?: string;
  cost_estimate: string;
}> {
  const perplexityKey = process.env.PERPLEXITY_API_KEY;

  if (!perplexityKey) {
    return {
      success: false,
      error: 'PERPLEXITY_API_KEY not configured',
      cost_estimate: '0€',
    };
  }

  try {
    // Fetch the original blog post
    const { data: post, error: fetchError } = await supabaseAdmin
      .from('blog_posts')
      .select('id, title, content, locale')
      .eq('id', originalPostId)
      .single();

    if (fetchError) throw new Error(`Failed to fetch blog post: ${fetchError.message}`);
    if (!post) throw new Error('Blog post not found');

    // Split content into chunks if too long (Perplexity has token limits)
    const contentChunks = post.content.split('\n\n');
    const maxChunkSize = 2000; // chars per chunk
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

    // Translate each chunk
    const translations: Record<string, string[]> = {
      en: [],
      fr: [],
      de: [],
      it: [],
      pl: [],
    };

    for (const chunk of chunks) {
      const prompt = `You are a professional translator for luxury real estate and travel content.

Translate the following Spanish blog content to English, French, German, Italian, and Polish.

Return ONLY a valid JSON object (no markdown, no code blocks):
{
  "en": "English translation",
  "fr": "French translation",
  "de": "German translation",
  "it": "Italian translation",
  "pl": "Polish translation"
}

Content to translate:
${chunk}`;

      const response = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${perplexityKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a professional translator. Respond with JSON format only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);

      Object.keys(translations).forEach((locale) => {
        translations[locale].push(parsed[locale] || '');
      });
    }

    // Join translated chunks
    const finalTranslations: Record<string, string> = {};
    Object.keys(translations).forEach((locale) => {
      finalTranslations[locale] = translations[locale].join('\n\n');
    });

    // Estimate cost
    const totalLength = post.content.length;
    const estimatedTokens = Math.ceil(totalLength / 4); // Rough estimate
    const costEstimate = (estimatedTokens / 1000) * 0.0002;

    return {
      success: true,
      translations: finalTranslations,
      cost_estimate: `${costEstimate.toFixed(4)}€`,
    };
  } catch (error: any) {
    console.error('[translateBlogContent] Error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error during translation',
      cost_estimate: '0€',
    };
  }
}
