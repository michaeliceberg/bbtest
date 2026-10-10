// app/diagnostic/page.tsx — диагностика «Мой путь» (lib/egeDiagnostic.ts), во весь экран.
// Незаконченная — продолжаем с того же места; законченная — показываем итог.

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { buildDiagResult, getDiagAnswers, getLatestDiagnostic, loadDiagQuestions } from '@/lib/egeDiagnostic'
import { EgeDiagnostic } from '@/components/ege-diagnostic'

export const dynamic = 'force-dynamic'

const SUBJECT = 'math_profile'

const DiagnosticPage = async () => {
    const session = await auth()
    if (!session?.user?.id) redirect('/')
    const userId = session.user.id
    const active = await getLatestDiagnostic(userId, SUBJECT, 'active')
    if (active) {
        const [questions, answers] = await Promise.all([loadDiagQuestions(SUBJECT, active.plan), getDiagAnswers(active.id)])
        return <EgeDiagnostic id={active.id} plan={active.plan} questions={questions} initialAnswers={answers} initialResult={null} />
    }
    const done = await getLatestDiagnostic(userId, SUBJECT, 'done')
    if (!done) redirect('/path')
    const result = await buildDiagResult(userId, SUBJECT, done)
    return <EgeDiagnostic id={done.id} plan={done.plan} questions={[]} initialAnswers={[]} initialResult={result} />
}

export default DiagnosticPage
