'use client';

import React, { useState } from 'react';
import { submitLeadAction } from '@/app/actions';
import { useTranslations } from 'next-intl';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

interface ContactFormProps {
    // Nullable: CRM-only properties may not have a cod_ofer assigned yet.
    cod_ofer: number | null;
    // CRM ref. Always present for property pages. Sent to the action so the
    // notification email subject identifies the property even cuando cod_ofer
    // es null (venta/alquiler/traspaso aún no sincronizados con Inmovilla).
    propertyRef?: string;
}

export const ContactForm = ({ cod_ofer, propertyRef }: ContactFormProps) => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [gdprAccepted, setGdprAccepted] = useState(false);
    const t = useTranslations('Contact');
    const { trackConversion } = useAnalytics();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);

        // Anti-spam honeypot
        if (formData.get('fax')) {
            setSuccess(true);
            return;
        }

        setLoading(true);
        setError(null);

        const data = {
            nombre: formData.get('nombre') as string,
            apellidos: formData.get('apellidos') as string,
            email: formData.get('email') as string,
            telefono: formData.get('telefono') as string,
            mensaje: formData.get('mensaje') as string,
            cod_ofer: cod_ofer,
            ref: propertyRef
        };

        try {
            const result = await submitLeadAction(data);
            if (result.success) {
                // Track conversion on successful form submission
                trackConversion({
                    codOfer: cod_ofer,
                    conversionType: 'contact_form'
                });
                setSuccess(true);
            } else {
                setError(result.error || t('errorSubmit'));
            }
        } catch (err) {
            setError(t('errorGeneric'));
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-12 text-center rounded-sm">
                <h3 className="font-serif text-3xl mb-4">{t('successTitle')}</h3>
                <p className="text-slate-500 font-light leading-relaxed">
                    {t('successText')}
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-950 p-10 border border-slate-100 dark:border-slate-900 shadow-xl rounded-sm">
            <h3 className="font-serif text-3xl mb-8">{t('formTitle')}</h3>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] tracking-widest uppercase text-slate-400 font-medium">{t('firstName')}</label>
                        <input
                            name="nombre"
                            required
                            className="w-full bg-slate-50 dark:bg-slate-900 border-none px-4 py-3 text-sm focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] tracking-widest uppercase text-slate-400 font-medium">{t('lastName')}</label>
                        <input
                            name="apellidos"
                            required
                            className="w-full bg-slate-50 dark:bg-slate-900 border-none px-4 py-3 text-sm focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] tracking-widest uppercase text-slate-400 font-medium">{t('email')}</label>
                    <input
                        name="email"
                        type="email"
                        required
                        className="w-full bg-slate-50 dark:bg-slate-900 border-none px-4 py-3 text-sm focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all outline-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] tracking-widest uppercase text-slate-400 font-medium">{t('phone')}</label>
                    <input
                        name="telefono"
                        required
                        className="w-full bg-slate-50 dark:bg-slate-900 border-none px-4 py-3 text-sm focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all outline-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] tracking-widest uppercase text-slate-400 font-medium">{t('message')}</label>
                    <textarea
                        name="mensaje"
                        rows={4}
                        className="w-full bg-slate-50 dark:bg-slate-900 border-none px-4 py-3 text-sm focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all outline-none resize-none"
                    />
                </div>

                {error && <p className="text-red-500 text-xs">{error}</p>}

                {/* GDPR Consent */}
                <div className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        id="gdpr-contact"
                        checked={gdprAccepted}
                        onChange={(e) => setGdprAccepted(e.target.checked)}
                        className="mt-1 rounded border-slate-300"
                        required
                    />
                    <label htmlFor="gdpr-contact" className="text-xs text-slate-500 leading-relaxed cursor-pointer">
                        {t('gdprCheckbox')}{' '}
                        <a href="/legal/privacidad" target="_blank" className="text-slate-900 dark:text-white underline">
                            {t('gdprLink')}
                        </a>.
                    </label>
                </div>

                {/* Anti-spam honeypot */}
                <div className="hidden" aria-hidden="true">
                    <input type="text" name="fax" tabIndex={-1} autoComplete="off" />
                </div>

                <button
                    type="submit"
                    disabled={loading || !gdprAccepted}
                    className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 uppercase text-[11px] tracking-[0.3em] font-bold hover:opacity-90 transition-all disabled:opacity-50"
                >
                    {loading ? t('submitting') : t('submit')}
                </button>

            </form>
        </div>
    );
};
