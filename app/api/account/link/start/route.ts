import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rememberLinkState } from "@/lib/link-state-store";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Не авторизованы" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const provider = body?.provider;
    if (!provider) {
        return NextResponse.json({ error: "Не указан provider" }, { status: 400 });
    }

    const state = crypto.randomBytes(16).toString("hex");
    rememberLinkState(state, session.user.id, provider);

    return NextResponse.json({ state });
}
