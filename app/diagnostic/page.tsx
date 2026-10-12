// app/diagnostic/page.tsx — диагностика «Мой путь», во весь экран.
// С 2026-10-13 — новая диагностика «база в уме» (components/ege-diagnostic-v2.tsx, lib/diagBase.ts).
// Пройдена новая — показываем её итог; пройдена только старая (version 1) — её итог (lib/egeDiagnostic.ts);
// ?again=1 или ещё ничего не пройдено — новая диагностика с начала.

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { buildDiagResult, getLatestDiagnostic } from '@/lib/egeDiagnostic'
import { buildBaseResult, getBaseRows } from '@/lib/diagBase'
import { finishBaseDiagnostic } from '@/actions/ege-diagnostic'
import { EgeDiagnostic } from '@/components/ege-diagnostic'
import { EgeDiagnosticV2 } from '@/components/ege-diagnostic-v2'

export const dynamic = 'force-dynamic'

const SUBJECT = 'math_profile'

const DiagnosticPage = async ({ searchParams }: { searchParams: { again?: string } }) => {
    const session = await auth()
    if (!session?.user?.id) redirect('/')
    const userId = session.user.id
    const done = searchParams?.again ? null : await getLatestDiagnostic(userId, SUBJECT, 'done')

    if (done?.version === 2) {
        const [rows, result] = await Promise.all([getBaseRows(done.id), buildBaseResult(done.id, SUBJECT)])
        return (
            <div className="min-h-screen bg-[#131D22]">
                <EgeDiagnosticV2 save={finishBaseDiagnostic} initialRows={rows} initialResult={result} />
            </div>
        )
    }
    if (done) {
        const result = await buildDiagResult(userId, SUBJECT, done)
        return <EgeDiagnostic id={done.id} plan={done.plan} questions={[]} initialAnswers={[]} initialResult={result} />
    }
    return (
        <div className="min-h-screen bg-[#131D22]">
            <EgeDiagnosticV2 save={finishBaseDiagnostic} />
        </div>
    )
}

export default DiagnosticPage
