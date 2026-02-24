import React from 'react';
import { Metadata } from 'next';
import { SyncPropertiesClient } from '@/components/admin/SyncPropertiesClient';

export const metadata: Metadata = {
  title: 'Sync Properties | Vidahome Admin',
};

export default async function SyncPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 py-12">
      <div className="max-w-2xl mx-auto px-8">
        <h1 className="text-4xl font-serif mb-8 dark:text-white">Sincronizar Propiedades</h1>
        
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-8 mb-8 border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-serif mb-4 dark:text-white">¿Qué hace?</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Sincroniza propiedades nuevas del CRM Inmovilla a la base de datos. 
            Esto es necesario para que aparezcan en el traductor y en toda la plataforma.
          </p>
          
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
            <div>
              <h3 className="font-semibold mb-2 text-slate-900 dark:text-white">Opción 1: Sincronizar una propiedad</h3>
              <p>Si acabas de crear una propiedad nueva en Inmovilla, usa esta opción para sincronizarla inmediatamente.</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 text-slate-900 dark:text-white">Opción 2: Sincronizar todas</h3>
              <p>Sincroniza TODAS las propiedades del CRM. Útil si hay nuevas o si hubo cambios.</p>
            </div>
          </div>
        </div>

        <SyncPropertiesClient />
      </div>
    </div>
  );
}
