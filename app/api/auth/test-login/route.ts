// ⚠️ ТОЛЬКО для localhost разработки!

import { NextRequest, NextResponse } from "next/server"
import { encode } from "next-auth/jwt"

export async function GET(request: NextRequest) {
  // Проверяем что это локалхост
  const host = request.headers.get("host") || ""
  if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
    return NextResponse.json(
      { error: "Test login only available on localhost" },
      { status: 403 }
    )
  }

  const testUserId = "test-user-123"

  const token = await encode({
    token: {
      id: testUserId,
      sub: testUserId,
      name: "Тестовый ученик",
    },
    secret: process.env.NEXTAUTH_SECRET!,
  })

  const response = NextResponse.json({ success: true })

  response.cookies.set("next-auth.session-token", token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  })

  return response
}
