# 📌 Important: Edge Function Architecture

## ⚠️ CRITICAL ARCHITECTURAL NOTE

The **Supabase Edge Function** (`translate-properties`) is **NOT part of this Next.js repository**.

It lives exclusively in your **Supabase Cloud project**.

### Why?

- ✅ **Edge Functions are Deno/TypeScript**, not compatible with Next.js build
- ✅ **Supabase manages the deployment** (you deploy via Supabase CLI, not npm)
- ✅ **Separation of concerns** - Backend services separate from frontend
- ✅ **Better security** - API keys stored in Supabase secrets, not in code

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│  This Repository (Next.js 16)                   │
│  - Frontend React Components                    │
│  - Server Actions (TypeScript)                  │
│  - API Routes (Next.js)                         │
│  - Client Libraries (translate-client.ts)       │
└────────────────────┬────────────────────────────┘
                     │
                     │ fetch() calls
                     ↓
┌─────────────────────────────────────────────────┐
│  Supabase Edge Function (Separate Deployment)   │
│  - Location: Supabase Console → Functions       │
│  - File: translate-properties/index.ts (Deno)   │
│  - Deployment: supabase functions deploy        │
│  - Secrets: Stored in Supabase Settings         │
└────────────────────┬────────────────────────────┘
                     │
                     │ HTTPS POST
                     ↓
┌─────────────────────────────────────────────────┐
│  Perplexity AI API                              │
│  - API Key: Stored in Supabase secrets          │
│  - Model: sonar-small-online                    │
│  - Never exposed to frontend code               │
└─────────────────────────────────────────────────┘
```

---

## 📂 Where the Edge Function Lives

### In Supabase Cloud (Not in this repo):
```
Supabase Console
  → Functions
    → translate-properties
      → index.ts (Deno code)
      → Secrets: PERPLEXITY_API_KEY
      → URL: https://yheqvroinbcrrpppzdzx.supabase.co/functions/v1/translate-properties
```

### In This Repository:
```
inmovilla-next-app/
├── src/lib/supabase/translate-client.ts    ← Client to CALL the function
├── src/app/actions/translate.ts            ← Server action wrapper
├── src/components/admin/TranslatePropertiesPanel.tsx  ← React UI
├── scripts/translate-with-perplexity.ts    ← CLI to run translations
└── docs/
    ├── EDGE_FUNCTION_TRANSLATION_GUIDE.md  ← How to use it
    ├── EDGE_FUNCTION_SETUP.md              ← How to update it
    └── QUICK_START_TRANSLATION.md          ← Quick reference
```

**Note**: The Edge Function code itself is NOT here (correctly).

---

## 🔄 How They Connect

### 1. Next.js Application Calls Edge Function

```typescript
// src/lib/supabase/translate-client.ts
export async function translateProperties(propertyIds?: string[]) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/translate-properties`;
  
  const response = await fetch(edgeFunctionUrl, {
    method: "POST",
    body: JSON.stringify({ property_ids: propertyIds }),
  });
  
  return response.json();
}
```

### 2. Edge Function Handles Request

```typescript
// In Supabase Console (NOT in this repo)
serve(async (req) => {
  // Validate request
  // Get API key from Supabase secret (NEVER exposed)
  // Call Perplexity API
  // Update database
  // Return results
});
```

---

## 🚀 Deploying Changes

### To Update This Repository (Next.js Code):
```bash
git add .
git commit -m "feat: update translation UI"
git push origin main
# Vercel automatically deploys
```

### To Update Edge Function (Deno Code):
```bash
# Make changes in Supabase Console UI
# Or sync from local:
supabase functions download translate-properties
# Edit supabase/functions/translate-properties/index.ts
# Deploy:
supabase functions deploy translate-properties
# This does NOT go into git
```

---

## 🔐 Security Implications

### API Key Management:

**❌ OLD (Insecure)**:
```typescript
// In .env or local code
PERPLEXITY_API_KEY="ppl-xxx"  // EXPOSED!
```

**✅ NEW (Secure)**:
```
Supabase Console → Settings → Edge Functions → Secrets
PERPLEXITY_API_KEY="ppl-xxx"  // Hidden from code
```

- ✅ No API keys in GitHub
- ✅ No API keys in Next.js code
- ✅ No API keys in commits
- ✅ Secured at Supabase level

---

## 📋 Checklist: Edge Function Maintenance

- [ ] **Get latest code from Supabase**: `supabase functions download translate-properties`
- [ ] **Edit locally**: `supabase/functions/translate-properties/index.ts`
- [ ] **Test locally**: `supabase functions invoke translate-properties --no-verify-jwt`
- [ ] **Deploy to Supabase**: `supabase functions deploy translate-properties`
- [ ] ✅ **NO git commit** for Edge Function changes
- [ ] **Update docs** if behavior changes

---

## 🆘 Troubleshooting

### Error: "Cannot find module 'https://deno.land...'"
- **Cause**: Trying to build Edge Function as Next.js code
- **Solution**: Edge Functions should NOT be in `supabase/functions/` when using Next.js build
- **Fix**: Already removed! See commit `4920500`

### Error: "Edge Function not found (401 Unauthorized)"
- **Cause**: PERPLEXITY_API_KEY not set in Supabase
- **Solution**: Go to Supabase Console → Settings → Edge Functions → Secrets → Add `PERPLEXITY_API_KEY`

### Edge Function code looks different than documentation
- **Cause**: Edge Function was updated in Supabase Console
- **Solution**: Sync it locally: `supabase functions download translate-properties`

---

## 📚 Learn More

- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Deno Documentation**: https://docs.deno.com/
- **Next.js Server Actions**: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations

---

## ✅ Summary

| Component | Location | Deployment | Git? |
|-----------|----------|-----------|------|
| Next.js App | This repo | `git push` → Vercel | ✅ Yes |
| Edge Function | Supabase Cloud | Supabase CLI | ❌ No |
| Client Library | This repo | `git push` → Vercel | ✅ Yes |
| Server Action | This repo | `git push` → Vercel | ✅ Yes |
| React Component | This repo | `git push` → Vercel | ✅ Yes |
| API Keys | Supabase Secrets | Console UI | ❌ No |

This separation ensures **security**, **maintainability**, and **proper deployment workflows** for each component.
