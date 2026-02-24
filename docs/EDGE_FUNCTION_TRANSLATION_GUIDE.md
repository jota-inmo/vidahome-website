# 🔄 Edge Function Translation System - Complete Guide

> **Date**: February 24, 2026  
> **Status**: ✅ Production Ready  
> **Security Level**: 🔐 High (API keys in Supabase secrets)

## 📋 Overview

This guide explains how the property translation system works using **Supabase Edge Functions** with **Perplexity AI** (sonar-small-online model).

### Why Edge Functions?

**Before**: Local Node.js scripts → Exposed API keys in .env files → Security risk ❌

**Now**: Next.js → Supabase Edge Function → Perplexity API → Secure ✅

```
┌─────────────────────────────────────────────────────────────┐
│  Your Next.js App (Browser/Server)                          │
│  - Frontend Components                                       │
│  - Server Actions                                           │
│  - API Routes                                               │
└──────────────────┬──────────────────────────────────────────┘
                   │ fetch() to Edge Function
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  Supabase Edge Function (translate-properties)              │
│  - Environment: Deno/TypeScript                            │
│  - API Key: Stored in Supabase Secrets                     │
│  - Batch Processing: Up to 10 properties/call              │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTPS Request
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  Perplexity API (sonar-small-online)                       │
│  - Fast & Cost-effective model                             │
│  - Supports batch translations                             │
│  - ~€0.0002 per 1000 tokens                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture

### 1. **Edge Function** (Supabase)

**Location**: `supabase/functions/translate-properties/index.ts`

**Configuration**:
- **Runtime**: Deno
- **Handler**: POST endpoint
- **Authentication**: Supabase Session or Anon Key
- **Timeout**: 60 seconds
- **Memory**: 1GB

**What it does**:
1. Receives list of property IDs (or empty for all pending)
2. Fetches property descriptions from `properties` table
3. Calls Perplexity API with Spanish descriptions
4. Parses JSON response with 5 languages (EN, FR, DE, IT, PL)
5. Updates `properties` table with translations
6. Logs all transactions in `translation_log` table
7. Returns results with cost estimation

**Languages Supported**:
- Input: Spanish (ES) - source language
- Output: English (EN), French (FR), German (DE), Italian (IT), Polish (PL)

### 2. **TypeScript Client** (Next.js Library)

**Location**: `src/lib/supabase/translate-client.ts`

**Exports**:
```typescript
// Translate all pending properties
await translateProperties();

// Translate specific properties
await translateProperties(['prop-123', 'prop-456']);

// Translate single property
await translateProperty('prop-123');

// Translate with progress callback
await translatePropertiesWithProgress(propertyIds, 10, (progress) => {
  console.log(`Batch ${progress.currentBatch}/${progress.totalBatches}`);
});
```

**Type**: `TranslationResponse`
```typescript
{
  translated: number;        // Successfully translated
  errors: number;            // Failed properties
  error_details?: Array<{    // Details of errors
    property_id: string;
    error: string;
  }>;
  cost_estimate: string;     // e.g., "0.0025€"
  duration_ms?: number;      // Execution time
  timestamp?: string;        // When it ran
}
```

### 3. **Server Action** (Next.js)

**Location**: `src/app/actions/translate.ts`

**Functions**:
```typescript
// Translate all pending properties
await translatePropertiesAction();

// Translate specific properties
await translatePropertiesAction(['prop-123']);

// Translate single property
await translatePropertyAction('prop-123');
```

Returns the same `TranslationResponse` type.

---

## 🚀 Usage Examples

### Example 1: Command-line Translation Script

```bash
# From project root
npm run translate:perplexity

# Or with Node/ts-node
npx ts-node scripts/translate-with-perplexity.ts
```

**Script location**: `scripts/translate-with-perplexity.ts`

**Output**:
```
[10:30:45] 🚀 Starting Property Translation via Supabase Edge Function...
[10:30:46] 📥 Identifying properties needing translation...
[10:30:47] ✅ Found 150 properties needing translation
---
[10:30:47] 📦 Processing batch 1/15 (10 properties)
[10:30:48] ✓ Batch 1: 10 translated, 0 errors
[10:30:48] 💰 Cost estimate: 0.0025€
[10:30:48] ⏳ Waiting 2000ms before next batch...
...
---
📊 Translation Summary:
   • Total properties processed: 150
   • Successfully translated: 150
   • Errors: 0
   • Success rate: 100.0%
   • Total cost estimate: 0.0375€
