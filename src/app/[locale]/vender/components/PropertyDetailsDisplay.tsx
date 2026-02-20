'use client';

import React from 'react';
import { MapPin, Ruler, Calendar, Home, Euro, Bed, Bath, Droplets, Sun, Hammer, ArrowUpSquare, Waves, Palmtree, ArrowRight } from 'lucide-react';
import { CatastroProperty } from '@/lib/api/catastro';

interface PropertyDetailsDisplayProps {
    property: CatastroProperty;
    estimation: { min: number; max: number } | null;
    handleUpdateProperty: (updates: Partial<CatastroProperty>) => void;
    setStep: (step: number) => void;
}

export function PropertyDetailsDisplay({
    property,
    estimation,
    handleUpdateProperty,
    setStep
}: PropertyDetailsDisplayProps) {
    return (
        <div className="max-w-4xl mx-auto px-8 pb-32">
            <div className="bg-white dark:bg-slate-900 p-12 rounded-lg border border-slate-100 dark:border-slate-800 shadow-xl">
                <h2 className="text-3xl font-serif mb-8 text-center">Datos de tu propiedad</h2>

                {/* Property Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    <div className="p-6 border border-slate-100 dark:border-slate-800 rounded-sm bg-slate-50/50 dark:bg-slate-800/50">
                        <MapPin className="text-teal-500 mb-3" size={24} />
                        <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Dirección</div>
                        <input
                            type="text"
                            value={property.direccion}
                            onChange={(e) => handleUpdateProperty({ direccion: e.target.value })}
                            className="w-full bg-transparent font-medium border-b border-transparent focus:border-teal-500 outline-none transition-all"
                        />
                    </div>

                    <div className="p-6 border border-slate-100 dark:border-slate-800 rounded-sm bg-slate-50/50 dark:bg-slate-800/50">
                        <Ruler className="text-teal-500 mb-3" size={24} />
                        <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Superficie (m²)</div>
                        <input
                            type="number"
                            value={property.superficie}
                            onChange={(e) => handleUpdateProperty({ superficie: parseInt(e.target.value) || 0 })}
                            className="w-full bg-transparent font-medium border-b border-transparent focus:border-teal-500 outline-none transition-all"
                        />
                    </div>

                    <div className="p-6 border border-slate-100 dark:border-slate-800 rounded-sm bg-slate-50/50 dark:bg-slate-800/50">
                        <Calendar className="text-teal-500 mb-3" size={24} />
                        <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Año Construcción</div>
                        <input
                            type="number"
                            value={property.anoConstruccion || ''}
                            onChange={(e) => handleUpdateProperty({ anoConstruccion: parseInt(e.target.value) || undefined })}
                            placeholder="Ej: 2005"
                            className="w-full bg-transparent font-medium border-b border-transparent focus:border-teal-500 outline-none transition-all"
                        />
                    </div>

                    <div className="p-6 border border-slate-100 dark:border-slate-800 rounded-sm bg-slate-50/50 dark:bg-slate-800/50">
                        <Home className="text-teal-500 mb-3" size={24} />
                        <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Uso Principal</div>
                        <select
                            value={property.uso}
                            onChange={(e) => handleUpdateProperty({ uso: e.target.value })}
                            className="w-full bg-transparent font-medium border-b border-transparent focus:border-teal-500 outline-none transition-all cursor-pointer"
                        >
                            <option value="Residencial">Residencial</option>
                            <option value="Comercial">Comercial</option>
                            <option value="Oficinas">Oficinas</option>
                            <option value="Industrial">Industrial</option>
                            <option value="Otros">Otros</option>
                        </select>
                    </div>

                    {property.valorCatastral !== undefined && (
                        <div className="p-6 border border-slate-100 dark:border-slate-800 rounded-sm bg-slate-50/50 dark:bg-slate-800/50">
                            <Euro className="text-teal-500 mb-3" size={24} />
                            <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Valor Catastral</div>
                            <div className="font-medium text-slate-400">{property.valorCatastral.toLocaleString('es-ES')}€</div>
                            <div className="text-[10px] text-slate-400 mt-1 italic">(Informativo Catastro)</div>
                        </div>
                    )}
                </div>

                {/* Extra Details Grid */}
                <div className="mb-12">
                    <h3 className="text-xl font-serif mb-6 flex items-center gap-2">
                        <span className="w-8 h-1 bg-teal-500 rounded-full"></span>
                        Detalles de la vivienda
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-sm flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-teal-500">
                                <Bed size={20} />
                            </div>
                            <div className="flex-1">
                                <div className="text-[10px] uppercase tracking-wider text-slate-400">Habitaciones</div>
                                <input
                                    type="number"
                                    value={property.habitaciones || 0}
                                    onChange={(e) => handleUpdateProperty({ habitaciones: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-transparent font-bold text-lg outline-none focus:text-teal-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-sm flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-teal-500">
                                <Bath size={20} />
                            </div>
                            <div className="flex-1">
                                <div className="text-[10px] uppercase tracking-wider text-slate-400">Baños</div>
                                <input
                                    type="number"
                                    value={property.banos || 0}
                                    onChange={(e) => handleUpdateProperty({ banos: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-transparent font-bold text-lg outline-none focus:text-teal-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-sm flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-teal-500">
                                <Droplets size={20} />
                            </div>
                            <div className="flex-1">
                                <div className="text-[10px] uppercase tracking-wider text-slate-400">Aseos</div>
                                <input
                                    type="number"
                                    value={property.aseos || 0}
                                    onChange={(e) => handleUpdateProperty({ aseos: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-transparent font-bold text-lg outline-none focus:text-teal-500 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-sm">
                                <div className="flex items-center gap-3">
                                    <Sun size={20} className="text-teal-500" />
                                    <span className="text-sm font-medium">¿Tiene Terraza?</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={property.terraza || false}
                                    onChange={(e) => handleUpdateProperty({ terraza: e.target.checked })}
                                    className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                />
                            </div>
                            {property.terraza && (
                                <div className="pl-12 flex items-center gap-4 animate-in fade-in slide-in-from-left-2 duration-200">
                                    <div className="text-xs text-slate-400">Superficie Ter. (m²)</div>
                                    <input
                                        type="number"
                                        value={property.terrazaM2 || 0}
                                        onChange={(e) => handleUpdateProperty({ terrazaM2: parseInt(e.target.value) || 0 })}
                                        className="w-20 px-2 py-1 border-b border-slate-200 focus:border-teal-500 outline-none transition-all font-bold"
                                    />
                                </div>
                            )}

                            <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-sm">
                                <div className="flex items-center gap-3">
                                    <Hammer size={20} className="text-teal-500" />
                                    <span className="text-sm font-medium">¿Está Reformado?</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={property.reformado || false}
                                    onChange={(e) => handleUpdateProperty({ reformado: e.target.checked })}
                                    className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                />
                            </div>
                            {property.reformado && (
                                <div className="pl-12 flex items-center gap-4 animate-in fade-in slide-in-from-left-2 duration-200">
                                    <div className="text-xs text-slate-400">Año de Reforma</div>
                                    <input
                                        type="number"
                                        value={property.anoReforma || ''}
                                        onChange={(e) => handleUpdateProperty({ anoReforma: parseInt(e.target.value) || undefined })}
                                        className="w-20 px-2 py-1 border-b border-slate-200 focus:border-teal-500 outline-none transition-all font-bold"
                                        placeholder="2020"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-sm">
                                <div className="flex items-center gap-3">
                                    <ArrowUpSquare size={20} className="text-teal-500" />
                                    <span className="text-sm font-medium">Tiene Ascensor</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={property.ascensor || false}
                                    onChange={(e) => handleUpdateProperty({ ascensor: e.target.checked })}
                                    className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-sm">
                                <div className="flex items-center gap-3">
                                    <Waves size={20} className="text-teal-500" />
                                    <span className="text-sm font-medium">Tiene Piscina</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={property.piscina || false}
                                    onChange={(e) => handleUpdateProperty({ piscina: e.target.checked })}
                                    className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-sm">
                                <div className="flex items-center gap-3">
                                    <Palmtree size={20} className="text-teal-500" />
                                    <span className="text-sm font-medium">Tiene Jardín</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={property.jardin || false}
                                    onChange={(e) => handleUpdateProperty({ jardin: e.target.checked })}
                                    className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Market Estimation */}
                {estimation && (
                    <div className="bg-gradient-to-br from-lime-50 to-teal-50 dark:from-lime-950/20 dark:to-teal-950/20 p-8 rounded-lg mb-8">
                        <h3 className="text-2xl font-serif mb-4 text-center">Estimación de Mercado</h3>
                        <div className="text-center">
                            <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-lime-500 to-teal-500 mb-2">
                                {estimation.min.toLocaleString('es-ES')}€ - {estimation.max.toLocaleString('es-ES')}€
                            </div>
                            <p className="text-sm text-slate-500">
                                *Estimación basada en valor catastral. Para una tasación precisa, contacta con nuestro equipo.
                            </p>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => setStep(3)}
                    className="w-full py-4 bg-gradient-to-r from-lime-400 to-teal-500 text-[#0a192f] font-bold text-sm uppercase tracking-widest rounded-sm hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                    Solicitar Tasación Profesional
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
}
