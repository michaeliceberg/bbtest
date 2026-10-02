import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import db from "@/db/drizzle"
import { eq } from "drizzle-orm"
import { userProgress } from "@/db/schema"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/")
  }

  // Проверяем админ статус
  const user = await db
    .select()
    .from(userProgress)
    .where(eq(userProgress.userId, session.user.id))
    .limit(1)

  if (!user[0]?.isAdmin) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-[#0F1419] flex flex-col">
      {/* Top Navbar — только воронка (просьба пользователя 2026-10-02; остальные
          разделы админки доступны по прямой ссылке /admin/challenges, /admin/t-challenges). */}
      <nav className="bg-[#161F23] border-b border-[#3A464E] px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Админка</h1>
        <a href="/trainer" className="px-3 py-2 rounded text-[#9AA7B0] text-sm hover:bg-[#232F34] transition">
          ← В приложение
        </a>
      </nav>

      {/* Main content */}
      <main className="flex-1 p-4 sm:p-6 overflow-auto">
        {children}
      </main>
    </div>
  )
}