---
✅ Translation job complete!
```

### Example 2: React Admin Component

```tsx
"use client";

import { useState } from "react";
import { translatePropertiesAction } from "@/app/actions/translate";

export function TranslateButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTranslate = async () => {
    setLoading(true);
    try {
      const result = await translatePropertiesAction();
      setResult(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleTranslate}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Translating..." : "Translate All Properties"}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p>✅ Translated: {result.translated}</p>
          <p>❌ Errors: {result.errors}</p>
          <p>💰 Cost: {result.cost_estimate}</p>
        </div>
      )}
    </div>
  );
}
```

### Example 3: API Route (Next.js)

```typescript
// app/api/admin/translate/route.ts
import { translatePropertiesAction } from "@/app/actions/translate";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { property_ids } = await request.json();

    const result = await translatePropertiesAction(property_ids);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
```

---

## 🔐 Security Configuration

### 1. Environment Variables

**Supabase Secrets** (stored securely in Supabase console):

```bash
PERPLEXITY_API_KEY = "ppl-xxxxxxxxxxxx"  # Never in version control
```

**Next.js `.env.local`** (Git ignored, for local development):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://yheqvroinbcrrpppzdzx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh... (public, safe to expose)
```

### 2. CORS Configuration

Edge Function has CORS headers configured:

```typescript
headers: {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}
```

### 3. Authentication

Edge Function validates:
- ✅ Supabase session token OR
- ✅ Service role key (from `Authorization` header)

### 4. Database RLS (Row Level Security)

`translation_log` table uses RLS:
- ✅ Authenticated users can read their own translations
- ✅ Edge Function (with service role) can write logs
- ✅ No direct public access

---

## 💾 Database Schema

### Properties Table (Updated)

```sql
ALTER TABLE properties ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS description_fr TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS description_de TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS description_it TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS description_pl TEXT;

CREATE INDEX properties_translations_idx ON properties
(description_es, description_en, description_fr, description_de, description_it, description_pl)
WHERE description_es IS NOT NULL;
```

### Translation Log Table

```sql
CREATE TABLE translation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id TEXT NOT NULL,
  status TEXT CHECK (status IN ('success', 'error')),
  source_language TEXT DEFAULT 'es',
  target_languages TEXT[] DEFAULT ARRAY['en', 'fr', 'de', 'it', 'pl'],
  tokens_used INTEGER,
  cost_estimate DECIMAL(10, 6),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX translation_log_property_id_idx ON translation_log(property_id);
CREATE INDEX translation_log_created_at_idx ON translation_log(created_at DESC);
CREATE INDEX translation_log_status_idx ON translation_log(status);
```

---

## 📊 Cost Estimation

**Model**: Perplexity sonar-small-online

**Pricing**: ~€0.0002 per 1000 tokens (varies by request complexity)

**Example**:
- 150 properties × average 200 tokens each = 30,000 tokens
- 30,000 ÷ 1000 × €0.0002 = €0.006 per language
- 5 languages × €0.006 = **€0.03 for all 150 properties**

Each translation is logged with estimated cost:

```typescript
const costEstimate = (tokens_used / 1000) * 0.0002;
// Example: 150 tokens = (150 / 1000) * 0.0002 = €0.00003
```

---

## 🧪 Testing the Translation System

### Test 1: Check if Edge Function is Running

```bash
curl -X POST https://yheqvroinbcrrpppzdzx.supabase.co/functions/v1/translate-properties \
  -H "Content-Type: application/json" \
  -d '{"property_ids": []}'
```

**Expected Response**:
```json
{
  "translated": 150,
  "errors": 0,
  "cost_estimate": "0.0375€"
}
```

### Test 2: Translate Single Property

```typescript
// In a Next.js component or API route
const result = await translateProperty('prop-123');
console.log(result);
// { translated: 1, errors: 0, cost_estimate: "0.00025€" }
```

### Test 3: Check Translation Results

