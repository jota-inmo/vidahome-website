'use client';

import React, { useEffect, useState } from 'react';
import { getCompanySettingsAction, updateCompanySettingsAction, CompanySettings } from '@/app/actions/settings';
import { toast } from 'sonner';
import { Save, Loader2, Phone, Mail, MapPin, Clock, Instagram } from 'lucide-react';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<CompanySettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            const data = await getCompanySettingsAction();
            setSettings(data);
            setLoading(false);
        };
        load();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;

        setSaving(true);
        const res = await updateCompanySettingsAction(settings);
        if (res.success) {
            toast.success('Configuración actualizada correctamente');
        } else {
            toast.error('Error al guardar: ' + res.error);
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl p-8">
            <header className="mb-12">
                <h1 className="font-serif text-4xl text-slate-900 border-b pb-4">Configuración de Agencia</h1>
                <p className="mt-2 text-slate-500">Administra los datos de contacto y horarios que se muestran en toda la web.</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-sm shadow-sm border border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Contacto */}
                    <div className="space-y-6">
                        <h2 className="text-xs uppercase tracking-widest font-bold text-teal-600 flex items-center gap-2">
                            <Phone size={14} /> Contacto
                        </h2>

                        <div>
                            <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Teléfono Principal</label>
                            <input
                                type="text"
                                value={settings?.phone || ''}
                                onChange={e => setSettings(s => s ? { ...s, phone: e.target.value } : null)}
                                className="w-full bg-slate-50 border-none px-4 py-3 rounded-sm focus:ring-1 focus:ring-teal-500 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Email de Contacto</label>
                            <input
                                type="email"
                                value={settings?.email || ''}
                                onChange={e => setSettings(s => s ? { ...s, email: e.target.value } : null)}
                                className="w-full bg-slate-50 border-none px-4 py-3 rounded-sm focus:ring-1 focus:ring-teal-500 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">URL de Instagram</label>
                            <div className="relative">
                                <Instagram size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input
                                    type="text"
                                    value={settings?.instagram_url || ''}
                                    onChange={e => setSettings(s => s ? { ...s, instagram_url: e.target.value } : null)}
                                    className="w-full bg-slate-50 border-none pl-12 pr-4 py-3 rounded-sm focus:ring-1 focus:ring-teal-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Horarios */}
                    <div className="space-y-6">
                        <h2 className="text-xs uppercase tracking-widest font-bold text-teal-600 flex items-center gap-2">
                            <Clock size={14} /> Horarios
                        </h2>

                        <div>
                            <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Lunes a Viernes</label>
                            <input
                                type="text"
                                value={settings?.hours_week || ''}
                                onChange={e => setSettings(s => s ? { ...s, hours_week: e.target.value } : null)}
                                className="w-full bg-slate-50 border-none px-4 py-3 rounded-sm focus:ring-1 focus:ring-teal-500 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Sábados</label>
                            <input
                                type="text"
                                value={settings?.hours_sat || ''}
                                onChange={e => setSettings(s => s ? { ...s, hours_sat: e.target.value } : null)}
                                className="w-full bg-slate-50 border-none px-4 py-3 rounded-sm focus:ring-1 focus:ring-teal-500 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Ubicación */}
                <div className="pt-8 border-t border-slate-50">
                    <h2 className="text-xs uppercase tracking-widest font-bold text-teal-600 flex items-center gap-2 mb-6">
                        <MapPin size={14} /> Ubicación Física
                    </h2>
                    <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Dirección Completa</label>
                        <textarea
                            rows={3}
                            value={settings?.address || ''}
                            onChange={e => setSettings(s => s ? { ...s, address: e.target.value } : null)}
                            className="w-full bg-slate-50 border-none px-4 py-3 rounded-sm focus:ring-1 focus:ring-teal-500 transition-all resize-none"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-8">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-[#0a192f] text-white px-10 py-4 flex items-center gap-3 hover:bg-[#112240] transition-all rounded-sm disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        <span className="text-[10px] uppercase tracking-widest font-bold">Guardar Cambios</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
