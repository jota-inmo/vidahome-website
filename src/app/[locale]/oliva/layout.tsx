import type { Metadata } from 'next';
import { buildLocalityMetadata } from '@/lib/utils/locality';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    return buildLocalityMetadata('oliva', locale);
}

export default function OlivaLayout({ children }: { children: React.ReactNode }) {
    return children;
}
