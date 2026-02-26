'use server';

import { requireAdmin } from '@/lib/auth';

// ─── Configuración de seguridad para subida de archivos ──────────────────────
const ALLOWED_MIME_TYPES = [
    'video/mp4',
    'video/webm',
    'video/quicktime',   // .mov
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
];

const ALLOWED_EXTENSIONS = ['mp4', 'webm', 'mov', 'jpg', 'jpeg', 'png', 'webp', 'avif'];
const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30 MB

export async function uploadMediaAction(formData: FormData) {
    try {
        if (!(await requireAdmin())) return { success: false, error: 'No autorizado' };
        const { supabaseAdmin } = await import('@/lib/supabase-admin');
        const file = formData.get('file') as File;
        if (!file) throw new Error('No se ha proporcionado ningún archivo');

        // ─── Validación de tipo MIME ─────────────────────────────────────────────
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            console.warn(`[Upload] Tipo MIME rechazado: ${file.type}`);
            return {
                success: false,
                error: `Tipo de archivo no permitido (${file.type}). Solo se aceptan: MP4, WebM, MOV, JPG, PNG, WebP.`
            };
        }

        // ─── Validación de extensión (doble check contra MIME spoofing) ──────────
        const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
        if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
            console.warn(`[Upload] Extensión rechazada: .${fileExt}`);
            return {
                success: false,
                error: `Extensión de archivo no permitida (.${fileExt}).`
            };
        }

        // ─── Validación de tamaño ────────────────────────────────────────────────
        if (file.size > MAX_FILE_SIZE) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
            return {
                success: false,
                error: `El archivo (${sizeMB} MB) supera el límite de ${MAX_FILE_SIZE / (1024 * 1024)} MB.`
            };
        }

        if (file.size === 0) {
            return { success: false, error: 'El archivo está vacío.' };
        }

        // ─── Nombre seguro ──────────────────────────────────────────────────────
        const safeName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

        // Convert File to ArrayBuffer for stable upload
        const arrayBuffer = await file.arrayBuffer();

        console.log(`⏳ Subiendo archivo ${safeName} (${(file.size / (1024 * 1024)).toFixed(1)} MB) a Supabase Storage...`);

        // Upload to 'media' bucket
        const { data, error } = await supabaseAdmin.storage
            .from('media')
            .upload(safeName, arrayBuffer, {
                contentType: file.type,
                upsert: true
            });

        if (error) {
            console.error('❌ Error Supabase Storage:', error);
            throw error;
        }

        // Get Public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('media')
            .getPublicUrl(safeName);

        console.log(`✅ Archivo subido con éxito: ${publicUrl}`);

        return { success: true, url: publicUrl, path: safeName };
    } catch (e: any) {
        console.error('Upload Error:', e);
        return { success: false, error: e.message };
    }
}
