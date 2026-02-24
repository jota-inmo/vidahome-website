'use client';

import React from 'react';
import { Search as SearchIcon, MapPin, Home } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

interface PropertySearchProps {
    onSearch: (filters: SearchFilters) => void;
    populations: string[];
}

export interface SearchFilters {
    query: string;
    type: 'buy' | 'rent';
    population: string;
}

export const PropertySearch = ({ onSearch, populations }: PropertySearchProps) => {
    const [type, setType] = React.useState<'buy' | 'rent'>('buy');
    const [query, setQuery] = React.useState('');
    const [population, setPopulation] = React.useState('');
    const t = useTranslations('Search');
    const { trackSearch } = useAnalytics();

    const handleTypeChange = (newType: 'buy' | 'rent') => {
        setType(newType);
        onSearch({ type: newType, query, population });
    };

    const handleSearch = () => {
        // Track search with query and filters
        if (query || population) {
            const searchQuery = `${query || ''} ${population || ''}`.trim();
            trackSearch(searchQuery, 0); // resultsCount will be updated after search completes
        }
        onSearch({ type, query, population });
    };

    return (
        <div className="w-full max-w-5xl mx-auto -mt-12 relative z-50">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSearch();
                }}
                className="bg-white dark:bg-slate-900 shadow-2xl rounded-sm border border-slate-100 dark:border-slate-800 p-2 overflow-hidden"
            >
                <div className="flex flex-col md:flex-row items-stretch gap-1">
                    {/* Toggle Comprar/Alquilar */}
                    <div className="flex p-1 bg-slate-50 dark:bg-slate-950 rounded-sm self-start md:self-stretch">
                        <button
                            type="button"
                            onClick={() => handleTypeChange('buy')}
                            className={`px-6 py-3 text-[10px] uppercase tracking-widest font-bold transition-all ${type === 'buy'
                                ? 'bg-[#0a192f] text-white shadow-lg'
                                : 'text-slate-400 hover:text-slate-600'
                                } rounded-sm`}
                        >
                            {t('buy')}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTypeChange('rent')}
                            className={`px-6 py-3 text-[10px] uppercase tracking-widest font-bold transition-all ${type === 'rent'
                                ? 'bg-[#0a192f] text-white shadow-lg'
                                : 'text-slate-400 hover:text-slate-600'
                                } rounded-sm`}
                        >
                            {t('rent')}
                        </button>
                    </div>

                    {/* Buscador de Texto / Referencia */}
                    <div className="flex-grow flex items-center px-6 border-l border-slate-100 dark:border-slate-800 mt-2 md:mt-0">
                        <Home size={18} className="text-slate-300 mr-4 flex-shrink-0" />
                        <input
                            type="text"
                            placeholder={t('placeholder')}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-300 text-sm py-4"
                        />
                    </div>

                    {/* Localización */}
                    <div className="flex-grow flex items-center px-6 border-l border-slate-100 dark:border-slate-800 mt-2 md:mt-0">
                        <MapPin size={18} className="text-slate-300 mr-4 flex-shrink-0" />
                        <select
                            value={population}
                            onChange={(e) => setPopulation(e.target.value)}
                            className="w-full bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white text-sm py-4 cursor-pointer appearance-none"
                        >
                            <option value="">{t('locationDefault')}</option>
                            {populations.map((pop) => (
                                <option key={pop} value={pop}>
                                    {pop}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Botón Buscar */}
                    <button
                        type="submit"
                        className="bg-[#0a192f] text-white px-10 py-4 flex items-center justify-center gap-3 hover:bg-[#112240] transition-colors rounded-sm group mt-2 md:mt-0"
                    >
                        <SearchIcon size={16} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] uppercase tracking-[0.2em] font-bold">{t('button')}</span>
                    </button>
                </div>
            </form>
        </div>
    );
};
