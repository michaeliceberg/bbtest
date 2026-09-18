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

import { Fragment, useEffect, useState } from 'react'
import { Check, RotateCcw, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'
import {
    RightTriangleDiagram, oppositeLegOf,
    HYPOTENUSE_COLOR, LEG_COLOR,
    type AlphaVertex, type SideId,
} from '@/components/geometry/RightTriangleDiagram'
import { MARKER_COLOR, MARKER_COLOR_GREEN } from '@/components/geometry/WalkthroughMarker'
import {
    TypedLine, TypedKeyPhraseLine, DiagramBlock, pickWalkthroughNextLabel, CORRECT_FEEDBACK_PHRASES,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton,
} from '@/components/geometry/WalkthroughLog'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'

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

// НАЧАЛЬНОЕ число заданий практики — реальное число может вырасти по
// ходу прохождения (см. handleNextTrial/"работа над ошибками" ниже), для
// проверки текущего общего количества использовать trialConfigs.length,
// не эту константу.
const TRIAL_COUNT = 4
// 0° сознательно исключён — это уже показанная обучающая ориентация,
// тренировка должна выглядеть заметно "новой" с первого же задания.
const ROTATIONS = [35, -35, 55, -55, 75, -75, 110, -110, 140, -140, 160, -160]

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

type TrialConfig = { rotationDeg: number; mirror: boolean; alphaVertex: AlphaVertex }

// Похвала за верный ответ — ВЫБРАНА ДЕТЕРМИНИРОВАННО из уже случайных
// (но стабильных на весь заход в урок) полей самого задания, а НЕ через
// Math.random()/useMemo прямо в JSX внутри .map() — вызов хуков внутри
// цикла .map() нарушил бы Rules of Hooks (число вызовов росло бы вместе
// с trialConfigs), а обычный Math.random() в теле рендера давал бы НОВУЮ
// фразу на каждый лишний ре-рендер, а не одну стабильную на задание.
const pickTrialFeedback = (cfg: TrialConfig): string => {
    const seed = cfg.rotationDeg * 3 + (cfg.mirror ? 17 : 0) + (cfg.alphaVertex === 'P' ? 5 : 0)
    return CORRECT_FEEDBACK_PHRASES[Math.abs(seed) % CORRECT_FEEDBACK_PHRASES.length]
}

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

// Квадратная кнопка "повторить" слева от "Дальше" — по прямой просьбе
// пользователя, чтобы можно было переиграть анимацию последнего шага ещё
// раз. Сама "перемотка" реализована не здесь — см. replayNonces/key ниже,
// эта кнопка только увеличивает счётчик ТЕКУЩЕГО шага.
const ReplayButton = ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title="Повторить анимацию"
        className={cn(
            'shrink-0 w-12 py-3 rounded-xl border-2 border-b-4 active:border-b-2 transition-colors flex items-center justify-center',
            disabled ? 'bg-[#161F23] border-[#2A343A] text-[#3A464E] cursor-not-allowed' : 'bg-[#1B252B] border-[#3A464E] text-[#9AA7B0] hover:text-[#F2F7FB] hover:border-[#4A5860]'
        )}
    >
        <RotateCcw className="w-5 h-5" />
    </button>
)

// Число шагов обучающей части — по прямой просьбе пользователя шаги
// больше НЕ проигрываются каскадом сами по себе: каждый требует явного
// клика "Дальше", чтобы дать время рассмотреть рисунок, прежде чем идти
// дальше (см. handleIntroNext).
const INTRO_STEPS = 5

