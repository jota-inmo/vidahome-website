import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkPropertyTitles() {
    try {
        console.log('🔍 Revisando títulos de propiedades...\n');

        const { data: properties, error } = await supabaseAdmin
            .from('properties')
            .select('id, title, location, price')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error fetching properties:', error.message);
            return;
        }

        if (!properties || properties.length === 0) {
            console.log('No properties found');
            return;
        }

        console.log(`Total propiedades: ${properties.length}\n`);
        console.log('━'.repeat(100));

        // Analizar titles
        const issues: Array<{
            id: string;
            title: string;
            location: string;
            price: number;
            issues: string[];
        }> = [];

        properties.forEach((prop: any) => {
            const titleIssues: string[] = [];

            // Revisar si título está vacío
            if (!prop.title || prop.title.trim() === '') {
                titleIssues.push('TÍTULO VACÍO');
            }

            // Revisar si título tiene caracteres extraños
            if (prop.title && prop.title.includes('€')) {
                titleIssues.push('CONTIENE SÍMBOLO €');
            }

            // Revisar si título tiene números de ID
            if (prop.title && /^\d+/.test(prop.title)) {
                titleIssues.push('COMIENZA CON NÚMEROS');
            }

            // Revisar si título es muy corto
            if (prop.title && prop.title.length < 5) {
                titleIssues.push('TÍTULO MUY CORTO');
            }

            // Revisar si título es muy largo
            if (prop.title && prop.title.length > 200) {
                titleIssues.push('TÍTULO MUY LARGO (>200 chars)');
            }

            // Revisar si título tiene saltos de línea
            if (prop.title && prop.title.includes('\n')) {
                titleIssues.push('CONTIENE SALTOS DE LÍNEA');
            }

            // Revisar si título contiene "undefined" o "null"
            if (prop.title && (prop.title.toLowerCase().includes('undefined') || prop.title.toLowerCase().includes('null'))) {
                titleIssues.push('CONTIENE "UNDEFINED" O "NULL"');
            }

            if (titleIssues.length > 0) {
                issues.push({
                    id: prop.id,
                    title: prop.title || '(vacío)',
                    location: prop.location || '(no ubicación)',
                    price: prop.price,
                    issues: titleIssues
                });
            }
        });

        // Mostrar resultados
        if (issues.length === 0) {
            console.log('✅ Todos los títulos están bien formados\n');
        } else {
            console.log(`⚠️  ${issues.length} propiedades con problemas en título:\n`);

            issues.forEach((issue, idx) => {
                console.log(`${idx + 1}. ID: ${issue.id}`);
                console.log(`   Título: "${issue.title}"`);
                console.log(`   Ubicación: ${issue.location}`);
                console.log(`   Precio: €${issue.price?.toLocaleString('es-ES') || 'N/A'}`);
                console.log(`   ❌ Problemas: ${issue.issues.join(' | ')}`);
                console.log('');
            });
        }

        console.log('━'.repeat(100));

        // Mostrar ejemplos de títulos correctos vs incorrectos
        console.log('\n📊 ANÁLISIS:\n');
        console.log('Títulos CORRECTOS deberían ser:');
        console.log('  ✅ Villa de lujo con piscina - 350m²');
        console.log('  ✅ Casa moderna frente al mar');
        console.log('  ✅ Piso céntrico 3 habitaciones\n');

        console.log('Títulos INCORRECTOS que hemos visto:');
        issues.slice(0, 5).forEach((issue) => {
            console.log(`  ❌ "${issue.title}"`);
        });

    } catch (error) {
        console.error('❌ Error:',error);
    }
}

checkPropertyTitles();
