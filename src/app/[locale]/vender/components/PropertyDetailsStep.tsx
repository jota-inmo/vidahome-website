'use client';

import React from 'react';
import { SellFormState } from '@/types/sell-form';
import { useTranslations } from 'next-intl';

interface PropertyDetailsStepProps {
  formState: SellFormState;
  setFormState: (state: SellFormState | ((prev: SellFormState) => SellFormState)) => void;
  onNext: () => void;
  onBack: () => void;
}

export const PropertyDetailsStep: React.FC<PropertyDetailsStepProps> = ({
  formState,
  setFormState,
  onNext,
  onBack,
}) => {
  const t = useTranslations('Vender');

  return (
    <section className="max-w-2xl mx-auto px-8 py-16">
      <div className="mb-12">
        <h2 className="text-4xl font-serif text-slate-900 dark:text-white mb-4">
          {t('detailsTitle')}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          {t('detailsDesc')}
        </p>
      </div>

      <div className="space-y-6 mb-8">

        {/* Número de habitaciones */}
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
            {t('detailsBedrooms')}
          </label>
          <select
            value={formState.habitaciones || ''}
            onChange={e => setFormState(prev => ({ ...prev, habitaciones: e.target.value ? Number(e.target.value) : undefined }))}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg
              bg-white dark:bg-slate-900 text-slate-900 dark:text-white
              focus:ring-2 focus:ring-lime-400 outline-none appearance-none"
          >
            <option value="">{t('detailsSelect')}</option>
            <option value="1">{t('detailsBedroom1')}</option>
            <option value="2">{t('detailsBedrooms2')}</option>
            <option value="3">{t('detailsBedrooms3')}</option>
            <option value="4">{t('detailsBedrooms4')}</option>
            <option value="5">{t('detailsBedrooms5')}</option>
            <option value="6">{t('detailsBedrooms6')}</option>
          </select>
        </div>

        {/* Número de baños */}
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
            {t('detailsBathrooms')}
          </label>
          <select
            value={formState.banos || ''}
            onChange={e => setFormState(prev => ({ ...prev, banos: e.target.value ? Number(e.target.value) : undefined }))}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg
              bg-white dark:bg-slate-900 text-slate-900 dark:text-white
              focus:ring-2 focus:ring-lime-400 outline-none appearance-none"
          >
            <option value="">{t('detailsSelect')}</option>
            <option value="1">{t('detailsBathroom1')}</option>
            <option value="2">{t('detailsBathrooms2')}</option>
            <option value="3">{t('detailsBathrooms3')}</option>
            <option value="4">{t('detailsBathrooms4')}</option>
          </select>
        </div>

        {/* Información adicional (opcional) */}
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
            {t('detailsAdditional')} <span className="text-slate-400 font-normal">{t('detailsOptional')}</span>
          </label>
          <textarea
            value={formState.notasAdicionales || ''}
            onChange={e => setFormState(prev => ({ ...prev, notasAdicionales: e.target.value }))}
            placeholder={t('detailsAdditionalPlaceholder')}
            rows={4}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg
              bg-white dark:bg-slate-900 text-slate-900 dark:text-white
              focus:ring-2 focus:ring-lime-400 outline-none resize-none text-sm leading-relaxed"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('detailsAdditionalHint')}
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
          {t('back')}
        </button>
        <button
          onClick={onNext}
          className="px-8 py-3 bg-lime-400 text-slate-900 hover:bg-lime-500
            rounded-sm font-medium uppercase tracking-[0.1em] text-sm transition-all
            shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          {t('next')}
        </button>
      </div>
    </section>
  );
};
