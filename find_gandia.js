const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/lib/api/localidades_map.json', 'utf8'));
for (const [id, name] of Object.entries(data)) {
    if (name.toLowerCase().includes('gandia')) {
        console.log(`${id}: ${name}`);
    }
}
