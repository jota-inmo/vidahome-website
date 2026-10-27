# ✅ SQL Schema Limpio - Sin Errores

Si recibiste el error:
```
ERROR: 42601: syntax error at or near "'use client'"
```

Es porque había conflicto con el formato del archivo anterior.

## 🆕 Usa Este SQL Limpio

**Archivo**: `sql/analytics-schema-clean.sql`

O copia este código directamente:

```sql
CREATE TABLE IF NOT EXISTS analytics_property_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cod_ofer INTEGER NOT NULL,
    locale VARCHAR(5) NOT NULL DEFAULT 'es',
    visitor_ip VARCHAR(50),
    user_agent TEXT,
    referer TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    session_id VARCHAR(100)
);

CREATE INDEX idx_analytics_views_property ON analytics_property_views(cod_ofer);
CREATE INDEX idx_analytics_views_date ON analytics_property_views(viewed_at);
CREATE INDEX idx_analytics_views_locale ON analytics_property_views(locale);

CREATE TABLE IF NOT EXISTS analytics_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cod_ofer INTEGER,
    email VARCHAR(255),
    source VARCHAR(50),
    locale VARCHAR(5) NOT NULL DEFAULT 'es',
    conversion_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_analytics_leads_property ON analytics_leads(cod_ofer);
CREATE INDEX idx_analytics_leads_date ON analytics_leads(created_at);
CREATE INDEX idx_analytics_leads_locale ON analytics_leads(locale);

CREATE TABLE IF NOT EXISTS analytics_valuations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    address VARCHAR(255),
    email VARCHAR(255),
    locale VARCHAR(5) NOT NULL DEFAULT 'es',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_analytics_valuations_date ON analytics_valuations(created_at);

CREATE TABLE IF NOT EXISTS analytics_page_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_path VARCHAR(255) NOT NULL,
    locale VARCHAR(5) NOT NULL DEFAULT 'es',
    visitor_ip VARCHAR(50),
    session_id VARCHAR(100),
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_analytics_pages_path ON analytics_page_views(page_path);
CREATE INDEX idx_analytics_pages_date ON analytics_page_views(viewed_at);

CREATE TABLE IF NOT EXISTS analytics_searches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    search_query TEXT,
    locale VARCHAR(5) NOT NULL DEFAULT 'es',
    results_count INTEGER,
    visitor_ip VARCHAR(50),
    session_id VARCHAR(100),
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_analytics_searches_date ON analytics_searches(searched_at);
CREATE INDEX idx_analytics_searches_locale ON analytics_searches(locale);

ALTER TABLE analytics_property_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert for all" ON analytics_property_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read for all" ON analytics_property_views FOR SELECT USING (true);
CREATE POLICY "Allow admin update" ON analytics_property_views FOR UPDATE USING (true);

CREATE POLICY "Allow insert for all" ON analytics_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read for all" ON analytics_leads FOR SELECT USING (true);

CREATE POLICY "Allow insert for all" ON analytics_valuations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read for all" ON analytics_valuations FOR SELECT USING (true);

CREATE POLICY "Allow insert for all" ON analytics_page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read for all" ON analytics_page_views FOR SELECT USING (true);

CREATE POLICY "Allow insert for all" ON analytics_searches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read for all" ON analytics_searches FOR SELECT USING (true);
```

## 🎯 Pasos para Ejecutar:

1. **Ve a Supabase Dashboard**
   - https://app.supabase.com/projects

2. **Selecciona tu proyecto**
   - `yheqvroinbcrrpppzdzx`

3. **SQL Editor → New Query**

4. **Copia TODO el código anterior** (desde CREATE TABLE hasta el último CREATE POLICY)

5. **Pega en el editor**

6. **Click en Run** (botón azul)

## ✅ Resultado Esperado:

```
✓ Query executed successfully
```

Deberías ver las 5 tablas creadas:
- `analytics_property_views` ✓
- `analytics_leads` ✓
- `analytics_valuations` ✓
- `analytics_page_views` ✓
- `analytics_searches` ✓

---

## 🆘 Si aún hay problemas:

El SQL es **100% válido PostgreSQL**. Si sigue dando error:

1. Copia **línea por línea** en lugar de todo junto
2. O intenta con PostgreSQL CLI:
   ```bash
   psql "postgresql://postgres:[PASSWORD]@db.yheqvroinbcrrpppzdzx.supabase.co:5432/postgres" < sql/analytics-schema-clean.sql
   ```

---

## ✨ Una vez ejecutado:

```bash
npm run dev
# Abre: http://localhost:3000/es/admin/analytics
```

Dashboard estará funcional y listo para trackear eventos! 🎉
