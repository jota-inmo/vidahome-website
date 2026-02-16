# Inmovilla API - IP Authorization Issue

## Problem

When deployed on Vercel, the Inmovilla API returns:
```
IP NO VALIDADA - IP_RECIVED: 3.208.86.127
```

This means Inmovilla's firewall is blocking requests because the server's IP is not authorized.

## Why This Happens

- **Local Development**: Your local machine's public IP is used
- **Vercel Deployment**: Vercel's server IP (e.g., `3.208.86.127`) is used
- Inmovilla checks the **server's IP**, not the end user's IP

## Solutions

### Option 1: Authorize Vercel's IP Range (Recommended for Testing)

1. Visit `/api/debug/ip` on your deployed site to see the current server IP
2. Contact Inmovilla support and ask them to authorize that IP
3. **Important**: Vercel uses dynamic IPs, so this IP might change

**Vercel IP Ranges** (as of 2024):
- You may need to authorize multiple IPs or a range
- Check Vercel's documentation for current IP ranges
- Consider asking Inmovilla to whitelist Vercel's entire IP range

### Option 2: Use a Static IP Proxy (Production Solution)

For production, consider using a proxy service with a static IP:

1. **AWS API Gateway + Lambda**: Route requests through AWS with an Elastic IP
2. **Cloudflare Workers**: Use Cloudflare's IP ranges
3. **Dedicated Proxy Service**: Services like QuotaGuard, Fixie, etc.

Example with a proxy:
```typescript
// In web-client.ts, modify the fetch call:
const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
        'X-Target-URL': this.baseUrl,
        'X-Static-IP': process.env.STATIC_IP_TOKEN,
        ...headers
    },
    body: body
});
```

### Option 3: Vercel Enterprise (Expensive)

Vercel Enterprise plans offer static IP addresses.

## Current Implementation

The code already:
- ✅ Sends the correct IP in the `ia` parameter
- ✅ Uses the correct User-Agent
- ✅ Implements all security validations
- ✅ Handles IP detection for both local and production

**The only issue is authorization on Inmovilla's side.**

## Testing Locally

When testing locally, the code automatically detects your public IP using `api.ipify.org` and sends it to Inmovilla. Make sure your local IP is also authorized if testing from your development machine.

## Next Steps

1. Access `/api/debug/ip` on your deployed Vercel site
2. Copy the `serverPublicIp` value
3. Email Inmovilla support: `soporte@inmovilla.com`
4. Request authorization for that IP (and ideally Vercel's IP range)

## Environment Variables

Make sure these are set in Vercel:
```env
INMOVILLA_AGENCIA=your_agency_number
INMOVILLA_PASSWORD=your_api_password
INMOVILLA_DOMAIN=vidahome.es
```

## Monitoring

The error is caught and logged in:
- `src/lib/api/web-client.ts` (lines 205-211)
- `src/app/actions.ts` (error handling in catch blocks)

Check Vercel logs for detailed error messages.
