# 🔧 Edge Function Setup - Local Development

This guide explains how to sync the `translate-properties` Edge Function from Supabase to your local repository.

## 📋 Prerequisites

1. **Supabase CLI** installed:
   ```bash
   npm install -g supabase
   # Or: brew install supabase/tap/supabase
   ```

2. **Authenticated with Supabase**:
   ```bash
   supabase login
   # Follow prompts to authenticate with your Supabase account
   ```

3. **Project linked**:
   ```bash
   supabase projects list
   supabase link --project-ref yheqvroinbcrrpppzdzx
   # Replace with your actual project reference ID
   ```

## 📥 Syncing Edge Function from Supabase

### Option 1: Download Existing Function (Recommended)

The `translate-properties` function already exists in your Supabase project. To download it:

```bash
# From project root
supabase functions download translate-properties --name translate-properties

# This creates: supabase/functions/translate-properties/
```

### Option 2: Manual Copy

If the CLI download doesn't work, you can manually copy the function:

1. Go to [Supabase Console](https://supabase.com/dashboard)
2. Navigate to: Functions → translate-properties
3. Copy the full code
4. Create local file:
   ```bash
   mkdir -p supabase/functions/translate-properties
   ```
5. Paste code into: `supabase/functions/translate-properties/index.ts`

### Option 3: Deploy from Local Repository

If you want to deploy a fresh version from local:

```bash
# First, ensure you have the function file locally
# supabase/functions/translate-properties/index.ts

# Then deploy it
supabase functions deploy translate-properties

# Or deploy all functions
supabase functions deploy
```

## ✅ Verifying the Setup

### Check local directory structure:

```bash
ls -la supabase/functions/translate-properties/
# Should show: index.ts
```

### Verify Supabase CLI can find it:

```bash
supabase functions list
# Should show: translate-properties (deployed)
```

### Test the function:

```bash
# Option 1: Direct invoke
supabase functions invoke translate-properties --no-verify-jwt

# Option 2: With authentication
supabase functions invoke translate-properties \
  --no-verify-jwt \
  --body '{"property_ids": []}'

# Option 3: Using curl (in deployed environment)
curl -X POST https://yheqvroinbcrrpppzdzx.supabase.co/functions/v1/translate-properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"property_ids": []}'
```

## 🔐 Environment Variables (Secrets)

The Edge Function uses an environment variable for the Perplexity API key:

### In Supabase Console:

1. Go to: Settings → Edge Functions → Secrets
2. Add secret: `PERPLEXITY_API_KEY = "ppl-xxx"`

### In Local Development:

Create `.env.local`:

```bash
# Not needed locally for Edge Function execution
# The function reads from Supabase secrets, not from .env
```

The Edge Function accesses the secret via:

```typescript
const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
```

## 📂 Directory Structure

After syncing, your structure should look like:

```
inmovilla-next-app/
├── supabase/
│   └── functions/
│       └── translate-properties/
│           └── index.ts          # ← Edge Function code
├── src/
│   └── lib/
│       └── supabase/
│           └── translate-client.ts    # ← TypeScript client
├── src/
│   └── app/
│       └── actions/
│           └── translate.ts          # ← Server action
├── scripts/
│   └── translate-with-perplexity.ts  # ← CLI script
└── docs/
    └── EDGE_FUNCTION_TRANSLATION_GUIDE.md
```

## 🚀 Quick Start

### 1. Download Edge Function (if not already local)

```bash
supabase functions download translate-properties --name translate-properties
```

### 2. Verify secrets are set

```bash
supabase secrets list
# Should show: PERPLEXITY_API_KEY
```

### 3. Test locally

```bash
supabase functions invoke translate-properties \
  --no-verify-jwt \
  --body '{"property_ids": []}'
```

### 4. Deploy (if you made changes)

```bash
supabase functions deploy translate-properties
```

## 🔄 Workflow: Development Cycle

### Edit Function Locally

```bash
# Edit: supabase/functions/translate-properties/index.ts
vim supabase/functions/translate-properties/index.ts
```

### Test Locally

```bash
supabase functions invoke translate-properties \
  --no-verify-jwt \
  --body '{"property_ids": ["prop-123"]}'
```

### Deploy to Supabase

```bash
supabase functions deploy translate-properties
```

### Commit to Git

```bash
git add supabase/functions/translate-properties/
git commit -m "feat: update translate-properties Edge Function"
git push origin main
```

## 🐛 Troubleshooting

### Issue: "Function not found"

```bash
supabase functions list
# If not listed, check:
ls -la supabase/functions/translate-properties/index.ts

# Deploy it:
supabase functions deploy translate-properties
```

### Issue: "Permission denied" when syncing

```bash
# Make sure you're logged in
supabase login

# Check project link
supabase projects list
supabase link --project-ref yheqvroinbcrrpppzdzx
```

### Issue: "Secret PERPLEXITY_API_KEY not found"

```bash
# Check Supabase console: Settings → Edge Functions → Secrets
# Verify the key name is exactly: PERPLEXITY_API_KEY

# Or set it via CLI:
supabase secrets set PERPLEXITY_API_KEY="ppl-xxx"
```

### Issue: Edge Function returns 401 Unauthorized

The function might be checking for valid Supabase session. In `index.ts`, ensure proper CORS headers:

```typescript
// Should be in index.ts
headers: {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}
```

## 📚 Related Commands

```bash
# List all functions
supabase functions list

# Get specific function info
supabase functions describe translate-properties

# View function logs
supabase functions logs translate-properties

# Delete a function (careful!)
supabase functions delete translate-properties

# Get help
supabase functions --help
```

## 🎯 Next Steps

After syncing the Edge Function:

1. ✅ Run the CLI script: `npm run translate:perplexity`
2. ✅ Check translation_log table for results
3. ✅ Verify properties were translated in database
4. ✅ Create admin UI to trigger translations (optional)
5. ✅ Monitor costs and error rates

---

For full documentation on the translation system, see: [EDGE_FUNCTION_TRANSLATION_GUIDE.md](./EDGE_FUNCTION_TRANSLATION_GUIDE.md)
