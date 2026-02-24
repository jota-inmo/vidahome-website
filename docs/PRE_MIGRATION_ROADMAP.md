# 🚀 Pre-Migration Roadmap - Vidahome Next.js

**Status**: Planning Phase
**Target**: Production-ready before DNS migration to Vercel
**Current Date**: February 2026

---

## 📊 Current State Assessment

### ✅ Completed & Functional
- [x] Next.js 16 App Router setup
- [x] TypeScript configuration
- [x] i18n infrastructure (ES, EN)
- [x] Analytics dashboard (5 tables, Recharts visualization)
- [x] Property catalog (fetching from Inmovilla API)
- [x] Property detail pages
- [x] Contact form with email notifications
- [x] Admin authentication (with JWT)
- [x] Admin pages (featured properties, hero, login, settings)
- [x] Property gallery & SEO metadata
- [x] URL migration plan (301 redirects)
- [x] Dark mode support
- [x] Responsive design (mobile, tablet, desktop)

### ⚠️ Partially Implemented
- 🟡 **Analytics Tracking**: Infrastructure exists but needs integration in components
- 🟡 **Multilingual Support**: Only ES + EN (need FR, DE, PL minimum)
- 🟡 **Admin Panel**: Basic features (need enhancement)

### ❌ Not Started
- ❌ **Blog System**: No blog structure
- ❌ **Blog i18n**: No translations system for blog posts
- ❌ **SEO Sitemap Generation**: Dynamic for all languages
- ❌ **Advanced Analytics**: Source detection, UTM parsing
- ❌ **Email Templates**: Professional templates for leads
- ❌ **Performance Optimization**: Caching, image optimization
- ❌ **Error Handling**: Comprehensive error pages & logging
- ❌ **Legal Pages**: Terms, Privacy Policy in all languages
- ❌ **Testimonials/Reviews**: Social proof system
- ❌ **Property Comparison**: Feature to compare multiple properties
- ❌ **Advanced Filtering**: More granular property search
- ❌ **API Rate Limiting**: Endpoint protection
- ❌ **Database Backups**: Automated backup strategy

---

## 🎯 Priority Tasks (Ordered by Dependencies)

### **PHASE 1: Foundation (Days 1-2)** ⏱️ ~8-10 hours

#### Task 1.1: Complete i18n Setup [🔴 CRITICAL]
- **What**: Add French (FR), German (DE), Polish (PL) to routing
- **Why**: Required for European market, essential before migration
- **Effort**: 2-3 hours
- **Files to modify**:
  - `src/i18n/routing.ts` - Add FR, DE, PL to locales array
  - `messages/fr.json` - New file (copy from es.json, translate)
  - `messages/de.json` - New file (copy from es.json, translate)
  - `messages/pl.json` - New file (copy from es.json, translate)
  - `src/app/[locale]/layout.tsx` - Update language switcher

#### Task 1.2: Analytics Tracking Integration [🔴 CRITICAL]
- **What**: Add tracking calls to all key components
- **Why**: Dashboard is ready but no data being collected
- **Effort**: 3-4 hours
- **Files to modify**:
  - `src/components/LuxuryPropertyCard.tsx` - Add `trackPropertyView()` on click
  - `src/components/ContactForm.tsx` - Add `trackConversion()` on submit
  - `src/components/PropertySearch.tsx` - Add `trackSearch()` on search
  - `src/app/[locale]/propiedades/[id]/page.tsx` - Add view tracking
  - `src/lib/hooks/useAnalytics.ts` - Enhance with UTM parsing

#### Task 1.3: Blog Structure Setup [🟠 HIGH]
- **What**: Create blog directory structure and database schema
- **Why**: Content marketing is critical for SEO
- **Effort**: 2-3 hours
- **Files to create**:
  - `src/app/[locale]/blog/page.tsx` - Blog listing
  - `src/app/[locale]/blog/[slug]/page.tsx` - Blog post detail
  - `src/app/actions/blog.ts` - Blog server actions
  - `src/types/blog.ts` - Blog types
  - `sql/blog-schema.sql` - Supabase tables

---

### **PHASE 2: Localization (Days 2-3)** ⏱️ ~6-8 hours

