This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

**Nota de Desarrollo**: Para ver los cambios y mejoras realizadas, consulta:
- [CHANGELOG.md](./CHANGELOG.md) - Integración con API del Catastro
- [TRANSLATION_SYSTEM_FINAL.md](./TRANSLATION_SYSTEM_FINAL.md) - Sistema de traducción con Perplexity AI ✅

## 🌍 Sistema de Traducción (✅ Producción)
El proyecto incluye un sistema automático de traducción para descripciones de propiedades:
- **Idiomas**: Español, Inglés, Francés, Alemán, Italiano, Polaco
- **Engine**: Perplexity AI (`sonar-small-online`)
- **Admin Panel**: Edición manual + auto-traducción en `/admin/translations`
- **Auditoría**: Tabla `translation_log` registra todas las traducciones

📖 **Documentación Completa**: [TRANSLATION_SYSTEM_FINAL.md](./TRANSLATION_SYSTEM_FINAL.md)

## 🚀 Calidad y Pruebas
Este proyecto cuenta con una suite de tests automatizados con **Vitest**:

```bash
npm run test          # Ejecutar todos los tests
npm run test:watch    # Modo interactivo
npm run lint          # Análisis estático
```

## 🛠️ Integración con Inmovilla
Para conectar con la API de Inmovilla desde Vercel, el sistema utiliza un **Arsys Proxy Layer** (debido a restricciones de IP).

📖 **Guía de Configuración**: [docs/ARSYS_PROXY_SETUP.md](./docs/ARSYS_PROXY_SETUP.md)  
📚 **Guía Maestra de Setup**: [docs/MASTER_SETUP_GUIDE.md](./docs/MASTER_SETUP_GUIDE.md)  

Para verificar la conexión manual con la API:
```bash
npm run api:test
```

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

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
