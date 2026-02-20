import Link from 'next/link';
import { getCompanySettingsAction } from '@/app/actions/settings';

export async function Footer() {
    const settings = await getCompanySettingsAction();

    return (
        <footer className="py-24 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 px-8">
            <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
                <div>
                    <h4 className="font-serif text-xl mb-6">Nuestra sede</h4>
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Vidahome ' + settings.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-slate-500 leading-relaxed font-light hover:text-[#0a192f] dark:hover:text-white transition-all block whitespace-pre-line"
                    >
                        {settings.address}
                    </a>
                </div>
                <div>
                    <h4 className="font-serif text-xl mb-6">Contacto directo</h4>
                    <div className="flex flex-col gap-2">
                        <a href={`tel:${settings.phone.replace(/\s+/g, '')}`} className="text-sm text-slate-500 leading-relaxed font-light hover:text-[#0a192f] dark:hover:text-white transition-all">
                            Llamar: {settings.phone}
                        </a>
                        <a href={`mailto:${settings.email}`} className="text-sm text-slate-500 leading-relaxed font-light hover:text-[#0a192f] dark:hover:text-white transition-all">
                            Email: {settings.email}
                        </a>
                    </div>
                </div>
                <div>
                    <h4 className="font-serif text-xl mb-6">Horario de agencia</h4>
                    <div className="text-sm text-slate-500 leading-relaxed font-light">
                        <p>{settings.hours_week}</p>
                        <p>{settings.hours_sat}</p>
                        <p className="mt-2 italic opacity-60">Fuera de horario con cita previa.</p>
                    </div>
                </div>
                <div>
                    <h4 className="font-serif text-xl mb-6">Información legal</h4>
                    <div className="flex flex-col gap-2">
                        <Link href="/legal/aviso-legal" className="text-sm text-slate-500 leading-relaxed font-light hover:text-[#0a192f] dark:hover:text-white transition-all">
                            Aviso Legal
                        </Link>
                        <Link href="/legal/privacidad" className="text-sm text-slate-500 leading-relaxed font-light hover:text-[#0a192f] dark:hover:text-white transition-all">
                            Política de Privacidad
                        </Link>
                        <Link href="/legal/cookies" className="text-sm text-slate-500 leading-relaxed font-light hover:text-[#0a192f] dark:hover:text-white transition-all">
                            Política de Cookies
                        </Link>
                    </div>
                </div>
            </div>
            <div className="max-w-[1600px] mx-auto mt-20 pt-8 border-t border-slate-100 dark:border-slate-800 text-center flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-[10px] tracking-[0.3em] uppercase text-slate-400">
                    © {new Date().getFullYear()} Vidahome Premium Experience — APIVA asociados nº0236
                </p>
                <div className="flex gap-6">
                    <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="text-[10px] tracking-[0.2em] uppercase text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">Instagram</a>
                </div>
            </div>
        </footer>
    );
}
