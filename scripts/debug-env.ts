import fs from 'fs';
import path from 'path';

// Read .env.local directly from file  
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

console.log('File contents:');
console.log(envContent);
console.log('\n---\n');

const lines = envContent.split('\n');
for (const line of lines) {
    if (line.includes('PERPLEXITY')) {
        console.log(`Found: "${line}"`);
        const parts = line.split('=');
        console.log(`Parts: ${parts.length}`);
        if (parts[1]) {
            const key = parts[1].trim();
            console.log(`Key: ${key.substring(0, 20)}...`);
        }
    }
}
