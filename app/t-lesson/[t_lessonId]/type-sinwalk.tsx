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

import { useMemo, useState } from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'
import {
    RightTriangleDiagram, oppositeLegOf,
    HYPOTENUSE_COLOR, OPPOSITE_LEG_COLOR,
    type AlphaVertex, type SideId,
} from '@/components/geometry/RightTriangleDiagram'
import { MARKER_COLOR_GREEN } from '@/components/geometry/WalkthroughMarker'
import { TypedLine, TypedKeyPhraseLine, DiagramBlock, useStickToBottom, pickWalkthroughNextLabel } from '@/components/geometry/WalkthroughLog'

// Пауза ПОСЛЕ клика "Дальше", ДО начала новой анимации следующей сцены
// (зума, дорисовки стороны и т.п.) — по прямой просьбе пользователя,
// чтобы глаз успевал заметить "это новая сцена", а не воспринимал переход
// как непрерывное продолжение предыдущей.
const SCENE_TRANSITION_PAUSE_MS = 1000

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

// Число шагов обучающей части — по прямой просьбе пользователя шаги
// больше НЕ проигрываются каскадом сами по себе: каждый требует явного
// клика "Дальше", чтобы дать время рассмотреть рисунок, прежде чем идти
// дальше (см. handleIntroNext).
const INTRO_STEPS = 5

