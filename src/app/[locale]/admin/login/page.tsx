'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/app/actions';

export default function AdminLogin() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await loginAction(password);
            if (res.success) {
                router.push('/admin');
                router.refresh();
            } else {
                setError(res.error || 'Error al iniciar sesión');
            }
        } catch (err) {
            setError('Algo salió mal. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a192f] flex items-center justify-center px-8">
            <div className="max-w-md w-full">
                <div className="text-center mb-12">
                    <span className="text-[10px] tracking-[0.5em] uppercase text-white/40 mb-4 block">Acceso Privado</span>
                    <h1 className="text-4xl font-serif text-white">Vidahome <span className="italic opacity-60 text-slate-400">Admin</span></h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl p-10 border border-white/10 rounded-sm">
                    <div className="mb-8">
                        <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-3">Contraseña de Acceso</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-white p-4 focus:outline-none focus:border-white/40 transition-all rounded-sm"
                            placeholder="••••••••"
                            required
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-5 text-[10px] uppercase tracking-[0.3em] font-bold transition-all rounded-sm ${loading ? 'bg-white/20 text-white/40' : 'bg-white text-[#0a192f] hover:bg-opacity-90'
                            }`}
                    >
                        {loading ? 'Verificando...' : 'Entrar al Panel'}
                    </button>
                </form>

                <div className="mt-12 text-center">
                    <button
                        onClick={() => router.push('/')}
                        className="text-[10px] tracking-widest uppercase text-white/30 hover:text-white/60 transition-colors"
                    >
                        Volver a la web
                    </button>
                </div>
            </div>
        </div>
    );
}
