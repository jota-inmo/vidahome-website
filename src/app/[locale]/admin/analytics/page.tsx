import React from 'react';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';

export const metadata = {
    title: 'Analytics Dashboard',
    description: 'Métricas y estadísticas del sitio',
};

export default function AnalyticsPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-serif font-bold text-slate-900 mb-2">
                        Analytics Dashboard
                    </h1>
                    <p className="text-lg text-slate-600">
                        Monitorea el rendimiento, conversiones y búsquedas de tu plataforma
                    </p>
                </div>

                {/* Dashboard Component */}
                <AnalyticsDashboard />

                {/* Footer Note */}
                <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                    <p className="font-medium mb-2">📊 Nota sobre los datos</p>
                    <p>
                        Los datos se actualizan cada vez que alguien ve una propiedad, realiza una búsqueda o
                        envía un formulario de contacto. Las tasaciones también se cuentan como leads.
                    </p>
                </div>
            </div>
        </div>
    );
}
