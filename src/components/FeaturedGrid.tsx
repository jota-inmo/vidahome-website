'use client';

import React, { useEffect, useState } from 'react';
import { PropertyListEntry } from '@/types/inmovilla';
import { LuxuryPropertyCard } from './LuxuryPropertyCard';

export function FeaturedGrid() {
    const [featured, setFeatured] = useState<PropertyListEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const { getFeaturedPropertiesWithDetailsAction } = await import('@/app/actions');
                const res = await getFeaturedPropertiesWithDetailsAction();

                if (res.success && res.data) {
                    setFeatured(res.data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-[16/11] bg-slate-100 dark:bg-slate-900 animate-pulse rounded-sm" />
                ))}
            </div>
        );
    }

    if (featured.length === 0) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-24">
            {featured.map((prop) => (
                <div key={prop.cod_ofer} className="animate-fade-up">
                    <LuxuryPropertyCard property={prop} />
                </div>
            ))}
        </div>
    );
}
