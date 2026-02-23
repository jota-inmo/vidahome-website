import { Link } from '@/i18n/routing';
import { getCompanySettingsAction } from '@/app/actions/settings';
import { getTranslations, getLocale } from 'next-intl/server';
import { translateSchedule } from '@/lib/utils/schedule-translator';

export async function Footer() {
    const settings = await getCompanySettingsAction();
    const t = await getTranslations('Footer');
    const locale = await getLocale();

    return (
        <footer className="py-24 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 px-8">
            <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
                <div>
                    <h4 className="font-serif text-xl mb-6">{t('sede')}</h4>
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
                    <h4 className="font-serif text-xl mb-6">{t('contacto')}</h4>
                    <div className="flex flex-col gap-2">
                        <a href={`tel:${settings.phone.replace(/\s+/g, '')}`} className="text-sm text-slate-500 leading-relaxed font-light hover:text-[#0a192f] dark:hover:text-white transition-all">
                            {t('call')}: {settings.phone}
                        </a>
                        <a href={`mailto:${settings.email}`} className="text-sm text-slate-500 leading-relaxed font-light hover:text-[#0a192f] dark:hover:text-white transition-all">
                            Email: {settings.email}
                        </a>
                    </div>
                </div>
                <div>
                    <h4 className="font-serif text-xl mb-6">{t('horario')}</h4>
                    <div className="text-sm text-slate-500 leading-relaxed font-light">
                        <p>{translateSchedule(settings.hours_week, locale)}</p>
                        <p>{translateSchedule(settings.hours_sat, locale)}</p>
                        <p className="mt-2 italic opacity-60">{t('outside')}</p>
                    </div>
                </div>
                <div>
                    <h4 className="font-serif text-xl mb-6">{t('legal')}</h4>
                    <div className="flex flex-col gap-2">
                        <Link href="/legal/aviso-legal" className="text-sm text-slate-500 leading-relaxed font-light hover:text-[#0a192f] dark:hover:text-white transition-all">
                            {t('aviso')}
                        </Link>
                        <Link href="/legal/privacidad" className="text-sm text-slate-500 leading-relaxed font-light hover:text-[#0a192f] dark:hover:text-white transition-all">
                            {t('privacidad')}
                        </Link>
                        <Link href="/legal/cookies" className="text-sm text-slate-500 leading-relaxed font-light hover:text-[#0a192f] dark:hover:text-white transition-all">
                            {t('cookies')}
                        </Link>
                    </div>
                </div>
            </div>
            <div className="max-w-[1600px] mx-auto mt-20 pt-8 border-t border-slate-100 dark:border-slate-800 text-center flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-[10px] tracking-[0.3em] uppercase text-slate-400">
                    {t('rights', { year: new Date().getFullYear() })}
                </p>
                <div className="flex gap-6">
                    <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="text-[10px] tracking-[0.2em] uppercase text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">Instagram</a>
                </div>
            </div>
        </footer>
    );
}
