# 🎯 PHASE 1 Execution Plan: Foundation (Days 1-2)

**Objective**: Get i18n and analytics integration ready
**Duration**: 8-10 hours
**Target completion**: End of Day 2

---

## TASK 1.1: Complete i18n Setup (2-3 hours)

### Step 1.1.1: Update routing.ts
**File**: `src/i18n/routing.ts`
**Current locales**: `['es', 'en']`
**Target locales**: `['es', 'en', 'fr', 'de', 'pl']`

```diff
export const routing = defineRouting({
-    locales: ['es', 'en'],
+    locales: ['es', 'en', 'fr', 'de', 'pl'],
     defaultLocale: 'es',
     localePrefix: 'always'
});
```

**After change**, the app will:
- Support `/es/`, `/en/`, `/fr/`, `/de/`, `/pl/` prefixes
- Redirect unknown locales to default (`es`)
- Automatically add locale to all links

---

### Step 1.1.2: Create translation files (es.json as template)

**Current structure**:
```
messages/
├── en.json    (English)
└── es.json    (Spanish - already done)
```

**Target structure**:
```
messages/
├── en.json
├── es.json
├── fr.json    (NEW)
├── de.json    (NEW)
└── pl.json    (NEW)
```

**Workflow**:
1. Copy `es.json` → `fr.json`
2. Copy `es.json` → `de.json`
3. Copy `es.json` → `pl.json`
4. Translate keys from Spanish to each language

**Priority keys to translate** (most visible):
- `Index.title` - Page titles
- `Index.portfolio` - Portfolio/Gallery label
- `Index.contacto` - Contact button
- `Navbar.propiedades` - Properties
- `Navbar.blog` - Blog (NEW)
- `Footer.terminos` - Terms
- `Footer.privacidad` - Privacy
- Navigation labels
- Button text
- Form labels

**Translation strategy**:
- Use Google Translate as first pass
- Review for context accuracy
- Test in app

---

### Step 1.1.3: Update Language Switcher

**File**: `src/components/Navbar.tsx`
**Current**: Probably has ES/EN selector
**Target**: Add FR, DE, PL selector

```tsx
// Approximate code to add
const languages = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },  // NEW
  { code: 'de', name: 'Deutsch' },   // NEW
  { code: 'pl', name: 'Polski' },    // NEW
];
```

**Display options**:
- Dropdown menu (if space limited)
- Flag icons + text
- Language selector in footer
- Both navbar + footer

---

### Step 1.1.4: Test i18n in browser

**Test checklist**:
```
[ ] Navigate to /es/ - Spanish loads
[ ] Navigate to /en/ - English loads
[ ] Navigate to /fr/ - French loads (from new files)
[ ] Navigate to /de/ - German loads (from new files)
[ ] Navigate to /pl/ - Polish loads (from new files)
[ ] Click language switcher - switches to correct locale
[ ] Refresh page - maintains locale
[ ] Home page renders in all 5 languages
[ ] No console errors about missing translations
```

**Run locally**:
```bash
npm run dev
# Visit http://localhost:3000/fr
# Visit http://localhost:3000/de
# etc.
```

---

## TASK 1.2: Analytics Tracking Integration (3-4 hours)

### Step 1.2.1: Enhance useAnalytics Hook

**File**: `src/lib/hooks/useAnalytics.ts`
**Current state**: Basic tracking without source detection
**Target**: Add UTM parsing + traffic source detection

**What to add**:
```typescript
// Extract UTM parameters
const getUTMParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
  };
};

// Detect traffic source from referrer
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

**Add to trackPropertyView()**:
```typescript
const utm = getUTMParams();
const source = detectTrafficSource(document.referrer);

await supabase.from('analytics_property_views').insert({
  cod_ofer: codOfer,
  locale,
  session_id: sessionId,
  user_agent: navigator.userAgent,
  referer: document.referrer,
  traffic_source: utm.utm_source || source,  // NEW
  utm_source: utm.utm_source,                 // NEW
  utm_medium: utm.utm_medium,                 // NEW
  utm_campaign: utm.utm_campaign,             // NEW
});
```

---

### Step 1.2.2: Update SQL Schema

**File**: `sql/analytics-schema-clean.sql`
**Action**: Add 4 new columns to `analytics_property_views` table

```sql
-- Add these columns to analytics_property_views
ALTER TABLE analytics_property_views ADD COLUMN traffic_source VARCHAR(50);
ALTER TABLE analytics_property_views ADD COLUMN utm_source VARCHAR(100);
ALTER TABLE analytics_property_views ADD COLUMN utm_medium VARCHAR(100);
ALTER TABLE analytics_property_views ADD COLUMN utm_campaign VARCHAR(100);

