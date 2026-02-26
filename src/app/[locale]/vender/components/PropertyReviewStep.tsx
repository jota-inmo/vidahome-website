'use client';

import React from 'react';
import { SellFormState } from '@/types/sell-form';
import { CheckCircle2, MapPin, Ruler, DollarSign } from 'lucide-react';

interface PropertyReviewStepProps {
  formState: SellFormState;
  setFormState: (state: SellFormState | ((prev: SellFormState) => SellFormState)) => void;
  onNext: () => void;
  onBack: () => void;
}

export const PropertyReviewStep: React.FC<PropertyReviewStepProps> = ({
  formState,
  setFormState,
  onNext,
  onBack
}) => {
  const prop = formState.propertyFromCatastro;
  const est = formState.estimation;

  if (!prop) {
    return (
      <section className="max-w-2xl mx-auto px-8 py-16">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400">No se encontró propiedad</p>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-2xl mx-auto px-8 py-16">
      <div className="mb-12">
        <h2 className="text-4xl font-serif text-slate-900 dark:text-white mb-4">
          Confirmación de propiedad
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          Verifica que encontramos la propiedad correcta
        </p>
      </div>

      {/* Tarjeta de propiedad encontrada */}
      <div className="bg-gradient-to-br from-lime-50 to-teal-50 dark:from-lime-950/20 dark:to-teal-950/20 border-2 border-lime-400 dark:border-lime-700 rounded-lg p-8 mb-8">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-8 h-8 bg-lime-400 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={20} className="text-slate-900" strokeWidth={3} />
          </div>
          <div>
            <h3 className="text-lg font-serif text-slate-900 dark:text-white">
              Propiedad encontrada en el Catastro
            </h3>
          </div>
        </div>

        <div className="space-y-4">
          {/* Dirección */}
          {prop.direccion && (
            <div className="flex gap-4">
              <MapPin size={20} className="text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 mb-1">
                  Dirección
                </p>
                <p className="text-slate-900 dark:text-white font-medium">
                  {prop.direccion}
                </p>
              </div>
            </div>
          )}

          {/* Ref. Catastral */}
          {prop.referenciaCatastral && (
            <div className="flex gap-4">
              <div className="text-xs uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 flex-shrink-0 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">
                Ref.
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 mb-1">
                  Referencia catastral
                </p>
                <p className="text-slate-900 dark:text-white font-mono text-sm">
                  {prop.referenciaCatastral}
                </p>
              </div>
            </div>
          )}

          {/* Grid de datos */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-lime-300 dark:border-lime-700">
            {/* Superficie */}
            {prop.superficie && (
              <div>
                <p className="text-xs uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 mb-1">
                  Superficie
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-serif text-slate-900 dark:text-white">
                    {prop.superficie}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">m²</span>
                </div>
              </div>
            )}

            {/* Año construcción */}
            {prop.anoConstruccion && (
              <div>
                <p className="text-xs uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 mb-1">
                  Año construcción
                </p>
                <p className="text-xl font-serif text-slate-900 dark:text-white">
                  {prop.anoConstruccion}
                </p>
              </div>
            )}

            {/* Habitaciones */}
            {prop.habitaciones && (
              <div>
                <p className="text-xs uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 mb-1">
                  Habitaciones
                </p>
                <p className="text-xl font-serif text-slate-900 dark:text-white">
                  {prop.habitaciones}
                </p>
              </div>
            )}

            {/* Baños */}
            {prop.banos && (
              <div>
                <p className="text-xs uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 mb-1">
                  Baños
                </p>
                <p className="text-xl font-serif text-slate-900 dark:text-white">
                  {prop.banos}
                </p>
              </div>
            )}

            {/* Valor catastral */}
            {prop.valorCatastral && (
              <div>
                <p className="text-xs uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 mb-1">
                  Valor catastral
                </p>
                <p className="text-lg font-serif text-slate-900 dark:text-white">
                  €{prop.valorCatastral?.toLocaleString('es-ES')}
                </p>
              </div>
            )}

            {/* Uso */}
            {prop.uso && (
              <div>
                <p className="text-xs uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 mb-1">
                  Uso
                </p>
                <p className="text-slate-900 dark:text-white">
                  {prop.uso}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estimación de valor */}
      {est && (
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-8 mb-8">
          <h3 className="text-lg font-serif text-slate-900 dark:text-white mb-6">
            Estimación de valor de mercado
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Valor mínimo estimado:</span>
              <span className="text-2xl font-serif text-lime-600 dark:text-lime-400">
                €{est.min?.toLocaleString('es-ES')}
              </span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">Valor máximo estimado:</span>
              <span className="text-2xl font-serif text-lime-600 dark:text-lime-400">
                €{est.max?.toLocaleString('es-ES')}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-4">
            Esta es una estimación inicial basada en datos del Catastro. Un agente profesional realizará una valoración completa tras contactarte.
          </p>
        </div>
      )}

      {/* Confirmación */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-6 mb-8">
        <div className="flex gap-3">
          <div className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">
            ✓
          </div>
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              ¿Es esta tu propiedad?
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Si no es correcta, vuelve atrás para realizar una nueva búsqueda. Si todo es correcto, continúa con tus datos de contacto.
            </p>
          </div>
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
          Buscar otra
        </button>
        <button
          onClick={onNext}
          className="px-8 py-3 bg-lime-400 text-slate-900 hover:bg-lime-500 
            rounded-sm font-medium uppercase tracking-[0.1em] text-sm transition-all
            shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          Sí, continuar con mis datos
        </button>
      </div>
    </section>
  );
};
