'use server';

export async function uploadMediaAction(formData: FormData) {
    try {
        const { supabaseAdmin } = await import('@/lib/supabase-admin');
        const file = formData.get('file') as File;
        if (!file) throw new Error('No se ha proporcionado ningún archivo');

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`; // Subir a la raíz del bucket 'media' para simplificar

        // Convert File to Buffer/ArrayBuffer for more stable upload in some environments
        const arrayBuffer = await file.arrayBuffer();

        console.log(`⏳ Subiendo archivo ${fileName} a Supabase Storage (bucket: media)...`);

        // Upload to 'media' bucket
        const { data, error } = await supabaseAdmin.storage
            .from('media')
            .upload(filePath, arrayBuffer, {
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
            .getPublicUrl(filePath);

        console.log(`✅ Archivo subido con éxito: ${publicUrl}`);

        return { success: true, url: publicUrl, path: filePath };
    } catch (e: any) {
        console.error('Upload Error:', e);
        return { success: false, error: e.message };
    }
}
