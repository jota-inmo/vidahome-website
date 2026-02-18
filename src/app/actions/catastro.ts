'use server';

export async function getCatastroProvinciasAction(): Promise<string[]> {
    try {
        const { CatastroClient } = await import('@/lib/api/catastro');
        const client = new CatastroClient();
        return await client.getProvincias();
    } catch (error) {
        console.error('Error fetching provincias:', error);
        return ['VALENCIA', 'ALICANTE', 'CASTELLON']; // Fallback básico
    }
}

export async function getCatastroMunicipiosAction(provincia: string): Promise<string[]> {
    try {
        const { CatastroClient } = await import('@/lib/api/catastro');
        const client = new CatastroClient();
        return await client.getMunicipios(provincia);
    } catch (error) {
        console.error('Error fetching municipios:', error);
        return [];
    }
}
