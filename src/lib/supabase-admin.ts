import { createClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase con SERVICE_ROLE_KEY — Solo para uso en el servidor.
 *
 * ⚠️  NUNCA importar este módulo en Client Components ('use client').
 *     La SERVICE_ROLE_KEY bypasea todas las políticas RLS y tiene acceso
 *     total a la base de datos. Solo debe usarse en Server Actions y API Routes.
 *
 * Usar para:
 *  - Operaciones de escritura en bucket 'media' (admin)
 *  - Cualquier operación que requiera permisos elevados
 *
 * NO usar para:
 *  - Lecturas públicas (usar el cliente anon de supabase.ts)
 *  - Nada que se ejecute en el navegador
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        // Desactivar persistencia de sesión — este cliente es stateless en el servidor
        autoRefreshToken: false,
        persistSession: false,
    },
});
