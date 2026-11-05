// Проба «Линейки ЕГЭ» (components/ege-ruler.tsx) на настоящих данных вошедшего ученика:
// слева — линейка, раскрытая целиком, справа у края экрана — свёрнутая (нажми — выедет).
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getUserProgress } from '@/db/queries'
import { hasProFor } from '@/lib/pro'
import { getEgeRulerData } from '@/lib/egeRuler'
import { getSetBarData } from '@/lib/setBar'
import { EgeRuler } from '@/components/ege-ruler'

export const dynamic = 'force-dynamic'

export default async function TestRulerPage({ searchParams }: { searchParams: { pro?: string } }) {
    const session = await auth()
    if (!session?.user?.id) redirect('/')
    const up = await getUserProgress()
    const hasPro = searchParams.pro === '0' ? false : hasProFor(up)
    const set = await getSetBarData(session.user.id, 'ЕГЭ Математика').catch(() => null)
    const data = await getEgeRulerData(session.user.id, { hasPro, setTaskNum: set?.taskNum ?? null })
    return (
        <main className="min-h-screen bg-[#161F23] px-4 py-6 text-[#F2F7FB]">
            <h1 className="mb-1 text-xl font-black">Линейка ЕГЭ — проба</h1>
            <p className="mb-4 max-w-md text-sm text-[#9AA7B0]">
                Справа у края — свёрнутая линейка (нажми). Ниже — она же раскрытая. <a className="underline" href="?pro=0">Без PRO</a> · <a className="underline" href="?">как есть</a>
            </p>
            <div className="flex justify-start"><EgeRuler data={data} inline /></div>
            <EgeRuler data={data} />
        </main>
    )
}
