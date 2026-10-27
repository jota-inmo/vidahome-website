# 🚀 Quick Start Guide - Edge Function Translation System

> **Last Updated**: February 24, 2026  
> **Commits**: `2235a58` + `f3aff13`  
> **Status**: ✅ Ready to Use

## 📋 What You Have

A **production-ready translation system** that translates property descriptions from Spanish to 5 languages using Perplexity AI via Supabase Edge Functions.

---

## ⚡ 5-Minute Setup

### Step 1: Verify Environment

```bash
# Check that your Edge Function URL is correct
echo "URL: https://yheqvroinbcrrpppzdzx.supabase.co/functions/v1/translate-properties"

# Verify environment variable is set
echo $NEXT_PUBLIC_SUPABASE_URL
# Should output: https://yheqvroinbcrrpppzdzx.supabase.co
```

### Step 2: Run Translation

```bash
# Translate all pending properties
npm run translate:perplexity
```

**That's it!** 🎉

The script will:
- ✅ Find properties needing translation
- ✅ Batch them in groups of 10
- ✅ Call Supabase Edge Function for each batch
- ✅ Log results to database
- ✅ Show summary with cost

---

## 📊 Expected Output

```
[10:30:45] 🚀 Starting Property Translation via Supabase Edge Function...
[10:30:46] 📥 Identifying properties needing translation...
[10:30:47] ✅ Found 150 properties needing translation
---
[10:30:47] 📦 Processing batch 1/15 (10 properties)
[10:30:48] ✓ Batch 1: 10 translated, 0 errors
[10:30:48] 💰 Cost estimate: 0.0025€
[10:30:48] ⏳ Waiting 2000ms before next batch...

📊 Translation Summary:
   • Total properties processed: 150
   • Successfully translated: 150
   • Errors: 0
   • Success rate: 100.0%
   • Total cost estimate: 0.0375€
---
✅ Translation job complete!
```

---

## 🎯 Three Ways to Translate

### Option 1: CLI Script (Recommended for Batch)

```bash
npm run translate:perplexity
```

**Best for**: Translating many properties at once (100+)  
**Time**: ~30-60 seconds for 150 properties

### Option 2: Admin Component (Recommended for UI)

In your admin page component:

```tsx
import { TranslatePropertiesPanel } from "@/components/admin/TranslatePropertiesPanel";

export default function AdminPage() {
  return <TranslatePropertiesPanel />;
}
```

**Features**:
- Beautiful UI with progress stats
- Real-time feedback
- Error details
- Cost tracking

### Option 3: Server Action (Recommended for Code)

```typescript
import { translatePropertiesAction } from "@/app/actions/translate";

// In a Server Component or API Route
const result = await translatePropertiesAction();
console.log(`Translated: ${result.translated}`);
console.log(`Cost: ${result.cost_estimate}`);
```

---

## 🔍 Verify Results

### Check Database

```sql
-- In Supabase console, run query:
SELECT property_id, description_es, description_en, description_fr
FROM properties
WHERE description_en IS NOT NULL
LIMIT 5;
```

### Check Logs

```sql
-- View recent translations:
SELECT property_id, status, tokens_used, cost_estimate, created_at
FROM translation_log
ORDER BY created_at DESC
LIMIT 20;
```

---

## 💡 Common Questions

### Q: How much does it cost?

**A**: ~€0.0002 per 1000 tokens, or about **€0.03-0.05 per 150 properties**

Each translation is logged with cost estimate in `translation_log` table.

### Q: How long does it take?

**A**: 
- Single property: ~200-300ms
- Batch of 10: ~2-3 seconds
- 150 properties: ~45 seconds (includes rate limiting delays)

### Q: Can I translate specific properties?

**A**: Yes! Use the library directly:

```typescript
import { translateProperties } from "@/lib/supabase/translate-client";

// Translate specific properties
const result = await translateProperties(['prop-123', 'prop-456']);
```

### Q: What if there are errors?

**A**: They'll be logged in `translation_log` table with error messages. The system continues processing other properties even if some fail.

### Q: Can I check progress?

**A**: Yes, the CLI script shows real-time progress. For code, use:

```typescript
import { translatePropertiesWithProgress } from "@/lib/supabase/translate-client";

const result = await translatePropertiesWithProgress(
  propertyIds,
  10,
  (progress) => {
    console.log(`Batch ${progress.currentBatch}/${progress.totalBatches}`);
    console.log(`Total translated: ${progress.totalTranslated}`);
  }
);
```

---

## 🔐 Security Checklist

- ✅ Perplexity API key stored in Supabase Secrets (not in code)
- ✅ No API keys in `.env` or GitHub
- ✅ CORS headers properly configured
- ✅ Authentication required for Edge Function calls
- ✅ Database RLS policies in place

---

## 📚 Learn More

| Document | Purpose |
|----------|---------|
| `EDGE_FUNCTION_TRANSLATION_GUIDE.md` | Complete guide (20+ sections) |
| `EDGE_FUNCTION_SETUP.md` | Supabase CLI setup & deployment |
| `EDGE_FUNCTION_IMPLEMENTATION_SUMMARY.md` | What was built & architecture |

---

## 🆘 Troubleshooting

### "Edge Function error: 401 Unauthorized"

**Solution**: Check environment variable:
```bash
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
# Should not be empty
```

### "No properties needing translation found"

**Possible causes**:
1. All properties already translated (check `properties` table)
2. No properties with `description_es` set

**Solution**: Check database:
```sql
SELECT COUNT(*) FROM properties WHERE description_es IS NOT NULL;
```

### "Perplexity API error"

**Solution**: Verify API key in Supabase console:
1. Settings → Edge Functions → Secrets
2. Ensure `PERPLEXITY_API_KEY` is set correctly
3. Format should be: `ppl-xxxxxxxxxxxxxxx`

---

## 📈 Next Steps

### After First Translation:

1. ✅ Check results in properties table
2. ✅ Review translations quality
3. ✅ Monitor costs in translation_log
4. ✅ Set up scheduled translations (optional)

### For Production:

1. ✅ Add translation trigger to property admin form
2. ✅ Create monitoring dashboard for costs
3. ✅ Implement quality checks
4. ✅ Set up error notifications

---

## 📞 Need Help?

1. **Check documentation**: See links above
2. **Review Edge Function logs**: Supabase Console → Logs
3. **Check translation_log table**: Find error messages
4. **Test with curl**: 
   ```bash
   curl -X POST https://yheqvroinbcrrpppzdzx.supabase.co/functions/v1/translate-properties \
     -H "Content-Type: application/json" \
     -d '{"property_ids": []}'
   ```

---

**You're all set!** 🚀

Start translating:
```bash
npm run translate:perplexity
```
