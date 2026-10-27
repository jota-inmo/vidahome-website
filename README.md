This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

**Nota de Desarrollo**: Para ver los cambios y mejoras realizadas, consulta:
- [CHANGELOG.md](./CHANGELOG.md) - Integración con API del Catastro
- [docs/archive/TRANSLATION_SYSTEM_FINAL.md](./docs/archive/TRANSLATION_SYSTEM_FINAL.md) - histórico del sistema de traducción (la documentación antigua vive en `docs/archive/`)

## 🌍 Sistema de Traducción (✅ Producción)
El proyecto incluye un sistema automático de traducción para descripciones de propiedades:
- **Idiomas**: Español, Inglés, Francés, Alemán, Italiano, Polaco
- **Engine**: Gemini 2.5 Flash (Perplexity retirado en abril; su código legacy sigue en `translate-perplexity.ts`)
- **Admin Panel**: Edición manual + auto-traducción en `/admin/translations`
- **Auditoría**: Tabla `translation_log` registra todas las traducciones

📖 **Histórico**: [docs/archive/TRANSLATION_SYSTEM_FINAL.md](./docs/archive/TRANSLATION_SYSTEM_FINAL.md)

## 🚀 Calidad y Pruebas
Este proyecto cuenta con una suite de tests automatizados con **Vitest**:

```bash
npm run test          # Ejecutar todos los tests
npm run test:watch    # Modo interactivo
npm run lint          # Análisis estático
```

## 🏷️ Releases (versionado semántico)
Para publicar una release en **1 comando** (actualiza versión, crea tag Git y hace push):

```bash
npm run release:patch  # 0.1.0 -> 0.1.1 (fixes)
npm run release:minor  # 0.1.0 -> 0.2.0 (features)
npm run release:major  # 0.1.0 -> 1.0.0 (breaking changes)
```

Nota: ejecuta estos comandos con el árbol Git limpio.

## 🛠️ Integración con Inmovilla
La web es **read-only sobre Supabase**: no llama a la API de Inmovilla. La sincronización con Inmovilla vive en el CRM (`vidahome-encargo`). El antiguo pipeline vía API Web + proxy Arsys se retiró el 2026-04-15 (`b57eaae`); su código residual se eliminó del repo en 2026-06.

📚 **Guía Maestra de Setup**: [docs/MASTER_SETUP_GUIDE.md](./docs/MASTER_SETUP_GUIDE.md)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load la fuente del proyecto (ver `src/app/[locale]/layout.tsx`).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
