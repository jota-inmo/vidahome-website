'use client';

import React from 'react';
import { CheckCircle } from 'lucide-react';

interface StepsIndicatorProps {
    currentStep: number;
    totalSteps?: number;
}

export function StepsIndicator({ currentStep, totalSteps = 6 }: StepsIndicatorProps) {
    const stepLabels = [
        'Operación',
        'Tipo de propiedad',
        'Ubicación',
        'Detalles',
        'Revisión',
        'Contacto'
    ];
    
    const steps = Array.from({ length: totalSteps }, (_, i) => ({
        id: i + 1,
        label: stepLabels[i] || `Paso ${i + 1}`
    }));

    return (
        <div className="max-w-4xl mx-auto px-8 mb-16">
            <div className="flex items-center justify-center gap-4">
                {steps.map((s) => (
                    <div key={s.id} className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${currentStep >= s.id
                            ? 'bg-gradient-to-r from-lime-400 to-teal-500 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                            }`}>
                            {currentStep > s.id ? <CheckCircle size={20} /> : s.id}
                        </div>
                        {s.id < totalSteps && (
                            <div className={`w-16 h-1 mx-2 ${currentStep > s.id ? 'bg-gradient-to-r from-lime-400 to-teal-500' : 'bg-slate-200 dark:bg-slate-800'
                                }`} />
                        )}
                    </div>
                ))}
            </div>
            <div className="flex justify-between mt-4 text-xs uppercase tracking-wider text-slate-500">
                {steps.map((s) => (
                    <span key={s.id}>{s.label}</span>
                ))}
            </div>
        </div>
    );
}
