import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = "https://api.perplexity.ai/openai/v1/chat/completions";

async function testPerplexityModels() {
    console.log('\n╔════════════════════════════════════╗');
    console.log('║ TESTING PERPLEXITY API              ║');
    console.log('╚════════════════════════════════════╝\n');

    if (!PERPLEXITY_API_KEY) {
        console.log('❌ PERPLEXITY_API_KEY not set!');
        console.log('Set it in .env.local:\n  PERPLEXITY_API_KEY=your-key\n');
        return;
    }

    const models = [
        'pplx-7b-online',
        'pplx-70b-online',
        'pplx-8x7b-online',
        'gpt-4o-mini',
        'llama-3.1-70b-instruct',
        'mixtral-8x7b-32768'
    ];

    for (const model of models) {
        console.log(`⏳ Testing model: ${model}`);
        try {
            const response = await fetch(PERPLEXITY_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'user', content: 'Say "OK"' }
                    ],
                    temperature: 0.7,
                    max_tokens: 100,
                }),
            });

            const data = await response.json() as any;

            if (response.ok) {
                console.log(`  ✅ SUCCESS`);
                console.log(`     Response: ${data.choices?.[0]?.message?.content?.substring(0, 50)}\n`);
            } else {
                console.log(`  ❌ ERROR (${response.status}): ${data.error?.message || JSON.stringify(data)}\n`);
            }
        } catch (err: any) {
            console.log(`  ❌ EXCEPTION: ${err.message}\n`);
        }
    }
}

testPerplexityModels();
