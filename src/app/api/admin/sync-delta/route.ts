import { syncDeltaAction } from '@/app/actions/sync-properties';
import { requireAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST() {
    if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await syncDeltaAction();

    if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const parts = [];
    if (result.added)       parts.push(`${result.added} nuevas`);
    if (result.removed)     parts.push(`${result.removed} inactivas`);
    if (result.reactivated) parts.push(`${result.reactivated} reactivadas`);

    return NextResponse.json({
        ...result,
        message: parts.length
            ? `✅ ${parts.join(', ')}. Sin cambios: ${result.unchanged}`
            : `✅ Sin cambios (${result.unchanged} propiedades al día)`,
    });
}
