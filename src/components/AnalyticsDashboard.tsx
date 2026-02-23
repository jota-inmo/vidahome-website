'use client';

import React, { useEffect, useState } from 'react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { getAnalyticsDashboard, DashboardMetrics } from '@/app/actions';

const COLORS = ['#0a192f', '#4ade80', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export function AnalyticsDashboard() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);

    useEffect(() => {
        async function loadMetrics() {
            setLoading(true);
            const { success, data } = await getAnalyticsDashboard(days);
            if (success && data) {
                setMetrics(data);
            }
            setLoading(false);
        }

        loadMetrics();
    }, [days]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto mb-4"></div>
                    <p className="text-slate-500">Cargando datos...</p>
                </div>
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-700">Error al cargar datos de analytics</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Period Selector */}
            <div className="flex gap-2 flex-wrap">
                {[7, 30, 90, 365].map(d => (
                    <button
                        key={d}
                        onClick={() => setDays(d)}
                        className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                            days === d
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        {d === 7 ? '7 días' : d === 30 ? '30 días' : d === 90 ? '90 días' : '1 año'}
                    </button>
                ))}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Vistas de Propiedad"
                    value={metrics.totalPropertyViews}
                    icon="👁️"
                    trend={
                        metrics.leadsBy.date.length > 1
                            ? metrics.leadsBy.date[metrics.leadsBy.date.length - 1].count -
                              metrics.leadsBy.date[0].count
                            : 0
                    }
                />
                <KPICard
                    title="Leads Generados"
                    value={metrics.totalLeads}
                    icon="💌"
                    trend={metrics.totalLeads}
                />
                <KPICard
                    title="Tasaciones"
                    value={metrics.totalValuations}
                    icon="📋"
                    trend={metrics.totalValuations}
                />
                <KPICard
                    title="Tasa Conversión"
                    value={`${metrics.conversion.conversionRate}%`}
                    icon="📈"
                    isPercentage
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Leads over time */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-serif font-bold mb-4 text-slate-900">
                        Leads por Día
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={metrics.leadsBy.date}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#0a192f"
                                strokeWidth={2}
                                dot={{ fill: '#0a192f', r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Leads by locale */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-serif font-bold mb-4 text-slate-900">
                        Leads por Idioma
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={metrics.leadsBy.locale}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="locale" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#3b82f6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Leads by source */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-serif font-bold mb-4 text-slate-900">
                        Origen de Leads
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={metrics.leadsBy.source}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry: any) => `${entry.source}: ${entry.count}`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="count"
                            >
                                {metrics.leadsBy.source.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Conversion funnel */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-serif font-bold mb-4 text-slate-900">
                        Embudo de Conversión
                    </h3>
                    <div className="space-y-4">
                        <FunnelStep
                            label="Vistas de Propiedad"
                            value={metrics.conversion.totalViews}
                            percentage={100}
                        />
                        <FunnelStep
                            label="Leads"
                            value={metrics.conversion.totalLeads}
                            percentage={metrics.conversion.conversionRate}
                        />
                    </div>
                </div>
            </div>

            {/* Top Properties */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-serif font-bold mb-4 text-slate-900">
                    Top 10 Propiedades
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b border-slate-200">
                            <tr>
                                <th className="text-left py-3 px-4 font-semibold text-slate-700">
                                    Ref
                                </th>
                                <th className="text-right py-3 px-4 font-semibold text-slate-700">
                                    Vistas
                                </th>
                                <th className="text-right py-3 px-4 font-semibold text-slate-700">
                                    Leads
                                </th>
                                <th className="text-right py-3 px-4 font-semibold text-slate-700">
                                    Conv. Rate
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {metrics.topProperties.map(prop => (
                                <tr key={prop.cod_ofer} className="hover:bg-slate-50">
                                    <td className="py-3 px-4 text-slate-900 font-medium">
                                        {prop.cod_ofer}
                                    </td>
                                    <td className="py-3 px-4 text-right text-slate-700">
                                        {prop.views}
                                    </td>
                                    <td className="py-3 px-4 text-right text-slate-700">
                                        {prop.leads}
                                    </td>
                                    <td className="py-3 px-4 text-right text-slate-700">
                                        {prop.views > 0
                                            ? Number(((prop.leads / prop.views) * 100).toFixed(1))
                                            : 0}
                                        %
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Top Searches */}
            {metrics.topSearches.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-serif font-bold mb-4 text-slate-900">
                        Top Búsquedas
                    </h3>
                    <div className="space-y-2">
                        {metrics.topSearches.map((search, idx) => (
                            <div
                                key={idx}
                                className="flex justify-between items-center p-3 border-b border-slate-100 last:border-0"
                            >
                                <span className="text-slate-700">{search.query}</span>
                                <span className="bg-slate-100 text-slate-900 px-3 py-1 rounded-full text-sm font-medium">
                                    {search.count}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

interface KPICardProps {
    title: string;
    value: string | number;
    icon: string;
    trend?: number;
    isPercentage?: boolean;
}

function KPICard({ title, value, icon, trend, isPercentage }: KPICardProps) {
    const trendColor = trend && trend > 0 ? 'text-green-600' : trend && trend < 0 ? 'text-red-600' : '';

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <p className="text-sm text-slate-600 font-medium">{title}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
                </div>
                <span className="text-3xl">{icon}</span>
            </div>
            {trend !== undefined && !isPercentage && (
                <div className={`text-sm font-medium ${trendColor}`}>
                    {trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️'} {Math.abs(trend)} últimos días
                </div>
            )}
        </div>
    );
}

function FunnelStep({ label, value, percentage }: { label: string; value: number; percentage: number }) {
    return (
        <div>
            <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">{label}</span>
                <span className="text-sm font-bold text-slate-900">{percentage.toFixed(1)}%</span>
            </div>
            <div className="bg-slate-200 rounded-full h-8 overflow-hidden">
                <div
                    className="bg-gradient-to-r from-slate-900 to-slate-700 h-full flex items-center justify-end pr-3 transition-all"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                >
                    <span className="text-xs font-bold text-white">{value}</span>
                </div>
            </div>
        </div>
    );
}