-- Add indexes for better query performance
CREATE INDEX idx_analytics_traffic_source ON analytics_property_views(traffic_source);
CREATE INDEX idx_analytics_utm_source ON analytics_property_views(utm_source);
```

**Execute in Supabase**:
1. Open Supabase dashboard
2. SQL Editor
3. Run the ALTER TABLE statements
4. Verify no errors

---

### Step 1.2.3: Add Tracking to Components

**Component 1**: `src/components/LuxuryPropertyCard.tsx`
**What**: Track when property card is clicked/viewed

```tsx
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export default function LuxuryPropertyCard({ property }: Props) {
  const { trackPropertyView } = useAnalytics();
  
  useEffect(() => {
    // Track view when card is visible (or on click)
    trackPropertyView(property.cod_ofer);
  }, [property.cod_ofer]);
  
  return (
    // ... existing card JSX
  );
}
```

**Component 2**: `src/components/ContactForm.tsx`
**What**: Track when contact form is submitted

```tsx
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export default function ContactForm() {
  const { trackConversion } = useAnalytics();
  
  const handleSubmit = async (data: FormData) => {
    // ... form submission logic
    
    // Track as lead conversion
    trackConversion({
      conversionType: 'contact_form',
      codOfer: propertyId, // if available
      source: 'contact_form',
    });
  };
}
```

**Component 3**: `src/components/PropertySearch.tsx`
**What**: Track search queries

```tsx
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export default function PropertySearch() {
  const { trackSearch } = useAnalytics();
  
  const handleSearch = (query: string) => {
    trackSearch(query, results.length);
  };
}
```

**Component 4**: `src/app/[locale]/propiedades/[id]/page.tsx`
**What**: Track property detail page view

```tsx
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export default function PropertyPage({ params }: Props) {
  const { trackPropertyView } = useAnalytics();
  
  useEffect(() => {
    trackPropertyView(parseInt(params.id));
  }, [params.id]);
  
  return (
    // ... existing page JSX
  );
}
```

---

### Step 1.2.4: Test Analytics Tracking

**Manual testing**:

1. **Open browser DevTools** (F12)
2. **Go to Network tab** → Filter by "analytics"
3. **Navigate to property page** → Should see Supabase insert request
4. **Check Supabase dashboard**:
   - SQL Editor
   - `SELECT * FROM analytics_property_views LIMIT 10;`
   - Should see new records with `traffic_source`, `utm_source` fields

**Test scenarios**:
```
Scenario 1: Direct property visit
- Visit: https://vidahome.es/es/propiedades/123
- Expected: traffic_source = 'direct' (no referrer)

Scenario 2: From email link
- Visit: https://vidahome.es/es/propiedades/123?utm_source=email&utm_campaign=confirmation
- Expected: traffic_source = 'email', utm_source = 'email', utm_campaign = 'confirmation'

Scenario 3: From Google
- Manually set referrer to google.com
- Expected: traffic_source = 'google_organic'

Scenario 4: From Facebook
- Manually set referrer to facebook.com
- Expected: traffic_source = 'facebook'
```

---

## TASK 1.3: Blog Structure Setup (2-3 hours)

### Step 1.3.1: Create Blog Directory Structure

**Create these directories**:
```
src/app/[locale]/blog/
├── page.tsx                    # Blog listing
└── [slug]/
    └── page.tsx                # Blog post detail

src/app/actions/
├── blog.ts                     # Blog server actions (NEW)

src/types/
├── blog.ts                     # Blog types (NEW)
```

---

### Step 1.3.2: Create Blog Database Schema

**File**: `sql/blog-schema.sql` (NEW)

```sql
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Content
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,           -- Markdown content
    excerpt VARCHAR(500),
    
    -- Metadata
    locale VARCHAR(5) NOT NULL,      -- es, en, fr, de, pl
    author VARCHAR(100),
    featured_image_url VARCHAR(500),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_published BOOLEAN DEFAULT false,
    
    -- SEO
    meta_description VARCHAR(160),
    meta_keywords VARCHAR(255),
    
    -- Relations
    category_id UUID REFERENCES blog_categories(id),
    
    CONSTRAINT unique_slug_per_locale UNIQUE (slug, locale)
);

CREATE TABLE IF NOT EXISTS blog_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    locale VARCHAR(5) NOT NULL,
    UNIQUE(slug, locale)
);

CREATE TABLE IF NOT EXISTS blog_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    locale VARCHAR(5) NOT NULL,
    UNIQUE(slug, locale)
);

CREATE TABLE IF NOT EXISTS blog_post_tags (
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- Indexes for performance
CREATE INDEX idx_blog_posts_locale ON blog_posts(locale);
CREATE INDEX idx_blog_posts_published ON blog_posts(is_published);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_categories_locale ON blog_categories(locale);

-- Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow read all" ON blog_posts FOR SELECT USING (is_published = true);
CREATE POLICY "Allow insert for all" ON blog_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read all" ON blog_categories FOR SELECT USING (true);
```

**Execute in Supabase**:
1. Copy SQL above
2. Supabase SQL Editor
3. Run
4. Verify 4 tables created

---

### Step 1.3.3: Create Blog Types

**File**: `src/types/blog.ts` (NEW)

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
  category_id?: string;
  category?: BlogCategory;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  locale: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  locale: string;
}
```

---

### Step 1.3.4: Create Basic Blog Pages (Placeholder)

**File**: `src/app/[locale]/blog/page.tsx` (NEW)

```tsx
import React from 'react';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Blog');
  return {
    title: `${t('title')} | Vidahome`,
    description: t('description'),
  };
}

export default async function BlogPage() {
  const t = await getTranslations('Blog');
  
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-[1200px] mx-auto px-8 py-20">
        <h1 className="text-5xl font-serif mb-4">{t('title')}</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-12">
          {t('description')}
        </p>
        
        {/* Blog posts will go here */}
        <div className="text-center py-20 border border-slate-200 dark:border-slate-800 rounded">
          <p className="text-slate-500">Blog posts coming soon...</p>
        </div>
      </div>
    </div>
  );
}
```

---

## 📝 Summary of Task 1

After completing TASK 1.1, 1.2, 1.3:

✅ **i18n**: Support for 5 languages (ES, EN, FR, DE, PL)
✅ **Analytics**: Tracking integrated with UTM parsing
✅ **Blog**: Database schema ready, basic pages created
✅ **Database**: Blog tables in Supabase
✅ **Types**: TypeScript types for blog system

**Next step**: TASK 2.1 - Translate UI to all 5 languages

---

## ⏱️ Time Estimates

| Task | Estimate |
|------|----------|
| 1.1 i18n Setup | 2-3h |
| 1.2 Analytics Integration | 3-4h |
| 1.3 Blog Structure | 2-3h |
| **Phase 1 Total** | **7-10h** |