export const TypeSinWalk = ({ onAnswer, onComplete }: Props) => {
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
    // trialConfigs растёт по ходу практики — см. handleNextTrial: реальный
    // баг, пойманный пользователем живьём ("на 4/4 сделал ошибку — всё
    // застыло, дальше нажать нельзя") — раньше при ошибке на ПОСЛЕДНЕМ по
    // счёту задании компонент всё равно звал onComplete(false) и
    // завершался, но общая нижняя кнопка тренажёра для SINWALK скрыта
    // целиком (у него своя "Дальше"/"Готово") — в итоге нажать было
    // буквально нечего. По прямой просьбе пользователя — если ошибка на
    // последнем задании, попытка НЕ считается завершённой: вместо
    // onComplete добавляется ЕЩЁ одно случайное задание, и так пока
    // последнее по счёту не будет решено верно.
    const [trialConfigs, setTrialConfigs] = useState<TrialConfig[]>(() => makeTrialConfigs(TRIAL_COUNT))
    const [trialIndex, setTrialIndex] = useState(0)
    const [trialAnswers, setTrialAnswers] = useState<(SideId | null)[]>(Array(TRIAL_COUNT).fill(null))
    const [checked, setChecked] = useState(false)

    // Счётчики "повторов" — ОТДЕЛЬНЫЙ nonce на каждый шаг/задание
    // ('step-0'..'step-4', 'trial-0'..'trial-3'), а не один общий на всё
    // (см. useReplayNonces в WalkthroughLog.tsx — тот же общий хук теперь
    // используют и кнопка "Повторить", и полный откат "назад", обоим
    // нужно ПЕРЕМОНТИРОВАТЬ содержимое сцены, чтобы анимация проигралась
    // заново). Это важно: если бы nonce был один общий и входил в key
    // каждого блока БЕЗУСЛОВНО, клик "повторить" на шаге 3 пересоздавал
    // бы (и заново печатал текст) ВСЕ уже пройденные шаги 0-2 тоже —
    // реальный баг, пойманный пользователем живьём ("почему в предыдущей
    // сцене снова проигрывается анимация текста"). Причина была именно в
    // ФОРМАТЕ key: раньше он переключался между `step1-${nonce}` (пока
    // шаг активен) и просто `step1` (как только шаг становится пройден)
    // — а любая смена ФОРМАТА key — это уже смена key для React, даже
    // если nonce не менялся, поэтому переход НА следующий шаг сам по
    // себе пересоздавал/перепечатывал предыдущий. Теперь key каждого
    // блока — ВСЕГДА один и тот же формат `step-N-${nonce}`, не зависит
    // от того, активен шаг сейчас или уже пройден — он не меняется просто
    // от перехода дальше, только от явного клика "повторить"/"назад"
    // ИМЕННО на этом шаге.
    const { bump: bumpNonce, nonceFor: replayNonceFor } = useReplayNonces()
    const currentReplayKey = phase === 'intro' ? `step-${step}` : `trial-${trialIndex}`
    const handleReplay = () => bumpNonce(currentReplayKey)

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
            const wasLastCorrect = trialAnswers[trialIndex] === currentCorrectSide
            const isLastInList = trialIndex + 1 >= trialConfigs.length
            if (isLastInList) {
                if (wasLastCorrect) {
                    setAdvancing(false)
                    // onComplete — только красит маскота/локальный статус
                    // ВНУТРИ trainer-question.tsx, сам урок дальше не
                    // двигает. Настоящее завершение вопроса (счёт/сердечки/
                    // переход дальше в TQUIZ.tsx) — только через onAnswer,
                    // как у CHECK/FRACTRICK (тех же самодостаточных типов).
                    // Раньше этого вызова не было вовсе — клик "Готово"
                    // ничего не делал, урок не мог закончиться никогда.
                    const isFullyCorrect = !hadMistake
                    onComplete(isFullyCorrect)
                    onAnswer(isFullyCorrect ? 'right' : 'wrong')
                    return
                }
                // Ошибка на последнем по счёту задании — не завершаем
                // попытку, а добавляем ещё одно (см. комментарий у
                // trialConfigs выше).
                const [extra] = makeTrialConfigs(1)
                setTrialConfigs((prev) => [...prev, extra])
                setTrialAnswers((prev) => [...prev, null])
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
    // Случайный выбор — ТОЛЬКО после монтирования (useEffect), не в самом
    // рендере/useMemo: тот выполняется и при SSR, и при первом клиентском
    // рендере независимо — Math.random() даёт разные значения на сервере
    // и клиенте и ломает гидратацию (тот же класс бага, что уже не раз
    // документирован в CLAUDE.md для случайного текста, видимого в SSR-HTML).
    const [introNextLabel, setIntroNextLabel] = useState('Дальше')
    const [trialNextLabel, setTrialNextLabel] = useState('Дальше')
    useEffect(() => { setIntroNextLabel(pickWalkthroughNextLabel('Дальше')) }, [step])
    useEffect(() => { setTrialNextLabel(pickWalkthroughNextLabel('Дальше')) }, [trialIndex])

    // Затемнение прошлых сцен + автоскролл к новой (см. useSceneFocus в
    // WalkthroughLog.tsx) — ключи сцен СТАБИЛЬНЫЕ (`step-N`/`trial-N`, без
    // replayNonce), иначе клик "Повторить" сбрасывал бы ref.
    const latestSceneKey = phase === 'intro' ? `step-${step}` : `trial-${trialIndex}`
    const prevSceneKeyOf = (key: string): string | null => {
        if (key.startsWith('trial-')) {
            const idx = Number(key.slice('trial-'.length))
            return idx > 0 ? `trial-${idx - 1}` : `step-${INTRO_STEPS - 1}`
        }
        if (key.startsWith('step-')) {
            const idx = Number(key.slice('step-'.length))
            return idx > 0 ? `step-${idx - 1}` : null
        }
        return null
    }
    const contentSettled = phase === 'intro' ? stepReady : checked
    const { isActive: isSceneActive, sceneRef } = useSceneFocus(latestSceneKey, contentSettled)
    const canGoBack = prevSceneKeyOf(latestSceneKey) !== null

    // "Назад" — по прямой просьбе пользователя (2026-09-19) РЕАЛЬНЫЙ откат
    // на предыдущую сцену (не просто "полистать взглядом"): состояние
    // step/trialIndex/phase откатывается на target, answer этой сцены
    // сбрасывается (можно ответить заново), nonce цели бампается (её
    // содержимое ПЕРЕМОНТИРУЕТСЯ — Typewriter/DiagramBlock/подсветка
    // стороны проигрываются заново). Сцены ПОСЛЕ target (в т.ч. та, с
    // которой кликнули "назад") сами исчезают из DOM — рендер-условие
    // `step >= i`/`trialIndex+1` уже не покрывает их, отдельно "стирать"
    // ничего не нужно.
    const handleBack = () => {
        if (advancing) return
        const target = prevSceneKeyOf(latestSceneKey)
        if (!target) return
        bumpNonce(target)
        if (target.startsWith('trial-')) {
            const idx = Number(target.slice('trial-'.length))
            setTrialIndex(idx)
            setChecked(false)
            setTrialAnswers((prev) => { const next = [...prev]; next[idx] = null; return next })
        } else if (target.startsWith('step-')) {
            const idx = Number(target.slice('step-'.length))
            setPhase('intro')
            setStep(idx)
            setStepReady(false)
        }
    }

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4">
            <div className="w-full flex flex-col gap-4">
                {/* Шаг 0 — просто треугольник. Заголовок вопроса ("Что такое
                    синус угла?") здесь НЕ дублируется — его уже показывает
                    облако маскота над карточкой (TrainerMascot.taskMessage),
                    свой <h2> с тем же текстом раньше был лишним повтором. */}
                <SceneWrapper key="step-0" innerRef={sceneRef('step-0')} active={isSceneActive('step-0')}>
                    <Fragment key={`step-0-${replayNonceFor('step-0')}`}>
                        <DiagramBlock><RightTriangleDiagram /></DiagramBlock>
                        <TypedLine
                            className="w-full text-base md:text-lg text-[#F2F7FB]"
                            text="Это прямоугольный треугольник — у него есть прямой угол."
                            onSettled={() => setStepReady(true)}
                        />
                    </Fragment>
                </SceneWrapper>

                {/* Шаг 1 — появляется маркер прямого угла (с zoom-эффектом
                    "смотри сюда" — камера ненадолго приближается к углу,
                    рисует маркер, затем ПОЛНОСТЬЮ отдаляется обратно — и
                    только ПОСЛЕ этого, поочерёдно, а не одновременно с
                    зум-аутом, появляются зелёные подписи "катет" на обеих
                    сторонах, см. RightTriangleDiagram). Слово "катетами" в
                    тексте ниже — просто жирным зелёным (без текстовыделителя,
                    по прямой просьбе пользователя убрать этот эффект). */}
                {step >= 1 && (
                    <SceneWrapper key="step-1" innerRef={sceneRef('step-1')} active={isSceneActive('step-1')}>
                        <Fragment key={`step-1-${replayNonceFor('step-1')}`}>
                            <DiagramBlock><RightTriangleDiagram rightAngleMarkShown legsLabelShown zoomFocus="rightAngle" /></DiagramBlock>
                            <TypedKeyPhraseLine
                                before="Вот он — прямой угол между двумя "
                                phrase="катетами"
                                after=" треугольника."
                                color={MARKER_COLOR_GREEN}
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 2 — гипотенуза (ключевая фраза, подпись вдоль стороны). */}
                {step >= 2 && (
                    <SceneWrapper key="step-2" innerRef={sceneRef('step-2')} active={isSceneActive('step-2')}>
                        <Fragment key={`step-2-${replayNonceFor('step-2')}`}>
                            <DiagramBlock>
                                <RightTriangleDiagram rightAngleMarkShown legsLabelShown hypotenuseHighlighted hypotenuseLabelShown />
                            </DiagramBlock>
                            <TypedKeyPhraseLine
                                before="Сторона напротив прямого угла — самая длинная сторона треугольника. Она называется "
                                phrase="гипотенуза"
                                color={HYPOTENUSE_COLOR}
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 3 — выбираем угол α (тоже с zoom-эффектом на саму
                    вершину, где рисуется дуга угла). */}
                {step >= 3 && (
                    <SceneWrapper key="step-3" innerRef={sceneRef('step-3')} active={isSceneActive('step-3')}>
                        <Fragment key={`step-3-${replayNonceFor('step-3')}`}>
                            <DiagramBlock>
                                <RightTriangleDiagram rightAngleMarkShown legsLabelShown hypotenuseHighlighted hypotenuseLabelShown alphaVertex="P" zoomFocus="alpha" />
                            </DiagramBlock>
                            <TypedLine
                                className="w-full text-base md:text-lg text-[#F2F7FB]"
                                text="Теперь выберем один из двух других углов — назовём его α (альфа)."
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 4 — противолежащий катет. Камера панорамирует от α к
                    самому катету (zoomFocus="alphaToOppositeLeg"); в момент
                    прибытия зелёная подпись "катет" на этой стороне
                    сменяется на "противолежащий катет" — В ТОМ ЖЕ зелёном
                    формате (без золотого/мигающего акцента, по прямой
                    просьбе пользователя убрать этот эффект). */}
                {step >= 4 && (
                    <SceneWrapper key="step-4" innerRef={sceneRef('step-4')} active={isSceneActive('step-4')}>
                        <Fragment key={`step-4-${replayNonceFor('step-4')}`}>
                            <DiagramBlock>
                                <RightTriangleDiagram
                                    rightAngleMarkShown legsLabelShown hypotenuseHighlighted hypotenuseLabelShown alphaVertex="P" zoomFocus="alphaToOppositeLeg"
                                    oppositeLegHighlighted oppositeLegLabelShown
                                />
                            </DiagramBlock>
                            <TypedKeyPhraseLine
                                before="Катет напротив угла α называется "
                                phrase="противолежащий катет"
                                color={LEG_COLOR}
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {phase === 'practice' && Array.from({ length: trialIndex + 1 }).map((_, i) => {
                    const cfg = trialConfigs[i]
                    const isCurrent = i === trialIndex
                    const isDone = i < trialIndex || (isCurrent && checked)
                    const answer = trialAnswers[i]
                    const correctSide = oppositeLegOf(cfg.alphaVertex)
                    return (
                        <SceneWrapper key={`trial-${i}`} innerRef={sceneRef(`trial-${i}`)} active={isSceneActive(`trial-${i}`)}>
                        <div key={`trial-${i}-${replayNonceFor(`trial-${i}`)}`} className="w-full flex flex-col gap-3">
                            {/* "N из M" — отдельная цветная плашка (не часть
                                печатаемого текста); сама фраза-задание
                                упрощена по прямой просьбе пользователя
                                ("Выбери противолежащий катет к углу α —
                                кликни по стороне треугольника" → просто
                                "Кликни по противолежащему катету"), слово
                                "противолежащему" выделено текстовыделителем
                                — чтобы сразу было понятно, что искать. */}
                            <div className="flex items-start gap-3 w-full">
                                <div
                                    className="shrink-0 flex items-center gap-0.5 px-3 h-9 rounded-full border-2 font-black text-sm tabular-nums"
                                    style={{
                                        borderColor: hexToRgba(GGEGE_PALETTE.purple.button, 0.55),
                                        backgroundColor: hexToRgba(GGEGE_PALETTE.purple.button, 0.16),
                                        color: GGEGE_PALETTE.purple.button,
                                    }}
                                >
                                    <span>{i + 1}</span>
                                    <span className="opacity-50 font-normal">/</span>
                                    <span>{trialConfigs.length}</span>
                                </div>
                                <TypedKeyPhraseLine
                                    className="flex-1 text-base md:text-lg text-[#F2F7FB]"
                                    before="Кликни по "
                                    phrase="противолежащему"
                                    after=" катету."
                                    color={MARKER_COLOR}
                                    highlight
                                />
                            </div>
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
                                    {answer === correctSide ? pickTrialFeedback(cfg) : 'Не тот катет — верная сторона подсвечена зелёным.'}
                                </div>
                            )}
                            {/* Конфетти на верный ответ — по прямой просьбе
                                пользователя, во всех step-by-step разборах
                                (см. LocalAnswerConfetti). Только пока это
                                ТЕКУЩЕЕ задание — естественно размонтируется
                                при переходе к следующему. */}
                            {isCurrent && isDone && answer === correctSide && <LocalAnswerConfetti />}
                        </div>
                        </SceneWrapper>
                    )
                })}
            </div>

            {phase === 'intro' ? (
                <div className="w-full flex items-center gap-2">
                    <ReplayButton onClick={handleReplay} disabled={advancing} />
                    <BackButton onClick={handleBack} disabled={advancing || !canGoBack} />
                    <button type="button" onClick={handleIntroNext} disabled={!stepReady || advancing} className={walkthroughButtonClass(stepReady && !advancing)} style={walkthroughButtonStyle(stepReady && !advancing)}>
                        {introNextLabel}
                    </button>
                </div>
            ) : checked ? (
                <div className="w-full flex items-center gap-2">
                    <ReplayButton onClick={handleReplay} disabled={advancing} />
                    <BackButton onClick={handleBack} disabled={advancing || !canGoBack} />
                    <button type="button" onClick={handleNextTrial} disabled={advancing} className={walkthroughButtonClass(!advancing)} style={walkthroughButtonStyle(!advancing)}>
                        {/* "Готово" — ТОЛЬКО если это реально последнее и
                            ВЕРНО решённое задание (клик завершит практику).
                            Если это последнее по счёту, но ответ неверный —
                            клик добавит ещё одно задание (см. handleNextTrial),
                            поэтому кнопка честно показывает "Дальше"-подобную
                            подпись, а не вводящее в заблуждение "Готово". */}
                        {trialIndex + 1 >= trialConfigs.length && trialAnswers[trialIndex] === currentCorrectSide ? 'Готово' : trialNextLabel}
                    </button>
                </div>
            ) : (
                <p className="text-sm text-[#9AA7B0] text-center">Кликни по одной из сторон треугольника выше</p>
            )}
        </div>
    )
}
