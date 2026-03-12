import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { createInmovillaApi } from '../src/lib/api/properties';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const TOKEN = process.env.INMOVILLA_TOKEN!;
const AUTH_TYPE = (process.env.INMOVILLA_AUTH_TYPE as 'Token' | 'Bearer') || 'Token';
const COD_OFER = 28342875;

async function debugCall() {
    console.log(`Checking COD_OFER: ${COD_OFER}`);
    const api = createInmovillaApi(TOKEN, AUTH_TYPE);
    
    try {
        const details = await api.getPropertyDetails(COD_OFER);
        console.log('Details:', JSON.stringify(details, null, 2));
    } catch (e: any) {
        console.error('Error:', e.message);
        if (e.status) console.error('Status:', e.status);
    }
}

debugCall();
