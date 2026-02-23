/**
 * Translation Utility using Hugging Face Inference API
 * 
 * Uses free models like Helsinki-NLP/MarianMT or NLLB-200.
 */

// Use Helsinki-NLP as primary for translation speed
const PRIMARY_MODEL = 'Helsinki-NLP/opus-mt-es-en';

export async function translateText(text: string, sourceLag: string, targetLang: string, timeoutMs: number = 30000): Promise<string | null> {
    if (!text || text.length < 5) return null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const token = process.env.HUGGINGFACE_TOKEN;

    // For now we assume source is Spanish ('es')
    if (sourceLag !== 'es') {
        console.warn('[Translator] Only Spanish source is supported currently.');
        return null;
    }

    const modelId = PRIMARY_MODEL;
    const url = `https://router.huggingface.co/hf-inference/models/${modelId}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
                inputs: text
            })
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const err = await response.text();
            console.warn(`[Translator] HF API Error (${modelId}):`, err.substring(0, 100)); // Limit log size
            return null;
        }

        let result = await response.json();

        // Handle "model loading" state
        if (result.error && result.error.includes('currently loading')) {
            // Only retry if we still have time
            if (timeoutMs > 15000) {
                const waitTime = Math.min((result.estimated_time || 10) * 1000, 10000);
                console.log(`[Translator] Model is loading, waiting ${waitTime / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                return translateText(text, sourceLag, targetLang, timeoutMs - waitTime - 2000);
            }
            return null;
        }

        // Handle response format variations
        if (Array.isArray(result) && result[0]?.translation_text) {
            return result[0].translation_text;
        }

        if (result.error) {
            console.warn(`[Translator] HF Error:`, result.error);
        }

        return null;
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.warn('[Translator] Translation timed out');
        } else {
            console.error('[Translator] Translation failed:', error);
        }
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
