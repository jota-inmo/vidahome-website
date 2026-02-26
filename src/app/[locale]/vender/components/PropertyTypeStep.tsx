'use client';

import React, { useMemo } from 'react';
import { PropertyType, SellFormState, PROPERTY_TYPES } from '@/types/sell-form';

interface PropertyTypeStepProps {
  formState: SellFormState;
  setFormState: (state: SellFormState | ((prev: SellFormState) => SellFormState)) => void;
  onNext: () => void;
  onBack: () => void;
}

export const PropertyTypeStep: React.FC<PropertyTypeStepProps> = ({
  formState,
  setFormState,
  onNext,
  onBack
}) => {
  const handleSelect = (type: PropertyType) => {
    setFormState(prev => ({ ...prev, propertyType: type, propertyTypeOther: undefined }));
  };

  const handleOtherText = (text: string) => {
    setFormState(prev => ({ ...prev, propertyTypeOther: text }));
  };

  // Agrupar tipos por categoría
  const groupedTypes = useMemo(() => {
    const groups: Record<string, typeof PROPERTY_TYPES> = {};
    PROPERTY_TYPES.forEach(type => {
      if (!groups[type.group]) groups[type.group] = [];
      groups[type.group].push(type);
    });
    return groups;
  }, []);

  const isOtra = formState.propertyType === 'otra';

  return (
    <section className="max-w-4xl mx-auto px-8 py-16">
      <div className="mb-12">
        <h2 className="text-4xl font-serif text-slate-900 dark:text-white mb-4">
          ¿Qué tipo de propiedad tienes?
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          Selecciona la que mejor se ajuste a tu inmueble
        </p>
      </div>

      <div className="space-y-8 mb-12">
        {Object.entries(groupedTypes).map(([group, types]) => (
          <div key={group}>
            <h3 className="text-sm uppercase tracking-[0.2em] font-medium text-slate-400 dark:text-slate-500 mb-4">
              {group}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {types.map(type => (
                <button
                  key={type.value}
                  onClick={() => handleSelect(type.value)}
                  className={`
                    p-4 text-left rounded-lg border-2 transition-all
                    ${formState.propertyType === type.value
                      ? 'border-lime-400 bg-lime-50 dark:bg-lime-950/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-950'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900 dark:text-white">
                      {type.label}
                    </span>
                    {formState.propertyType === type.value && (
                      <div className="w-5 h-5 bg-lime-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        ✓
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Otro tipo - campo de texto */}
      {isOtra && (
        <div className="mb-12 p-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-3">
            Especifica el tipo de propiedad
          </label>
          <input
            type="text"
            value={formState.propertyTypeOther || ''}
            onChange={e => handleOtherText(e.target.value)}
            placeholder="Ej. Nave industrial, edificio de inversión, etc."
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg
              bg-white dark:bg-slate-900 text-slate-900 dark:text-white
              focus:ring-2 focus:ring-lime-400 focus:border-transparent outline-none"
          />
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-slate-300 dark:border-slate-700 rounded-sm
            font-medium uppercase tracking-[0.1em] text-sm
            text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-900
            transition-colors"
        >
          Atrás
        </button>
        <button
          onClick={onNext}
          disabled={!formState.propertyType || (isOtra && !formState.propertyTypeOther)}
          className={`
            px-8 py-3 rounded-sm font-medium uppercase tracking-[0.1em] text-sm transition-all
            ${(formState.propertyType && (!isOtra || formState.propertyTypeOther))
              ? 'bg-lime-400 text-slate-900 hover:bg-lime-500 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }
          `}
        >
          Siguiente
        </button>
      </div>
    </section>
  );
};
