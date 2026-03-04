/**
 * Types para el nuevo formulario de Vender (6 pasos)
 */

export type OperationType = 'venta' | 'alquiler';

export type PropertyType =
  | 'piso'
  | 'apartamento'
  | 'chalet'
  | 'casa-aislada'
  | 'adosado'
  | 'pareado'
  | 'adosado-esquinero'
  | 'local-comercial'
  | 'oficina'
  | 'trastero'
  | 'garaje'
  | 'aparcamiento'
  | 'almacen'
  | 'terreno-urbano'
  | 'terreno-urbanizable'
  | 'terreno-rustico'
  | 'otra';

export interface SellFormState {
  // STEP 1: Tipo de operación
  operationType: OperationType | '';

  // STEP 2: Tipo de bien
  propertyType: PropertyType | '';
  propertyTypeOther?: string;

  // STEP 3: Dirección
  provincia: string;
  municipio: string;
  tipoVia: string;
  via: string;
  numero: string;
  refCatastralManual?: string;

  // STEP 4: Detalles del inmueble
  pisoPlanta?: string;       // Solo piso/apartamento
  puerta?: string;           // Solo piso/apartamento
  estadoInmueble?: string;   // Todos los tipos
  notasAdicionales?: string; // Todos los tipos

  // STEP 5: Propiedad del Catastro
  propertyFromCatastro?: {
    referenciaCatastral: string;
    direccion: string;
    superficie?: number;
    anoConstruccion?: number;
    uso?: string;
    clase?: string;
    valorCatastral?: number;
    habitaciones?: number;
    banos?: number;
    [key: string]: any;
  };
  estimation?: {
    min: number;
    max: number;
  };

  // STEP 6: Contacto
  nombre: string;
  email?: string;
  telefono: string;
  indicativoPais: string;
  mensaje?: string;
}

export interface PhoneValidationResult {
  isValid: boolean;
  formatted: string;
  country?: string;
  countryCode?: string;
  error?: string;
}

export interface LeadValuationV2 {
  id?: string;
  created_at?: string;
  updated_at?: string;

  operation_type: OperationType;
  property_type: PropertyType;
  property_type_other?: string;

  provincia: string;
  municipio: string;
  tipo_via: string;
  via: string;
  numero: string;
  ref_catastral_manual?: string;

  piso_planta?: string;
  puerta?: string;

  catastro_data?: Record<string, any>;

  user_name: string;
  user_email?: string;
  user_phone: string;
  user_country_code: string;
  user_message?: string;

  progress_step?: number;
  completed?: boolean;
  estimated_value?: number;
  notes?: string;
  status?: 'new' | 'contacted' | 'scheduled' | 'completed' | 'rejected';
}

export const PROPERTY_TYPES: { value: PropertyType; label: string; group: string }[] = [
  // Residencial
  { value: 'piso', label: 'Piso', group: 'Residencial' },
  { value: 'apartamento', label: 'Apartamento', group: 'Residencial' },
  { value: 'chalet', label: 'Casa/Chalet rústico', group: 'Residencial' },
  { value: 'casa-aislada', label: 'Casa aislada', group: 'Residencial' },
  { value: 'adosado', label: 'Adosado', group: 'Residencial' },
  { value: 'pareado', label: 'Pareado', group: 'Residencial' },
  { value: 'adosado-esquinero', label: 'Adosado esquinero', group: 'Residencial' },

  // Comercial
  { value: 'local-comercial', label: 'Local comercial', group: 'Comercial' },
  { value: 'oficina', label: 'Oficina', group: 'Comercial' },
  { value: 'almacen', label: 'Almacén', group: 'Comercial' },

  // Garajes y trasteros
  { value: 'garaje', label: 'Garaje', group: 'Otros' },
  { value: 'aparcamiento', label: 'Aparcamiento', group: 'Otros' },
  { value: 'trastero', label: 'Trastero/Almacén pequeño', group: 'Otros' },

  // Terreno
  { value: 'terreno-urbano', label: 'Terreno urbano', group: 'Terreno' },
  { value: 'terreno-urbanizable', label: 'Terreno no urbanizable', group: 'Terreno' },
  { value: 'terreno-rustico', label: 'Terreno rústico', group: 'Terreno' },

  // Otros
  { value: 'otra', label: 'Otro tipo de propiedad', group: 'Otros' }
];

export const COUNTRY_CODES = {
  ES: { code: '+34', name: 'España', flag: '🇪🇸' },
  FR: { code: '+33', name: 'Francia', flag: '🇫🇷' },
  IT: { code: '+39', name: 'Italia', flag: '🇮🇹' },
  DE: { code: '+49', name: 'Alemania', flag: '🇩🇪' },
  UK: { code: '+44', name: 'Reino Unido', flag: '🇬🇧' },
  PT: { code: '+351', name: 'Portugal', flag: '🇵🇹' },
  BE: { code: '+32', name: 'Bélgica', flag: '🇧🇪' },
  NL: { code: '+31', name: 'Países Bajos', flag: '🇳🇱' },
  AT: { code: '+43', name: 'Austria', flag: '🇦🇹' },
  PL: { code: '+48', name: 'Polonia', flag: '🇵🇱' }
};

export type CountryCode = keyof typeof COUNTRY_CODES;
