import React from 'react';

/**
 * Placeholder that mirrors the real LuxuryPropertyCard's structure and
 * dimensions (16/11 image, p-8 body with title, specs row, price, a 3-line
 * description and a footer) so swapping the skeleton for the loaded card
 * causes no layout shift.
 */
export const PropertySkeleton = () => {
    return (
        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-sm overflow-hidden flex flex-col h-full animate-pulse-soft">
            {/* Image — same aspect ratio as the card */}
            <div className="aspect-[16/11] bg-slate-100 dark:bg-slate-900" />

            <div className="p-8 flex flex-col flex-grow">
                {/* Title */}
                <div className="h-7 bg-slate-100 dark:bg-slate-900 w-2/3 rounded mb-4" />

                {/* Specs row (beds · baths · m²) */}
                <div className="flex gap-8 mb-6">
                    <div className="h-5 w-10 bg-slate-100 dark:bg-slate-900 rounded" />
                    <div className="h-5 w-10 bg-slate-100 dark:bg-slate-900 rounded" />
                    <div className="h-5 w-12 bg-slate-100 dark:bg-slate-900 rounded" />
                </div>

                {/* Price */}
                <div className="h-7 bg-slate-100 dark:bg-slate-900 w-1/3 rounded mb-6" />

                {/* Description — three lines */}
                <div className="space-y-2 mb-8 flex-grow">
                    <div className="h-4 bg-slate-100 dark:bg-slate-900 w-full rounded" />
                    <div className="h-4 bg-slate-100 dark:bg-slate-900 w-full rounded" />
                    <div className="h-4 bg-slate-100 dark:bg-slate-900 w-4/5 rounded" />
                </div>

                {/* Footer (ref · explore) */}
                <div className="pt-8 border-t border-slate-100 dark:border-slate-900 flex justify-between">
                    <div className="h-4 w-20 bg-slate-100 dark:bg-slate-900 rounded" />
                    <div className="h-4 w-16 bg-slate-100 dark:bg-slate-900 rounded" />
                </div>
            </div>
        </div>
    );
};
