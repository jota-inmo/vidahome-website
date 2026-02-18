'use server';

export async function uploadMediaAction(formData: FormData) {
    try {
        const { supabaseAdmin } = await import('@/lib/supabase-admin');
        const file = formData.get('file') as File;
        if (!file) throw new Error('No se ha proporcionado ningún archivo');

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `hero/${fileName}`;

        // Upload to 'videos' bucket
        const { data, error } = await supabaseAdmin.storage
            .from('videos')
            .upload(filePath, file);

        if (error) throw error;

        // Get Public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('videos')
            .getPublicUrl(filePath);

        return { success: true, url: publicUrl, path: filePath };
    } catch (e: any) {
        console.error('Upload Error:', e);
        return { success: false, error: e.message };
    }
}
