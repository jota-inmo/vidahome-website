'use client';

import React from 'react';
import { OperationType, SellFormState } from '@/types/sell-form';
import { Heart, Home } from 'lucide-react';

interface OperationTypeStepProps {
  formState: SellFormState;
  setFormState: (state: SellFormState | ((prev: SellFormState) => SellFormState)) => void;
  onNext: () => void;
}

export const OperationTypeStep: React.FC<OperationTypeStepProps> = ({
  formState,
  setFormState,
  onNext
}) => {
  const handleSelect = (type: OperationType) => {
    setFormState(prev => ({ ...prev, operationType: type }));
    // No auto-advance, dejar que usuario haga clic en siguiente
  };

  return (
    <section className="max-w-2xl mx-auto px-8 py-16">
      <div className="mb-12">
        <h2 className="text-4xl font-serif text-slate-900 dark:text-white mb-4">
          ¿Qué quieres hacer?
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          Selecciona si quieres vender o alquilar tu propiedad
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {/* Venta */}
        <button
          onClick={() => handleSelect('venta')}
          className={`
            relative p-8 rounded-lg border-2 transition-all duration-300
            ${formState.operationType === 'venta'
              ? 'border-lime-400 bg-lime-50 dark:bg-lime-950/20 shadow-lg shadow-lime-200/50 dark:shadow-lime-900/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-lime-200 dark:hover:border-lime-800 bg-white dark:bg-slate-950'
            }
          `}
        >
          <div className="flex flex-col items-center text-center">
            <div
              className={`
                w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors
                ${formState.operationType === 'venta'
                  ? 'bg-lime-400 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }
              `}
            >
              <Home size={32} strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-serif text-slate-900 dark:text-white mb-2">
              Vender
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Quiero vender mi propiedad y conocer su valor en el mercado
            </p>
            {formState.operationType === 'venta' && (
              <div className="mt-4 inline-flex items-center gap-2 text-lime-600 dark:text-lime-400 text-sm font-medium">
                <span className="w-5 h-5 bg-lime-400 rounded-full flex items-center justify-center text-white">
                  ✓
                </span>
                Seleccionado
              </div>
            )}
          </div>
        </button>

        {/* Alquiler */}
        <button
          onClick={() => handleSelect('alquiler')}
          className={`
            relative p-8 rounded-lg border-2 transition-all duration-300
            ${formState.operationType === 'alquiler'
              ? 'border-lime-400 bg-lime-50 dark:bg-lime-950/20 shadow-lg shadow-lime-200/50 dark:shadow-lime-900/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-lime-200 dark:hover:border-lime-800 bg-white dark:bg-slate-950'
            }
          `}
        >
          <div className="flex flex-col items-center text-center">
            <div
              className={`
                w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors
                ${formState.operationType === 'alquiler'
                  ? 'bg-lime-400 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }
              `}
            >
              <Heart size={32} strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-serif text-slate-900 dark:text-white mb-2">
              Alquilar
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Quiero alquilar mi propiedad y encontrar inquilinos
            </p>
            {formState.operationType === 'alquiler' && (
              <div className="mt-4 inline-flex items-center gap-2 text-lime-600 dark:text-lime-400 text-sm font-medium">
                <span className="w-5 h-5 bg-lime-400 rounded-full flex items-center justify-center text-white">
                  ✓
                </span>
                Seleccionado
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={onNext}
          disabled={!formState.operationType}
          className={`
            px-8 py-3 rounded-sm font-medium uppercase tracking-[0.1em] text-sm transition-all
            ${formState.operationType
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
