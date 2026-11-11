'use client'

// Проверка места гуся после урока на карте тренажёра (StagePath): облачко рисуется слева, справа или сверху — туда, где
// нет названий уроков и кружков. Ширина карты переключается, чтобы увидеть и телефон, и компьютер.
import { useState } from 'react'
import { StagePath, type SkillTopic } from '@/components/trainer-grade-tree'
import { TrainerPet } from '@/components/trainer-pet'
import { GGEGE_PALETTE } from '@/src/constants/lessonButtonColors'

const titles = ['Как складывать логарифмы?', 'Как вычитать логарифмы?', 'Сумма и разность логарифмов — тренировка', 'Степень в основании и аргументе', 'Деление логарифмов', 'К-к-комбо логарифмов', 'Перевёртыш', 'Босс-экзамен: Логарифмы']
const topic: SkillTopic = {
    id: 16, title: 'Логарифмы', percentage: 40,
    stages: titles.map((t, i) => ({ id: 900 + i, title: t, percentage: i < 3 ? 100 : 0, isStepByStep: i !== 2 && i !== 7, egePart: i % 2 === 0 ? 1 : 2, badge: i === 0 ? 'log₂ 1/8 = −3' : null } as SkillTopic['stages'][number])),
}

export default function TestGooseMap() {
    const [w, setW] = useState(480)
    const [reveal, setReveal] = useState(900)
    return (
        <div className="min-h-screen bg-[#131D22] p-4 text-white">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-bold">
                {[375, 480, 720, 960].map((x) => (
                    <button key={x} onClick={() => setW(x)} className="rounded-lg border-2 px-3 py-1" style={{ borderColor: w === x ? '#53ADEF' : '#3A464E' }}>{x}px</button>
                ))}
                <span className="ml-3 text-[#9AA7B0]">после урока:</span>
                {[900, 901, 902, 903, 904].map((x) => (
                    <button key={x} onClick={() => setReveal(x)} className="rounded-lg border-2 px-3 py-1" style={{ borderColor: reveal === x ? '#53ADEF' : '#3A464E' }}>{x - 899}</button>
                ))}
            </div>
            <div style={{ width: w }} className="mx-auto">
                <StagePath
                    key={`${w}-${reveal}`}
                    topic={topic}
                    accent={GGEGE_PALETTE.blue}
                    cozy={false}
                    isAdmin={false}
                    frontierIdx={3}
                    stepNums={topic.stages.map(() => null)}
                    doneGradient="" doneBorder="" doneGlow=""
                    pet={null}
                    revealId={reveal}
                    revealWalk
                    cheerPet={(c, k) => <TrainerPet streak={3} hasExtendedToday setDone={false} dayKey={1} compact cheer={c} walking={k.walking} arrived={k.arrived} flip={k.flip} bubbleSide={k.side} />}
                />
            </div>
        </div>
    )
}
