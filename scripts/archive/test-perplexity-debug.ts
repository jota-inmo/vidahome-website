import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = "https://api.perplexity.ai/openai/v1/chat/completions";

async function testPerplexityDebug() {
    console.log('\n╔════════════════════════════════════╗');
    console.log('║ DEBUGGING PERPLEXITY API            ║');
    console.log('╚════════════════════════════════════╝\n');

    if (!PERPLEXITY_API_KEY) {
        console.log('❌ PERPLEXITY_API_KEY not set!');
        return;
    }

    console.log(`API Key length: ${PERPLEXITY_API_KEY.length}`);
    console.log(`API Key prefix: ${PERPLEXITY_API_KEY.substring(0, 10)}...`);
    console.log(`Endpoint: ${PERPLEXITY_API_URL}\n`);

    console.log('Making request...\n');
    
    const response = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'pplx-7b-online',
            messages: [
                { role: 'user', content: 'Say "OK"' }
            ],
            temperature: 0.7,
            max_tokens: 100,
        }),
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}\n`);

    const text = await response.text();
    console.log(`Response length: ${text.length} bytes\n`);
    console.log(`Response text:\n${text.substring(0, 500)}\n`);

    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        console.log('❌ Got HTML response (probably 404 or error page)');
    } else if (response.ok) {
        try {
            const data = JSON.parse(text);
            console.log('✅ Valid JSON response');
            console.log(JSON.stringify(data, null, 2));
        } catch (err) {
            console.log('❌ Invalid JSON');
        }
    } else {
        try {
            const data = JSON.parse(text);
            console.log('❌ Error response:');
            console.log(JSON.stringify(data, null, 2));
        } catch (err) {
            console.log(`❌ Could not parse error: ${err}`);
        }
    }
}

testPerplexityDebug().catch(console.error);
