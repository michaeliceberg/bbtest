import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rememberLinkState } from "@/lib/link-state-store";
import crypto from "crypto";

export async function POST() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Не авторизованы" }, { status: 401 });
    }

    const state = crypto.randomBytes(16).toString("hex");
    rememberLinkState(state, session.user.id);

    return NextResponse.json({ state });
}
