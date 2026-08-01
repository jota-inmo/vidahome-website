'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import {
  GOOGLE_PROFILE_URL,
  GOOGLE_REVIEW_COUNT,
  GOOGLE_REVIEWS,
} from '@/data/googleReviews';

// Avance automático pausado: cada tarjeta permanece visible 2-3 pasos, así que
// con 10s por paso una reseña media se puede leer entera sin tocar nada.
const AUTOPLAY_MS = 10000;
const TOTAL = GOOGLE_REVIEWS.length;

/** 1 tarjeta en móvil, 2 en tablet, 3 en escritorio (espejo de las clases basis-*). */
function useSlidesPerView() {
  const [slides, setSlides] = useState(3);
  useEffect(() => {
    const md = window.matchMedia('(min-width: 768px)');
    const lg = window.matchMedia('(min-width: 1024px)');
    const update = () => setSlides(lg.matches ? 3 : md.matches ? 2 : 1);
    update();
    md.addEventListener('change', update);
    lg.addEventListener('change', update);
    return () => {
      md.removeEventListener('change', update);
      lg.removeEventListener('change', update);
    };
  }, []);
  return slides;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

export function GoogleReviewsCarousel() {
  const t = useTranslations('Index');
  const locale = useLocale();
  const slidesPerView = useSlidesPerView();
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const maxIndex = TOTAL - slidesPerView;

  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const id = setInterval(() => {
      setIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, reducedMotion, maxIndex]);

  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
    [locale],
  );

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={t('reviewsTitle')}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <div className="overflow-hidden -mx-3">
        {/* El % de translateX se resuelve contra el ancho del propio track (= contenedor),
            y cada tarjeta ocupa 100/slidesPerView de ese ancho → un paso = una tarjeta. */}
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${(index * 100) / slidesPerView}%)` }}
        >
          {GOOGLE_REVIEWS.map((review, i) => {
            const visible = i >= index && i < index + slidesPerView;
            return (
              <div
                key={review.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} / ${TOTAL}`}
                aria-hidden={!visible}
                className="shrink-0 grow-0 basis-full md:basis-1/2 lg:basis-1/3 px-3"
              >
                <figure className="h-full flex flex-col text-left p-6 md:p-8 border border-slate-100 dark:border-slate-900 shadow-sm bg-white dark:bg-slate-950">
                  <div className="flex items-center gap-1 mb-4" aria-label={`${review.rating}/5`}>
                    {Array.from({ length: review.rating }).map((_, s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" aria-hidden />
                    ))}
                  </div>
                  <blockquote
                    lang={review.lang}
                    className="text-sm text-slate-500 dark:text-slate-400 font-light leading-relaxed line-clamp-6 flex-1"
                  >
                    {review.text}
                  </blockquote>
                  <figcaption className="mt-6">
                    <span className="font-serif text-brand-navy dark:text-white block">{review.author}</span>
                    <span className="text-[10px] tracking-widest uppercase text-slate-400">
                      {monthFormatter.format(new Date(`${review.date}-15`))} · Google
                    </span>
                  </figcaption>
                </figure>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 mt-8">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(i - 1, 0))}
          disabled={index === 0}
          aria-label={t('reviewsPrev')}
          className="p-2 border border-slate-200 dark:border-slate-800 text-brand-navy dark:text-white hover:opacity-60 disabled:opacity-25 transition-all"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden />
        </button>
        <div className="flex items-center gap-2">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${i + 1} / ${maxIndex + 1}`}
              aria-current={i === index}
              className={`h-1.5 transition-all ${
                i === index
                  ? 'w-6 bg-brand-navy dark:bg-white'
                  : 'w-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setIndex((i) => Math.min(i + 1, maxIndex))}
          disabled={index >= maxIndex}
          aria-label={t('reviewsNext')}
          className="p-2 border border-slate-200 dark:border-slate-800 text-brand-navy dark:text-white hover:opacity-60 disabled:opacity-25 transition-all"
        >
          <ChevronRight className="w-4 h-4" aria-hidden />
        </button>
      </div>

      <a
        href={GOOGLE_PROFILE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-8 text-xs tracking-[0.3em] uppercase font-bold text-brand-navy dark:text-white border-b border-brand-navy dark:border-white pb-1 hover:opacity-60 transition-all"
      >
        {t('reviewsLink', { count: GOOGLE_REVIEW_COUNT })}
      </a>
    </div>
  );
}
