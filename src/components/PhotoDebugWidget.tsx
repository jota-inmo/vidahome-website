'use client';

import React, { useEffect } from 'react';
import { PropertyListEntry } from '@/types/inmovilla';

export function PhotoDebugWidget({ properties }: { properties: PropertyListEntry[] }) {
    useEffect(() => {
        console.log('📦 PhotoDebugWidget received properties:', {
            count: properties.length,
            first: properties[0] ? {
                cod_ofer: properties[0].cod_ofer,
                ref: properties[0].ref,
                mainImage: properties[0].mainImage,
                habitaciones: properties[0].habitaciones,
            } : null
        });
    }, [properties]);
    
    return null; // This component is invisible but logs data
}
