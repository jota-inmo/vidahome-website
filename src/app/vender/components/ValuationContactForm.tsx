'use client';

import React from 'react';

interface ValuationContactFormProps {
    contactData: { nombre: string; email: string; telefono: string; mensaje: string };
    setContactData: React.Dispatch<React.SetStateAction<{ nombre: string; email: string; telefono: string; mensaje: string }>>;
    handleSubmitContact: (e: React.FormEvent) => void;
    loading: boolean;
}

export function ValuationContactForm({
    contactData,
    setContactData,
    handleSubmitContact,
    loading
}: ValuationContactFormProps) {
    return (
        <div className="max-w-2xl mx-auto px-8 pb-32">
            <div className="bg-white dark:bg-slate-900 p-12 rounded-lg border border-slate-100 dark:border-slate-800 shadow-xl">
                <h2 className="text-3xl font-serif mb-8 text-center">Solicita tu tasación profesional</h2>

                <form onSubmit={handleSubmitContact} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Nombre completo
                        </label>
                        <input
                            type="text"
                            required
                            value={contactData.nombre}
                            onChange={(e) => setContactData({ ...contactData, nombre: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={contactData.email}
                            onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Teléfono
                        </label>
                        <input
                            type="tel"
                            required
                            value={contactData.telefono}
                            onChange={(e) => setContactData({ ...contactData, telefono: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Mensaje (opcional)
                        </label>
                        <textarea
                            rows={4}
                            value={contactData.mensaje}
                            onChange={(e) => setContactData({ ...contactData, mensaje: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            placeholder="Cuéntanos más sobre tu propiedad..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-lime-400 to-teal-500 text-[#0a192f] font-bold text-sm uppercase tracking-widest rounded-sm hover:shadow-lg transition-all disabled:opacity-50"
                    >
                        {loading ? 'Enviando...' : 'Enviar Solicitud'}
                    </button>
                </form>
            </div>
        </div>
    );
}
