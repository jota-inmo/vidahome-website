import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

async function testHeaderFormats() {
    console.log('\n╔════════════════════════════════════╗');
    console.log('║ TESTING AUTHORIZATION HEADERS       ║');
    console.log('╚════════════════════════════════════╝\n');

    const headers = [
        { name: 'Bearer', value: `Bearer ${PERPLEXITY_API_KEY}` },
        { name: 'Direct API Key', value: PERPLEXITY_API_KEY },
        { name: 'X-API-Key', value: PERPLEXITY_API_KEY },
    ];

    const endpoint = 'https://api.perplexity.ai/chat/completions';

    for (const { name, value } of headers) {
        console.log(`⏳ Trying: ${name}`);
        try {
            const authHeaders: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            
            if (name === 'X-API-Key') {
                authHeaders['X-API-Key'] = value;
            } else if (name === 'Direct API Key') {
                authHeaders['Authorization'] = value;
            } else {
                authHeaders['Authorization'] = value;
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    model: 'pplx-7b-online',
                    messages: [{ role: 'user', content: 'Hi' }],
                    max_tokens: 10,
                }),
            });

            console.log(`   Status: ${response.status}`);
            
            const text = await response.text();
            if (text.length > 0) {
                console.log(`   Response: ${text.substring(0, 60)}...`);
            }
            
            if (response.ok) {
                console.log(`   ✅ SUCCESS!\n`);
                console.log('Use this header format:\n  ' + JSON.stringify(authHeaders, null, 2));
                return;
            } else {
                console.log();
            }
        } catch (err: any) {
            console.log(`   ❌ ${err.message}\n`);
        }
    }
}

testHeaderFormats();
