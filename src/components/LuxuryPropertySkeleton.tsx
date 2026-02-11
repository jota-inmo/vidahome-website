import React from 'react';

export const PropertySkeleton = () => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm animate-pulse-soft">
            {/* Aspect ratio box for image */}
            <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-800" />

            <div className="p-8 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="h-8 bg-slate-100 dark:bg-slate-800 w-2/3 rounded" />
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 w-12 rounded" />
                </div>

                <div className="space-y-2">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 w-full rounded" />
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 w-5/6 rounded" />
                </div>

                <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-between">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 w-20 rounded" />
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 w-20 rounded" />
                </div>
            </div>
        </div>
    );
};
