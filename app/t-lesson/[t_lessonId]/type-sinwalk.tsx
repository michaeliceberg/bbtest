// app/t-lesson/[t_lessonId]/type-sinwalk.tsx
//
// Тип SINWALK — интерактивный разбор по шагам "что такое синус угла"
// (тренажёр "Геометрия: Синус, косинус, тангенс", урок ПЕРЕД остальными
// этапами темы). Тот же "накопительный лог" (WalkthroughLog.tsx) и та же
// философия самодостаточного типа, что уже у MULTISTEP/FRACTRICK —
// компонент сам ведёт свою внутреннюю хореографию и зовёт onComplete
// РОВНО один раз в конце; общая нижняя кнопка (components/trainer-
// question.tsx) в это время задизейблена (answerState остаётся
// "pending", пока onComplete не сработает — см. handleMultistepComplete),
// а по факту завершения превращается в обычное "далее"/"ответить".
//
// Сюжет — прямая инструкция пользователя, по шагам:
// 1. Рисуем прямоугольный треугольник, пауза.
// 2. Прямой угол (bounce), стрелка к гипотенузе, подпись "гипотенуза".
// 3. Выбираем один из острых углов, bounce-появление "α".
// 4. Стрелка от α к противолежащему катету (сторона, НЕ касающаяся α),
//    подпись "противолежащий катет".
// 5. Несколько тренировочных заданий — треугольник каждый раз в НОВОМ
//    повороте/зеркале/с новым выбором α, нужно кликнуть по
//    противолежащему катету на самом чертеже (не по кнопкам-вариантам).
//
// Обучающие кадры (rotationDeg=0, фиксированная ориентация) — длинные
// подписи "гипотенуза"/"противолежащий катет" читаемы только без
// поворота (см. комментарий в RightTriangleDiagram.tsx). Тренировочные
// кадры вращаются свободно — там подписывается только короткая "α".

'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'
import {
    RightTriangleDiagram, oppositeLegOf,
    type AlphaVertex, type SideId,
} from '@/components/geometry/RightTriangleDiagram'
import { TypedLine, DiagramBlock, useStickToBottom } from '@/components/geometry/WalkthroughLog'

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}

const TRIAL_COUNT = 4
// 0° сознательно исключён — это уже показанная обучающая ориентация,
// тренировка должна выглядеть заметно "новой" с первого же задания.
const ROTATIONS = [35, -35, 55, -55, 75, -75, 110, -110, 140, -140, 160, -160]

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

type TrialConfig = { rotationDeg: number; mirror: boolean; alphaVertex: AlphaVertex }

const makeTrialConfigs = (n: number): TrialConfig[] => {
    const configs: TrialConfig[] = []
    let lastRotation: number | null = null
    for (let i = 0; i < n; i++) {
        let rotationDeg = pick(ROTATIONS)
        let guard = 0
        while (rotationDeg === lastRotation && guard < 6) {
            rotationDeg = pick(ROTATIONS)
            guard++
        }
        lastRotation = rotationDeg
        configs.push({ rotationDeg, mirror: Math.random() < 0.5, alphaVertex: Math.random() < 0.5 ? 'P' : 'Q' })
    }
    return configs
}

const nextButtonClass = (enabled: boolean) => cn(
    'w-full max-w-xs py-3 rounded-xl font-bold text-lg border-2 border-b-4 active:border-b-2 transition-colors',
    enabled ? 'bg-[#A1D151] border-[#78C93C] text-[#151F24]' : 'bg-[#161F23] border-[#3A464E] text-[#5A6A72] cursor-not-allowed'
)

