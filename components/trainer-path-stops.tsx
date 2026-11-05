// components/trainer-path-stops.tsx
//
// Экран раздела задачника (/learn?task=N): тренажёры задания стоят первыми кружками дорожки, над уроками. Порядок виден
// сам: сначала тренажёр, потом задачи. Кружок ведёт сразу в первый непройденный урок темы (?back=N — вернуться сюда).
// Пройдена тема при серебре (≥50%): то же правило, что у починки предмета в ангаре. Бронза — кружок ещё цветной,
// серебро и золото — спокойный, с медалью: тренировку можно улучшать, но она больше не первый шаг.

import Link from 'next/link'
import { Dumbbell } from 'lucide-react'
import { NavMedal } from '@/components/nav-sheet-ui'
import type { TrainerKey } from '@/lib/egeTrainerLinks'
import { declensionRu } from '@/usefulFunctions'

export const TRAINER_STOP_DONE_PERCENT = 50

export function TrainerPathStops({ num, keys, accent }: { num: number; keys: TrainerKey[]; accent: { button: string; bottom: string } }) {
    const curId = keys.find((k) => k.percent < TRAINER_STOP_DONE_PERCENT)?.tUnitId
    return (
        <div className="mt-5 flex flex-col items-center gap-4">
            {keys.map((k) => {
                const done = k.percent >= TRAINER_STOP_DONE_PERCENT
                const cur = k.tUnitId === curId
                return (
                    <Link key={k.tUnitId} href={`/t-lesson/${k.nextLessonId}?back=${num}`} className="flex max-w-[280px] flex-col items-center gap-1 text-center">
                        {cur && <span className="animate-bounce rounded-lg bg-[#F2C35B] px-2 py-0.5 text-[11px] font-black text-[#3A2A08]">Начни здесь</span>}
                        <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-b-[6px] active:border-b-0"
                            style={{ background: done ? '#26333B' : accent.button, borderBottomColor: done ? '#10171A' : accent.bottom }}>
                            {k.percent > 0 ? <NavMedal percent={k.percent} size={50} /> : <Dumbbell className="h-8 w-8 text-white" strokeWidth={2.6} />}
                        </span>
                        <span className="text-[13px] font-black leading-tight text-[#E2EAF0]">Тренажёр: {k.title}</span>
                        <span className="text-[11px] font-bold text-[#9AA7B0]">{k.doneLessons}/{k.totalLessons} {declensionRu(k.totalLessons, 'урок', 'урока', 'уроков')}</span>
                    </Link>
                )
            })}
        </div>
    )
}
