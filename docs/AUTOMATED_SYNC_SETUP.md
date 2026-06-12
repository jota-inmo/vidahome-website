# 🔄 Automated Property Sync - Setup Guide

## 📊 Current State
- **Manual only**: Click `/admin/sync` → Sincroniza → Espera
- **API calls only in**: `/admin/sync` panel

## ✨ Options to Automate

### **Option A: Vercel Cron (⭐ RECOMMENDED)**

**Simplest, built-in to Vercel**

**Automatically syncs properties once per day at 7 AM Madrid time**

#### What happens:
```
Daily at 7:00 AM Madrid time automatically:
  Vercel calls GET /api/sync/cron
    ↓
  Endpoint executes syncPropertiesFromInmovillaAction()
    ↓
  Properties synced silently
    ↓
  New/updated properties appear on website
```

#### Setup (4 steps):

**1. Add CRON_SECRET to .env.local:**
```
CRON_SECRET=your-secret-key-here
```

**2. Add CRON_SECRET to Vercel:**
- Dashboard → Settings → Environment Variables
- Add: `CRON_SECRET` = same secret

**3. Deploy to Vercel:**
```powershell
git add .
git commit -m "feat: add automated property sync via Vercel Cron (daily 7 AM Madrid)"
git push origin main
```

**4. Verify in Vercel:**
- Dashboard → Crons → See `/api/sync/cron`
- Check status + logs

#### Schedule options (in UTC):
```
Daily at 7:00 AM Madrid:   "0 6 * * *"    ← Current (6 AM UTC winter, 5 AM UTC summer)
Every 6 hours:             "0 */6 * * *"
Every 3 hours:             "0 */3 * * *"
Every 1 hour (all day):    "0 * * * *"
Every 12 hours:            "0 */12 * * *"
Every day at 10:00:        "0 10 * * *"
```

*⚠️ **IMPORTANT - Timezone Conversion:**
- Cron uses **UTC** time
- Madrid is **UTC+1** (winter/CET) or **UTC+2** (summer/CEST)
- So "0 6 * * *" in UTC = **7:00 AM Madrid time (winter)** or **8:00 AM Madrid time (summer)**

Edit in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/sync/cron",
      "schedule": "0 6 * * *"
    }
  ]
}
```

---

### **Option B: GitHub Actions — ❌ RETIRADA (2026-06)**

El workflow `.github/workflows/auto-sync.yml` y el script `npm run sync:manual` se eliminaron del repo: dependían del pipeline Inmovilla API Web + proxy Arsys, retirado el 2026-04-15 (`b57eaae`). La sincronización con Inmovilla vive hoy en el CRM (`vidahome-encargo`).

---

### **Option C: Supabase Edge Function + Cron**

**Most robust, but more complex**

#### What happens:
```
Every 6 hours via cron_jobs table:
  Supabase executes Edge Function
    ↓
  Edge Function calls Inmovilla API directly
    ↓
  Stores in property_metadata
    ↓
  Props appear on website
```

#### Why?
- Runs in Supabase (closer to data)
- No Vercel cold starts
- Edge Function handles errors better
- But: requires cron_jobs table + function code

#### Setup (Complex - Skip unless needed)

---

### **Option D: Inmovilla Webhooks**

**Only if Inmovilla supports webhooks**

#### What you'd need:
- Inmovilla publishes property → Sends POST webhook
- Your app receives POST → Syncs that property
- Instant updates (no delays)

#### Reality:
- ❌ Unlikely Inmovilla supports this
- Check with your account manager

---

## 🎯 RECOMMENDATION

**Use Option A (Vercel Cron)**

| Aspect | A (Vercel) | B (GitHub) | C (Edge) | D (Webhook) |
|--------|-----------|-----------|---------|------------|
| **Setup time** | 5 min | 5 min | 30 min | Unknown |
| **Cost** | Free | Free | Free | Free |
| **Reliability** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Speed** | Fast | Medium | Very Fast | Instant |
| **Monitoring** | Dashboard | GitHub UI | Supabase logs | N/A |
| **Complexity** | Simple | Simple | Complex | Complex |

---

## 📋 Next Steps

**Choose ONE option and follow these steps:**

1. **Choose:** A (Vercel), B (GitHub), C (Edge), or D (Webhook)
2. **Configure:** Follow setup above
3. **Deploy:** Push to git
4. **Test:** Wait for first run or trigger manually
5. **Verify:** Check logs in appropriate dashboard

---

## 🔍 Monitoring

### Vercel Cron:
```
Dashboard → Crons → /api/sync/cron → See logs
```

### Supabase Edge Function:
```
Supabase Dashboard → Edge Functions → Logs
```

---

## 📝 What Gets Synced?

Every run does:
```
1. Calls Inmovilla getProperties() → Gets all 78 properties
2. Calls getPropertyDetails() for each → Gets photos, metadata
3. Stores/updates in property_metadata table
4. Auto-backfills property_features
5. Website shows new/updated properties instantly
```

---

## ⚙️ Manual Override

Even with automation, you can manually sync anytime:

```powershell
# Via API
curl https://your-app.com/api/sync/cron \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 🚨 Troubleshooting

**Sync not running?**
- Check Vercel/GitHub logs
- Verify credentials in Supabase
- Check INMOVILLA_USER + INMOVILLA_PASSWORD are correct

**Properties not appearing?**
- Check property_metadata table in Supabase
- Verify nodisponible = false (not hidden)
- Refresh browser cache (Ctrl+Shift+Del)

**Errors in Inmovilla API?**
- Rate limit hit? (Inmovilla throttles calls)
- Add delay in sync script
- Reduce sync frequency

---

## 📞 Support

If setup fails:
1. Check the specific logs for your option (Vercel/GitHub/Supabase)
2. Look for error messages about:
   - Inmovilla API (credentials/connection)
   - Supabase (permissions/schema)
   - Network (timeouts)
3. Add retries to sync script if needed
