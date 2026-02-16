<?php
/**
 * Inmovilla API Proxy for Arsys
 * 
 * This proxy runs on your Arsys server with a static IP.
 * Your Vercel app calls this proxy, which then calls Inmovilla.
 * 
 * Setup:
 * 1. Upload this file to your Arsys hosting (e.g., /api/inmovilla-proxy.php)
 * 2. Get your Arsys server IP from the control panel
 * 3. Ask Inmovilla to authorize your Arsys IP
 * 4. Configure PROXY_SECRET in this file
 * 5. Point your Next.js app to this proxy URL
 */

// Security: Change this secret key
define('PROXY_SECRET', '73d9a1f2b4c6e8092a1d4f6c8e0b2a4d6f8e0d2a4c6b8a2f4d6e8a0b2d4c6a8f');

// CORS headers (adjust domain as needed)
header('Access-Control-Allow-Origin: https://vidahome-website.vercel.app');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Proxy-Secret');
header('Content-Type: application/json');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Verify secret key
$providedSecret = $_SERVER['HTTP_X_PROXY_SECRET'] ?? '';
if ($providedSecret !== PROXY_SECRET) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Get the request body from Vercel
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['body'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request']);
    exit;
}

// Forward to Inmovilla API
$ch = curl_init('https://apiweb.inmovilla.com/apiweb/apiweb.php');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data['body']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/x-www-form-urlencoded',
    'User-Agent: Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.3) Gecko/20070309 Firefox/2.0.0.3'
]);

// Execute and get response
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

// Handle errors
if ($error) {
    http_response_code(502);
    echo json_encode([
        'error' => 'Proxy error',
        'message' => $error
    ]);
    exit;
}

// Return Inmovilla's response
http_response_code($httpCode);
echo $response;
?>
