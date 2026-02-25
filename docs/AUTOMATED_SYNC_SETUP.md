# 🔄 Automated Property Sync - Setup Guide

## 📊 Current State
- **Manual only**: Click `/admin/sync` → Sincroniza → Espera
- **API calls only in**: `/admin/sync` panel

## ✨ Options to Automate

### **Option A: Vercel Cron (⭐ RECOMMENDED)**

**Simplest, built-in to Vercel**

#### What happens:
```
Every 6 hours automatically:
  Vercel calls GET /api/sync/cron
    ↓
  Endpoint executes syncPropertiesFromInmovillaAction()
    ↓
  Properties synced silently
    ↓
  New properties appear on website
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
git commit -m "feat: add automated property sync via Vercel Cron"
git push origin main
```

**4. Verify in Vercel:**
- Dashboard → Crons → See `/api/sync/cron`
- Check status + logs

#### Schedule options (in UTC):
```
Every 6 hours:           "0 */6 * * *"
Every 3 hours:           "0 */3 * * *"
Every 1 hour (all day):  "0 * * * *"
Every 1 hour 10-21h*:    "0 10-21 * * *"  ← Current (Madrid daytime)
Every 12 hours:          "0 */12 * * *"
Every day at 10:00:      "0 10 * * *"
```

*⚠️ **IMPORTANT - Timezone Conversion:**
- Cron uses **UTC** time
- Madrid is **UTC+1** (winter/CET) or **UTC+2** (summer/CEST)
- So "0 10-21 * * *" in UTC = **11:00-22:00 Madrid time (winter)** or **09:00-20:00 Madrid time (summer)**
- For **"each hour from 10:00-21:00 Madrid time"** use: `"0 8-20 * * *"` (covers both timezones)

Edit in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/sync/cron",
      "schedule": "0 8-20 * * *"
    }
  ]
}
```

---

### **Option B: GitHub Actions (Free)**

**If you're using GitHub, this is automatic**

#### What happens:
```
Every 6 hours:
  GitHub Action runs npm run sync:manual
    ↓
  Logs visible in GitHub → Actions
    ↓
  Properties synced
    ↓
  Emails you on failure
```

#### Setup (3 steps):

**1. Secrets in GitHub:**
- Repo → Settings → Secrets and variables → Actions
- Add all your secrets:
  ```
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  INMOVILLA_USER
  INMOVILLA_PASSWORD
  INMOVILLA_AGENT_ID
  ```

**2. File is already created:**
- `.github/workflows/auto-sync.yml` ✅

**3. Push to main:**
```powershell
git add .
git commit -m "feat: add github actions auto sync"
git push origin main
```

**4. Go to GitHub:**
- Repo → Actions → See "Auto-sync Properties from Inmovilla"
- Can see every run + logs

#### Advantages:
- Free (GitHub hosted)
- Transparent logs
- Can trigger manually
- Email notifications

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

### GitHub Actions:
```
Repo → Actions → Auto-sync Properties → See all runs
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
# Development
npm run sync:manual

# Or via API
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
