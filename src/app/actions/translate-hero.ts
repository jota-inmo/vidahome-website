'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

interface HeroTranslateResult {
  success: boolean;
  translated: number;
  errors: number;
  error_details?: Array<{ id: string; error: string }>;
  cost_estimate: string;
}

/**
 * Traduce títulos del banner/hero a múltiples idiomas usando Perplexity AI
 */
export async function translateHeroAction(): Promise<HeroTranslateResult> {
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
    // Fetch hero slides from Supabase
    const { data: heroSlides, error: fetchError } = await supabaseAdmin
      .from('hero_slides')
      .select('id, title');

    if (fetchError) throw new Error(`Failed to fetch hero slides: ${fetchError.message}`);

    if (!heroSlides || heroSlides.length === 0) {
      return {
        success: true,
        translated: 0,
        errors: 0,
        cost_estimate: '0€',
      };
    }

    // Filter slides with Spanish titles to translate
    const slidesWithTitles = heroSlides.filter(
      (slide: any) => slide.title && typeof slide.title === 'string'
    );

    if (slidesWithTitles.length === 0) {
      return {
        success: true,
        translated: 0,
        errors: 0,
        cost_estimate: '0€',
      };
    }

    // Build prompt for Perplexity
    const prompt = `You are a professional translator for luxury real estate in Spain.

Translate the following Spanish hero/banner titles to English, French, German, Italian, and Polish.

Return ONLY a valid JSON object with this structure (no markdown, no code blocks):
{
  "translations": [
    {
      "id": "slide_id",
      "title_es": "Spanish title",
      "en": "English translation",
      "fr": "French translation",
      "de": "German translation",
      "it": "Italian translation",
      "pl": "Polish translation"
    }
  ]
}

Titles to translate:
${slidesWithTitles.map((slide: any) => `ID: ${slide.id}\nTITLE: ${slide.title}`).join('\n---\n')}`;

    // Call Perplexity API
    const perplexityResponse = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${perplexityKey}`,
      },
      body: JSON.stringify({
        model: 'sonar-small-online',
        messages: [
          {
            role: 'system',
            content:
              'You are a professional translator expert in luxury real estate. You provide high-quality translations in JSON format only.',
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

    // Update hero slides with translations
    let successCount = 0;
    let errorCount = 0;
    const errorDetails: Array<{ id: string; error: string }> = [];

    for (const translation of translations) {
      try {
        const { id, en, fr, de, it, pl } = translation;

        // Build titles object
        const titles = {
          es: translation.title_es || '',
          en: en || '',
          fr: fr || '',
          de: de || '',
          it: it || '',
          pl: pl || '',
        };

        // Update hero slide with translations
        const { error: updateError } = await supabaseAdmin
          .from('hero_slides')
          .update({ titles })
          .eq('id', id);

        if (updateError) throw updateError;

        // Log to translation_log
        await supabaseAdmin.from('translation_log').insert({
          property_id: `hero_${id}`,
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
          property_id: `hero_${translation.id || 'unknown'}`,
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
    console.error('[translateHero] Error:', error);
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
