import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { consumeConflict } from "@/lib/link-conflict-store";
import { forceRelinkIdentity, type Provider } from "@/lib/identity";

// Пользователь увидел конфликт (способ уже занят другим аккаунтом с
// прогрессом) и осознанно решил всё равно забрать его себе.
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Не авторизованы" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const conflictToken = body?.conflictToken;
    if (!conflictToken) {
        return NextResponse.json({ error: "Нет conflictToken" }, { status: 400 });
    }

    const entry = consumeConflict(conflictToken);
    if (!entry || entry.targetUserId !== session.user.id) {
        return NextResponse.json({ error: "Запрос устарел или недействителен, попробуйте заново" }, { status: 400 });
    }

    await forceRelinkIdentity(entry.provider as Provider, entry.providerAccountId, entry.targetUserId);

    return NextResponse.json({ status: "linked" });
}
