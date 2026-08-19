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

    const redirectUrl = new URL("/account", req.url);
    redirectUrl.searchParams.set("link", result.status);

    return withSessionCookie(NextResponse.redirect(redirectUrl), result);
}
