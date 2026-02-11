'use client';

import React, { useEffect, useState } from 'react';
import { fetchPropertiesAction, getFeaturedPropertiesAction, updateFeaturedPropertiesAction, logoutAction } from '../../actions';
import { useRouter } from 'next/navigation';
import { PropertyListEntry } from '@/types/inmovilla';
import Link from 'next/link';

export default function FeaturedAdmin() {
    const [properties, setProperties] = useState<PropertyListEntry[]>([]);
    const [featuredIds, setFeaturedIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const router = useRouter();

    const handleLogout = async () => {
        await logoutAction();
        router.push('/admin/login');
    };

    useEffect(() => {
        async function load() {
            const [allRes, fIds] = await Promise.all([
                fetchPropertiesAction(),
                getFeaturedPropertiesAction()
            ]);
            if (allRes.success && allRes.data) {
                setProperties(allRes.data);
            }
            setFeaturedIds(fIds);
            setLoading(false);
        }
        load();
    }, []);

    const toggleFeatured = (id: number) => {
        setFeaturedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(i => i !== id);
            }
            if (prev.length >= 6) {
                setMessage('Máximo 6 propiedades permitidas');
                return prev;
            }
            setMessage('');
            return [...prev, id];
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateFeaturedPropertiesAction(featuredIds);
            setMessage('¡Cambios guardados con éxito!');
            setTimeout(() => setMessage(''), 3000);
        } catch (e) {
            setMessage('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-20 text-center font-serif italic">Cargando panel de gestión...</div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-32 pb-20 px-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div>
                        <span className="text-[10px] tracking-[0.4em] uppercase text-slate-400 mb-4 block">Administración</span>
                        <h1 className="text-4xl md:text-5xl font-serif text-[#0a192f] dark:text-white">Propiedades <span className="italic text-slate-400">Destacadas</span></h1>
                        <p className="mt-4 text-slate-500 font-light">Selecciona hasta 6 propiedades para mostrar en la página de inicio.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {message && <span className="text-sm text-blue-600 dark:text-blue-400 animate-pulse">{message}</span>}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`px-10 py-4 text-[10px] uppercase tracking-widest font-bold transition-all rounded-sm ${saving ? 'bg-slate-200 text-slate-400' : 'bg-[#0a192f] text-white hover:bg-[#1e3a8a]'
                                }`}
                        >
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </header>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                    <th className="p-6 text-[10px] uppercase tracking-widest font-bold text-slate-400">Selección</th>
                                    <th className="p-6 text-[10px] uppercase tracking-widest font-bold text-slate-400">Referencia</th>
                                    <th className="p-6 text-[10px] uppercase tracking-widest font-bold text-slate-400">Tipo</th>
                                    <th className="p-6 text-[10px] uppercase tracking-widest font-bold text-slate-400">Ubicación</th>
                                    <th className="p-6 text-[10px] uppercase tracking-widest font-bold text-slate-400">Precio</th>
                                </tr>
                            </thead>
                            <tbody>
                                {properties.map((prop) => (
                                    <tr
                                        key={prop.cod_ofer}
                                        className={`border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer ${featuredIds.includes(prop.cod_ofer) ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                                            }`}
                                        onClick={() => toggleFeatured(prop.cod_ofer)}
                                    >
                                        <td className="p-6">
                                            <div className={`w-5 h-5 border rounded-sm flex items-center justify-center transition-all ${featuredIds.includes(prop.cod_ofer)
                                                ? 'bg-[#0a192f] border-[#0a192f]'
                                                : 'border-slate-300 dark:border-slate-600'
                                                }`}>
                                                {featuredIds.includes(prop.cod_ofer) && (
                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-6 font-medium text-slate-900 dark:text-slate-100">{prop.ref}</td>
                                        <td className="p-6 text-slate-500 font-light">{prop.tipo_nombre || 'Residencia'}</td>
                                        <td className="p-6 text-slate-500 font-light">{prop.poblacion}</td>
                                        <td className="p-6 text-slate-900 dark:text-slate-100 font-serif">
                                            {prop.precioinmo ? `€ ${prop.precioinmo.toLocaleString()}` : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-12 flex justify-center">
                    <Link
                        href="/"
                        className="text-[11px] tracking-widest uppercase text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        Volver a la web principal
                    </Link>
                    <span className="mx-4 text-slate-200">|</span>
                    <button
                        onClick={handleLogout}
                        className="text-[11px] tracking-widest uppercase text-red-400 hover:text-red-600 transition-colors"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
}
