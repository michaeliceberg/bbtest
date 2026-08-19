import { NextRequest, NextResponse } from "next/server";
import { finishLink, sessionCookieName } from "@/lib/link-finish";

// Вызывается при возврате из signIn(provider, { callbackUrl }) — вход всегда
// идёт полным редиректом (OAuth и виджеты не умеют иначе).
export async function GET(req: NextRequest) {
    const state = req.nextUrl.searchParams.get("state");
    const result = await finishLink(state);

    // req.url за прокси может указывать на внутренний адрес сервера
    // (например http://localhost:3001) — берём публичный домен из
    // NEXTAUTH_URL, как это уже делает сам next-auth.
    const baseUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin;
    const redirectUrl = new URL("/account", baseUrl);
    redirectUrl.searchParams.set("link", result.status);

    if (result.status === "conflict") {
        redirectUrl.searchParams.set("conflictToken", result.conflictToken);
        redirectUrl.searchParams.set("points", String(result.stats.points));
        redirectUrl.searchParams.set("gems", String(result.stats.gems));
        redirectUrl.searchParams.set("lessonsDone", String(result.stats.lessonsDone));
    }

    const response = NextResponse.redirect(redirectUrl);
    if ("newToken" in result) {
        response.cookies.set(sessionCookieName(), result.newToken, {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
        });
    }
    return response;
}