export const TypeSinWalk = ({ onComplete }: Props) => {
    const [phase, setPhase] = useState<'intro' | 'practice'>('intro')
    const [hadMistake, setHadMistake] = useState(false)

    // Раскрытие обучающей последовательности — 0..8 (см. комментарий у
    // каждого блока ниже, тот же принцип, что introReveal/heightsReveal в
    // TrapezoidWalkthrough).
    const [introReveal, setIntroReveal] = useState(0)
    const introBusy = phase === 'intro' && introReveal < 8

    const [trialConfigs] = useState(() => makeTrialConfigs(TRIAL_COUNT))
    const [trialIndex, setTrialIndex] = useState(0)
    const [trialAnswers, setTrialAnswers] = useState<(SideId | null)[]>(Array(TRIAL_COUNT).fill(null))
    const [checked, setChecked] = useState(false)

    const currentCorrectSide = oppositeLegOf(trialConfigs[trialIndex].alphaVertex)

    const handleSideClick = (side: SideId) => {
        if (checked) return
        const next = [...trialAnswers]
        next[trialIndex] = side
        setTrialAnswers(next)
        setChecked(true)
        if (side !== currentCorrectSide) setHadMistake(true)
    }

    const handleNextTrial = () => {
        if (trialIndex + 1 >= TRIAL_COUNT) {
            onComplete(!hadMistake)
            return
        }
        setTrialIndex((i) => i + 1)
        setChecked(false)
    }

    const endRef = useStickToBottom([introReveal, phase, trialIndex, checked])

    return (
        <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-4">
            <h2 className="text-lg md:text-xl font-bold text-center text-[#F2F7FB]">
                Что такое синус угла?
            </h2>

            <div className="w-full flex flex-col gap-4">
                <DiagramBlock><RightTriangleDiagram /></DiagramBlock>

                <TypedLine
                    className="w-full text-base md:text-lg text-[#F2F7FB]"
                    text="Это прямоугольный треугольник — у него есть прямой угол."
                    onSettled={() => setIntroReveal((r) => Math.max(r, 1))}
                />

                {introReveal >= 1 && (
                    <DiagramBlock onSettled={() => setIntroReveal((r) => Math.max(r, 2))}>
                        <RightTriangleDiagram rightAngleMarkShown />
                    </DiagramBlock>
                )}

                {introReveal >= 2 && (
                    <TypedLine
                        className="w-full text-base md:text-lg text-[#F2F7FB]"
                        text="Сторона напротив прямого угла — самая длинная сторона треугольника. Она называется гипотенуза."
                        onSettled={() => setIntroReveal((r) => Math.max(r, 3))}
                    />
                )}

                {introReveal >= 3 && (
                    <DiagramBlock onSettled={() => setIntroReveal((r) => Math.max(r, 4))}>
                        <RightTriangleDiagram rightAngleMarkShown hypotenuseHighlighted hypotenuseLabelShown />
                    </DiagramBlock>
                )}

                {introReveal >= 4 && (
                    <TypedLine
                        className="w-full text-base md:text-lg text-[#F2F7FB]"
                        text="Теперь выберем один из двух других углов — назовём его α (альфа)."
                        onSettled={() => setIntroReveal((r) => Math.max(r, 5))}
                    />
                )}

                {introReveal >= 5 && (
                    <DiagramBlock onSettled={() => setIntroReveal((r) => Math.max(r, 6))}>
                        <RightTriangleDiagram rightAngleMarkShown hypotenuseHighlighted alphaVertex="P" />
                    </DiagramBlock>
                )}

                {introReveal >= 6 && (
                    <TypedLine
                        className="w-full text-base md:text-lg text-[#F2F7FB]"
                        text="У угла α есть сторона, которая его НЕ касается — она называется противолежащий катет."
                        onSettled={() => setIntroReveal((r) => Math.max(r, 7))}
                    />
                )}

                {introReveal >= 7 && (
                    <DiagramBlock onSettled={() => setIntroReveal(8)}>
                        <RightTriangleDiagram
                            rightAngleMarkShown hypotenuseHighlighted alphaVertex="P"
                            oppositeLegHighlighted oppositeLegLabelShown
                        />
                    </DiagramBlock>
                )}

                {phase === 'practice' && Array.from({ length: trialIndex + 1 }).map((_, i) => {
                    const cfg = trialConfigs[i]
                    const isCurrent = i === trialIndex
                    const isDone = i < trialIndex || (isCurrent && checked)
                    const answer = trialAnswers[i]
                    const correctSide = oppositeLegOf(cfg.alphaVertex)
                    return (
                        <div key={i} className="w-full flex flex-col gap-3">
                            <TypedLine
                                className="w-full text-base md:text-lg text-[#F2F7FB]"
                                text={`Задание ${i + 1} из ${TRIAL_COUNT}. Выбери противолежащий катет к углу α — кликни по стороне треугольника.`}
                            />
                            <DiagramBlock>
                                <RightTriangleDiagram
                                    rotationDeg={cfg.rotationDeg}
                                    mirror={cfg.mirror}
                                    rightAngleMarkShown
                                    alphaVertex={cfg.alphaVertex}
                                    interactive={isCurrent && !checked}
                                    onSideClick={isCurrent ? handleSideClick : undefined}
                                    selectedSide={answer}
                                    correctSide={correctSide}
                                    checked={isDone}
                                />
                            </DiagramBlock>
                            {isDone && (
                                <div
                                    className={cn(
                                        'flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center',
                                        answer === correctSide ? 'bg-[#A1D15122] text-[#A1D151]' : 'bg-[#DC605B22] text-[#DC605B]'
                                    )}
                                >
                                    {answer === correctSide ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                    {answer === correctSide ? 'Верно!' : 'Не тот катет — верная сторона подсвечена зелёным.'}
                                </div>
                            )}
                        </div>
                    )
                })}

                <div ref={endRef} />
            </div>

            {phase === 'intro' ? (
                <button type="button" onClick={() => setPhase('practice')} disabled={introBusy} className={nextButtonClass(!introBusy)}>
                    Дальше
                </button>
            ) : checked ? (
                <button type="button" onClick={handleNextTrial} className={nextButtonClass(true)}>
                    {trialIndex + 1 >= TRIAL_COUNT ? 'Готово' : 'Дальше'}
                </button>
            ) : (
                <p className="text-sm text-[#9AA7B0] text-center">Кликни по одной из сторон треугольника выше</p>
            )}
        </div>
    )
}
