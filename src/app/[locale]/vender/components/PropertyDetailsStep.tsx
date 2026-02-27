'use client';

import React from 'react';
import { SellFormState } from '@/types/sell-form';

interface PropertyDetailsStepProps {
  formState: SellFormState;
  setFormState: (state: SellFormState | ((prev: SellFormState) => SellFormState)) => void;
  onNext: () => void;
  onBack: () => void;
  isPisoType?: boolean;
}

const ESTADOS = [
  { value: 'obra-nueva', label: 'Obra nueva / A estrenar' },
  { value: 'reformado', label: 'Recientemente reformado' },
  { value: 'buen-estado', label: 'Buen estado de conservación' },
  { value: 'a-reformar', label: 'Necesita reforma' },
  { value: 'en-reformas', label: 'En obra / reformas en curso' },
];

export const PropertyDetailsStep: React.FC<PropertyDetailsStepProps> = ({
  formState,
  setFormState,
  onNext,
  onBack,
  isPisoType = false,
}) => {
  return (
    <section className="max-w-2xl mx-auto px-8 py-16">
      <div className="mb-12">
        <h2 className="text-4xl font-serif text-slate-900 dark:text-white mb-4">
          Detalles del inmueble
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          Cuéntanos un poco más sobre tu propiedad para poder valorarla mejor
        </p>
      </div>

      <div className="space-y-6 mb-8">

        {/* Piso/Planta y Puerta — solo para pisos */}
        {isPisoType && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Piso / Planta
              </label>
              <select
                value={formState.pisoPlanta || ''}
                onChange={e => setFormState(prev => ({ ...prev, pisoPlanta: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg
                  bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                  focus:ring-2 focus:ring-lime-400 outline-none appearance-none"
              >
                <option value="">Selecciona...</option>
                <option value="bajo">Bajo / Planta baja</option>
                <option value="principal">Principal (1ª planta)</option>
                <option value="1">1ª planta</option>
                <option value="2">2ª planta</option>
                <option value="3">3ª planta</option>
                <option value="4">4ª planta</option>
                <option value="5">5ª planta</option>
                <option value="6">6ª planta</option>
                <option value="7">7ª planta o superior</option>
                <option value="duplex">Dúplex</option>
                <option value="atico">Ático</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Letra / Puerta
              </label>
              <input
                type="text"
                value={formState.puerta || ''}
                onChange={e => setFormState(prev => ({ ...prev, puerta: e.target.value.toUpperCase() }))}
                placeholder="Ej. A, B, C, 1, 2..."
                maxLength={5}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg
                  bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                  focus:ring-2 focus:ring-lime-400 outline-none text-center font-mono text-lg"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Letra de escalera o número de puerta
              </p>
            </div>
          </>
        )}

        {/* Estado del inmueble — para todos */}
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
            Estado del inmueble
          </label>
          <div className="grid grid-cols-1 gap-3">
            {ESTADOS.map(est => (
              <button
                key={est.value}
                type="button"
                onClick={() => setFormState(prev => ({ ...prev, estadoInmueble: est.value }))}
                className={`w-full px-4 py-3 rounded-lg border text-left text-sm font-medium transition-all
                  ${formState.estadoInmueble === est.value
                    ? 'border-lime-400 bg-lime-50 dark:bg-lime-950/30 text-lime-700 dark:text-lime-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-lime-300'
                  }`}
              >
                {est.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notas adicionales — para todos */}
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
            Información adicional <span className="text-slate-400 font-normal">(opcional)</span>
          </label>
          <textarea
            value={formState.notasAdicionales || ''}
            onChange={e => setFormState(prev => ({ ...prev, notasAdicionales: e.target.value }))}
            placeholder="Ej: tiene garaje y piscina comunitaria, reformado en 2022, orientación sur, vistas al mar..."
            rows={4}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg
              bg-white dark:bg-slate-900 text-slate-900 dark:text-white
              focus:ring-2 focus:ring-lime-400 outline-none resize-none text-sm leading-relaxed"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cualquier detalle relevante que ayude a valorar tu propiedad
          </p>
        </div>
      </div>

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
          className="px-8 py-3 bg-lime-400 text-slate-900 hover:bg-lime-500
            rounded-sm font-medium uppercase tracking-[0.1em] text-sm transition-all
            shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          Siguiente
        </button>
      </div>
    </section>
  );
};
