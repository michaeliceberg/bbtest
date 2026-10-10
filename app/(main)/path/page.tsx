// app/(main)/path/page.tsx
//
// «Мой путь к ЕГЭ» — карта заданий экзамена (станции), копилка первичных баллов,
// прогноз тестового балла и цель. Расчёт — lib/egeMap.ts. Пока только профильная математика.

import { redirect } from 'next/navigation'
import { auth } from '@/lib/server-auth'
import { getUserProgress } from '@/db/queries'
import { getEgeMap } from '@/lib/egeMap'
import { getActiveEgeMove, getUnclaimedMoveCase } from '@/lib/egeMove'
import { EgePath } from '@/components/ege-path'
import { DiagnosticIntro } from '@/components/ege-diagnostic-intro'
import { getLatestDiagnostic } from '@/lib/egeDiagnostic'

export const dynamic = 'force-dynamic'

const PathPage = async () => {
    const session = await auth()
    if (!session?.user?.id) redirect('/')
    const userProgress = await getUserProgress()
    if (!userProgress) redirect('/courses')
    const [map, active, unclaimed, lastDiag, doneDiag] = await Promise.all([
        getEgeMap(session.user.id, 'math_profile'),
        getActiveEgeMove(session.user.id),
        getUnclaimedMoveCase(session.user.id),
        getLatestDiagnostic(session.user.id, 'math_profile'),
        getLatestDiagnostic(session.user.id, 'math_profile', 'done'),
    ])
    // Диагностика: при первом заходе — экран-приглашение; отложили или не закончили — карточка.
    const diagTasks = map.stations.filter((s) => s.courseTarget > 0).length
    if (!lastDiag) return <DiagnosticIntro variant="screen" questionsCount={diagTasks} />
    const diagCard = doneDiag ? null : <DiagnosticIntro variant="card" questionsCount={diagTasks} resume={lastDiag.status === 'active'} />
    return <EgePath map={map} target={userProgress.egeTarget ?? null} activeMoveId={active?.id ?? null} unclaimedCase={unclaimed} diagCard={diagCard} />
}

export default PathPage