#### Task 2.1: Translate Core UI [🟠 HIGH]
- **What**: Translate all JSON files to FR, DE, PL
- **Effort**: 3-4 hours
- **Keys to translate**:
  - Navigation labels
  - Property type translations
  - Form placeholders & validation
  - Button labels
  - Footer content
  - Legal page titles

#### Task 2.2: Dynamic Route Translations [🟠 HIGH]
- **What**: Handle property names, room types, amenities in all languages
- **Effort**: 2-3 hours
- **Implementation**:
  - Property type mapping for each locale
  - Room type translations
  - Amenity descriptions
  - Create `src/lib/utils/translations-map.ts`

#### Task 2.3: SEO per Language [🟠 HIGH]
- **What**: Custom metadata, canonical URLs, og tags per locale
- **Effort**: 2 hours
- **Files**:
  - `src/app/[locale]/layout.tsx` - Language meta tags
  - `src/app/[locale]/page.tsx` - Homepage per language

---

### **PHASE 3: Blog System (Days 3-4)** ⏱️ ~8-10 hours

#### Task 3.1: Database Schema [🟠 HIGH]
- **What**: Create blog posts, categories, tags tables in Supabase
- **Effort**: 1-2 hours
- **Tables**:
  - `blog_posts` - Title, content, locale, slug, author, published_at
  - `blog_categories` - For organizing posts
  - `blog_tags` - Tag system

#### Task 3.2: Blog Admin Interface [🟠 HIGH]
- **What**: Create blog post management in admin panel
- **Effort**: 4-5 hours
- **Features**:
  - Create/edit/delete posts
  - Publish/unpublish
  - Language selector
  - Rich text editor (use `react-markdown`)
  - SEO preview
  - Featured image upload

#### Task 3.3: Blog Frontend [🟠 HIGH]
- **What**: Display blog posts with pagination, search, filtering
- **Effort**: 3-4 hours
- **Features**:
  - Blog listing with pagination
  - Category filtering
  - Search functionality
  - Related posts
  - Author bio (if multiple authors)
  - Share buttons (Twitter, LinkedIn, WhatsApp)

#### Task 3.4: Blog i18n [🟠 HIGH]
- **What**: Full translation support for blog system
- **Effort**: 2-3 hours
- **Approach**:
  - Posts store `locale` field
  - Admin can write/manage posts per language
  - Frontend filters by current locale
  - Slug can include locale prefix for SEO

---

### **PHASE 4: Analytics Enhancement (Days 4-5)** ⏱️ ~6-8 hours

#### Task 4.1: UTM Parameter Parsing [🟠 HIGH]
- **What**: Parse UTM params from URLs and track source
- **Effort**: 2 hours
- **Implementation**:
  ```typescript
  // In useAnalytics hook
  const getUTMParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
    };
  };
  ```

#### Task 4.2: Traffic Source Detection [🟠 HIGH]
- **What**: Classify traffic source (google, email, facebook, direct, etc)
- **Effort**: 2 hours
- **Logic**:
  - If `utm_source=email` → email
  - If referrer contains `google.` → organic google
  - If referrer contains `facebook.` → facebook
  - If no referrer → direct
  - Otherwise → other

#### Task 4.3: Update Analytics Tables [🟡 MEDIUM]
- **What**: Add UTM & source columns to existing tables
- **Effort**: 1 hour
- **SQL Migration**:
  ```sql
  ALTER TABLE analytics_property_views ADD COLUMN utm_source VARCHAR(100);
  ALTER TABLE analytics_property_views ADD COLUMN utm_medium VARCHAR(100);
  ALTER TABLE analytics_property_views ADD COLUMN utm_campaign VARCHAR(100);
  ALTER TABLE analytics_property_views ADD COLUMN traffic_source VARCHAR(50);
  ```

#### Task 4.4: Dashboard Enhancements [🟡 MEDIUM]
- **What**: Add traffic source breakdown to dashboard
- **Effort**: 2-3 hours
- **Charts**:
  - Traffic source pie chart
  - UTM campaign performance
  - Source-specific conversion rates

---

### **PHASE 5: Content & SEO (Days 5-6)** ⏱️ ~6-8 hours

