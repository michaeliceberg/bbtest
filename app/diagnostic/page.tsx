// app/diagnostic/page.tsx — диагностика «Мой путь», во весь экран.
// С 2026-10-13 — диагностика «база в уме» (lib/diagBase.ts), с 2026-11-06 в премиальном виде (components/ege-diagnostic-v3.tsx).
// Пройдена новая — показываем её итог; пройдена только старая (version 1) — её итог (lib/egeDiagnostic.ts);
// ?again=1 или ещё ничего не пройдено — новая диагностика с начала.

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { auth } from '@/lib/auth'
import { buildDiagResult, getLatestDiagnostic } from '@/lib/egeDiagnostic'
import { buildBaseResult, getBaseRows } from '@/lib/diagBase'
import { finishBaseDiagnostic } from '@/actions/ege-diagnostic'
import { EgeDiagnostic } from '@/components/ege-diagnostic'
import { EgeDiagnosticV3 } from '@/components/ege-diagnostic-v3'

export const dynamic = 'force-dynamic'

const SUBJECT = 'math_profile'

// Кнопка «Назад» на итогах: страница во весь экран, без меню — иначе с неё не уйти (2026-11-06).
const BackToPath = () => (
    <Link href="/path" className="fixed left-3 top-3 z-50 flex items-center gap-1.5 rounded-xl border-2 border-b-4 border-[#3A464E] bg-[#151F23]/90 px-3 py-2 text-sm font-black text-[#F2F7FB] active:border-b-0">
        <ArrowLeft className="h-4 w-4" /> Назад
    </Link>
)

const DiagnosticPage = async ({ searchParams }: { searchParams: { again?: string } }) => {
    const session = await auth()
    if (!session?.user?.id) redirect('/')
    const userId = session.user.id
    const done = searchParams?.again ? null : await getLatestDiagnostic(userId, SUBJECT, 'done')

    if (done?.version === 2) {
        const [rows, result] = await Promise.all([getBaseRows(done.id), buildBaseResult(done.id, SUBJECT)])
        return (
            <div className="relative isolate min-h-screen">
                <BackToPath />
                <EgeDiagnosticV3 save={finishBaseDiagnostic} initialRows={rows} initialResult={result} />
            </div>
        )
    }
    if (done) {
        const result = await buildDiagResult(userId, SUBJECT, done)
        return (
            <>
                <BackToPath />
                <EgeDiagnostic id={done.id} plan={done.plan} questions={[]} initialAnswers={[]} initialResult={result} />
            </>
        )
    }
    return (
        <div className="relative isolate min-h-screen">
            <EgeDiagnosticV3 save={finishBaseDiagnostic} />
        </div>
    )
}

export default DiagnosticPage
