#!/usr/bin/env node

/**
 * Helper Script for Arsys Proxy Setup
 * 
 * This script helps you:
 * 1. Generate a secure random secret for the proxy
 * 2. Verify your environment configuration
 * 3. Test the proxy connection
 */

const crypto = require('crypto');
const https = require('https');

console.log('\n🔧 Arsys Proxy Setup Helper\n');
console.log('='.repeat(50));

// Function 1: Generate Secret
function generateSecret() {
    const secret = crypto.randomBytes(32).toString('hex');
    console.log('\n✅ Secreto generado:');
    console.log('─'.repeat(50));
    console.log(secret);
    console.log('─'.repeat(50));
    console.log('\n📋 Copia este valor y úsalo en:');
    console.log('   1. arsys-proxy/inmovilla-proxy.php → PROXY_SECRET');
    console.log('   2. Vercel → ARSYS_PROXY_SECRET');
    return secret;
}

// Function 2: Check Environment
function checkEnvironment() {
    console.log('\n🔍 Verificando configuración...\n');

    const required = {
        'INMOVILLA_AGENCIA': process.env.INMOVILLA_AGENCIA,
        'INMOVILLA_PASSWORD': process.env.INMOVILLA_PASSWORD,
        'ARSYS_PROXY_URL': process.env.ARSYS_PROXY_URL,
        'ARSYS_PROXY_SECRET': process.env.ARSYS_PROXY_SECRET,
    };

    let allConfigured = true;

    for (const [key, value] of Object.entries(required)) {
        const status = value ? '✅' : '❌';
        const display = value ? (value.length > 20 ? value.substring(0, 20) + '...' : value) : 'NO CONFIGURADA';
        console.log(`${status} ${key}: ${display}`);
        if (!value) allConfigured = false;
    }

    console.log('\n' + '─'.repeat(50));

    if (allConfigured) {
        console.log('✅ Todas las variables están configuradas');
    } else {
        console.log('⚠️  Faltan variables por configurar');
        console.log('   Ver: .env.example para más detalles');
    }

    return allConfigured;
}

// Function 3: Test Proxy
async function testProxy() {
    const proxyUrl = process.env.ARSYS_PROXY_URL;
    const proxySecret = process.env.ARSYS_PROXY_SECRET;

    if (!proxyUrl || !proxySecret) {
        console.log('\n❌ No se puede probar el proxy: faltan ARSYS_PROXY_URL o ARSYS_PROXY_SECRET');
        return;
    }

    console.log('\n🧪 Probando conexión con el proxy...\n');
    console.log(`URL: ${proxyUrl}`);

    try {
        const url = new URL(proxyUrl);
        const postData = JSON.stringify({ body: 'test' });

        const options = {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length,
                'X-Proxy-Secret': proxySecret
            }
        };

        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    console.log(`Status: ${res.statusCode}`);

                    if (res.statusCode === 200) {
                        console.log('✅ Proxy funcionando correctamente');
                    } else if (res.statusCode === 403) {
                        console.log('❌ Error de autenticación: verifica ARSYS_PROXY_SECRET');
                    } else {
                        console.log(`⚠️  Respuesta inesperada: ${res.statusCode}`);
                        console.log('Respuesta:', data.substring(0, 200));
                    }
                    resolve();
                });
            });

            req.on('error', (error) => {
                console.log('❌ Error de conexión:', error.message);
                console.log('\nPosibles causas:');
                console.log('  - El archivo PHP no está subido a Arsys');
                console.log('  - La URL es incorrecta');
                console.log('  - El servidor Arsys no está accesible');
                reject(error);
            });

            req.write(postData);
            req.end();
        });
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

// Main Menu
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (command === 'secret' || command === 'generate') {
        generateSecret();
    } else if (command === 'check' || command === 'verify') {
        checkEnvironment();
    } else if (command === 'test') {
        await testProxy();
    } else if (command === 'all') {
        generateSecret();
        console.log('\n');
        checkEnvironment();
        console.log('\n');
        await testProxy();
    } else {
        console.log('\n📖 Uso:\n');
        console.log('  node setup-helper.js secret   - Generar secreto aleatorio');
        console.log('  node setup-helper.js check    - Verificar configuración');
        console.log('  node setup-helper.js test     - Probar conexión con proxy');
        console.log('  node setup-helper.js all      - Ejecutar todo\n');
        console.log('📚 Documentación: SOLUCION_IP_ARSYS.md\n');
    }
}

main().catch(console.error);
