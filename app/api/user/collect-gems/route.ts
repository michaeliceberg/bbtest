// app/api/user/collect-gems/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { collectGems } from '@/lib/mines';

export async function POST() {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const result = await collectGems(session.user.id);
    return NextResponse.json(result);
}