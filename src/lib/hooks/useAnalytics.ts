/**
 * Hook para capturar eventos de analytics
 * Registra: vistas de propiedades, búsquedas, vistas de página
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Session tracking
const getSessionId = () => {
    if (typeof window === 'undefined') return '';
    
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
};

interface TrackEventOptions {
    codOfer?: number;
    source?: string;
    conversionType?: string;
}

export function useAnalytics() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [locale, setLocale] = useState('es');

    // Extract locale from pathname
    useEffect(() => {
        const pathParts = pathname.split('/');
        if (pathParts[1] && ['es', 'en', 'fr', 'de'].includes(pathParts[1])) {
            setLocale(pathParts[1]);
        }
    }, [pathname]);

    // Track page view
    useEffect(() => {
        const trackPageView = async () => {
            try {
                await supabase.from('analytics_page_views').insert({
                    page_path: pathname,
                    locale,
                    session_id: getSessionId(),
                    visitor_ip: 'client', // Cliente no puede obtener IP real
                });
            } catch (error) {
                console.warn('[Analytics] Error tracking page view:', error);
            }
        };

        trackPageView();
    }, [pathname, locale]);

    // Track property view
    const trackPropertyView = useCallback(async (codOfer: number) => {
        try {
            await supabase.from('analytics_property_views').insert({
                cod_ofer: codOfer,
                locale,
                session_id: getSessionId(),
                user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
                referer: typeof document !== 'undefined' ? document.referrer : '',
            });
        } catch (error) {
            console.warn('[Analytics] Error tracking property view:', error);
        }
    }, [locale]);

    // Track search
    const trackSearch = useCallback(async (query: string, resultsCount: number) => {
        try {
            await supabase.from('analytics_searches').insert({
                search_query: query,
                locale,
                results_count: resultsCount,
                session_id: getSessionId(),
            });
        } catch (error) {
            console.warn('[Analytics] Error tracking search:', error);
        }
    }, [locale]);

    // Track lead/conversion
    const trackConversion = useCallback(async (options: TrackEventOptions) => {
        try {
            await supabase.from('analytics_leads').insert({
                cod_ofer: options.codOfer,
                source: options.source || 'direct',
                locale,
                conversion_type: options.conversionType || 'lead',
            });
        } catch (error) {
            console.warn('[Analytics] Error tracking conversion:', error);
        }
    }, [locale]);

    return {
        trackPropertyView,
        trackSearch,
        trackConversion,
    };
}
