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
      {/* Top Navbar */}
      <nav className="bg-[#161F23] border-b border-[#3A464E] px-6 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Админка</h1>
        <div className="flex gap-4">
          <a
            href="/admin"
            className="px-4 py-2 rounded bg-[#5183A4] text-white text-sm hover:bg-[#4A7A97] transition"
          >
            Главная
          </a>
          <a
            href="/admin/challenges"
            className="px-4 py-2 rounded text-[#9AA7B0] text-sm hover:bg-[#232F34] transition"
          >
            📚 Задачи (Courses)
          </a>
          <a
            href="/admin/t-challenges"
            className="px-4 py-2 rounded text-[#9AA7B0] text-sm hover:bg-[#232F34] transition"
          >
            🎓 Тренажеры (Trainers)
          </a>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  )
}
