/**
 * Hook para validación de teléfono inteligente con detección de país
 */

import { useState, useCallback, useMemo } from 'react';
import { PhoneValidationResult, COUNTRY_CODES, CountryCode } from '@/types/sell-form';

// Validación por país (simplificada pero funcional)
const PHONE_PATTERNS: Record<string, { pattern: RegExp; length: number; description: string }> = {
  ES: {
    pattern: /^(?:\+?34)?[679]\d{8}$/,
    length: 9,
    description: 'Comienza con 6, 7 o 9'
  },
  FR: {
    pattern: /^(?:\+?33)?[1-9]\d{8}$/,
    length: 9,
    description: 'Comienza con 1-9'
  },
  IT: {
    pattern: /^(?:\+?39)?[023-9]\d{9}$/,
    length: 10,
    description: '10 dígitos'
  },
  DE: {
    pattern: /^(?:\+?49)?[2-9]\d{9,10}$/,
    length: 10,
    description: '10-11 dígitos'
  },
  UK: {
    pattern: /^(?:\+?44)?[2-9]\d{9}$/,
    length: 10,
    description: '10 dígitos'
  },
  PT: {
    pattern: /^(?:\+?351)?[2-9]\d{8}$/,
    length: 9,
    description: '9 dígitos'
  },
  BE: {
    pattern: /^(?:\+?32)?[1-9]\d{8}$/,
    length: 9,
    description: '9 dígitos'
  },
  NL: {
    pattern: /^(?:\+?31)?[1-9]\d{8}$/,
    length: 9,
    description: '9 dígitos'
  },
  AT: {
    pattern: /^(?:\+?43)?[1-9]\d{8,9}$/,
    length: 10,
    description: '10-11 dígitos'
  },
  PL: {
    pattern: /^(?:\+?48)?[1-9]\d{8}$/,
    length: 9,
    description: '9 dígitos'
  }
};

export function usePhoneValidation(initialCountry: CountryCode = 'ES') {
  const [country, setCountry] = useState<CountryCode>(initialCountry);
  const [rawPhone, setRawPhone] = useState('');
  const [error, setError] = useState<string>('');

  // Detectar país automáticamente según el código introducido
  const detectCountry = useCallback((input: string): CountryCode => {
    const cleaned = input.replace(/[^\d+]/g, '').toUpperCase();
    
    for (const [cc, info] of Object.entries(COUNTRY_CODES)) {
      if (cleaned.includes(info.code.replace('+', ''))) {
        return cc as CountryCode;
      }
    }
    
    return 'ES'; // Default
  }, []);

  // Limpiar y formatear el teléfono
  const normalize = useCallback((input: string): string => {
    // Quitar espacios, guiones, guiones bajos, paréntesis
    let cleaned = input
      .replace(/[\s\-_()\[\]]/g, '')
      .replace(/[^0-9+]/g, '');

    // Si empieza con + o 00, detectar país
    if (cleaned.startsWith('+') || cleaned.startsWith('00')) {
      let countryPrefix = '';
      for (const [, info] of Object.entries(COUNTRY_CODES)) {
        const numericCode = info.code.replace('+', '');
        if (cleaned.includes(numericCode)) {
          countryPrefix = numericCode;
          break;
        }
      }

      if (countryPrefix) {
        // Quitar prefijo del país
        cleaned = cleaned.replace(/^\+?0?/, '').replace(new RegExp(`^0?${countryPrefix}`), '');
        setCountry(detectCountry(`+${countryPrefix}`));
      }
    }

    // Quitar leading zeros (pero mantener el primer dígito)
    cleaned = cleaned.replace(/^0+/, '');

    return cleaned;
  }, [detectCountry]);

  // Validar teléfono completo
  const validate = useCallback((phone: string, selectedCountry: CountryCode): PhoneValidationResult => {
    const cleaned = normalize(phone);
    
    if (!cleaned) {
      return { isValid: false, formatted: '', error: 'El teléfono es requerido' };
    }

    const pattern = PHONE_PATTERNS[selectedCountry];
    if (!pattern) {
      return { isValid: false, formatted: '', error: 'País no soportado' };
    }

    // Validar con el patrón
    const countryCode = COUNTRY_CODES[selectedCountry];
    const numericCode = countryCode.code.replace('+', '');
    const fullNumber = numericCode + cleaned;

    const isValid = pattern.pattern.test(fullNumber);

    if (!isValid) {
      return {
        isValid: false,
        formatted: '',
        error: `Formato inválido para ${countryCode.name}. ${pattern.description}`
      };
    }

    // Formatear para mostrar
    const formatted = formatPhoneForDisplay(cleaned, selectedCountry);

    return {
      isValid: true,
      formatted,
      country: countryCode.name,
      countryCode: countryCode.code
    };
  }, [normalize, country]);

  // Formatear teléfono para mostrar (ej: +34 677 12 34 56)
  const formatPhoneForDisplay = (digits: string, selectedCountry: CountryCode): string => {
    const countryCode = COUNTRY_CODES[selectedCountry];
    const pattern = PHONE_PATTERNS[selectedCountry];

    if (!pattern) return digits;

    const length = pattern.length;
    if (digits.length < length) {
      return digits;
    }

    // Para la mayoría de países europeos: +34 XXX XX XX XX
    if (length === 9) {
      return `${countryCode.code} ${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
    }
    if (length === 10) {
      return `${countryCode.code} ${digits.slice(0, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
    }
    if (length === 11) {
      return `${countryCode.code} ${digits.slice(0, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`;
    }

    return `${countryCode.code} ${digits}`;
  };

  // Manejar cambio en el input (mientras escribe)
  const handlePhoneChange = useCallback((input: string) => {
    setRawPhone(input);
    
    // Detectar país automáticamente si incluye prefijo
    if (input.includes('+') || input.includes('00')) {
      const detected = detectCountry(input);
      setCountry(detected);
    }

    // Solo validar en blur (al perder el foco), no mientras escribe
    setError('');
  }, [detectCountry]);

  // Manejar cuando sale del campo (blur)
  const handlePhoneBlur = useCallback(() => {
    if (rawPhone.trim()) {
      const result = validate(rawPhone, country);
      if (!result.isValid) {
        setError(result.error || 'Teléfono inválido');
      } else {
        setError('');
      }
    } else {
      setError('');
    }
  }, [rawPhone, country, validate]);

  // Getter para el teléfono limpio (sin país)
  const getCleanPhone = useCallback((): string => {
    return normalize(rawPhone);
  }, [rawPhone, normalize]);

  // Getter para el teléfono con código de país
  const getFormattedPhone = useCallback((): string => {
    const countryCode = COUNTRY_CODES[country];
    const cleaned = normalize(rawPhone);
    return countryCode.code + cleaned;
  }, [rawPhone, country, normalize]);

  const countryInfo = useMemo(() => COUNTRY_CODES[country], [country]);

  return {
    country,
    setCountry,
    rawPhone,
    setRawPhone,
    error,
    setError,
    handlePhoneChange,
    handlePhoneBlur,
    validate: () => validate(rawPhone, country),
    getCleanPhone,
    getFormattedPhone,
    countryInfo,
    isValidPhone: error === '' && rawPhone.trim() !== ''
  };
}

/**
 * Helper para validar teléfono directamente
 */
export function validatePhone(
  phone: string,
  countryCode: CountryCode = 'ES'
): PhoneValidationResult {
  const hook = usePhoneValidation(countryCode);
  hook.setRawPhone(phone);
  return hook.validate();
}
