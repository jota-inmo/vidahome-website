import { InmovillaClient } from './client';
import { PropertyListEntry, PropertyDetails, PropertyFilters } from '@/types/inmovilla';

/**
 * Service to handle property-related API calls
 */
export class PropertyService extends InmovillaClient {
    /**
     * Retrieves a list of properties with basic filtering
     * @param filters - Filters like page, dateStart, dateEnd
     */
    async getProperties(filters: PropertyFilters = {}): Promise<PropertyListEntry[]> {
        // According to documentation, listado is required as a query param flag
        const params = {
            listado: true,
            ...filters
        };

        return this.get<PropertyListEntry[]>('/propiedades/', params);
    }

    /**
     * Retrieves detailed information for a specific property
     * @param cod_ofer - The property unique identifier
     */
    async getPropertyDetails(cod_ofer: number): Promise<PropertyDetails> {
        return this.get<PropertyDetails>('/propiedades/', { cod_ofer });
    }

    async getPropertyExtraInfo(cod_ofer: number): Promise<any> {
        return this.get<any>('/propiedades/', { extrainfo: true, cod_ofer });
    }

    async createClient(data: any): Promise<any> {
        return this.post('/clientes/', data);
    }
}

// Export a singleton instance helper (optional, depends on architecture)
export const createInmovillaApi = (token: string, authType: 'Token' | 'Bearer' = 'Bearer') => {
    return new PropertyService({ token, authType });
};
