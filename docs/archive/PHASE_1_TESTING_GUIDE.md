# 🧪 PHASE 1 TESTING GUIDE

**Purpose**: Validate all Phase 1 features work correctly before GitHub commit
**Estimated Time**: 30-60 minutes
**Dev Server**: Should be running in background

---

## ✅ PRE-TESTING CHECKLIST

Before you start testing, verify:
- [ ] Dev server is running (`npm run dev`)
- [ ] No TypeScript errors in terminal
- [ ] Browser can access http://localhost:3000
- [ ] Supabase project is accessible

---

## 🌐 TEST 1: LANGUAGE SUPPORT (10 minutes)

### Test 1.1: Language Switching
1. Open http://localhost:3000/es/ (Spanish)
   - ✓ Page loads without errors
   - ✓ All text in Spanish
   - ✓ Navbar shows Spanish labels

2. Open http://localhost:3000/en/ (English)
   - ✓ Page loads without errors
   - ✓ All text in English
   - ✓ Navbar shows English labels

3. Open http://localhost:3000/fr/ (French)
   - ✓ Page loads without errors
   - ✓ All text in French
   - ✓ Navbar shows French labels

4. Open http://localhost:3000/de/ (German)
   - ✓ Page loads without errors
   - ✓ All text in German
   - ✓ Navbar shows German labels

5. Open http://localhost:3000/pl/ (Polish)
   - ✓ Page loads without errors
   - ✓ All text in Polish
   - ✓ Navbar shows Polish labels

### Test 1.2: Navbar Language Selector
1. Go to any page (e.g., /es/propiedades)
2. Look at Navbar (top right area)
   - ✓ See 5 language options with flags (🇪🇸 🇬🇧 🇫🇷 🇩🇪 🇵🇱)
   - ✓ Current language is highlighted
3. Click different language flags
   - ✓ Page changes to that language
   - ✓ URL changes correctly (/es/ → /en/ → /fr/, etc.)
   - ✓ All text updates immediately

### Test 1.3: "Blog" in Navbar
1. Go to http://localhost:3000/es/
   - ✓ Navbar has "Blog" link
2. Go to http://localhost:3000/en/
   - ✓ Navbar has "Blog" link (English: "Blog")
3. Go to http://localhost:3000/fr/
   - ✓ Navbar has "Blog" link (French: "Blog")
4. Go to http://localhost:3000/de/
   - ✓ Navbar has "Blog" link (German: "Blog")
5. Go to http://localhost:3000/pl/
   - ✓ Navbar has "Blog" link (Polish: "Blog")

---

## 📰 TEST 2: BLOG PAGES (10 minutes)

### Test 2.1: Blog Listing Page
1. Go to http://localhost:3000/blog (English by default)
   - ✓ Page loads without errors
   - ✓ Shows "Blog" header
   - ✓ Shows "No posts available" message (because database is empty)
   - ✓ No console errors

2. Go to http://localhost:3000/es/blog
   - ✓ Page loads in Spanish
   - ✓ Shows "Blog" section in Spanish
   - ✓ Shows "No posts" message

3. Go to http://localhost:3000/fr/blog
   - ✓ Page loads in French
   - ✓ Content in French

