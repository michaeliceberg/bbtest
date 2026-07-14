// app/api/user/pending-gems/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPendingGems } from '@/lib/mines';

export async function GET() {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { totalPending } = await getPendingGems(session.user.id);
    return NextResponse.json({ pendingGems: totalPending });
}