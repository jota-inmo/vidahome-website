'use client';

import React, { useEffect, useState } from 'react';
import { SellFormState, COUNTRY_CODES, CountryCode } from '@/types/sell-form';
import { usePhoneValidation } from '@/lib/hooks/usePhoneValidation';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface ContactFormStepProps {
  formState: SellFormState;
  setFormState: (state: SellFormState | ((prev: SellFormState) => SellFormState)) => void;
  onSubmit: () => void;
  onBack: () => void;
  loading?: boolean;
}

export const ContactFormStep: React.FC<ContactFormStepProps> = ({
  formState,
  setFormState,
  onSubmit,
  onBack,
  loading = false
}) => {
  const phone = usePhoneValidation(formState.indicativoPais as CountryCode || 'ES');
  const [emailError, setEmailError] = useState('');

  // Sincronizar estado global con el hook del teléfono
  useEffect(() => {
    setFormState(prev => ({
      ...prev,
      telefono: phone.rawPhone,
      indicativoPais: phone.countryInfo?.code || '+34'
    }));
  }, [phone.rawPhone, phone.country, phone.countryInfo]);

  // Validar email
  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError('');
      return true;
    }
    // Validación simple pero funcional
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = regex.test(email);
    setEmailError(isValid ? '' : 'Email inválido');
    return isValid;
  };

  const handleEmailChange = (value: string) => {
    setFormState(prev => ({ ...prev, email: value }));
    validateEmail(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar nombre
    if (!formState.nombre?.trim()) {
      alert('Por favor, introduce tu nombre');
      return;
    }

    // Validar teléfono
    const phoneValidation = phone.validate();
    if (!phoneValidation.isValid) {
      alert(phoneValidation.error || 'Teléfono inválido');
      return;
    }

    // Validar email si se proporcionó
    if (formState.email && !validateEmail(formState.email)) {
      alert('Email inválido');
      return;
    }

    onSubmit();
  };

  return (
    <section className="max-w-2xl mx-auto px-8 py-16">
      <div className="mb-12">
        <h2 className="text-4xl font-serif text-slate-900 dark:text-white mb-4">
          ¿Cómo te contactamos?
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          Información para que nuestro equipo se ponga en contacto contigo
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 mb-8" noValidate>
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
            Tu nombre <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formState.nombre}
            onChange={e => setFormState(prev => ({ ...prev, nombre: e.target.value }))}
            placeholder="Tu nombre..."
            required
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg
              bg-white dark:bg-slate-900 text-slate-900 dark:text-white
              focus:ring-2 focus:ring-lime-400 outline-none"
          />
        </div>

        {/* Email (opcional) */}
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
            Email <span className="text-slate-400 text-xs">(opcional)</span>
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
                  Email válido
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
            Te enviaremos la tasación por aquí (pero también puedes contactar por teléfono)
          </p>
        </div>

        {/* Teléfono (inteligente) */}
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
            Teléfono <span className="text-red-500">*</span>
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
                  {phone.validate().formatted || 'Teléfono válido'}
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
            Detectamos automáticamente tu país. Acepta diferentes formatos: +34 677 123456, 677-12-34-56, etc.
          </p>
        </div>

        {/* Mensaje (opcional) */}
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
            Mensaje <span className="text-slate-400 text-xs">(opcional)</span>
          </label>
          <textarea
            value={formState.mensaje || ''}
            onChange={e => setFormState(prev => ({ ...prev, mensaje: e.target.value.slice(0, 500) }))}
            placeholder="Ej. El piso tiene reforma moderna, ascensor, terraza con vistas..."
            rows={4}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg
              bg-white dark:bg-slate-900 text-slate-900 dark:text-white
              focus:ring-2 focus:ring-lime-400 outline-none resize-none"
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Información que nos ayude a mejorar la tasación
            </p>
            <span className="text-xs text-slate-400">
              {formState.mensaje?.length || 0}/500
            </span>
          </div>
        </div>

        {/* Honeypot para anti-spam */}
        <input type="hidden" name="website" value="" />

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
            Atrás
          </button>
          <button
            type="submit"
            disabled={loading || !!phone.error || !formState.nombre}
            className={`
              px-8 py-3 rounded-sm font-medium uppercase tracking-[0.1em] text-sm transition-all
              ${loading || !!phone.error || !formState.nombre
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-lime-400 text-slate-900 hover:bg-lime-500 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
              }
            `}
          >
            {loading ? 'Enviando...' : 'Enviar Solicitud'}
          </button>
        </div>
      </form>

      {/* Disclaimer */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-center">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Tus datos serán utilizados únicamente para contactarte sobre tu tasación. 
          Conforme aceptas nuestra <a href="#" className="text-lime-600 dark:text-lime-400 underline">política de privacidad</a>.
        </p>
      </div>
    </section>
  );
};