#### Task 5.1: Dynamic Sitemap [🟠 HIGH]
- **What**: Generate sitemap.xml dynamically for all languages
- **Effort**: 2 hours
- **File**: `src/app/sitemap.ts`
- **Include**:
  - Homepage (all locales)
  - Property pages (all locales)
  - Blog posts (all locales)
  - Legal pages (all locales)
  - Exclude: admin routes

#### Task 5.2: Legal Pages (i18n) [🟠 HIGH]
- **What**: Terms, Privacy Policy, Cookie Policy in all languages
- **Effort**: 3-4 hours
- **Files**:
  - `src/app/[locale]/legal/terminos/page.tsx`
  - `src/app/[locale]/legal/privacidad/page.tsx`
  - `src/app/[locale]/legal/cookies/page.tsx`
  - Plus EN, FR, DE, PL versions

#### Task 5.3: Structured Data (Schema.org) [🟡 MEDIUM]
- **What**: JSON-LD for properties, organization, articles
- **Effort**: 2 hours
- **Components**:
  - PropertySchema (for property detail pages)
  - LocalBusinessSchema (homepage)
  - ArticleSchema (blog posts)

---

### **PHASE 6: Quality Assurance (Days 6-7)** ⏱️ ~6-8 hours

#### Task 6.1: Testing Strategy [🔴 CRITICAL]
- **What**: Test all features across all languages
- **Effort**: 3-4 hours
- **Checklist**:
  - [ ] Homepage loads in ES, EN, FR, DE, PL
  - [ ] Property pages work in all languages
  - [ ] Contact form submits (track analytics)
  - [ ] Blog posts display correctly
  - [ ] Admin panel works
  - [ ] Analytics dashboard shows data
  - [ ] Mobile responsive (all screens)
  - [ ] Dark mode toggle works
  - [ ] 301 redirects work (old URLs)
  - [ ] Metadata correct per language
  - [ ] Links don't have broken locale prefixes

#### Task 6.2: Performance Optimization [🟡 MEDIUM]
- **What**: Optimize for Core Web Vitals
- **Effort**: 2-3 hours
- **Actions**:
  - Image optimization (next/image)
  - Code splitting
  - Cache headers
  - Font optimization
  - CSS minification

#### Task 6.3: Security Audit [🔴 CRITICAL]
- **What**: Security review before production
- **Effort**: 1-2 hours
- **Checks**:
  - [ ] Environment variables not exposed
  - [ ] Admin routes protected
  - [ ] CSRF protection on forms
  - [ ] Rate limiting on API
  - [ ] SQL injection prevention (Supabase handles)
  - [ ] XSS protection
  - [ ] Headers security (CSP, HSTS, etc) ✅ Already done

#### Task 6.4: Monitoring Setup [🟡 MEDIUM]
- **What**: Error tracking and monitoring
- **Effort**: 2 hours
- **Tools**:
  - Sentry for error tracking
  - Vercel Analytics
  - Custom error logging to Supabase

---

### **PHASE 7: Pre-Migration Final (Days 7-8)** ⏱️ ~4-6 hours

#### Task 7.1: DNS & Deployment Check [🔴 CRITICAL]
- **What**: Verify everything works on Vercel staging
- **Effort**: 2 hours
- **Actions**:
  - Deploy to Vercel main branch
  - Test all routes
  - Verify redirects
  - Check environment variables
  - Verify Supabase connection

#### Task 7.2: Documentation [🟠 HIGH]
- **What**: Complete migration playbook
- **Effort**: 2 hours
- **Create**:
  - `docs/MIGRATION_CHECKLIST.md`
  - `docs/RUNBOOK.md` (if issues occur)
  - `docs/ADMIN_GUIDE.md`
  - `docs/CONTENT_GUIDE.md`

#### Task 7.3: Final Go/No-Go Decision [🔴 CRITICAL]
- **What**: Team review before migration
- **Effort**: 1 hour
- **Review**:
  - Functionality ✓
  - Performance ✓
  - Security ✓
  - Content quality ✓
  - Analytics working ✓

---

## 📋 Dependency Graph

