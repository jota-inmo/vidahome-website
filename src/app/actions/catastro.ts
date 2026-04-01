'use server';

// Fallback de municipios principales por provincia (zona operativa VidaHome)
const MUNICIPIOS_FALLBACK: Record<string, string[]> = {
    'VALENCIA': [
        'GANDIA', 'VALENCIA', 'OLIVA', 'TAVERNES DE LA VALLDIGNA', 'XERACO',
        'XERESA', 'BELLREGUARD', 'MIRAMAR', 'PILES', 'DAIMUZ',
        'GUARDAMAR DE LA SAFOR', 'REAL DE GANDIA', 'BENIARJO', 'PALMA DE GANDIA',
        'ADOR', 'LLOCNOU DE SANT JERONI', 'ROTOVA', 'ALMOINES', 'BENIFLA',
        'POTRIES', 'RAFELCOFER', 'VILLALONGA', 'LLOC NOU D\'EN FENOLLET',
        'BARX', 'SIMAT DE LA VALLDIGNA', 'BENIFAIRO DE LA VALLDIGNA',
        'ALZIRA', 'XATIVA', 'ONTINYENT', 'SUECA', 'CULLERA', 'TORRENT',
        'SAGUNTO', 'PATERNA', 'MANISES', 'BURJASSOT', 'REQUENA', 'UTIEL',
    ],
    'ALICANTE': [
        'ALICANTE', 'BENIDORM', 'DENIA', 'JAVEA', 'CALPE', 'ALTEA',
        'ELCHE', 'TORREVIEJA', 'ORIHUELA', 'VILLAJOYOSA', 'ALCOY',
        'ELDA', 'PETRER', 'CREVILLENTE', 'NOVELDA', 'SAN VICENTE DEL RASPEIG',
    ],
    'CASTELLON': [
        'CASTELLON DE LA PLANA', 'BENICASIM', 'OROPESA DEL MAR', 'VINAROS',
        'BENICARLÓ', 'PEÑISCOLA', 'VILA-REAL', 'BURRIANA', 'ONDA',
    ],
};

export async function getCatastroProvinciasAction(): Promise<string[]> {
    try {
        const { CatastroClient } = await import('@/lib/api/catastro');
        const client = new CatastroClient();
        const result = await client.getProvincias();
        if (result.length > 0) return result;
    } catch (error) {
        console.error('Error fetching provincias:', error);
    }
    return Object.keys(MUNICIPIOS_FALLBACK);
}

export async function getCatastroMunicipiosAction(provincia: string): Promise<string[]> {
    try {
        const { CatastroClient } = await import('@/lib/api/catastro');
        const client = new CatastroClient();
        const result = await client.getMunicipios(provincia);
        if (result.length > 0) return result;
    } catch (error) {
        console.error('Error fetching municipios:', error);
    }
    return MUNICIPIOS_FALLBACK[provincia.toUpperCase()] || [];
}
