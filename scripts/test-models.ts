import dotenv from 'dotenv';

dotenv.config({ path: '.env.local', override: true });

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const endpoint = 'https://api.perplexity.ai/chat/completions';

console.log('\n╔════════════════════════════════════╗');
console.log('║ TESTING PERPLEXITY MODELS          ║');
console.log('╚════════════════════════════════════╝\n');

// Updated models according to Perplexity docs
const models = [
    'sonar',
    'sonar-pro',
    'sonar-reasoning',
    'llama-3.1-70b-instruct',
    'mixtral-8x7b-instruct',
];

for (const model of models) {
    console.log(`⏳ Testing: ${model}`);
    
    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: 'user', content: 'Say OK' }
            ],
            max_tokens: 50,
        }),
    })
        .then(async (response) => {
            const text = await response.text();
            
            if (response.ok) {
                try {
                    const data = JSON.parse(text);
                    console.log(`   ✅ OK - Response: ${data.choices?.[0]?.message?.content?.substring(0, 30)}...\n`);
                } catch {
                    console.log(`   ✅ OK\n`);
                }
            } else {
                try {
                    const data = JSON.parse(text);
                    console.log(`   ❌ ${data.error?.message || 'Error'}\n`);
                } catch {
                    console.log(`   ❌ Status ${response.status}\n`);
                }
            }
        })
        .catch(err => {
            console.log(`   ❌ ${err.message}\n`);
        });
}

// Wait a bit before exit
setTimeout(() => process.exit(0), 3000);
