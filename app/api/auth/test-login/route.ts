// ⚠️ ТОЛЬКО для localhost разработки!

import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Проверяем что это локалхост
  const host = request.headers.get("host") || ""
  if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
    return NextResponse.json(
      { error: "Test login only available on localhost" },
      { status: 403 }
    )
  }

  // Возвращаем OK - редирект случится в page.tsx
  const response = NextResponse.json({ success: true })

  // Можно установить тестовый cookie если понадобится позже
  // response.cookies.set('test-user', 'test-user-123', { path: '/' })

  return response
}
