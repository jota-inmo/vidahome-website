# 🚀 SAAS ROADMAP - Real Estate Platform (Futuro)

> ⚠️ **ESTADO**: Documento de planificación activa  
> **TIMELINE**: FASE 0 activa ahora → SaaS a partir de Mes 3  
> **PRIORIDAD**: FASE 0 = ALTA (automatización interna) / SaaS = Media (post-validación)

---

## 📋 Tabla de Contenidos
1. [FASE 0: Primero Tu Uso (Ahora)](#fase-0-primero-tu-uso-ahora)
2. [Visión General SaaS](#visión-general-saas)
3. [Arquitectura Multi-Tenant](#arquitectura-multi-tenant)
4. [Cambios Técnicos Necesarios](#cambios-técnicos-necesarios)
5. [Modelo de Negocio](#modelo-de-negocio)
6. [Roadmap de Desarrollo SaaS](#roadmap-de-desarrollo-saas)
7. [Go-to-Market Strategy](#go-to-market-strategy)
8. [Análisis Financiero](#análisis-financiero)
9. [Riesgos & Mitigación](#riesgos--mitigación)

---

## 🏠 FASE 0: Primero Tu Uso (Ahora)

> **Objetivo**: Automatizar el 80% de los workflows de Vidahome antes de escalar a SaaS.  
> **ROI Target**: 5-10 ventas/mes → 15-20 ventas/mes. Tiempo docs: 4h → 15 min.  
> **Condición para pasar a SaaS**: ROI > 2x confirmado con métricas reales.

---

### 📅 Semana 1-2: Generador Encargos (Core)

**Prioridad máxima** — Automatizar la documentación de compraventas:

- [ ] **Nota Simple Auto** — Integración Catastro-API.es (€0.10/nota) → PDF automático desde ref catastral
- [ ] **Email Notaría Formateado** — Plantilla profesional + ZIP adjuntos, asunto estructurado
- [ ] **Email Banco Hipoteca** — Misma lógica, adaptado a tono financiero + docs pre-aprobación
- [ ] **Solicitud CEE Auto** — Email al certificador habitual con datos de la propiedad

**Edge Functions a crear:**
```
supabase/functions/nota-simple/    → 1-click ref catastral → PDF descargable
supabase/functions/email-notaria/  → ZIP docs + asunto preciso + preview
supabase/functions/email-banco/    → Hipoteca pre-aprobada, mismo patrón
supabase/functions/solicitud-cee/  → Email certificador con datos automáticos
```

---

### 📬 Funcionalidad Clave: Modal Envío Paquete Documentos

> **UX**: 30 segundos de selección → email profesional enviado con adjuntos correctos.

**Flujo de usuario:**
1. Agente abre modal desde ficha de la propiedad/encargo
2. Selecciona **destinatario** (checkbox): `☐ Notaría` / `☐ Banco`
3. Selecciona **documentos a adjuntar** (checkboxes):
   - `☐ Nota Simple` | `☐ Contrato Arras` | `☐ CEE` | `☐ IBI/Comunidad` | `☐ DNI Cliente`
4. El sistema **auto-redacta** asunto y cuerpo del email según destinatario + docs seleccionados
5. **Preview live** del email antes de enviar
6. **Envío** → ZIP inteligente con solo los docs seleccionados
7. **Tracking**: Enviado `[10:15]` → Abierto `[10:20]` → Respondido

**Templates dinámicos:**
```typescript
const templates = {
  notaria: {
    asunto: `ESCRITURA LISTA - ${direccion} - ${fecha}`,
    saludo: 'Estimado/a Oficial de Notaría',
    seccion: 'DOCUMENTOS PARA ESCRITURA:',
  },
  banco: {
    asunto: `HIPOTECA LISTA - ${direccion} - ${importe}€`,
    saludo: 'Estimado/a Agente Hipotecario',
    seccion: 'DOCUMENTOS PARA PRE-APROBACIÓN:',
  }
};
// El texto completo se auto-genera con LLM usando los docs seleccionados
```

**Valor como add-on SaaS**: €10/mes "Paquetes Inteligentes"  
**Tiempo implementación**: ~1 semana (reutiliza lógica de email-notaria)

---

### 📅 Semana 3-4: Leads + GEO (Ventaja Local)

- [ ] **Leads Dashboard** — Supabase: `portal_source`, `status`, `agente`, funnel visual
- [ ] **GEO Booster** — Cron job que publica propiedades en Google Business Profile automáticamente
- [ ] **Reviews Auto Post-Venta** — NPS → si positivo, solicita review en Google Business

---

### 📅 Semana 5-6: Validación ROI

**Métricas a medir antes de activar FASE SaaS:**

| Métrica | Antes | Objetivo | Estado |
|---------|-------|----------|--------|
| Tiempo nota simple + arras + notaría | ~4h | 15 min | ⏳ |
| Ventas/mes | 5-10 | 15-20 (2x funnel) | ⏳ |
| Leads perdidos (sin seguimiento) | ~97% | ~70% | ⏳ |
| Emails profesionales enviados/semana | manual | automatizado | ⏳ |

**Criterio para activar SaaS**: ≥2 métricas con ROI > 2x durante 4 semanas consecutivas.

---



## 🎯 Visión General SaaS

### Concepto
**"El Webflow para agencias inmobiliarias"** - Sitio web + admin panel profesional sin necesidad de código.

### Target Market
- 🎯 Agencias inmobiliarias locales (1-20 agentes)
- 🎯 Franquicias de RE buscando soluciones modernas
- 🎯 Portales inmobiliarios secundarios

### Propuesta de Valor Única
- ✅ Multi-idioma nativo (6 idiomas + extensible)
- ✅ Diseño moderno y profesional
- ✅ Admin panel intuitivo (sin código)
- ✅ Integraciones con APIs locales (Inmovilla, Catastro, etc.)
- ✅ Precios competitivos (€29-299/mes vs €150-300)
- ✅ Escalabilidad comprobada

---

## 🏗️ Arquitectura Multi-Tenant

### Opción A: Shared Database + RLS (RECOMENDADO para inicio)

```
├─ Una sola base de datos Supabase
├─ Particionamiento por tenant_id
├─ Row Level Security para aislamiento
└─ Costo infra: €50-100/mes

VENTAJAS:
✅ Costo bajo
✅ Implementación rápida
✅ Mantenimiento centralizado

DESVENTAJAS:
❌ Menos aislamiento (fault can affect all)
❌ Límite ~50-100 clientes antes de performance issues
```

### Opción B: Separate Database per Tenant (Futuro)

```
├─ Cada cliente = BD propia
├─ Máximo aislamiento
└─ Costo infra: €200-500/mes

VENTAJAS:
✅ Aislamiento total
✅ Escalabilidad infinita
✅ SLAs individuales por cliente

DESVENTAJAS:
❌ Costo operacional alto
❌ Complejidad de provisioning
❌ Backup/restore por cliente

TIMELINE: Migrar cuando > 30 clientes
```

### Arquitectura Recomendada:

```
FASE 1 (Año 1):
├─ Shared DB + RLS
├─ Tenant isolation via tenant_id
├─ Auth con clerk/supabase auth
└─ Multi-region CDN para assets

FASE 2 (Año 2):
├─ Migrate to Separate DBs
├─ Dedicated Cloudflare Workers per tenant
├─ Custom domain support DNS
└─ API Gateway con rate limiting por cliente

FASE 3 (Año 3+):
├─ Kubernetes deployment
├─ Auto-scaling per tenant
├─ Advanced analytics & observability
└─ Enterprise features (SSO, etc)
```

---

## 🔧 Cambios Técnicos Necesarios

### 1. Base de Datos Refactorizada

#### ANTES (Vidahome):
```typescript
interface Property {
  id: UUID;
  title: string;
  description: string;
  // ... campos específicos de Vidahome
}
```

#### DESPUÉS (SaaS):
```typescript
interface Property {
  id: UUID;
  tenant_id: UUID;  // ← CRITICAL: Identifica al cliente
  title: string;
  description: string;
  // ... campos ahora por cliente
}

// Aplicar a:
interface HeroSlide { tenant_id: UUID; ... }
interface AdminUser { tenant_id: UUID; ... }
interface ContentBlock { tenant_id: UUID; ... }
```

#### SQL Migrations Necesarias:

```sql
-- 1. Agregar tabla de tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  domain VARCHAR(255) UNIQUE,
  logo_url VARCHAR(255),
  primary_color VARCHAR(7),
  created_at TIMESTAMP DEFAULT NOW(),
  subscription_plan VARCHAR(50) DEFAULT 'starter',
  stripe_customer_id VARCHAR(255)
);

-- 2. Agregar tenant_id a tablas existentes
ALTER TABLE properties ADD COLUMN tenant_id UUID NOT NULL 
  REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE hero_slides ADD COLUMN tenant_id UUID NOT NULL 
  REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE admin_users ADD COLUMN tenant_id UUID NOT NULL 
  REFERENCES tenants(id) ON DELETE CASCADE;

-- 3. Crear índices para performance
CREATE INDEX idx_properties_tenant ON properties(tenant_id);
CREATE INDEX idx_hero_slides_tenant ON hero_slides(tenant_id);
CREATE INDEX idx_admin_users_tenant ON admin_users(tenant_id);

-- 4. RLS Policies (Row Level Security)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_select ON properties
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM admin_users 
                 WHERE user_id = auth.uid())
  );

CREATE POLICY tenant_isolation_insert ON properties
  FOR INSERT WITH CHECK (
    tenant_id = (SELECT tenant_id FROM admin_users 
                 WHERE user_id = auth.uid())
  );

CREATE POLICY tenant_isolation_update ON properties
  FOR UPDATE USING (
    tenant_id = (SELECT tenant_id FROM admin_users 
                 WHERE user_id = auth.uid())
  );

-- Aplicar RLS a otras tablas similarly...
```

### 2. Autenticación & Multi-Tenant

#### ANTES:
```typescript
// Vidahome login simple
const handleLogin = async (password: string) => {
  const isValid = password === process.env.ADMIN_PASSWORD;
  // ...
}
```

#### DESPUÉS:
```typescript
// SaaS multi-tenant auth
import { createClient } from '@supabase/supabase-js';

interface SignUpPayload {
  email: string;
  password: string;
  agencyName: string;
  country: string;
}

const handleSignUp = async (payload: SignUpPayload) => {
  // 1. Create Supabase auth user
  const { data: { user }, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
  });
  
  // 2. Create tenant record
  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from('tenants')
    .insert({
      name: payload.agencyName,
      slug: generateSlug(payload.agencyName),
      created_by: user.id,
      country: payload.country
    })
    .select()
    .single();
  
  // 3. Create admin user association
  const { error: linkError } = await supabaseAdmin
    .from('admin_users')
    .insert({
      user_id: user.id,
      tenant_id: tenant.id,
      role: 'owner'
    });
  
  // 4. Return JWT with tenant_id claim (for RLS)
  return { tenant_id: tenant.id, user_id: user.id };
};

// JWT custom claims (Supabase)
// En auth.users tabla: raw_app_meta_data = { tenant_id: "..." }
```

### 3. Componentes Refactorizados

#### Ejemplo: Properties List
```typescript
// ANTES: Global properties (Vidahome only)
export const PropertyList = async () => {
  const { supabase } = await import('@/lib/supabase');
  const { data: properties } = await supabase
    .from('properties')
    .select('*');
  
  return <PropertyGrid properties={properties} />;
};

// DESPUÉS: Tenant-aware properties
export const PropertyList = async () => {
  const { getSession } = await import('@/lib/auth');
  const session = await getSession();
  const tenant_id = session?.user?.user_metadata?.tenant_id;
  
  const { supabase } = await import('@/lib/supabase');
  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .eq('tenant_id', tenant_id);  // ← KEY CHANGE
  
  return <PropertyGrid properties={properties} />;
};
```

### 4. Customización por Cliente

#### Campos a Parametrizar:

```typescript
interface TenantCustomization {
  // Branding
  logo_url: string;
  primary_color: string;        // hex
  secondary_color: string;      // hex
  font_family: 'inter' | 'playfair' | 'poppins';
  
  // Domain
  custom_domain?: string;       // ej: inmuebles-cliente.com
  
  // Features
  enabled_features: {
    blog: boolean;
    newsletter: boolean;
    virtual_tour: boolean;
    calculator: boolean;
  };
  
  // Integrations
  integrations: {
    inmovilla_api_key?: string;
    zapier_webhook?: string;
  };
  
  // Localization
  default_language: 'es' | 'en' | 'fr' | 'de' | 'it' | 'pl';
  enabled_languages: string[];
  
  // Contact info
  phone: string;
  email: string;
  address: string;
  social_links: Record<string, string>;
}
```

#### Componente de Customización en Admin:

```typescript
// src/app/[locale]/admin/branding/page.tsx
export default function BrandingPage() {
  const [tenant, setTenant] = useState<TenantCustomization>(null);
  
  return (
    <div className="space-y-8">
      {/* Color Picker */}
      <ColorPicker 
        label="Color Primario"
        value={tenant.primary_color}
        onChange={handleColorChange}
      />
      
      {/* Logo Upload */}
      <FileUpload 
        label="Logo Agencia"
        onUpload={handleLogoUpload}
      />
      
      {/* Domain Setup */}
      <DomainConfig 
        domain={tenant.custom_domain}
        onSave={handleDomainChange}
      />
      
      {/* Feature Toggles */}
      <FeatureToggle 
        features={tenant.enabled_features}
        onChange={handleFeatureToggle}
      />
    </div>
  );
}
```

### 5. Billing & Payments Integration

```typescript
// src/lib/billing.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface PlanConfig {
  starter: { price: 2900, properties: 10, users: 1, storage_gb: 5 };
  pro: { price: 9900, properties: 100, users: 5, storage_gb: 50 };
  enterprise: { price: 29900, properties: -1, users: -1, storage_gb: 500 };
}

export async function createCheckoutSession(
  tenant_id: string,
  plan: keyof PlanConfig
) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: {
          name: `Real Estate SaaS - ${plan.toUpperCase()}`,
          metadata: { tenant_id, plan }
        },
        unit_amount: PlanConfig[plan].price,
        recurring: { interval: 'month' }
      },
      quantity: 1
    }],
    customer_metadata: { tenant_id },
    success_url: `${process.env.NEXT_PUBLIC_URL}/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
  });
  
  return session;
}

export async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object as Stripe.Subscription;
      await updateTenantSubscription(
        subscription.metadata.tenant_id,
        subscription.id,
        subscription.status
      );
      break;
    
    case 'customer.subscription.deleted':
      // Downgrade tenant or disable
      break;
  }
}
```

---

## 💰 Modelo de Negocio

### Pricing Tiers:

```
┌──────────────┬─────────┬──────────┬──────────┬──────────────┐
│ Plan         │ Precio  │ Propiedades│ Usuarios │ Storage    │
├──────────────┼─────────┼──────────┼──────────┼──────────────┤
│ Starter      │ €29/mo  │ 10       │ 1        │ 5GB         │
│ Pro          │ €99/mo  │ 100      │ 5        │ 50GB        │
│ Enterprise   │ €299/mo │ Sin límite│ 20       │ 500GB       │
│ Custom       │ TBD     │ Custom   │ Custom   │ Custom      │
└──────────────┴─────────┴──────────┴──────────┴──────────────┘

Features adicionales (add-ons):
- Extra usuarios: €10/usuario/mes
- Extra almacenamiento: €1/10GB/mes
- Custom domain: €5/mes
- Priority support: €20/mes
```

### Revenue Projections:

```
CONSERVADOR (acquisition lenta):

AÑO 1:
  Starter: 10 clientes × €29 × 12 = €3,480
  Pro: 5 × €99 × 12 = €5,940
  Enterprise: 1 × €299 × 12 = €3,588
  ─────────────────────────────
  Total ingresos: €12,008
  Gastos infra: €2,000
  Ahorro fiscal (R+D): -€8,000
  ──────────────────────────────
  NET: -€15,992 (but cuenta como gasto R+D)

AÑO 2:
  Starter: 30 × €29 × 12 = €10,440
  Pro: 15 × €99 × 12 = €17,820
  Enterprise: 3 × €299 × 12 = €10,764
  ─────────────────────────────
  Total ingresos: €39,024
  Gastos infra: €4,000
  ──────────────────────────────
  NET: €35,024 (BENEFICIO)

AÑO 3:
  Starter: 60 × €29 × 12 = €20,880
  Pro: 40 × €99 × 12 = €47,520
  Enterprise: 10 × €299 × 12 = €35,880
  ─────────────────────────────
  Total ingresos: €104,280
  Gastos infra: €6,000
  ──────────────────────────────
  NET: €98,280 (BENEFICIO ALTO)

OPTIMISTA (viral/fast growth):

AÑO 1: €30,000 (más agresivo marketing)
AÑO 2: €120,000 (50+ clientes)
AÑO 3: €400,000+ (200+ clientes)
```

---

## 📅 Roadmap de Desarrollo SaaS

### Pre-requisitos:
- [ ] Vidahome completamente desacoplado de arquitectura Inmovilla
- [ ] Código limpio y documentado
- [ ] Tests unitarios para core features
- [ ] Infrastructure as Code (Terraform)

### FASE 1: Multi-Tenant Foundation (4-6 semanas)
**Objetivo**: Arquitectura base lista para onboarding de clientes

**Tareas**:
- [ ] DB migrations (tenant_id, RLS policies)
- [ ] Refactor authentication (multi-tenant aware)
- [ ] Update all queries to filter by tenant_id
- [ ] Tenant management endpoints
- [ ] Test RLS policies thoroughly

**Entregables**:
- [ ] Migrations SQL documentadas
- [ ] Auth flow end-to-end
- [ ] API para crear/actualizar tenants
- [ ] Documentación técnica

**Costo tiempo**: 160-200 horas
**Costo dinero**: €8,000-12,000
**Skills**: Backend (Node/TS), DB design, security

---

### FASE 2: Onboarding & Admin (3-4 semanas)
**Objetivo**: Clientes pueden registrarse y acceder al dashboard

**Tareas**:
- [ ] Sign up flow (email verification)
- [ ] Tenant dashboard (analytics overview)
- [ ] User management (agregar usuarios a agencia)
- [ ] Settings (basic config)
- [ ] Roles & permissions (owner/agent/viewer)

**Entregables**:
- [ ] Sign up page
- [ ] Tenant dashboard
- [ ] User management UI
- [ ] Settings panel

**Costo tiempo**: 120-150 horas
**Costo dinero**: €6,000-9,000
**Skills**: Full-stack, UX/design

---

### FASE 3: Customization (3-4 semanas)
**Objetivo**: Cada tenant puede personalizar su sitio

**Tareas**:
- [ ] Logo & branding uploader
- [ ] Color customization
- [ ] Content editor (hero, about, etc)
- [ ] Feature toggles (blog, calculator, etc)
- [ ] Domain management (SSL certificates)

**Entregables**:
- [ ] Branding admin panel
- [ ] Content editor
- [ ] Domain setup guide
- [ ] Custom CSS support (advanced)

**Costo tiempo**: 140-180 horas
**Costo dinero**: €7,000-10,000
**Skills**: Frontend, CSS, DevOps (SSL/DNS)

---

### FASE 4: Billing & Payments (2-3 semanas)
**Objetivo**: Cobrar a clientes automáticamente

**Tareas**:
- [ ] Stripe integration
- [ ] Pricing page
- [ ] Checkout flow
- [ ] Invoice generation
- [ ] Plan downgrade/upgrade logic
- [ ] Usage tracking & enforcement

**Entregables**:
- [ ] Pricing page
- [ ] Checkout complete
- [ ] Billing dashboard
- [ ] Invoice API

**Costo tiempo**: 80-120 horas
**Costo dinero**: €4,000-6,000
**Skills**: Stripe API, backend

---

### FASE 5: Marketing & Go-Live (2-3 semanas)
**Objetivo**: Lanzar al mercado y adquirir primeros clientes

**Tareas**:
- [ ] Landing page
- [ ] Marketing website
- [ ] Documentation & tutorial vids
- [ ] SEO optimization
- [ ] Beta launch (5-10 early adopters)
- [ ] Feedback loop

**Entregables**:
- [ ] Landing page
- [ ] Help center
- [ ] Video tutorials
- [ ] Blog (SEO content)

**Costo tiempo**: 100-150 horas
**Costo dinero**: €5,000-8,000 (+ publicidad)
**Skills**: Marketing, copywriting, SEO

---

### FASE 6: Advanced Features (Ongoing)
**Objetivo**: Mejorar basado en feedback de clientes

**Ideas para roadmap**:
- [ ] API REST para integraciones
- [ ] Webhooks (para real estate portals)
- [ ] Advanced analytics
- [ ] Email marketing integration
- [ ] Social media posting
- [ ] Mobile app
- [ ] AI-powered property descriptions
- [ ] Virtual tour integration

---

## 🚀 Go-to-Market Strategy

### FASE 1: Preseed (Beta privada)
```
Timeline: Semanas 1-4 post-lanzamiento
Objetivo: Validar producto con 10 early adopters

Acciones:
├─ Contactar conocidos en RE
├─ Ofrecer 6 meses gratis a cambio de feedback
├─ Sesiones de feedback semanales
├─ Caso de estudio detallado por cliente
└─ Iterar based on feedback

Canales:
├─ LinkedIn (reach out directly)
├─ Email (niche communities)
├─ Industry forums/Reddit
└─ Referrals (ask if they know someone)
```

### FASE 2: Soft Launch (Paid beta)
```
Timeline: Semanas 5-12
Objetivo: 30 clientes pagantes, validar unit economics

Acciones:
├─ 50% discount primer año (€14.50, €49.50, €149.50)
├─ Premium support gratuito
├─ Monthly product updates calls
├─ Customer testimonials & case studies
└─ Referral bonus (1 mes gratis por referral)

Canales:
├─ SEO for "CRM inmobiliario" "real estate SaaS"
├─ Product Hunt (launch day promo)
├─ Indie Hackers
├─ LinkedIn ads targeting RE agents
└─ Cold outreach (top 100 agencias)
```

### FASE 3: Public Launch
```
Timeline: Trimestre 2 post-dev
Objetivo: 100 clientes, brand awareness

Acciones:
├─ PR outreach (tech media + RE publications)
├─ Content marketing (100+ blog posts)
├─ Affiliate program (€50 commission per client)
├─ Partnership with associations (real estate)
├─ Webinar series (RE + technology)
└─ Case study library

Canales:
├─ Organic SEO (target "real estate platform saaS")
├─ Paid ads (Google Ads, LinkedIn)
├─ Email marketing (list building)
├─ Community building (slack/discord)
├─ YouTube (product demos, tutorials)
└─ Podcast sponsorships (entrepreneur/RE)
```

### FASE 4: Scale
```
Timeline: Año 2+
Objetivo: 500+ clientes, market leadership

Acciones:
├─ Enterprise sales team
├─ Partner marketplace
├─ Integrations ecosystem
├─ International expansion
├─ Mobile app
└─ Analytics/AI features
```

### Target Audiences (Priority Order):

1. **Agencias locales españolas** (1-5 agentes)
   - Pain point: "Mi web no se vende"
   - Solution: "Web moderna en 5 minutos"
   - Price sensitivity: High
   - Acquisition: Direct outreach + SEO

2. **Franquicias de RE** (50-200 oficinas)
   - Pain point: "Cada oficina maneja su web diferente"
   - Solution: "Branding centralizado, gestión descentralizada"
   - Price sensitivity: Low
   - Acquisition: Account-based marketing

3. **Portales inmobiliarios** (herramientas para publicar)
   - Pain point: "Necesitamos que nuestros partners tengan webs propios"
   - Solution: "White-label para vender a sus clientes"
   - Price sensitivity: Very low (volumen)
   - Acquisition: Partnership

4. **Property managers** (administración inmuebles)
   - Pain point: "Necesito vitrinas para mis propiedades"
   - Solution: "Showcase profesional"
   - Price sensitivity: Medium
   - Acquisition: Industry forums + associations

---

## 📊 Análisis Financiero Detallado

### Costo Total de Desarrollo

```
FASE 1 (Multi-tenant): €8,000 - €12,000
FASE 2 (Auth/Admin): €6,000 - €9,000
FASE 3 (Customization): €7,000 - €10,000
FASE 4 (Billing): €4,000 - €6,000
FASE 5 (Launch): €5,000 - €8,000
──────────────────────────────────
TOTAL: €30,000 - €45,000

O en horas: 220-330 horas @ €100-135/hora
```

### Proyección de Flujo de Caja (Optimista)

```
        Ingresos    Gastos      Neto        Acumulado
──────────────────────────────────────────────────────
Año 1   €40,000     €8,000      €32,000     -€13,000*
Año 2   €120,000    €12,000     €108,000    €95,000
Año 3   €400,000    €20,000     €380,000    €475,000
Año 4   €800,000    €40,000     €760,000    €1,235,000
Año 5   €1,200,000  €80,000     €1,120,000  €2,355,000

*Año 1 incluye -€45k dev cost
```

### Comparativa con Competencia

```
Producto            Precio  Features                  
──────────────────────────────────────────────────
Inmobilianet        €200+   CRM, análisis, web básica
Openpere            €150    CRM, portal, email
MLS Systems         €300    Enterprise, custom
Realtor.com Tools   €100+   Por funcionalidad

NUESTRO SaaS        €29-299 ✓ Modern UI
                            ✓ Multi-idioma
                            ✓ API integraciones
                            ✓ Admin panel profesional
                            ✓ Escalable
```

### Break-Even Analysis

```
Fixed Costs (monthly):
├─ Infrastructure: €500 (Supabase, Vercel, etc)
├─ Team (1 dev part-time): €2,000
└─ Misc: €500
  Total: €3,000/mes

Contribution Margin:
├─ Starter (€29): 80% margin = €23.20
├─ Pro (€99): 80% margin = €79.20
├─ Enterprise (€299): 85% margin = €254.15
  Weighted average: ~75%

Break-even:
€3,000 / 0.75 = €4,000 MRR needed
= ~25 Pro clientes / 100 Starter clientes

Timeline to break-even:
Año 1, Q3-Q4 (si acquisition es buena)
```

---

## ⚠️ Riesgos & Mitigación

### RIESGOS TÉCNICOS

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|-------------|-----------|
| RLS policies tienen bugs (data leak) | 🔴 Crítico | Media | Thorough testing, audit de seguridad |
| Performance degrada con muchos tenants | 🟡 Alto | Baja | Sharding, read replicas desde día 1 |
| Customización es difícil (tight coupling) | 🟡 Alto | Alta | Modular architecture, feature flags |
| Integración Inmovilla breaks por changes | 🟡 Alto | Media | Desacoplar completamente en Phase 0 |

### RIESGOS DE MERCADO

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|-------------|-----------|
| Competencia grande baja precios | 🟡 Alto | Alta | Diferenciación (multi-idioma, UX) |
| Bajo adopción inicial | 🟡 Alto | Alta | MVP validación, early adopter program |
| Churn alto (no sticky product) | 🟡 Alto | Media | Strong onboarding, community building |
| Regulaciones cambien (GDPR, legal) | 🟡 Alto | Baja | GDPR compliant desde inicio, DPA |

### RIESGOS FINANCIEROS

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|-------------|-----------|
| Presupuesto dev explota | 🟡 Alto | Media | Milestone-based payments, agile process |
| Runway no alcanza profitability | 🟡 Alto | Media | Funding or part-time model inicialmente |
| CAC (customer acquisition cost) > LTV | 🟡 Alto | Media | Multi-channel, focus on organic |

### MITIGACIÓN ESTRATÉGICA

1. **MVP First**: Lanzar con features mínimas, iterar
2. **Early Validation**: 10 beta clientes antes de invertir heavy
3. **Organic Growth**: SEO + content marketing antes de ads caros
4. **Community**: Discord/Slack para feedback y testimonials
5. **Partnerships**: Contactar associations, portals, resellers
6. **Sustainable**: No levanting funding, profitabilidad en Año 2

---

## 📌 Decisiones & Next Steps

### Condiciones para Activar Plan SaaS:

✅ **MUST HAVES**:
1. Vidahome completamente operacional en producción
2. Código desacoplado de Inmovilla (arquitectura limpia)
3. At least 1 año de validación con cliente actual
4. Team o budget para dedicar 20+ horas/semana

✅ **SHOULD HAVES**:
1. Tracción inicial (validación de mercado)
2. Primeras 3-5 agencias interesadas en beta
3. Documentación técnica completa
4. Infrastructure as Code preparada

### Próximas Acciones Inmediatas:

1. **FASE 0 activa NOW**: Generador encargos (nota simple + email notaría/banco)
2. **Config Catastro-API.es**: Dar de alta cuenta, obtener API key (€0.10/nota)
3. **Modal paquete docs**: Edge function `send-paquete-docs` con checkbox + ZIP
4. **Test real**: Usar en 1 compraventa real → medir tiempo ahorrado
5. **Medir ROI semana 6**: ¿2x en alguna métrica? → activar FASE SaaS
6. **Investigar**: Contactar 3-5 agencias COAPI Valencia para validar interés beta

### Revisión Plan:
- **Trimestral**: Evaluar progreso, validar asunciones
- **Anual**: Decisión: "¿Comenzamos SaaS?"

---

## 📚 Referencias

### Recursos Técnicos
- Supabase Multi-tenancy guide: docs.supabase.io
- Stripe Billing: stripe.com/docs/billing/subscriptions
- Row Level Security: postgresql.org/docs/current/ddl-rowsecurity.html

### Recursos de Negocio
- Y Combinator Startup Course: startupschool.org
- Peter Thiel Zero to One
- Clayton Christensen Innovators Dilemma

### Articles Relevantes
- "How to Build a Profitable SaaS" - Indie Hackers
- "Pricing SaaS Products" - Patrick Campbell
- "Multi-tenancy: Architecture & Design" - AWS

---

**Documento creado**: 26 Feb 2026  
**Última actualización**: 27 Feb 2026 (añadida FASE 0 + modal paquete docs)  
**Estado**: Activo — FASE 0 en ejecución  
**Siguiente revisión**: Semana 6 (validación ROI FASE 0)

*FASE 0: automatización interna → FASE SaaS: solo si ROI > 2x confirmado.*
