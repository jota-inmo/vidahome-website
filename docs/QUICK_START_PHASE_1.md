# 🚀 Quick Start: Phase 1 Implementation

**Duration**: 8-10 hours
**Complexity**: Medium
**Start date**: Ready now
**End date**: Days 1-2

---

## 📌 What You'll Do Today

You will make the web support **5 languages** (ES, EN, FR, DE, PL) and add **analytics tracking** to capture user behavior. Then create the foundation for a **multilingual blog**.

This is the foundation for everything else.

---

## 🎯 Task 1: i18n Setup (2-3 hours)

### Step 1: Add language codes to routing

**File**: `src/i18n/routing.ts`

Change line 5 from:
```typescript
locales: ['es', 'en'],
```

To:
```typescript
locales: ['es', 'en', 'fr', 'de', 'pl'],
```

**What this does**: The app now knows about 5 languages. When someone visits `/fr/`, it will use French translations.

✅ **Test**: Run `npm run dev` and navigate to `http://localhost:3000/fr` - should load (but with English text since we haven't translated yet)

---

### Step 2: Create translation files

**Current situation**: You have:
- `messages/es.json` (Spanish - complete)
- `messages/en.json` (English - complete)

**What you need**: Add French, German, Polish

**How**:

1. Open `messages/es.json`
2. Copy all content
3. Create new file `messages/fr.json`
4. Paste content
5. Translate Spanish keys to French

**Example**:
```json
// In es.json
{
  "Index": {
    "title": "Propiedades de Lujo en Gandía"
  }
}

// In fr.json
{
  "Index": {
    "title": "Propriétés de Luxe à Gandía"
  }
}
```

**Use Google Translate for first pass**, then review:
- `es.json` → Google Translate → `fr.json`
- `es.json` → Google Translate → `de.json`
- `es.json` → Google Translate → `pl.json`

**Priority keys** (translate these first):
```
Index.title
Index.portfolio
Index.description
Navbar.propiedades
Navbar.nosotros
Navbar.blog
Navbar.contacto
Footer.terminos
Footer.privacidad
Footer.cookies
```

✅ **Test**: After creating `messages/fr.json`, visit `http://localhost:3000/fr` - should show French text

---

### Step 3: Update language switcher in Navbar

**File**: `src/components/Navbar.tsx`

Find the language selector code (probably a dropdown or buttons for ES/EN).

Add FR, DE, PL to the list:

```typescript
const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },  // ADD THIS
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },   // ADD THIS
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },    // ADD THIS
];
```

✅ **Test**: Navbar should show 5 language options. Clicking each should switch the language.

---

## 🎯 Task 2: Analytics Tracking (3-4 hours)

### Step 1: Enhance useAnalytics hook with UTM parsing

**File**: `src/lib/hooks/useAnalytics.ts`

Add these helper functions at the top of the file:

```typescript
// Extract UTM parameters from URL
const getUTMParams = () => {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
  };
};

// Detect where user came from
const detectTrafficSource = (referrer: string): string => {
  if (!referrer) return 'direct';
  if (referrer.includes('google.')) return 'google_organic';
  if (referrer.includes('facebook.')) return 'facebook';
  if (referrer.includes('instagram.')) return 'instagram';
  if (referrer.includes('linkedin.')) return 'linkedin';
  if (referrer.includes('twitter.') || referrer.includes('x.com')) return 'twitter';
  if (referrer.includes('vidahome.es')) return 'internal';
  return 'referral';
};
```

Then modify the `trackPropertyView` function to include these new fields:

```typescript
const trackPropertyView = useCallback(async (codOfer: number) => {
  try {
    const utm = getUTMParams();
    const referrer = typeof document !== 'undefined' ? document.referrer : '';
    const source = detectTrafficSource(referrer);
    
    await supabase.from('analytics_property_views').insert({
      cod_ofer: codOfer,
      locale,
      session_id: sessionId,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      referer: referrer,
      traffic_source: utm.utm_source || source,  // NEW
      utm_source: utm.utm_source,                 // NEW
      utm_medium: utm.utm_medium,                 // NEW
      utm_campaign: utm.utm_campaign,             // NEW
    });
  } catch (error) {
    console.error('Analytics error:', error);
  }
}, [locale]);
```

✅ **Test**: Open DevTools → Network → Filter by Supabase → Visit a property page → Should see insert request

---

### Step 2: Update Supabase database schema

**In Supabase**:
1. Open dashboard → SQL Editor
2. Run this SQL:

```sql
ALTER TABLE analytics_property_views ADD COLUMN traffic_source VARCHAR(50);
ALTER TABLE analytics_property_views ADD COLUMN utm_source VARCHAR(100);
ALTER TABLE analytics_property_views ADD COLUMN utm_medium VARCHAR(100);
ALTER TABLE analytics_property_views ADD COLUMN utm_campaign VARCHAR(100);

CREATE INDEX idx_analytics_traffic_source ON analytics_property_views(traffic_source);
CREATE INDEX idx_analytics_utm_source ON analytics_property_views(utm_source);
```

3. Wait for "Success" message

✅ **Test**: Run `SELECT * FROM analytics_property_views LIMIT 5;` - should see new columns

---

### Step 3: Add tracking to components

Add this import to each component:
```typescript
import { useAnalytics } from '@/lib/hooks/useAnalytics';
```

**LuxuryPropertyCard.tsx**: Add tracking on card click
```typescript
const { trackPropertyView } = useAnalytics();

useEffect(() => {
  trackPropertyView(property.cod_ofer);
}, [property.cod_ofer]);
```

**ContactForm.tsx**: Add tracking on form submit
```typescript
const { trackConversion } = useAnalytics();

const handleSubmit = async () => {
  // ... form logic ...
  trackConversion({
    conversionType: 'contact_form',
    codOfer: propertyId,
  });
};
```

**PropertySearch.tsx**: Add tracking on search
```typescript
const { trackSearch } = useAnalytics();

const handleSearch = (query: string) => {
  trackSearch(query, results.length);
};
```

✅ **Test**: 
- Visit property page → Check Network tab → Should see Supabase insert
- Submit form → Check analytics → Should record conversion
- Do a search → Check analytics → Should record search

---

## 🎯 Task 3: Blog Setup (2-3 hours)

### Step 1: Create database schema

**In Supabase SQL Editor**, run:

```sql
-- Blog Posts
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt VARCHAR(500),
    locale VARCHAR(5) NOT NULL,
    author VARCHAR(100),
    featured_image_url VARCHAR(500),
    meta_description VARCHAR(160),
    meta_keywords VARCHAR(255),
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(slug, locale)
);

-- Categories
CREATE TABLE IF NOT EXISTS blog_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    locale VARCHAR(5) NOT NULL
);

-- Indexes
CREATE INDEX idx_blog_posts_locale ON blog_posts(locale);
CREATE INDEX idx_blog_posts_published ON blog_posts(is_published);
CREATE INDEX idx_blog_categories_locale ON blog_categories(locale);

-- Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow read published" ON blog_posts FOR SELECT USING (is_published = true);
CREATE POLICY "Allow insert" ON blog_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read" ON blog_categories FOR SELECT USING (true);
```

✅ **Test**: Run `SELECT * FROM blog_posts;` - should work (empty table)

---

### Step 2: Create blog types

**New file**: `src/types/blog.ts`

```typescript
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  locale: string;
  author: string;
  featured_image_url?: string;
  meta_description: string;
  meta_keywords: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  published_at: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  locale: string;
}
```

---

### Step 3: Create blog directory and pages

**Create directory**: `src/app/[locale]/blog/`

**New file**: `src/app/[locale]/blog/page.tsx`

```typescript
import React from 'react';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Blog');
  return {
    title: `Blog | Vidahome`,
    description: 'Latest articles about properties in Gandía',
  };
}

export default async function BlogPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-[1200px] mx-auto px-8 py-20">
        <h1 className="text-5xl font-serif mb-4">Blog</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-12">
          Latest articles about luxury properties and real estate.
        </p>
        
        <div className="text-center py-20 border border-slate-200 rounded">
          <p className="text-slate-500">Blog posts coming soon...</p>
        </div>
      </div>
    </div>
  );
}
```

✅ **Test**: Navigate to `http://localhost:3000/es/blog` - should show placeholder

---

## 📝 Verification Checklist

After completing all 3 tasks:

```
TASK 1 - i18n:
  [ ] routing.ts updated with 5 languages
  [ ] messages/fr.json created
  [ ] messages/de.json created
  [ ] messages/pl.json created
  [ ] Navbar shows 5 language options
  [ ] /fr/, /de/, /pl/ pages load correctly
  
TASK 2 - Analytics:
  [ ] useAnalytics hook enhanced with UTM parsing
  [ ] SQL columns added to Supabase
  [ ] Tracking added to LuxuryPropertyCard
  [ ] Tracking added to ContactForm
  [ ] Tracking added to PropertySearch
  [ ] Analytics data appears in Supabase
  
TASK 3 - Blog:
  [ ] blog_posts table created
  [ ] blog_categories table created
  [ ] src/types/blog.ts created
  [ ] src/app/[locale]/blog/page.tsx created
  [ ] Blog page loads at /es/blog, /en/blog, etc.
```

---

## 🔍 Quick Testing Guide

### Test i18n
```bash
npm run dev
# Visit http://localhost:3000/es - Spanish
# Visit http://localhost:3000/en - English
# Visit http://localhost:3000/fr - French
# Visit http://localhost:3000/de - German
# Visit http://localhost:3000/pl - Polish
```

### Test Analytics
```bash
# 1. Open DevTools (F12)
# 2. Go to Network tab
# 3. Visit a property page
# 4. Look for POST request to Supabase
# 5. Should see 200 status
```

### Test Blog
```bash
npm run dev
# Visit http://localhost:3000/es/blog
# Visit http://localhost:3000/fr/blog
# Both should show "Blog posts coming soon..."
```

---

## ⏱️ Time Breakdown

| Task | Estimated | Actual |
|------|-----------|--------|
| Task 1 (i18n) | 2-3h | _____ |
| Task 2 (Analytics) | 3-4h | _____ |
| Task 3 (Blog) | 2-3h | _____ |
| Testing | 1h | _____ |
| Commits | 30m | _____ |
| **TOTAL** | **8-10h** | _____ |

---

## 🐛 Troubleshooting

**Problem**: French page shows English text
- **Solution**: Check that `messages/fr.json` exists and has the same keys as `es.json`

**Problem**: Analytics not recording
- **Solution**: Check Supabase connection, verify columns exist with `SELECT * FROM analytics_property_views LIMIT 1;`

**Problem**: Blog page shows 404
- **Solution**: Make sure directory `src/app/[locale]/blog/` exists with `page.tsx` file

**Problem**: Language switcher doesn't work
- **Solution**: Verify Navbar code updated correctly, check console for errors

---

## 📚 Next Steps After Phase 1

1. **Phase 2**: Translate all UI text to FR, DE, PL (6-8 hours)
2. **Phase 3**: Build blog admin interface (8-10 hours)
3. **Phase 4**: Advanced analytics & UTM tracking (6-8 hours)
4. **Phase 5**: SEO, sitemaps, legal pages (6-8 hours)
5. **Phase 6**: Testing & optimization (6-8 hours)
6. **Phase 7**: Pre-migration checks (4-6 hours)

---

## 💾 When Done

After completing Phase 1:

```bash
git add .
git commit -m "feat: Phase 1 - i18n (5 languages), analytics tracking, blog foundation"
git push origin main
```

---

## ❓ Questions?

- i18n questions: See `docs/PRE_MIGRATION_ROADMAP.md` section 2.1
- Analytics questions: See `docs/PHASE_1_EXECUTION.md` section TASK 1.2
- Blog questions: See `docs/PHASE_1_EXECUTION.md` section TASK 1.3

---

**Ready? Start with Task 1.** 🚀

It takes ~2-3 hours and gives immediate results (5 languages working).

