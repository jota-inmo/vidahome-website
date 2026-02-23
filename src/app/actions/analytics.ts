/**
 * Server actions para obtener datos de analytics
 * Usar supabaseAdmin para acceso a datos de analytics
 */

'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

export interface DashboardMetrics {
    totalLeads: number;
    totalPropertyViews: number;
    totalValuations: number;
    topProperties: Array<{
        cod_ofer: number;
        views: number;
        leads: number;
        tipo?: string;
        municipio?: string;
    }>;
    leadsBy: {
        date: Array<{ date: string; count: number }>;
        locale: Array<{ locale: string; count: number }>;
        source: Array<{ source: string; count: number }>;
    };
    topSearches: Array<{
        query: string;
        count: number;
    }>;
    conversion: {
        totalViews: number;
        totalLeads: number;
        conversionRate: number; // percentage
    };
}

export async function getAnalyticsDashboard(
    days: number = 30
): Promise<{ success: boolean; data?: DashboardMetrics; error?: string }> {
    try {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);

        // 1. Total leads
        const { data: leadsData, error: leadsError } = await supabaseAdmin
            .from('analytics_leads')
            .select('id')
            .gte('created_at', fromDate.toISOString());

        if (leadsError) throw leadsError;

        const totalLeads = leadsData?.length || 0;

        // 2. Total property views
        const { data: viewsData, error: viewsError } = await supabaseAdmin
            .from('analytics_property_views')
            .select('id')
            .gte('viewed_at', fromDate.toISOString());

        if (viewsError) throw viewsError;

        const totalPropertyViews = viewsData?.length || 0;

        // 3. Total valuations
        const { data: valuationsData, error: valuationsError } = await supabaseAdmin
            .from('analytics_valuations')
            .select('id')
            .gte('created_at', fromDate.toISOString());

        if (valuationsError) throw valuationsError;

        const totalValuations = valuationsData?.length || 0;

        // 4. Top properties (por vistas y leads)
        const { data: propertyViews, error: propertyViewsError } = await supabaseAdmin
            .from('analytics_property_views')
            .select('cod_ofer')
            .gte('viewed_at', fromDate.toISOString());

        if (propertyViewsError) throw propertyViewsError;

        const { data: propertyLeads, error: propertyLeadsError } = await supabaseAdmin
            .from('analytics_leads')
            .select('cod_ofer')
            .gte('created_at', fromDate.toISOString());

        if (propertyLeadsError) throw propertyLeadsError;

        // Group property views and leads
        const viewsByProperty = new Map<number, { views: number; leads: number }>();

        propertyViews?.forEach(({ cod_ofer }) => {
            if (cod_ofer) {
                const current = viewsByProperty.get(cod_ofer) || { views: 0, leads: 0 };
                current.views += 1;
                viewsByProperty.set(cod_ofer, current);
            }
        });

        propertyLeads?.forEach(({ cod_ofer }) => {
            if (cod_ofer) {
                const current = viewsByProperty.get(cod_ofer) || { views: 0, leads: 0 };
                current.leads += 1;
                viewsByProperty.set(cod_ofer, current);
            }
        });

        // Sort and get top 10
        const topProperties = Array.from(viewsByProperty.entries())
            .map(([cod_ofer, { views, leads }]) => ({
                cod_ofer,
                views,
                leads,
            }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 10);

        // 5. Leads by date (últimos 30 días agrupado por día)
        const { data: leadsByDate, error: leadsByDateError } = await supabaseAdmin
            .from('analytics_leads')
            .select('created_at')
            .gte('created_at', fromDate.toISOString())
            .order('created_at', { ascending: true });

        if (leadsByDateError) throw leadsByDateError;

        const leadsDateMap = new Map<string, number>();
        leadsByDate?.forEach(({ created_at }) => {
            const date = new Date(created_at).toISOString().split('T')[0];
            leadsDateMap.set(date, (leadsDateMap.get(date) || 0) + 1);
        });

        const leadsDateArray = Array.from(leadsDateMap.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // 6. Leads by locale
        const { data: leadsByLocale, error: leadsByLocaleError } = await supabaseAdmin
            .from('analytics_leads')
            .select('locale')
            .gte('created_at', fromDate.toISOString());

        if (leadsByLocaleError) throw leadsByLocaleError;

        const localeMap = new Map<string, number>();
        leadsByLocale?.forEach(({ locale }) => {
            localeMap.set(locale || 'es', (localeMap.get(locale || 'es') || 0) + 1);
        });

        const leadsLocaleArray = Array.from(localeMap.entries())
            .map(([locale, count]) => ({ locale, count }))
            .sort((a, b) => b.count - a.count);

        // 7. Leads by source
        const { data: leadsBySource, error: leadsBySourceError } = await supabaseAdmin
            .from('analytics_leads')
            .select('source')
            .gte('created_at', fromDate.toISOString());

        if (leadsBySourceError) throw leadsBySourceError;

        const sourceMap = new Map<string, number>();
        leadsBySource?.forEach(({ source }) => {
            sourceMap.set(source || 'direct', (sourceMap.get(source || 'direct') || 0) + 1);
        });

        const leadsSourceArray = Array.from(sourceMap.entries())
            .map(([source, count]) => ({ source, count }))
            .sort((a, b) => b.count - a.count);

        // 8. Top searches
        const { data: allSearches, error: searchesError } = await supabaseAdmin
            .from('analytics_searches')
            .select('search_query')
            .gte('searched_at', fromDate.toISOString());

        if (searchesError) throw searchesError;

        const searchMap = new Map<string, number>();
        allSearches?.forEach(({ search_query }) => {
            if (search_query) {
                searchMap.set(search_query, (searchMap.get(search_query) || 0) + 1);
            }
        });

        const topSearches = Array.from(searchMap.entries())
            .map(([query, count]) => ({ query, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // 9. Conversion rate
        const conversionRate = totalPropertyViews > 0
            ? Number(((totalLeads / totalPropertyViews) * 100).toFixed(2))
            : 0;

        const metrics: DashboardMetrics = {
            totalLeads,
            totalPropertyViews,
            totalValuations,
            topProperties,
            leadsBy: {
                date: leadsDateArray,
                locale: leadsLocaleArray,
                source: leadsSourceArray,
            },
            topSearches,
            conversion: {
                totalViews: totalPropertyViews,
                totalLeads,
                conversionRate,
            },
        };

        return { success: true, data: metrics };
    } catch (error) {
        console.error('[Analytics] Error fetching dashboard:', error);
        return {
            success: false,
            error: (error as Error).message || 'Error al obtener analytics',
        };
    }
}
