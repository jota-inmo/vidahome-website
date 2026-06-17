/**
 * Hook para capturar eventos de analytics
 * Registra: vistas de propiedades, búsquedas, vistas de página
 * Incluye: UTM tracking, detección de fuente de tráfico
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Analytics events are posted to a server route that resolves the tenant from the
// request Host and stamps `tenant_id` with the resolved tenant (the browser cannot
// resolve the tenant nor mint the anon claim — SUPABASE_JWT_SECRET is server-only).
// Fire-and-forget: analytics must never block or surface errors to the visitor.
const ANALYTICS_ENDPOINT = '/api/analytics/track';

function sendEvent(payload: Record<string, unknown>) {
    try {
        void fetch(ANALYTICS_ENDPOINT, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true,
        }).catch((error) => {
            console.warn('[Analytics] Error sending event:', error);
        });
    } catch (error) {
        console.warn('[Analytics] Error sending event:', error);
    }
}

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
    codOfer?: number | null;
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
        if (pathParts[1] && ['es', 'en', 'fr', 'de', 'it', 'pl'].includes(pathParts[1])) {
            setLocale(pathParts[1]);
        }
    }, [pathname]);

    // Track page view
    useEffect(() => {
        sendEvent({
            type: 'page_view',
            page_path: pathname,
            locale,
            session_id: getSessionId(),
        });
    }, [pathname, locale]);

    // Track property view. cod_ofer may be null for CRM-published rows that
    // haven't been synced to Inmovilla yet — in that case skip the insert
    // since analytics_property_views.cod_ofer has a NOT NULL constraint.
    const trackPropertyView = useCallback(async (codOfer: number | null | undefined) => {
        if (codOfer == null) return;
        const utm = getUTMParams();
        const referrer = typeof document !== 'undefined' ? document.referrer : '';
        const trafficSource = utm.utm_source || detectTrafficSource(referrer);

        sendEvent({
            type: 'property_view',
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
    }, [locale]);

    // Track search
    const trackSearch = useCallback(async (query: string, resultsCount: number) => {
        sendEvent({
            type: 'search',
            search_query: query,
            locale,
            results_count: resultsCount,
            session_id: getSessionId(),
        });
    }, [locale]);

    // Track lead/conversion. Skip when codOfer is missing (CRM-only rows
    // haven't been synced to Inmovilla yet) since analytics_leads.cod_ofer
    // has a NOT NULL constraint.
    const trackConversion = useCallback(async (options: TrackEventOptions) => {
        if (options.codOfer == null) return;
        const utm = getUTMParams();
        const referrer = typeof document !== 'undefined' ? document.referrer : '';
        const trafficSource = utm.utm_source || detectTrafficSource(referrer);

        sendEvent({
            type: 'lead',
            cod_ofer: options.codOfer,
            source: options.source || trafficSource || 'direct',
            locale,
            conversion_type: options.conversionType || 'lead',
        });
    }, [locale]);

    return {
        trackPropertyView,
        trackSearch,
        trackConversion,
    };
}
