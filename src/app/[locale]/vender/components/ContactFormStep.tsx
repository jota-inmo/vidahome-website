'use client';

import React, { useEffect, useState } from 'react';
import { SellFormState, COUNTRY_CODES, CountryCode } from '@/types/sell-form';
import { usePhoneValidation } from '@/lib/hooks/usePhoneValidation';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ContactFormStepProps {
  formState: SellFormState;
  setFormState: (state: SellFormState | ((prev: SellFormState) => SellFormState)) => void;
  onSubmit: () => void;
  onBack: () => void;
  loading?: boolean;
}

// Helper: Convertir código de país (+34) a CountryCode (ES)
const getCountryCodeFromPhoneCode = (phoneCode: string): CountryCode => {
  for (const [key, value] of Object.entries(COUNTRY_CODES)) {
    if (value.code === phoneCode) {
      return key as CountryCode;
    }
  }
  return 'ES'; // Default
};

export const ContactFormStep: React.FC<ContactFormStepProps> = ({
  formState,
  setFormState,
  onSubmit,
  onBack,
  loading = false
}) => {
  const t = useTranslations('Vender');
  const initialCountry = getCountryCodeFromPhoneCode(formState.indicativoPais || '+34');
  const phone = usePhoneValidation(initialCountry);
  const [emailError, setEmailError] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [gdprAccepted, setGdprAccepted] = useState(false);

  // Inicializar teléfono si ya existe en formState (al volver atrás)
  useEffect(() => {
    if (!initialized && formState.telefono) {
      phone.setRawPhone(formState.telefono);
      setInitialized(true);
    }
  }, [initialized, formState.telefono, phone]);

  // Sincronizar estado global con el hook del teléfono
  useEffect(() => {
    if (initialized || phone.rawPhone) {
      setFormState(prev => ({
        ...prev,
        telefono: phone.rawPhone,
        indicativoPais: phone.countryInfo?.code || '+34'
      }));
    }
  }, [phone.rawPhone, phone.country, phone.countryInfo, initialized]);

  // Validar email
  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError('');
      return true;
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = regex.test(email);
    setEmailError(isValid ? '' : t('contactEmailInvalid'));
    return isValid;
  };

  const handleEmailChange = (value: string) => {
    setFormState(prev => ({ ...prev, email: value }));
    validateEmail(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.nombre?.trim()) {
      alert(t('contactAlertName'));
      return;
    }

    const phoneValidation = phone.validate();
    if (!phoneValidation.isValid) {
      alert(phoneValidation.error || t('contactAlertPhone'));
      return;
    }

    if (formState.email && !validateEmail(formState.email)) {
      alert(t('contactAlertEmail'));
      return;
    }

    onSubmit();
  };

  return (
    <section className="max-w-2xl mx-auto px-8 py-16">
      <div className="mb-12">
        <h2 className="text-4xl font-serif text-slate-900 dark:text-white mb-4">
          {t('contactTitle')}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          {t('contactDesc')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 mb-8" noValidate>
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
            {t('contactName')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formState.nombre}
            onChange={e => setFormState(prev => ({ ...prev, nombre: e.target.value }))}
            placeholder={t('contactNamePlaceholder')}
            required
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg
              bg-white dark:bg-slate-900 text-slate-900 dark:text-white
              focus:ring-2 focus:ring-lime-400 outline-none"
          />
        </div>

        {/* Email (opcional) */}
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
            {t('contactEmail')} <span className="text-slate-400 text-xs">{t('contactEmailOptional')}</span>
          </label>
          <input
            type="email"
            value={formState.email || ''}
            onChange={e => handleEmailChange(e.target.value)}
            placeholder="tu@email.com"
            className={`
              w-full px-4 py-3 border rounded-lg
              bg-white dark:bg-slate-900 text-slate-900 dark:text-white
              focus:ring-2 focus:ring-lime-400 outline-none transition-colors
              ${emailError
                ? 'border-red-300 dark:border-red-700 focus:ring-red-400'
                : 'border-slate-300 dark:border-slate-700'
              }
            `}
          />
          {formState.email && (
            <div className="mt-2 flex items-center gap-2">
              {!emailError ? (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                  <CheckCircle2 size={16} />
                  {t('contactEmailValid')}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle size={16} />
                  {emailError}
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {t('contactEmailHint')}
          </p>
        </div>

        {/* Teléfono (inteligente) */}
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
            {t('contactPhone')} <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2 mb-3">
            {/* Selector de país */}
            <select
              value={phone.country}
              onChange={e => phone.setCountry(e.target.value as CountryCode)}
              className="max-w-[100px] px-3 py-3 border border-slate-300 dark:border-slate-700 rounded-lg
                bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                focus:ring-2 focus:ring-lime-400 outline-none appearance-none text-sm"
            >
              {Object.entries(COUNTRY_CODES).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.code}
                </option>
              ))}
            </select>

            {/* Input de teléfono */}
            <input
              type="tel"
              value={phone.rawPhone}
              onChange={e => phone.handlePhoneChange(e.target.value)}
              onBlur={phone.handlePhoneBlur}
              placeholder="677 12 34 56"
              className={`
                flex-1 px-4 py-3 border rounded-lg
                bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                focus:outline-none focus:ring-2 transition-colors
                ${phone.error
                  ? 'border-red-300 dark:border-red-700 focus:ring-red-400'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-lime-400'
                }
              `}
            />
          </div>

          {phone.rawPhone && (
            <div className="mt-2 flex items-center gap-2">
              {!phone.error ? (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                  <CheckCircle2 size={16} />
                  {phone.validate().formatted || t('contactPhoneValid')}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle size={16} />
                  {phone.error}
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
            {t('contactPhoneHint')}
          </p>
        </div>

        {/* Mensaje (opcional) */}
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
            {t('contactMessage')} <span className="text-slate-400 text-xs">{t('contactEmailOptional')}</span>
          </label>
          <textarea
            value={formState.mensaje || ''}
            onChange={e => setFormState(prev => ({ ...prev, mensaje: e.target.value.slice(0, 500) }))}
            placeholder={t('contactMessagePlaceholder')}
            rows={4}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg
              bg-white dark:bg-slate-900 text-slate-900 dark:text-white
              focus:ring-2 focus:ring-lime-400 outline-none resize-none"
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t('contactMessageHint')}
            </p>
            <span className="text-xs text-slate-400">
              {formState.mensaje?.length || 0}/500
            </span>
          </div>
        </div>

        {/* Honeypot para anti-spam */}
        <input type="hidden" name="website" value="" />

        {/* GDPR Consent */}
        <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg">
          <input
            type="checkbox"
            id="gdpr-valuation"
            checked={gdprAccepted}
            onChange={(e) => setGdprAccepted(e.target.checked)}
            className="mt-1 rounded border-slate-300"
            required
          />
          <label htmlFor="gdpr-valuation" className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed cursor-pointer">
            {t('contactPrivacy')}{' '}
            <a href="/legal/privacidad" target="_blank" className="text-lime-600 dark:text-lime-400 underline">
              {t('contactPrivacyLink')}
            </a>.
          </label>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-4 justify-center pt-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 border border-slate-300 dark:border-slate-700 rounded-sm
              font-medium uppercase tracking-[0.1em] text-sm
              text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-900
              transition-colors"
          >
            {t('back')}
          </button>
          <button
            type="submit"
            disabled={loading || !!phone.error || !formState.nombre || !gdprAccepted}
            className={`
              px-8 py-3 rounded-sm font-medium uppercase tracking-[0.1em] text-sm transition-all
              ${loading || !!phone.error || !formState.nombre || !gdprAccepted
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-lime-400 text-slate-900 hover:bg-lime-500 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
              }
            `}
          >
            {loading ? t('contactSending') : t('contactSubmit')}
          </button>
        </div>
      </form>
    </section>
  );
};
