const fs = require('fs');
try {
    const content = fs.readFileSync('help_output.html', 'utf8');
    console.log(content.substring(0, 2000));
} catch (e) {
    console.error(e);
}
