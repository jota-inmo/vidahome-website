/**
 * Hook para capturar eventos de analytics
 * Registra: vistas de propiedades, búsquedas, vistas de página
 * Incluye: UTM tracking, detección de fuente de tráfico
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

// Extract UTM parameters from URL
const getUTMParams = () => {
    if (typeof window === 'undefined') return {};
    const params = new URLSearchParams(window.location.search);
    return {
        utm_source: params.get('utm_source'),
        utm_medium: params.get('utm_medium'),
        utm_campaign: params.get('utm_campaign'),
    };
};

// Detect traffic source from referrer
const detectTrafficSource = (referrer: string): string => {
    if (!referrer) return 'direct';
    if (referrer.includes('google.')) return 'google_organic';
    if (referrer.includes('facebook.')) return 'facebook';
    if (referrer.includes('instagram.')) return 'instagram';
    if (referrer.includes('linkedin.')) return 'linkedin';
    if (referrer.includes('twitter.') || referrer.includes('x.com')) return 'twitter';
    if (referrer.includes('vidahome.es')) return 'internal';
    return 'referral';
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
        if (pathParts[1] && ['es', 'en', 'fr', 'de', 'pl'].includes(pathParts[1])) {
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
            const utm = getUTMParams();
            const referrer = typeof document !== 'undefined' ? document.referrer : '';
            const trafficSource = utm.utm_source || detectTrafficSource(referrer);

            await supabase.from('analytics_property_views').insert({
                cod_ofer: codOfer,
                locale,
                session_id: getSessionId(),
                user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
                referer: referrer,
                traffic_source: trafficSource,
                utm_source: utm.utm_source,
                utm_medium: utm.utm_medium,
                utm_campaign: utm.utm_campaign,
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
            const utm = getUTMParams();
            const referrer = typeof document !== 'undefined' ? document.referrer : '';
            const trafficSource = utm.utm_source || detectTrafficSource(referrer);

            await supabase.from('analytics_leads').insert({
                cod_ofer: options.codOfer,
                source: options.source || trafficSource || 'direct',
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
