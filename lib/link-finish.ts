// lib/link-finish.ts
//
// Завершающий шаг привязки способа входа. Пользователь уже вошёл ОБЫЧНЫМ
// способом через существующий signIn(provider, ...) — эта функция сверяет
// результат с тем, кто инициировал привязку (через link-state-store), и
// либо тихо переприкрепляет identity к исходному аккаунту (если новый вход
// оказался "пустым", без прогресса), либо откатывает сессию обратно и
// предлагает пользователю осознанно подтвердить перепривязку (см.
// lib/link-conflict-store.ts и /api/account/link/force).

import { encode } from "next-auth/jwt";
import db from "@/db/drizzle";
import { userProgress, identities, challengeProgress } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { consumeLinkState } from "./link-state-store";
import { rememberConflict } from "./link-conflict-store";
import { auth } from "./auth";

export type ConflictStats = {
    points: number;
    gems: number;
    lessonsDone: number;
};

export type FinishLinkResult =
    | { status: "already-linked" }
    | { status: "linked"; newToken: string }
    | { status: "conflict"; newToken: string; conflictToken: string; stats: ConflictStats }
    | { status: "expired" }
    | { status: "not-authenticated" };

export function sessionCookieName(): string {
    return process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token";
}

export async function finishLink(state: string | null): Promise<FinishLinkResult> {
    if (!state) return { status: "expired" };

    const linkState = consumeLinkState(state);
    if (!linkState) return { status: "expired" };
    const { userId: targetUserId, provider } = linkState;

    const session = await auth();
    const justSignedInUserId = session?.user?.id;
    if (!justSignedInUserId) return { status: "not-authenticated" };

    if (justSignedInUserId === targetUserId) {
        return { status: "already-linked" };
    }

    // Имя/аватар для новой сессии берём у ЦЕЛЕВОГО аккаунта (к которому
    // привязываем способ входа), а не у только что прошедшего signIn —
    // иначе на аккаунт бы протекло имя/фото из привязываемого провайдера,
    // затирая то, что пользователь сам задал в /account.
    const targetProgress = await db.query.userProgress.findFirst({
        where: eq(userProgress.userId, targetUserId),
    });

    const revertToken = await encode({
        token: {
            id: targetUserId,
            sub: targetUserId,
            name: targetProgress?.userName ?? session!.user.name,
            picture: targetProgress?.userImageSrc ?? session!.user.image,
        },
        secret: process.env.NEXTAUTH_SECRET!,
    });

    const identityRow = await db.query.identities.findFirst({
        where: and(eq(identities.provider, provider), eq(identities.userId, justSignedInUserId)),
    });
    if (!identityRow) {
        // Не должно случаться в норме — просто откатываем сессию как было.
        return { status: "not-authenticated" };
    }

    const existingProgress = await db.query.userProgress.findFirst({
        where: eq(userProgress.userId, justSignedInUserId),
    });

    if (!existingProgress) {
        // Пусто — безопасно переприкрепить этот способ входа к целевому аккаунту.
        await db
            .update(identities)
            .set({ userId: targetUserId })
            .where(and(eq(identities.provider, provider), eq(identities.providerAccountId, identityRow.providerAccountId)));

        return { status: "linked", newToken: revertToken };
    }

    // У только что вошедшего способа уже есть свой реальный аккаунт — не
    // сливаем данные молча. Показываем, что там есть, и даём пользователю
    // осознанно решить, забрать ли этот способ себе (force-релинк).
    const [{ value: lessonsDoneRaw }] = await db
        .select({ value: sql<number>`count(*)` })
        .from(challengeProgress)
        .where(and(eq(challengeProgress.userId, justSignedInUserId), eq(challengeProgress.completed, true)));

    const conflictToken = rememberConflict({
        targetUserId,
        provider,
        providerAccountId: identityRow.providerAccountId,
    });

    return {
        status: "conflict",
        newToken: revertToken,
        conflictToken,
        stats: {
            points: existingProgress.points,
            gems: existingProgress.gems,
            lessonsDone: Number(lessonsDoneRaw) || 0,
        },
    };
}
