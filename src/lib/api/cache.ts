/**
 * Cache Module — Vidahome
 *
 * Estrategia de caché compatible con entornos serverless (Vercel):
 * - En producción (Vercel): usa `unstable_cache` de Next.js, que persiste
 *   entre invocaciones de funciones serverless usando la Data Cache de Next.js.
 * - En desarrollo local: usa un Map en memoria (suficiente para dev).
 *
 * La caché de archivos anterior (fs.writeFileSync) NO funcionaba en Vercel
 * porque el sistema de archivos es efímero y de solo lectura en serverless.
 */

import { unstable_cache } from 'next/cache';

// ─── In-Memory Cache (fallback para compatibilidad con código existente) ───────

interface CacheEntry {
    data: any;
    expires: number;
}

class MemoryCache {
    private store = new Map<string, CacheEntry>();

    get<T>(key: string): T | null {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expires) {
            this.store.delete(key);
            return null;
        }
        return entry.data as T;
    }

    set(key: string, data: any, ttlSeconds: number = 3600): void {
        this.store.set(key, {
            data,
            expires: Date.now() + ttlSeconds * 1000,
        });
    }

    remove(key: string): void {
        this.store.delete(key);
    }

    clear(): void {
        this.store.clear();
    }
}

export const apiCache = new MemoryCache();

// ─── Next.js Data Cache (para Server Actions y Server Components) ─────────────
//
// Uso:
//   import { withNextCache } from '@/lib/api/cache';
//   const cachedFn = withNextCache('my-key', myAsyncFn, { revalidate: 1200 });
//   const data = await cachedFn(arg1, arg2);
//
// La Data Cache de Next.js persiste entre invocaciones serverless en Vercel.
// Se invalida automáticamente con `revalidatePath` o `revalidateTag`.

export function withNextCache<T extends (...args: any[]) => Promise<any>>(
    key: string,
    fn: T,
    options: { revalidate?: number; tags?: string[] } = {}
): T {
    return unstable_cache(fn, [key], {
        revalidate: options.revalidate ?? 1200, // 20 minutos por defecto
        tags: options.tags ?? [key],
    }) as T;
}
