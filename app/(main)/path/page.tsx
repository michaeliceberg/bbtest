// app/(main)/path/page.tsx
//
// «Мой путь к ЕГЭ» — карта заданий экзамена (станции), копилка первичных баллов,
// прогноз тестового балла и цель. Расчёт — lib/egeMap.ts. Пока только профильная математика.

import { redirect } from 'next/navigation'
import { auth } from '@/lib/server-auth'
import { getUserProgress } from '@/db/queries'
import { getEgeMap } from '@/lib/egeMap'
import { getActiveEgeMove } from '@/lib/egeMove'
import { EgePath } from '@/components/ege-path'

export const dynamic = 'force-dynamic'

const PathPage = async () => {
    const session = await auth()
    if (!session?.user?.id) redirect('/')
    const userProgress = await getUserProgress()
    if (!userProgress) redirect('/courses')
    const [map, active] = await Promise.all([getEgeMap(session.user.id, 'math_profile'), getActiveEgeMove(session.user.id)])
    return <EgePath map={map} target={userProgress.egeTarget ?? null} activeMoveId={active?.id ?? null} />
}

export default PathPage
