import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

async function triggerSync() {
    console.log('🔄 Importing sync function...');
    
    const { syncPropertiesFromInmovillaAction } = await import('./src/app/actions/inmovilla.js');
    
    console.log('📡 Starting full sync with photos...');
    const result = await syncPropertiesFromInmovillaAction();
    
    console.log('\n✅ Sync Result:');
    console.log(`  Success: ${result.success}`);
    console.log(`  Synced: ${result.synced}`);
    if (result.error) {
        console.log(`  Error: ${result.error}`);
    }
}

triggerSync().catch(err => {
    console.error('❌ Sync failed:', err);
    process.exit(1);
});
