/**
 * Hook para validación de teléfono inteligente con detección de país
 */

import { useState, useCallback, useMemo } from 'react';
import { PhoneValidationResult, COUNTRY_CODES, CountryCode } from '@/types/sell-form';

// Validación por país (MÁS FLEXIBLE - acepta variaciones de longitud)
const PHONE_PATTERNS: Record<string, { pattern: RegExp; minLength: number; maxLength: number; description: string }> = {
  ES: {
    pattern: /^(?:\+?34)?[0-9]{8,10}$/,
    minLength: 8,
    maxLength: 10,
    description: 'Entre 8 y 10 dígitos'
  },
  FR: {
    pattern: /^(?:\+?33)?[0-9]{8,10}$/,
    minLength: 8,
    maxLength: 10,
    description: 'Entre 8 y 10 dígitos'
  },
  IT: {
    pattern: /^(?:\+?39)?[0-9]{8,11}$/,
    minLength: 8,
    maxLength: 11,
    description: 'Entre 8 y 11 dígitos'
  },
  DE: {
    pattern: /^(?:\+?49)?[0-9]{8,12}$/,
    minLength: 8,
    maxLength: 12,
    description: 'Entre 8 y 12 dígitos'
  },
  UK: {
    pattern: /^(?:\+?44)?[0-9]{8,11}$/,
    minLength: 8,
    maxLength: 11,
    description: 'Entre 8 y 11 dígitos'
  },
  PT: {
    pattern: /^(?:\+?351)?[0-9]{8,10}$/,
    minLength: 8,
    maxLength: 10,
    description: 'Entre 8 y 10 dígitos'
  },
  BE: {
    pattern: /^(?:\+?32)?[0-9]{8,10}$/,
    minLength: 8,
    maxLength: 10,
    description: 'Entre 8 y 10 dígitos'
  },
  NL: {
    pattern: /^(?:\+?31)?[0-9]{8,10}$/,
    minLength: 8,
    maxLength: 10,
    description: 'Entre 8 y 10 dígitos'
  },
  AT: {
    pattern: /^(?:\+?43)?[0-9]{8,12}$/,
    minLength: 8,
    maxLength: 12,
    description: 'Entre 8 y 12 dígitos'
  },
  PL: {
    pattern: /^(?:\+?48)?[0-9]{8,10}$/,
    minLength: 8,
    maxLength: 10,
    description: 'Entre 8 y 10 dígitos'
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

  // Validar teléfono completo (MÁS PERMISIVO)
  const validate = useCallback((phone: string, selectedCountry: CountryCode): PhoneValidationResult => {
    const cleaned = normalize(phone);
    
    if (!cleaned) {
      return { isValid: false, formatted: '', error: 'El teléfono es requerido' };
    }

    const pattern = PHONE_PATTERNS[selectedCountry];
    if (!pattern) {
      return { isValid: false, formatted: '', error: 'País no soportado' };
    }

    // Validación simple por longitud (más flexible)
    if (cleaned.length < pattern.minLength) {
      return {
        isValid: false,
        formatted: '',
        error: `Teléfono muy corto. Mínimo ${pattern.minLength} dígitos`
      };
    }

    if (cleaned.length > pattern.maxLength) {
      return {
        isValid: false,
        formatted: '',
        error: `Teléfono muy largo. Máximo ${pattern.maxLength} dígitos`
      };
    }

    // Solo verificar que sean números
    if (!/^[0-9]+$/.test(cleaned)) {
      return {
        isValid: false,
        formatted: '',
        error: 'Solo se permiten números'
      };
    }

    // Formatear para mostrar
    const countryCode = COUNTRY_CODES[selectedCountry];
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

    // Formato genérico con espacios cada 3 dígitos
    const parts: string[] = [];
    for (let i = 0; i < digits.length; i += 3) {
      parts.push(digits.slice(i, i + 3));
    }

    return `${countryCode.code} ${parts.join(' ')}`;
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
