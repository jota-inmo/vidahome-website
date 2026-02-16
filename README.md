This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

**Nota de Desarrollo**: Para ver los cambios y mejoras realizados en la integración con la **API del Catastro**, consulta el archivo [CHANGELOG.md](./CHANGELOG.md).

## ⚠️ Importante: Integración con Inmovilla API

Si estás desplegando en **Vercel**, necesitas configurar el proxy de Arsys para evitar problemas con IPs dinámicas:

📖 **Lee primero**: [RESUMEN_SOLUCION.md](./RESUMEN_SOLUCION.md)  
🚀 **Guía rápida**: [SOLUCION_IP_ARSYS.md](./SOLUCION_IP_ARSYS.md)  
📚 **Documentación completa**: [docs/ARSYS_PROXY_SETUP.md](./docs/ARSYS_PROXY_SETUP.md)

**Herramienta de ayuda:**
```bash
node setup-helper.js secret   # Generar secreto
node setup-helper.js check    # Verificar configuración
node setup-helper.js test     # Probar proxy
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