```
Phase 1: i18n Setup
    ↓
Phase 2: Localization (depends on Phase 1)
    ↓
Phase 3: Blog System (can start parallel with Phase 2)
    ↓
Phase 4: Analytics Enhancement (independent, can run parallel)
    ↓
Phase 5: Content & SEO (can start after Phase 2)
    ↓
Phase 6: QA & Optimization (after all features done)
    ↓
Phase 7: Pre-Migration Final (last step)
```

---

## ⏱️ Timeline Estimate

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Phase 1 (Foundation) | 8-10h | Day 1 | Day 2 |
| Phase 2 (Localization) | 6-8h | Day 2 | Day 3 |
| Phase 3 (Blog) | 8-10h | Day 3 | Day 4 |
| Phase 4 (Analytics) | 6-8h | Day 3 | Day 5 |
| Phase 5 (SEO) | 6-8h | Day 4 | Day 6 |
| Phase 6 (QA) | 6-8h | Day 6 | Day 7 |
| Phase 7 (Final) | 4-6h | Day 7 | Day 8 |
| **TOTAL** | **44-58h** | **Day 1** | **Day 8** |

**Realistic Calendar**: 10-12 working days with some parallelization

---

## 🎯 Success Criteria

Before DNS migration, verify:

- ✅ All 5 languages working (ES, EN, FR, DE, PL)
- ✅ Blog system operational with 5-10 test posts
- ✅ Analytics tracking capturing data
- ✅ All legal pages in all languages
- ✅ Dynamic sitemap generates
- ✅ Mobile responsive on all pages
- ✅ Admin panel fully functional
- ✅ Performance score >85 Lighthouse
- ✅ Security audit passed
- ✅ URL redirects working (old → new)
- ✅ No console errors or warnings
- ✅ All external APIs responding
- ✅ Supabase tables populated with test data
- ✅ Monitoring & error tracking active

---

## 📝 Resource Requirements

### Tools/Services
- Vercel (deployment) ✅
- Supabase (database) ✅
- Inmovilla API (property data) ✅
- Translation service (Google Translate for initial, then review)
- Image optimization (Vercel/Next.js)

### Team
- 1 Developer (you) - Full time
- 1 Translator (contractor) - Part time for blog/legal content
- 1 QA (can be you for spot checks)

### Costs
- Vercel: ~$20-50/month
- Supabase: ~$25/month (standard plan)
- Translation: $0-300 (if outsourced)

---

## 🚀 Go-Live Checklist

Day of DNS migration:

```
[ ] Vercel deployment passing all checks
[ ] Supabase backups created
[ ] All old URLs have 301 redirects
[ ] Analytics tracking confirmed working
[ ] Admin team trained on new system
[ ] Customer support briefed
[ ] Social media ready with announcement
[ ] Email campaign prepared (if any)
[ ] DNS nameservers documented
[ ] Rollback plan documented (just in case)
[ ] Team on standby during migration
[ ] Monitor errors for 24h post-migration
```

---

## 📞 Questions to Clarify

1. **Blog content**: Who writes blog posts? (you, content person, AI?)
2. **Blog frequency**: How often do you want to publish?
3. **Legal translations**: Do you have existing Spanish versions to translate?
4. **Analytics goals**: What KPIs are most important to track?
5. **Testimonials**: Do you have customer testimonials to display?
6. **CRM sync**: Does analytics data need to sync back to Inmovilla CRM?

---

## 📊 Progress Tracker

Track completion here as you progress:

```
Phase 1: ██████░░░░░░░░░░░░░  20%
Phase 2: ░░░░░░░░░░░░░░░░░░░░   0%
Phase 3: ░░░░░░░░░░░░░░░░░░░░   0%
Phase 4: ░░░░░░░░░░░░░░░░░░░░   0%
Phase 5: ░░░░░░░░░░░░░░░░░░░░   0%
Phase 6: ░░░░░░░░░░░░░░░░░░░░   0%
Phase 7: ░░░░░░░░░░░░░░░░░░░░   0%

Overall: ▓░░░░░░░░░░░░░░░░░░░   3%
```

---

**Last Updated**: February 24, 2026
**Next Review**: After Phase 1 completion
**Estimated Migration Date**: ~March 5-10, 2026 (pending completion)

