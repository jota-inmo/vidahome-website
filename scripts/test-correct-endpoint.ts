import dotenv from 'dotenv';

dotenv.config({ path: '.env.local', override: true });

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const endpoint = 'https://api.perplexity.ai/chat/completions';

console.log('\n╔════════════════════════════════════╗');
console.log('║ TESTING PERPLEXITY WITH NEW KEY    ║');
console.log('╚════════════════════════════════════╝\n');

console.log(`API Key: ${PERPLEXITY_API_KEY?.substring(0, 15)}...`);
console.log(`Endpoint: ${endpoint}\n`);

fetch(endpoint, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        model: 'pplx-7b-online',
        messages: [
            { role: 'user', content: 'Translate to English: "Hola mundo"' }
        ],
        max_tokens: 100,
    }),
})
    .then(async (response) => {
        console.log(`Status: ${response.status} ${response.statusText}`);
        const text = await response.text();

        if (response.ok && text) {
            try {
                const data = JSON.parse(text);
                console.log('✅ SUCCESS!\n');
                console.log(`Response: ${data.choices?.[0]?.message?.content}\n`);
            } catch (err) {
                console.log('Response:', text.substring(0, 200));
            }
        } else {
            console.log(`❌ Error: ${text || 'Empty response'}`);
        }
    })
    .catch(err => {
        console.error('❌ Error:', err.message);
    });
