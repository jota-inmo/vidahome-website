import React from 'react';

export default function LegalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 py-24 px-8">
            <div className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
                {children}
            </div>
        </div>
    );
}
