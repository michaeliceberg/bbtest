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
import { getWeeklySummary, snapshotForecast } from '@/lib/weeklyReport'
import { WeeklyGrowthCard } from '@/components/weekly-growth-card'
import { getOrCreateInvite } from '@/lib/invite'
import { getInviteLink } from '@/lib/referral'

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
    // Новая диагностика «база в уме» — 17 заданий (components/ege-diagnostic-v2.tsx)
    const diagTasks = 17
    if (!lastDiag) return <DiagnosticIntro variant="screen" questionsCount={diagTasks} />
    // Снимок прогноза недели (для «Моя неделя» и воскресного отчёта родителю), потом сводка.
    if (map.primary > 0) await snapshotForecast(session.user.id, map.primary, map.test).catch(() => {})
    const [weekly, invite] = await Promise.all([getWeeklySummary(session.user.id), getOrCreateInvite(session.user.id)])
    const weeklyCard = <WeeklyGrowthCard w={weekly} inviteUrl={getInviteLink(invite?.code, undefined, 'math')} />
    const diagCardOnly = doneDiag ? null : <DiagnosticIntro variant="card" questionsCount={diagTasks} resume={lastDiag.status === 'active'} />
    const diagCard = <>{diagCardOnly}{weeklyCard}</>
    return <EgePath key={`${userProgress.targetVuz}-${userProgress.egeTarget}`} vuzId={userProgress.targetVuz ?? null} map={map} target={userProgress.egeTarget ?? null} activeMoveId={active?.id ?? null} unclaimedCase={unclaimed} diagCard={diagCard} />
}

export default PathPage
