import fs from 'fs';
import path from 'path';

// Read .env.local directly from file
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const perplexityLine = envContent.split('\n').find(line => line.startsWith('PERPLEXITY_API_KEY'));

console.log('\n╔════════════════════════════════════╗');
console.log('║ TESTING NEW PERPLEXITY KEY         ║');
console.log('╚════════════════════════════════════╝\n');

if (!perplexityLine) {
    console.log('❌ PERPLEXITY_API_KEY not found in .env.local');
    process.exit(1);
}

const PERPLEXITY_API_KEY = perplexityLine.split('=')[1].trim();

console.log(`✅ API Key found: ${PERPLEXITY_API_KEY.substring(0, 15)}...`);
console.log(`   Length: ${PERPLEXITY_API_KEY.length}\n`);

const endpoint = 'https://api.perplexity.ai/chat/completions';

console.log('Making request...\n');

fetch(endpoint, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        model: 'pplx-7b-online',
        messages: [
            { role: 'user', content: 'Say OK' }
        ],
        max_tokens: 50,
    }),
})
    .then(async (response) => {
        console.log(`Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log(`Response length: ${text.length} bytes\n`);

        if (response.ok) {
            try {
                const data = JSON.parse(text);
                console.log('✅ SUCCESS!');
                console.log(`Response: ${data.choices?.[0]?.message?.content}`);
            } catch (err) {
                console.log('Parsed response:', text);
            }
        } else {
            console.log('Error response:', text.substring(0, 200));
        }
    })
    .catch(err => {
        console.error('❌ Error:', err.message);
    });
