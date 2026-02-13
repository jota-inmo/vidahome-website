const http = require('http');

const data = JSON.stringify({
    provincia: 'VALENCIA',
    municipio: 'GANDIA',
    via: 'MAYOR',
    numero: '1'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/catastro/search',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => console.log('Response:', body));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
