/**
 * Translation Utility using Hugging Face Inference API
 * 
 * Uses free models like Helsinki-NLP/MarianMT or NLLB-200.
 */

const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;

// Model mapping for Spanish to other languages
const MODELS: Record<string, string> = {
    'en': 'Helsinki-NLP/opus-mt-es-en',
    'fr': 'Helsinki-NLP/opus-mt-es-fr',
    'de': 'Helsinki-NLP/opus-mt-es-de',
    'it': 'Helsinki-NLP/opus-mt-es-it',
    'nl': 'Helsinki-NLP/opus-mt-es-nl',
    'ru': 'Helsinki-NLP/opus-mt-es-ru',
};

// Multilingual fallback model (slower but covers everything)
const GLOBAL_MODEL = 'facebook/nllb-200-distilled-600M';

export async function translateText(text: string, sourceLag: string, targetLang: string): Promise<string | null> {
    if (!text || text.length < 5) return null;

    // For now we assume source is Spanish ('es')
    if (sourceLag !== 'es') {
        console.warn('[Translator] Only Spanish source is supported currently.');
        return null;
    }

    const modelId = MODELS[targetLang] || GLOBAL_MODEL;
    const url = `https://api-inference.huggingface.co/models/${modelId}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(HF_TOKEN ? { 'Authorization': `Bearer ${HF_TOKEN}` } : {})
            },
            body: JSON.stringify({
                inputs: text,
                parameters: {
                    // Specific params for NLLB if used
                    ...(modelId === GLOBAL_MODEL ? { src_lang: 'spa_Latn', tgt_lang: getNLBBLangCode(targetLang) } : {})
                }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.warn(`[Translator] HF API Error (${modelId}):`, err);
            return null;
        }

        const result = await response.json();

        // Handle response format variations
        if (Array.isArray(result) && result[0]?.translation_text) {
            return result[0].translation_text;
        }

        return null;
    } catch (error) {
        console.error('[Translator] Translation failed:', error);
        return null;
    }
}

function getNLBBLangCode(lang: string): string {
    const map: Record<string, string> = {
        'en': 'eng_Latn',
        'fr': 'fra_Latn',
        'de': 'deu_Latn',
        'it': 'ita_Latn',
        'nl': 'nld_Latn',
        'ru': 'rus_Cyrl'
    };
    return map[lang] || 'eng_Latn';
}
