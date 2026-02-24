# ⚙️ How to Deploy Analytics Schema

The REST API doesn't allow direct SQL execution for security reasons. You have **3 options**:

## ✅ OPTION 1: Via Supabase Dashboard (Recommended - Easiest)

### Steps:

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com/projects

2. **Select your project**
   - Project ID: `yheqvroinbcrrpppzdzx`

3. **Navigate to SQL Editor**
   - Left menu → **SQL Editor** → **New Query**

4. **Copy the SQL schema**
   - Open file: `sql/analytics-schema.sql`
   - Select **ALL** content (Ctrl+A)
   - Copy (Ctrl+C)

5. **Paste into SQL Editor**
   - Click in the SQL Editor textarea
   - Paste (Ctrl+V)

6. **Execute**
   - Click the blue **Run** button (bottom right)
   - Wait ~5-10 seconds for execution

### Expected Result:
```
✓ 5 statements executed successfully
```

### What gets created:
- Table: `analytics_property_views` ✓
- Table: `analytics_leads` ✓
- Table: `analytics_valuations` ✓
- Table: `analytics_page_views` ✓
- Table: `analytics_searches` ✓
- Indexes & RLS Policies ✓

---

## ✅ OPTION 2: Via PostgreSQL CLI (If you have `psql` installed)

### Prerequisites:
- PostgreSQL client installed (`psql` command available)
- Your database password from Supabase

### Steps:

1. **Get your database password**
   - Go to Supabase Dashboard
   - Settings → Database → Connection info
   - Copy the password

2. **Run the deployment command**
   ```bash
   psql "postgresql://postgres:[YOUR_PASSWORD]@db.yheqvroinbcrrpppzdzx.supabase.co:5432/postgres" < sql/analytics-schema.sql
   ```
   
   Replace `[YOUR_PASSWORD]` with your actual password

3. **Wait for completion**
   - Should see: `CREATE TABLE`, `CREATE INDEX`, etc.

---

## ✅ OPTION 3: Via Supabase CLI (If you have it installed)

### Prerequisites:
- Supabase CLI installed: `npm install -g supabase`
- Authenticated with Supabase

### Steps:

```bash
# Install Supabase CLI
npm install -g supabase

# Push the migrations
supabase db push

# Or directly with psql:
supabase link --project-ref yheqvroinbcrrpppzdzx
supabase db push
```

---

## 🎯 After Deployment

Once the schema is successfully created:

1. **Start the dev server**
   ```bash
   npm run dev
   ```

2. **Open the dashboard**
   - Go to: `http://localhost:3000/es/admin/analytics`
   - Or: `http://localhost:3000/en/admin/analytics`

3. **You should see**
   - ✓ KPI cards (with 0 data initially)
   - ✓ Empty charts (waiting for events)
   - ✓ Ready for tracking events

---

## ✅ Verify Success in Supabase Dashboard

After running the script, verify the tables were created:

1. Go to Supabase Dashboard
2. Left menu → **Table Editor**
3. You should see:
   - `analytics_property_views`
   - `analytics_leads`
   - `analytics_valuations`
   - `analytics_page_views`
   - `analytics_searches`

If you see these 5 tables, **deployment was successful!** ✅

---

## 🚀 Next: Component Integration

After deploying the schema, integrate tracking into components:

See: `ANALYTICS_INTEGRATION_GUIDE.md` for code examples

---

## 🆘 Troubleshooting

### I executed the SQL but don't see any tables
- **Wait a few seconds** - Sometimes Supabase dashboard needs to refresh
- **Press F5** to refresh the page
- **Check your project ID** - Make sure it's: `yheqvroinbcrrpppzdzx`

### I see errors like "already exists"
- This is **OK** - Means you ran it twice or the table already exists
- Just check the table editor to verify

### The dashboard page shows errors
- Did you execute the SQL schema? (CRITICAL)
- Did you run `npm run dev`? (Required)
- Check browser console (F12) for specific errors

### I don't have PostgreSQL CLI (`psql`)
- Use **OPTION 1** (Supabase Dashboard) - No installation needed!

---

## 📊 Schema Details

The schema creates:

```sql
-- Property Views (when users view property details)
analytics_property_views
├── cod_ofer (property ID)
├── locale (language: es, en, fr, etc)
├── session_id (tracking user sessions)
└── viewed_at (timestamp)

-- Lead Submissions (contact forms, valuations)
analytics_leads
├── source (contact_form, property_card, search)
├── locale (language)
├── conversion_type (lead, quote, call)
└── created_at (timestamp)

-- Valuation Requests
analytics_valuations
├── valuation_id (reference to valuation)
├── locale (language)
└── created_at (timestamp)

-- General Page Views
analytics_page_views
├── page_path (URL path)
├── locale (language)
├── session_id (session tracking)
└── viewed_at (timestamp)

-- Search Events
analytics_searches
├── search_query (what user searched)
├── results_count (number of results)
├── locale (language)
└── searched_at (timestamp)
```

All tables have:
- ✅ Indexes for fast queries
- ✅ RLS policies for security
- ✅ Timestamps for analytics

---

**Ready? Choose your option and deploy!** 🚀
