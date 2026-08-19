import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getLinkedProviders } from "@/lib/identity";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Не авторизованы" }, { status: 401 });
    }

    const providers = await getLinkedProviders(session.user.id);
    return NextResponse.json({ providers });
}