### Test 2.2: Blog Detail Page (Should 404)
1. Go to http://localhost:3000/blog/nonexistent
   - ✓ Should show 404 error (post doesn't exist)
   - ✓ No server errors

2. Try different locales:
   - ✓ http://localhost:3000/es/blog/test → 404 (expected)
   - ✓ http://localhost:3000/fr/blog/test → 404 (expected)

### Test 2.3: Blog Metadata
1. Go to http://localhost:3000/blog
   - ✓ Open browser DevTools (F12)
   - ✓ Go to Elements/Inspector tab
   - ✓ Look for `<title>` tag
   - ✓ Should show blog page title with locale

---

## 📊 TEST 3: ANALYTICS TRACKING (20 minutes)

### Test 3.1: Property View Tracking

**Setup**:
1. Go to http://localhost:3000/propiedades (property listing)
2. Open DevTools (F12)
3. Go to Network tab
4. Look for Supabase API calls

**Test Steps**:
1. Click on a property card
   - ✓ Page loads with property details
   - ✓ In Network tab, look for POST to `analytics_property_views`
   - ✓ Request should contain: cod_ofer, locale, session_id, traffic_source, utm_source, etc.

2. Try visiting property detail with UTM parameters:
   - Go to: `http://localhost:3000/propiedades/[property_id]?utm_source=email&utm_medium=newsletter&utm_campaign=spring2024`
   - ✓ Property page loads
   - ✓ Analytics request includes utm_source=email, utm_medium=newsletter, utm_campaign=spring2024

### Test 3.2: Form Conversion Tracking

**Test Steps**:
1. Go to a property page (http://localhost:3000/propiedades/[property_id])
2. Scroll down to contact form
3. Open DevTools Network tab (F12)
4. Fill out and submit the form:
   - First Name: Test
   - Last Name: User
   - Email: test@test.com
   - Phone: 123456789
   - Message: Test message
5. Click Submit
   - ✓ Success message appears
   - ✓ In Network tab, look for POST to `analytics_leads` or `analytics_property_views`
   - ✓ Request should contain: cod_ofer, locale, traffic_source

### Test 3.3: Search Tracking

**Test Steps**:
1. Go to http://localhost:3000/ (home page)
2. Open DevTools Network tab
3. Look at the search widget
4. Enter a search query (e.g., "villa")
5. Press search
   - ✓ Results load
   - ✓ In Network tab, look for POST to `analytics_searches`
   - ✓ Request should contain: search_query, locale, session_id

### Test 3.4: Check Supabase Data

**In Supabase Dashboard**:
1. Go to https://supabase.com/dashboard
2. Select "inmovilla-next" project
3. Go to SQL Editor
4. Run these queries:

```sql
-- Check analytics_property_views data
SELECT COUNT(*) as total, traffic_source 
FROM analytics_property_views 
GROUP BY traffic_source;

-- Check blog tables exist
SELECT COUNT(*) FROM blog_posts;
SELECT COUNT(*) FROM blog_categories;
SELECT COUNT(*) FROM blog_tags;

-- Check analytics columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'analytics_property_views' 
AND column_name IN ('traffic_source', 'utm_source', 'utm_medium', 'utm_campaign');
```

Expected Results:
- ✓ `traffic_source` column exists in `analytics_property_views`
- ✓ `utm_source`, `utm_medium`, `utm_campaign` columns exist
- ✓ Blog tables exist (blog_posts, blog_categories, blog_tags, blog_post_tags)
- ✓ Data in `analytics_property_views` shows traffic_source values (e.g., "direct", "google_organic", etc.)

---

## 📱 TEST 4: MOBILE RESPONSIVENESS (10 minutes)

### Test 4.1: Responsive Layout
1. Open http://localhost:3000/es/ on desktop
2. Open DevTools (F12)
3. Click "Toggle device toolbar" (or Ctrl+Shift+M)
4. Test different screen sizes:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1920px)

**Check**:
- ✓ Language selector in Navbar is responsive
- ✓ Blog grid displays correctly (1 col on mobile, 2 on tablet, 3 on desktop)
- ✓ Forms are readable and usable on mobile
- ✓ No horizontal scrolling (unless intentional)

### Test 4.2: Touch Interactions
1. On mobile view, test:
   - ✓ Navbar language selector works with touch
   - ✓ Property cards clickable
   - ✓ Forms inputs work
   - ✓ Buttons have adequate touch targets (min 44px)

---

## 🛠️ TEST 5: CODE QUALITY (5 minutes)

### Test 5.1: Console Errors
1. Go to http://localhost:3000/es/
2. Open DevTools Console (F12 → Console tab)
3. Check for errors:
   - ✓ No red errors
   - ✓ No TypeScript warnings
   - ✓ Only normal-looking logs (if any)

### Test 5.2: Network Errors
1. Go to http://localhost:3000/
2. Open DevTools Network tab
3. Check all requests:
   - ✓ No 404 errors (except intentional ones)
   - ✓ No 500 errors
   - ✓ Supabase requests are successful (200 status)

### Test 5.3: Build Status
1. In terminal, check for errors:
   - ✓ No "error TS" messages
   - ✓ No "Failed to compile" messages
   - ✓ Dev server still running without issues

---

## 🎯 TEST RESULTS SUMMARY

Create a summary table:

| Feature | Status | Notes |
|---------|--------|-------|
| Spanish (ES) | ✓ | Works at /es/ |
| English (EN) | ✓ | Works at /en/ |
| French (FR) | ✓ | Works at /fr/ |
| German (DE) | ✓ | Works at /de/ |
| Polish (PL) | ✓ | Works at /pl/ |
| Navbar Language Selector | ✓ | Shows 5 languages |
| Blog Listing Page | ✓ | Shows empty state |
| Blog Detail Page | ✓ | Shows 404 (expected) |
| Property View Tracking | ✓ | Data in Supabase |
| Form Conversion Tracking | ✓ | Data in Supabase |
| Search Tracking | ✓ | Data in Supabase |
| UTM Parameter Capture | ✓ | Stored in Supabase |
| Mobile Responsiveness | ✓ | Works on all sizes |
| Console Errors | ✓ | None found |
| Network Errors | ✓ | None found |

---

## ✅ PASS CRITERIA

**Phase 1 is READY to commit if**:
- ✓ All 5 languages work correctly
- ✓ Blog pages load without errors
- ✓ Analytics tracking captures data to Supabase
- ✓ No console errors
- ✓ No network errors
- ✓ Mobile responsive
- ✓ Navbar shows 5 languages

**If any test fails**:
1. Note which test failed
2. Check error message in console or Network tab
3. Describe what went wrong
4. Screenshot if helpful

---

## 📋 FINAL CHECKLIST

Before pushing to GitHub:

- [ ] All language tests pass
- [ ] All blog page tests pass
- [ ] All analytics tests pass
- [ ] All mobile tests pass
- [ ] All code quality tests pass
- [ ] Supabase data verification passes
- [ ] No build errors
- [ ] No console errors

---

## 🚀 NEXT STEP AFTER TESTING

Once all tests pass:

```bash
git add .
git commit -m "feat: PHASE 1 - i18n (5 languages), analytics tracking (UTM/source), blog foundation"
git push origin main
```

---

**Document**: Phase 1 Testing Guide
**Ready for**: Manual quality assurance before production push