export const TypeSinWalk = ({ onComplete }: Props) => {
    const [phase, setPhase] = useState<'intro' | 'practice'>('intro')
    const [hadMistake, setHadMistake] = useState(false)

    // Текущий обучающий шаг (0..INTRO_STEPS-1) — продвигается ТОЛЬКО по
    // клику "Дальше"; stepReady включается, когда печать текста текущего
    // шага завершилась (кнопка до этого задизейблена — нечего листать
    // дальше, пока текст ещё печатается).
    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    // true между кликом "Дальше" и фактическим применением следующего шага
    // (см. SCENE_TRANSITION_PAUSE_MS) — блокирует повторный клик во время
    // паузы и держит экран неизменным, прежде чем начнётся новая сцена.
    const [advancing, setAdvancing] = useState(false)

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
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            if (trialIndex + 1 >= TRIAL_COUNT) {
                onComplete(!hadMistake)
                return
            }
            setTrialIndex((i) => i + 1)
            setChecked(false)
            setAdvancing(false)
        }, SCENE_TRANSITION_PAUSE_MS)
    }

    // Клик "Дальше" в обучающей части — единственный способ продвинуться
    // (никакого автопроигрыша). На последнем шаге переводит в практику.
    // Пауза (advancing) — ДО применения следующего шага, чтобы новая
    // сцена (например zoom-эффект) не начиналась вплотную к клику.
    const handleIntroNext = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            if (step + 1 >= INTRO_STEPS) {
                setPhase('practice')
            } else {
                setStep((s) => s + 1)
                setStepReady(false)
            }
            setAdvancing(false)
        }, SCENE_TRANSITION_PAUSE_MS)
    }

    // Подпись кнопки "Дальше" — иногда варьируется (см. WALKTHROUGH_NEXT_
    // PHRASES); пересчитывается на каждый НОВЫЙ шаг/задание, а не на любой
    // ре-рендер, иначе текст менялся бы "на лету" под уже видимой кнопкой.
    const introNextLabel = useMemo(() => pickWalkthroughNextLabel('Дальше'), [step])
    const trialNextLabel = useMemo(() => pickWalkthroughNextLabel('Дальше'), [trialIndex])

    const endRef = useStickToBottom([step, stepReady, phase, trialIndex, checked, advancing])

    return (
        <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-4">
            <div className="w-full flex flex-col gap-4">
                {/* Шаг 0 — просто треугольник. Заголовок вопроса ("Что такое
                    синус угла?") здесь НЕ дублируется — его уже показывает
                    облако маскота над карточкой (TrainerMascot.taskMessage),
                    свой <h2> с тем же текстом раньше был лишним повтором. */}
                <DiagramBlock><RightTriangleDiagram /></DiagramBlock>
                <TypedLine
                    className="w-full text-base md:text-lg text-[#F2F7FB]"
                    text="Это прямоугольный треугольник — у него есть прямой угол."
                    onSettled={() => setStepReady(true)}
                />

                {/* Шаг 1 — появляется маркер прямого угла (с zoom-эффектом
                    "смотри сюда" — камера ненадолго приближается к углу,
                    рисует маркер, затем отдаляется обратно). Заодно ОБЕ
                    стороны-катета подписываются зелёным "катет" (bounce
                    появление с затуханием) — слово "катетами" в тексте
                    ниже подсвечено тем же зелёным текстовыделителем, что и
                    в разборе "Трапеция №1". */}
                {step >= 1 && (
                    <>
                        <DiagramBlock><RightTriangleDiagram rightAngleMarkShown legsLabelShown zoomFocus="rightAngle" /></DiagramBlock>
                        <TypedKeyPhraseLine
                            before="Вот он — прямой угол между двумя "
                            phrase="катетами"
                            after=" треугольника."
                            color={MARKER_COLOR_GREEN}
                            highlight
                            onSettled={() => setStepReady(true)}
                        />
                    </>
                )}

                {/* Шаг 2 — гипотенуза (ключевая фраза, подпись вдоль стороны). */}
                {step >= 2 && (
                    <>
                        <DiagramBlock>
                            <RightTriangleDiagram rightAngleMarkShown legsLabelShown hypotenuseHighlighted hypotenuseLabelShown />
                        </DiagramBlock>
                        <TypedKeyPhraseLine
                            before="Сторона напротив прямого угла — самая длинная сторона треугольника. Она называется "
                            phrase="гипотенуза"
                            color={HYPOTENUSE_COLOR}
                            onSettled={() => setStepReady(true)}
                        />
                    </>
                )}

                {/* Шаг 3 — выбираем угол α (тоже с zoom-эффектом на саму
                    вершину, где рисуется дуга угла). */}
                {step >= 3 && (
                    <>
                        <DiagramBlock>
                            <RightTriangleDiagram rightAngleMarkShown legsLabelShown hypotenuseHighlighted alphaVertex="P" zoomFocus="alpha" />
                        </DiagramBlock>
                        <TypedLine
                            className="w-full text-base md:text-lg text-[#F2F7FB]"
                            text="Теперь выберем один из двух других углов — назовём его α (альфа)."
                            onSettled={() => setStepReady(true)}
                        />
                    </>
                )}

                {/* Шаг 4 — противолежащий катет. Камера панорамирует от α к
                    самому катету (zoomFocus="alphaToOppositeLeg"); в момент
                    прибытия зелёная подпись "катет" на этой стороне
                    сменяется золотой "противолежащий катет" (bounce) — та
                    же ключевая фраза, что и раньше, мигающая. */}
                {step >= 4 && (
                    <>
                        <DiagramBlock>
                            <RightTriangleDiagram
                                rightAngleMarkShown legsLabelShown hypotenuseHighlighted alphaVertex="P" zoomFocus="alphaToOppositeLeg"
                                oppositeLegHighlighted oppositeLegLabelShown
                            />
                        </DiagramBlock>
                        <TypedKeyPhraseLine
                            before="Катет напротив угла α называется "
                            phrase="противолежащий катет"
                            color={OPPOSITE_LEG_COLOR}
                            pulse
                            onSettled={() => setStepReady(true)}
                        />
                    </>
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
                <button type="button" onClick={handleIntroNext} disabled={!stepReady || advancing} className={nextButtonClass(stepReady && !advancing)}>
                    {introNextLabel}
                </button>
            ) : checked ? (
                <button type="button" onClick={handleNextTrial} disabled={advancing} className={nextButtonClass(!advancing)}>
                    {trialIndex + 1 >= TRIAL_COUNT ? 'Готово' : trialNextLabel}
                </button>
            ) : (
                <p className="text-sm text-[#9AA7B0] text-center">Кликни по одной из сторон треугольника выше</p>
            )}
        </div>
    )
}