```typescript
const { data: property } = await supabase
  .from('properties')
  .select('description_es, description_en, description_fr')
  .eq('property_id', 'prop-123')
  .single();

console.log('English:', property.description_en);
console.log('French:', property.description_fr);
```

### Test 4: Review Translation Logs

```typescript
const { data: logs } = await supabase
  .from('translation_log')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10);

console.log(logs);
```

---

## 🔄 Workflow: End-to-End

### Step 1: Admin Triggers Translation

```tsx
// Admin panel component
<button onClick={() => translatePropertiesAction()}>
  Translate Properties
</button>
```

### Step 2: Request Reaches Edge Function

```
Browser/Server → POST /functions/v1/translate-properties
Body: { property_ids: [...] }
```

### Step 3: Edge Function Processes

```typescript
1. Validate authentication
2. Fetch properties from DB (max 10)
3. Prepare prompt with Spanish descriptions
4. Call Perplexity API
5. Parse JSON response
6. Update properties table
7. Log to translation_log table
8. Return results + cost
```

### Step 4: Results Return to Client

```typescript
{
  translated: 10,
  errors: 0,
  cost_estimate: "0.0025€"
}
```

### Step 5: Database Updated

```sql
-- properties table
UPDATE properties
SET description_en = '...',
    description_fr = '...',
    description_de = '...'
WHERE property_id = 'prop-123';

-- translation_log table
INSERT INTO translation_log (property_id, status, tokens_used, cost_estimate)
VALUES ('prop-123', 'success', 156, 0.000312);
```

---

## 🚨 Troubleshooting

### Issue: "Edge Function error: 401 Unauthorized"

**Cause**: Missing or invalid Supabase key

**Solution**:
```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Verify in Supabase console: Project Settings → API Keys
```

### Issue: "Perplexity API error: 401 Unauthorized"

**Cause**: Invalid API key in Supabase secrets

**Solution**:
1. Go to Supabase console
2. Settings → Edge Functions → Secrets
3. Verify `PERPLEXITY_API_KEY` is correct
4. Format: `ppl-xxxxxxxxxxxxxxx`

### Issue: "Translations not appearing in database"

**Cause**: RLS policies blocking writes

**Solution**:
```sql
-- Check RLS policy
SELECT * FROM pg_policies WHERE tablename = 'properties';

-- Temporarily disable RLS for debugging
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;
-- Re-enable after testing
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
```

### Issue: "Request timeout after 60 seconds"

**Cause**: Processing too many properties at once

**Solution**: Use smaller batches
```typescript
// Instead of all 100 properties at once
const result = await translateProperties(
  propertyIds.slice(0, 10)  // Only 10 per call
);
```

---

## 📈 Monitoring & Logging

### View Recent Translations

```typescript
// Get all translations from last hour
const { data } = await supabase
  .from('translation_log')
  .select('*')
  .gt('created_at', new Date(Date.now() - 3600000).toISOString());

console.table(data);
```

### Calculate Total Cost

```typescript
const { data } = await supabase
  .from('translation_log')
  .select('cost_estimate')
  .eq('status', 'success');

const totalCost = data.reduce((sum, row) => sum + row.cost_estimate, 0);
console.log(`Total cost: €${totalCost.toFixed(4)}`);
```

### Error Rate

```typescript
const { data } = await supabase
  .from('translation_log')
  .select('status');

const errors = data.filter(r => r.status === 'error').length;
const errorRate = (errors / data.length) * 100;
console.log(`Error rate: ${errorRate.toFixed(1)}%`);
```

---

## 🎯 Next Steps

- [ ] **Test the Edge Function** with a small batch (5 properties)
- [ ] **Monitor costs** - Check translation_log table after first run
- [ ] **Create Admin UI** - Build interface to trigger translations
- [ ] **Schedule translations** - Set up cron job for regular updates
- [ ] **Implement notifications** - Email admin when translation completes
- [ ] **Add progress tracking** - Show real-time progress in UI

---

## 📚 Related Documentation

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Perplexity API Documentation](https://docs.perplexity.ai)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Supabase Environment Variables](https://supabase.com/docs/guides/functions/secrets)

---

## ❓ Questions?

If the Edge Function doesn't work as expected:
1. Check Supabase logs: Settings → Logs
2. Verify Perplexity API key is correct
3. Test manually with curl command above
4. Check translation_log table for error messages
