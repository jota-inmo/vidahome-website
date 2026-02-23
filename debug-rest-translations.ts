import { PropertyService } from './src/lib/api/properties';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function checkRestTranslations(id: number) {
    const token = process.env.INMOVILLA_TOKEN;
    const authType = (process.env.INMOVILLA_AUTH_TYPE as 'Token' | 'Bearer') || 'Bearer';

    if (!token) {
        console.error('Missing token');
        return;
    }

    const api = new PropertyService({ token, authType });

    try {
        console.log(`Checking REST API for property ${id}...`);
        const details = await api.getPropertyDetails(id);

        console.log('--- REST API DETAILS ---');
        // Let's look for description fields or languages
        console.log('Main description:', details.descripciones);

        // Sometimes interesting raw content is in the whole object
        const raw: any = details;
        if (raw.idiomas) {
            console.log('Found languages array:', raw.idiomas);
        }

        // Show all keys that might represent translations
        const translationKeys = Object.keys(raw).filter(k => k.includes('descrip') || k.includes('texto'));
        console.log('Potential description keys:', translationKeys);

        if (translationKeys.length > 0) {
            translationKeys.forEach(k => console.log(`${k}: ${String(raw[k]).substring(0, 50)}...`));
        }

    } catch (error) {
        console.error('Error fetching REST details:', error);
    }
}

// Using one of the IDs we found earlier
checkRestTranslations(27910163);
