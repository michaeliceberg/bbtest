import { NextRequest, NextResponse } from "next/server";
import { finishLink, sessionCookieName } from "@/lib/link-finish";

function withSessionCookie(response: NextResponse, result: Awaited<ReturnType<typeof finishLink>>) {
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

// Вызывается клиентом после "тихого" входа (Telegram/звонок, signIn с redirect:false).
export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    const result = await finishLink(body?.state ?? null);
    return withSessionCookie(NextResponse.json(result), result);
}

// Вызывается при возврате из VK OAuth (там вход возможен только полным редиректом).
export async function GET(req: NextRequest) {
    const state = req.nextUrl.searchParams.get("state");
    const result = await finishLink(state);

    // req.url за прокси может указывать на внутренний адрес сервера
    // (например http://localhost:3001) — берём публичный домен из
    // NEXTAUTH_URL, как это уже делает сам next-auth.
    const baseUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin;
    const redirectUrl = new URL("/account", baseUrl);
    redirectUrl.searchParams.set("link", result.status);

    return withSessionCookie(NextResponse.redirect(redirectUrl), result);
}
