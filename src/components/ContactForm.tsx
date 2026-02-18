'use client';

import React, { useState } from 'react';
import { submitLeadAction } from '@/app/actions';

interface ContactFormProps {
    cod_ofer: number;
}

export const ContactForm = ({ cod_ofer }: ContactFormProps) => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            cod_ofer: cod_ofer
        };

        try {
            const result = await submitLeadAction(data);
            if (result.success) {
                setSuccess(true);
            } else {
                setError(result.error || 'Error al enviar el formulario');
            }
        } catch (err) {
            setError('Ocurrió un error inesperado');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-12 text-center rounded-sm">
                <h3 className="font-serif text-3xl mb-4">Solicitud Recibida</h3>
                <p className="text-slate-500 font-light leading-relaxed">
                    Nuestros asesores se pondrán en contacto con usted a la brevedad posible para gestionar su interés en esta propiedad.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-950 p-10 border border-slate-100 dark:border-slate-900 shadow-xl rounded-sm">
            <h3 className="font-serif text-3xl mb-8">Solicitar Información</h3>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] tracking-widest uppercase text-slate-400 font-medium">Nombre</label>
                        <input
                            name="nombre"
                            required
                            className="w-full bg-slate-50 dark:bg-slate-900 border-none px-4 py-3 text-sm focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] tracking-widest uppercase text-slate-400 font-medium">Apellidos</label>
                        <input
                            name="apellidos"
                            required
                            className="w-full bg-slate-50 dark:bg-slate-900 border-none px-4 py-3 text-sm focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] tracking-widest uppercase text-slate-400 font-medium">Dirección de Email</label>
                    <input
                        name="email"
                        type="email"
                        required
                        className="w-full bg-slate-50 dark:bg-slate-900 border-none px-4 py-3 text-sm focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all outline-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] tracking-widest uppercase text-slate-400 font-medium">Teléfono</label>
                    <input
                        name="telefono"
                        required
                        className="w-full bg-slate-50 dark:bg-slate-900 border-none px-4 py-3 text-sm focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all outline-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] tracking-widest uppercase text-slate-400 font-medium">Mensaje / Consulta</label>
                    <textarea
                        name="mensaje"
                        rows={4}
                        className="w-full bg-slate-50 dark:bg-slate-900 border-none px-4 py-3 text-sm focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all outline-none resize-none"
                    />
                </div>

                {error && <p className="text-red-500 text-xs">{error}</p>}

                {/* Anti-spam honeypot */}
                <div className="hidden" aria-hidden="true">
                    <input type="text" name="fax" tabIndex={-1} autoComplete="off" />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 uppercase text-[11px] tracking-[0.3em] font-bold hover:opacity-90 transition-all disabled:opacity-50"
                >
                    {loading ? 'Enviando Solicitud...' : 'Enviar Solicitud'}
                </button>

            </form>
        </div>
    );
};
