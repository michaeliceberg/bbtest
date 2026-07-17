import Link from "next/link"

export default function AdminPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-white mb-8">Администрирование</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/challenges">
          <div className="bg-[#161F23] border border-[#3A464E] rounded-lg p-6 hover:bg-[#1A252B] cursor-pointer transition">
            <h2 className="text-xl font-bold text-white mb-2">📚 Управление задачами</h2>
            <p className="text-[#9AA7B0]">Добавить/редактировать курсы, уроки и задачи для задачника</p>
          </div>
        </Link>

        <Link href="/admin/t-challenges">
          <div className="bg-[#161F23] border border-[#3A464E] rounded-lg p-6 hover:bg-[#1A252B] cursor-pointer transition">
            <h2 className="text-xl font-bold text-white mb-2">🎓 Управление тренажерами</h2>
            <p className="text-[#9AA7B0]">Добавить/редактировать курсы, юниты и задачи для тренажера</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
