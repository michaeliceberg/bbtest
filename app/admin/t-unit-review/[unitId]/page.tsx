import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTUnitWithChallenges } from '@/db/queries'
import { ReviewList } from './review-list'

// isAdmin уже гейтится в app/admin/layout.tsx (редиректит на / без него) —
// здесь его перепроверять не нужно, эта страница живёт внутри app/admin.

const TUnitReviewPage = async ({ params }: { params: { unitId: string } }) => {
    const unitId = Number(params.unitId)
    const t_unit = await getTUnitWithChallenges(unitId)

    if (!t_unit) {
        return (
            <div className="max-w-2xl mx-auto text-[#9AA7B0]">
                Тема с id={params.unitId} не найдена.
            </div>
        )
    }

    const lessons = t_unit.t_lessons.map((l) => ({ id: l.id, title: l.title, order: l.order }))
    const initialChallenges = t_unit.t_lessons.flatMap((l) => l.t_challenges)

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-1">
                <Link
                    href="/trainer"
                    className="flex items-center gap-1 text-[#9AA7B0] hover:text-white text-sm transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Тренажёр
                </Link>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">{t_unit.title}</h1>
            <p className="text-[#9AA7B0] text-sm mb-6">
                {lessons.length} этапов · {initialChallenges.length} задач всего
            </p>

            <ReviewList unitTitle={t_unit.title} lessons={lessons} initialChallenges={initialChallenges} />
        </div>
    )
}

export default TUnitReviewPage
