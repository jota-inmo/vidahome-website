async function testPhotoURL() {
    const testUrl = 'https://fotos15.inmovilla.com/13031/28189625/17-1.jpg';
    
    console.log(`Testing photo URL: ${testUrl}\n`);
    
    try {
        const response = await fetch(testUrl, { method: 'HEAD' });
        console.log(`Status: ${response.status}`);
        console.log(`Content-Type: ${response.headers.get('content-type')}`);
        console.log(`Content-Length: ${response.headers.get('content-length')}`);
        console.log(`Cache-Control: ${response.headers.get('cache-control')}`);
        
        if (response.status === 200) {
            console.log('\n✅ Photo URL is accessible!');
        } else {
            console.log(`\n⚠️  Photo returned status ${response.status}`);
        }
    } catch (err) {
        console.error(`❌ Error accessing photo:`, err.message);
    }
}

testPhotoURL();
