import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

const endpoints = [
    'https://api.perplexity.ai/chat/completions',
    'https://api.perplexity.ai/openai/v1/chat/completions',
    'https://api.perplexity.ai/v1/chat/completions',
    'https://api.perplexity.com/openai/v1/chat/completions',
    'https://api.perplexity.com/chat/completions',
];

async function testEndpoints() {
    console.log('\n╔════════════════════════════════════╗');
    console.log('║ TESTING PERPLEXITY ENDPOINTS        ║');
    console.log('╚════════════════════════════════════╝\n');

    for (const endpoint of endpoints) {
        console.log(`⏳ ${endpoint}`);
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'pplx-7b-online',
                    messages: [{ role: 'user', content: 'Hi' }],
                    max_tokens: 10,
                }),
            });

            console.log(`   Status: ${response.status}`);
            if (response.ok) {
                console.log(`   ✅ OK\n`);
            } else {
                const text = await response.text();
                console.log(`   Body: ${text.substring(0, 100)}\n`);
            }
        } catch (err: any) {
            console.log(`   ❌ ${err.message}\n`);
        }
    }
}

testEndpoints();
