// lib/link-finish.ts
//
// Завершающий шаг привязки способа входа. Пользователь уже вошёл ОБЫЧНЫМ
// способом через существующий signIn(provider, ...) — эта функция сверяет
// результат с тем, кто инициировал привязку (через link-state-store), и
// либо тихо переприкрепляет identity к исходному аккаунту (если новый вход
// оказался "пустым", без прогресса), либо сообщает о конфликте и
// откатывает сессию обратно на исходный аккаунт (ничего не сливаем молча).

import { encode } from "next-auth/jwt";
import db from "@/db/drizzle";
import { userProgress, identities } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUserIdForLinkState } from "./link-state-store";
import { auth } from "./auth";

export type FinishLinkResult =
    | { status: "already-linked" }
    | { status: "linked"; newToken: string }
    | { status: "conflict"; newToken: string }
    | { status: "expired" }
    | { status: "not-authenticated" };

export function sessionCookieName(): string {
    return process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token";
}

export async function finishLink(state: string | null): Promise<FinishLinkResult> {
    if (!state) return { status: "expired" };

    const targetUserId = getUserIdForLinkState(state);
    if (!targetUserId) return { status: "expired" };

    const session = await auth();
    const justSignedInUserId = session?.user?.id;
    if (!justSignedInUserId) return { status: "not-authenticated" };

    if (justSignedInUserId === targetUserId) {
        return { status: "already-linked" };
    }

    const buildRevertToken = () =>
        encode({
            token: {
                id: targetUserId,
                sub: targetUserId,
                name: session!.user.name,
                picture: session!.user.image,
            },
            secret: process.env.NEXTAUTH_SECRET!,
        });

    const existingProgress = await db.query.userProgress.findFirst({
        where: eq(userProgress.userId, justSignedInUserId),
    });

    if (existingProgress) {
        // У только что вошедшего способа уже есть свой реальный аккаунт —
        // не сливаем данные молча, возвращаем сессию как было.
        return { status: "conflict", newToken: await buildRevertToken() };
    }

    // Пусто — безопасно переприкрепить этот способ входа к целевому аккаунту.
    await db.update(identities).set({ userId: targetUserId }).where(eq(identities.userId, justSignedInUserId));

    return { status: "linked", newToken: await buildRevertToken() };
}
