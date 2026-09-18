// components/geometry/TrapezoidWalkthrough.tsx
//
// Первый интерактивный разбор по шагам (курс "ЕГЭ Математика Профиль" →
// Планиметрия → Трапеция → challenge id=1679: "Основания равнобедренной
// трапеции равны 43 и 73. Косинус острого угла трапеции равен 5/7.
// Найдите боковую сторону.") — переписан на тот же "накопительный лог",
// что и второй разбор (TangentialQuadWalkthrough, см. WalkthroughLog.tsx
// и комментарий там): текст печатается по буквам и не стирается, новые
// диаграммы дорисовываются НИЖЕ прежних снимков (не мутируют один и тот
// же чертёж), ссылки на условие — короткие цитаты с пометкой "Условие"
// вместо статичного блока с бегающим маркером, числовой ответ
// подставляется прямо на место "?" по мере ввода (без отдельного
// экранчика клавиатуры и без кнопки минуса — в геометрии отрицательных
// ответов не бывает).
//
// Выбор режима зума треугольника: раньше ОДИН диагональный <motion.g>
// плавно анимировал переход между обычным/увеличенным видом внутри
// одного и того же долгоживущего компонента. Теперь каждая "стадия"
// диаграммы — свой независимый, один раз смонтированный экземпляр
// TrapezoidDiagram с уже готовым набором пропов (см. DiagramBlock) —
// сам TrapezoidDiagram.tsx не менялся, просто вызывается несколько раз
// подряд с разными снимками состояния вместо одного реактивного набора.
//
// Центрирование сцены + реальный откат "назад" (2026-09-19) — мигрирован
// на ту же общую архитектуру SceneWrapper/useSceneFocus/useReplayNonces/
// BackButton, что уже отработана в 5 тренажёрных разборах (см. более
// раннюю запись в CLAUDE.md "Степбайстеп: настоящее центрирование новой
// сцены..."). Ключевая разница с ними — здесь один SceneWrapper (`step-N`)
// покрывает ЦЕЛЫЙ `stepIndex`, а НЕ отдельный микро-блок: внутри одного
// stepIndex уже была своя цепочка последовательного раскрытия
// (`introReveal`/`heightsReveal`/...), она осталась КАК ЕСТЬ — просто
// теперь целиком обёрнута в SceneWrapper+Fragment(nonce), чтобы кнопка
// "назад" могла и подсветить/центрировать её, и полностью перемонтировать.
// "Назад" откатывает stepIndex на 1 назад и явно сбрасывает раскрытие/
// ответ ОБОИХ шагов — целевого (чтобы он проиграл анимацию заново) и
// того, с которого ушли (чтобы при повторном заходе он тоже стартовал с
// нуля, а не показался весь разом — см. resetStepState).

import { Fragment, useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KeyboardInput } from '@/app/lesson/keyboard-input'
import { AnimatedOptionButton } from '@/components/AnimatedOptionButton'
import { HighlightedNumbersText } from '@/components/HighlightedNumbersText'
import { TrapezoidDiagram } from './TrapezoidDiagram'
import {
    CORRECT_COLOR, WRONG_COLOR, CURSOR_LATEX,
    ConditionCitation, TypedLine, FormulaBlock, DiagramBlock, useGlyphBlink,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton,
    walkthroughButtonClass, walkthroughButtonStyle,
} from './WalkthroughLog'

type Props = {
    onComplete: (allCorrect: boolean) => void
}

const STEP_COUNT = 5
const CORRECT_CHOICE = '15 / cos'

// Живая подстановка ответа прямо на место "?" в формуле (тот же приём,
// что и у финального шага TangentialQuadWalkthrough): пока не проверено —
// курсор ВСЕГДА дописан сразу после уже набранных цифр (по образцу
// motion.dev "Typewriter" — курсор не пропадает после первого символа, а
// продолжает мигать и сдвигается вправо по мере ввода); после проверки —
// окраска в зелёный/красный, курсор больше не нужен.
const answerLatexPart = (typed: string, checked: boolean, correct: boolean | null): string => {
    if (checked) return `\\textcolor{${correct ? CORRECT_COLOR : WRONG_COLOR}}{${typed || '?'}}`
    return `${typed}${CURSOR_LATEX}`
}

export const TrapezoidWalkthrough = ({ onComplete }: Props) => {
    const [stepIndex, setStepIndex] = useState(0)
    const [hadMistake, setHadMistake] = useState(false)

    // Раскрытие внутри шага 0 (интро: равнобедренность → диаграмма с
    // подсветкой ног → 43/73 → диаграмма с числами).
    const [introReveal, setIntroReveal] = useState(0) // 0..4
    // Шаг 1 (высоты → диаграмма → отрезки-подсказки → диаграмма).
    const [heightsReveal, setHeightsReveal] = useState(0) // 0..4

    // Шаг 2 — длина отрезка (73-43)/2.
    const [segmentTyped, setSegmentTyped] = useState('')
    const [segmentChecked, setSegmentChecked] = useState(false)
    const [segmentCorrect, setSegmentCorrect] = useState<boolean | null>(null)

    // Шаг 3 — зум на треугольник → цитата про косинус → вопрос → выбор.
    const [choiceReveal, setChoiceReveal] = useState(0) // 0..3
    const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
    const [choiceChecked, setChoiceChecked] = useState(false)

    // Шаг 4 — финальная боковая сторона 15/(5/7).
    const [finalTyped, setFinalTyped] = useState('')
    const [finalChecked, setFinalChecked] = useState(false)
    const [finalCorrect, setFinalCorrect] = useState<boolean | null>(null)

    const introBusy = stepIndex === 0 && introReveal < 4
    const heightsBusy = stepIndex === 1 && heightsReveal < 4
    const choiceBusy = stepIndex === 3 && choiceReveal < 3

    const segmentFormula = `$\\dfrac{73-43}{2} = ${answerLatexPart(segmentTyped, segmentChecked, segmentCorrect)}$`
    const finalFormula = `$\\dfrac{15}{\\tfrac{5}{7}} = ${answerLatexPart(finalTyped, finalChecked, finalCorrect)}$`
    const segmentFormulaRef = useRef<HTMLDivElement>(null)
    const finalFormulaRef = useRef<HTMLDivElement>(null)
    useGlyphBlink(segmentFormulaRef, [segmentTyped, segmentChecked])
    useGlyphBlink(finalFormulaRef, [finalTyped, finalChecked])

    const handleSegmentCheck = () => {
        const correct = segmentTyped.trim().replace('.', ',') === '15'
        setSegmentCorrect(correct)
        setSegmentChecked(true)
        if (!correct) setHadMistake(true)
    }

    const handleChoiceCheck = () => {
        const correct = selectedChoice === CORRECT_CHOICE
        setChoiceChecked(true)
        if (!correct) setHadMistake(true)
    }

    const handleFinalCheck = () => {
        const correct = finalTyped.trim().replace('.', ',') === '21'
        setFinalCorrect(correct)
        setFinalChecked(true)
        if (!correct) setHadMistake(true)
    }

    const goNext = () => setStepIndex((i) => i + 1)
    const handleFinish = () => onComplete(!hadMistake)

    // Счётчики "повторов" — нужны кнопке "назад" для перемонтирования
    // содержимого целевого шага (тот же приём, что и в тренажёрных
    // разборах, см. type-logsubwalk.tsx).
    const { bump: bumpNonce, nonceFor } = useReplayNonces()

    // Затемнение прошлых шагов + автоскролл к текущему (см. useSceneFocus
    // в WalkthroughLog.tsx). latestKey — просто текущий stepIndex; каждый
    // раз, как он меняется, скролл центрирует ИМЕННО этот шаг целиком.
    const latestSceneKey = `step-${stepIndex}`
    const canGoBack = stepIndex > 0
    // "Готовность" содержимого текущего шага — грубый, но достаточный
    // сигнал (тот же принцип, что "stepReady"/"checked" в тренажёрных
    // разборах) для повторного скролла ПОСЛЕ того, как высота шага
    // устаканилась (печать текста могла подрасти её уже после первого
    // скролла).
    const stepContentSettled =
        stepIndex === 0 ? introReveal >= 4 :
        stepIndex === 1 ? heightsReveal >= 4 :
        stepIndex === 2 ? segmentChecked :
        stepIndex === 3 ? choiceChecked :
        finalChecked
    const { isActive: isSceneActive, sceneRef } = useSceneFocus(latestSceneKey, stepContentSettled)

    // Сброс раскрытия/ответа ОДНОГО шага до пристинного состояния — нужен
    // и целевому шагу (чтобы он проиграл анимацию заново), и шагу, с
    // которого уходим (чтобы при повторном заходе вперёд он тоже начал с
    // нуля, а не показал всё содержимое разом — см. комментарий в шапке
    // файла).
    const resetStepState = (idx: number) => {
        if (idx === 0) { setIntroReveal(0) }
        else if (idx === 1) { setHeightsReveal(0) }
        else if (idx === 2) { setSegmentTyped(''); setSegmentChecked(false); setSegmentCorrect(null) }
        else if (idx === 3) { setChoiceReveal(0); setSelectedChoice(null); setChoiceChecked(false) }
        else if (idx === 4) { setFinalTyped(''); setFinalChecked(false); setFinalCorrect(null) }
    }

    // "Назад" — реальный откат на предыдущий шаг: hadMistake НЕ сбрасывается
    // (та же конвенция, что и в тренажёрных разборах — факт уже сделанной
    // ошибки не стирается тем, что пользователь решил пересмотреть шаг).
    const handleBack = () => {
        if (!canGoBack) return
        const target = stepIndex - 1
        bumpNonce(`step-${target}`)
        resetStepState(target)
        resetStepState(stepIndex)
        setStepIndex(target)
    }

    return (
        <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-1.5">
                {Array.from({ length: STEP_COUNT }).map((_, i) => (
                    <span
                        key={i}
                        className={cn(
                            'h-2 rounded-full transition-all',
                            i < stepIndex ? 'w-6 bg-[#A1D151]' : i === stepIndex ? 'w-6 bg-[#4A90D9]' : 'w-2 bg-[#3A464E]'
                        )}
                    />
                ))}
            </div>

            {/* Условие целиком — постоянный контекст сверху, без маркера;
                конкретные фразы цитируются по кусочкам в самом логе ниже
                (см. ConditionCitation), тот же приём, что и во втором
                разборе. */}
            <div className="w-full rounded-xl border-2 border-[#3A464E] bg-[#161F23] px-4 py-3 text-center text-sm md:text-base text-[#F2F7FB] leading-relaxed">
                <HighlightedNumbersText text="Основания равнобедренной трапеции равны 43 и 73. Косинус острого угла трапеции равен $\dfrac{5}{7}$. Найдите боковую сторону." />
            </div>

            {/* ---------- накопительный лог ---------- */}
            <div className="w-full flex flex-col gap-4">

                {/* Шаг 0 — равнобедренность → диаграмма с подсветкой ног →
                    43/73 → диаграмма с числами. */}
                <SceneWrapper key="step-0" innerRef={sceneRef('step-0')} active={isSceneActive('step-0')}>
                    <Fragment key={`step-0-${nonceFor('step-0')}`}>
                        <DiagramBlock><TrapezoidDiagram /></DiagramBlock>

                        <ConditionCitation
                            text="Основания равнобедренной трапеции"
                            onSettled={() => setIntroReveal((r) => Math.max(r, 1))}
                        />

                        {introReveal >= 1 && (
                            <DiagramBlock onSettled={() => setIntroReveal((r) => Math.max(r, 2))}>
                                <TrapezoidDiagram legsHighlighted />
                            </DiagramBlock>
                        )}

                        {introReveal >= 2 && (
                            <ConditionCitation
                                text="равны 43 и 73"
                                onSettled={() => setIntroReveal((r) => Math.max(r, 3))}
                            />
                        )}

                        {introReveal >= 3 && (
                            <DiagramBlock onSettled={() => setIntroReveal(4)}>
                                <TrapezoidDiagram legsHighlighted base43Shown base73Shown />
                            </DiagramBlock>
                        )}
                    </Fragment>
                </SceneWrapper>

                {/* Шаг 1 — высоты → диаграмма → отрезки-подсказки → диаграмма. */}
                {stepIndex >= 1 && (
                    <SceneWrapper key="step-1" innerRef={sceneRef('step-1')} active={isSceneActive('step-1')}>
                        <Fragment key={`step-1-${nonceFor('step-1')}`}>
                            <TypedLine
                                className="w-full text-base md:text-lg text-[#F2F7FB]"
                                text="Проведём две высоты из вершин меньшего основания."
                                onSettled={() => setHeightsReveal((r) => Math.max(r, 1))}
                            />

                            {heightsReveal >= 1 && (
                                <DiagramBlock onSettled={() => setHeightsReveal((r) => Math.max(r, 2))}>
                                    <TrapezoidDiagram legsHighlighted base43Shown base73Shown altitudesDrawn />
                                </DiagramBlock>
                            )}

                            {heightsReveal >= 2 && (
                                <TypedLine
                                    className="w-full text-base md:text-lg text-[#F2F7FB]"
                                    text="У основания образовались два равных отрезка по краям."
                                    onSettled={() => setHeightsReveal((r) => Math.max(r, 3))}
                                />
                            )}

                            {heightsReveal >= 3 && (
                                <DiagramBlock onSettled={() => setHeightsReveal(4)}>
                                    <TrapezoidDiagram legsHighlighted base43Shown base73Shown altitudesDrawn segmentsHighlighted />
                                </DiagramBlock>
                            )}
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 2 — длина отрезка (73-43)/2. */}
                {stepIndex >= 2 && (
                    <SceneWrapper key="step-2" innerRef={sceneRef('step-2')} active={isSceneActive('step-2')}>
                        <Fragment key={`step-2-${nonceFor('step-2')}`}>
                            <TypedLine
                                className="w-full text-base md:text-lg text-[#F2F7FB]"
                                text="Найдём длину каждого отрезка:"
                            />
                            <FormulaBlock latex={segmentFormula} innerRef={segmentFormulaRef} />
                            {!segmentChecked && (
                                <KeyboardInput value={segmentTyped} onChange={setSegmentTyped} disabled={false} showDisplay={false} allowNegative={false} />
                            )}
                            {segmentChecked && (
                                <div
                                    className={cn(
                                        'flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center',
                                        segmentCorrect ? 'bg-[#A1D15122] text-[#A1D151]' : 'bg-[#DC605B22] text-[#DC605B]'
                                    )}
                                >
                                    {segmentCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                    {segmentCorrect ? 'Верно!' : 'Правильный ответ: 15'}
                                </div>
                            )}
                            {segmentChecked && (
                                <DiagramBlock>
                                    <TrapezoidDiagram legsHighlighted base43Shown base73Shown altitudesDrawn segmentsHighlighted segmentValue="15" />
                                </DiagramBlock>
                            )}
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 3 — зум на треугольник → цитата про косинус → вопрос → выбор. */}
                {stepIndex >= 3 && (
                    <SceneWrapper key="step-3" innerRef={sceneRef('step-3')} active={isSceneActive('step-3')}>
                        <Fragment key={`step-3-${nonceFor('step-3')}`}>
                            <DiagramBlock onSettled={() => setChoiceReveal((r) => Math.max(r, 1))}>
                                <TrapezoidDiagram
                                    legsHighlighted base43Shown base73Shown altitudesDrawn segmentsHighlighted segmentValue="15"
                                    triangleHighlighted zoomTriangle hypotenuseFocused
                                />
                            </DiagramBlock>

                            {choiceReveal >= 1 && (
                                <ConditionCitation
                                    text="Косинус острого угла трапеции равен 5/7"
                                    onSettled={() => setChoiceReveal((r) => Math.max(r, 2))}
                                />
                            )}

                            {choiceReveal >= 2 && (
                                <TypedLine
                                    className="w-full text-base md:text-lg text-[#F2F7FB]"
                                    text="В прямоугольном треугольнике известны прилежащий катет (15) и косинус угла. Как найти боковую сторону — гипотенузу?"
                                    onSettled={() => setChoiceReveal(3)}
                                />
                            )}

                            {choiceReveal >= 3 && (
                                <div className="grid grid-cols-2 gap-3 w-full">
                                    {['15 · cos', '15 / cos'].map((option, idx) => (
                                        <AnimatedOptionButton
                                            key={idx}
                                            option={option}
                                            index={idx}
                                            onClick={() => !choiceChecked && setSelectedChoice(option)}
                                            isSelected={selectedChoice === option}
                                            isCorrect={choiceChecked && option === CORRECT_CHOICE}
                                            isWrong={choiceChecked && selectedChoice === option && option !== CORRECT_CHOICE}
                                            disabled={choiceChecked}
                                        />
                                    ))}
                                </div>
                            )}

                            {choiceChecked && (
                                <div
                                    className={cn(
                                        'flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center',
                                        selectedChoice === CORRECT_CHOICE ? 'bg-[#A1D15122] text-[#A1D151]' : 'bg-[#DC605B22] text-[#DC605B]'
                                    )}
                                >
                                    {selectedChoice === CORRECT_CHOICE ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                    {selectedChoice === CORRECT_CHOICE ? 'Верно!' : `Правильный ответ: ${CORRECT_CHOICE}`}
                                </div>
                            )}

                            {choiceChecked && (
                                <DiagramBlock>
                                    <TrapezoidDiagram legsHighlighted base43Shown base73Shown altitudesDrawn segmentsHighlighted segmentValue="15" triangleHighlighted />
                                </DiagramBlock>
                            )}
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 4 — финальная боковая сторона 15/(5/7). */}
                {stepIndex >= 4 && (
                    <SceneWrapper key="step-4" innerRef={sceneRef('step-4')} active={isSceneActive('step-4')}>
                        <Fragment key={`step-4-${nonceFor('step-4')}`}>
                            <TypedLine
                                className="w-full text-base md:text-lg text-[#F2F7FB]"
                                text="Подставим числа:"
                            />
                            <FormulaBlock latex={finalFormula} innerRef={finalFormulaRef} />
                            {!finalChecked && (
                                <KeyboardInput value={finalTyped} onChange={setFinalTyped} disabled={false} showDisplay={false} allowNegative={false} />
                            )}
                            {finalChecked && (
                                <div
                                    className={cn(
                                        'flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center',
                                        finalCorrect ? 'bg-[#A1D15122] text-[#A1D151]' : 'bg-[#DC605B22] text-[#DC605B]'
                                    )}
                                >
                                    {finalCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                    {finalCorrect ? 'Верно!' : 'Правильный ответ: 21'}
                                </div>
                            )}
                            {finalChecked && (
                                <DiagramBlock>
                                    <TrapezoidDiagram
                                        legsHighlighted base43Shown base73Shown altitudesDrawn segmentsHighlighted segmentValue="15"
                                        triangleHighlighted legValue="21"
                                    />
                                </DiagramBlock>
                            )}
                        </Fragment>
                    </SceneWrapper>
                )}
            </div>

            <div className="w-full flex items-center gap-2">
                <BackButton onClick={handleBack} disabled={!canGoBack} />
                {(() => {
                    if (stepIndex === 0) {
                        return (
                            <button type="button" onClick={goNext} disabled={introBusy}
                                className={walkthroughButtonClass(!introBusy)} style={walkthroughButtonStyle(!introBusy)}>
                                Дальше
                            </button>
                        )
                    }
                    if (stepIndex === 1) {
                        return (
                            <button type="button" onClick={goNext} disabled={heightsBusy}
                                className={walkthroughButtonClass(!heightsBusy)} style={walkthroughButtonStyle(!heightsBusy)}>
                                Дальше
                            </button>
                        )
                    }
                    if (stepIndex === 2) {
                        if (segmentChecked) {
                            return (
                                <button type="button" onClick={goNext}
                                    className={walkthroughButtonClass(true)} style={walkthroughButtonStyle(true)}>
                                    Дальше
                                </button>
                            )
                        }
                        const enabled = segmentTyped.trim().length > 0
                        return (
                            <button type="button" onClick={handleSegmentCheck} disabled={!enabled}
                                className={walkthroughButtonClass(enabled)} style={walkthroughButtonStyle(enabled)}>
                                Проверить
                            </button>
                        )
                    }
                    if (stepIndex === 3) {
                        if (choiceChecked) {
                            return (
                                <button type="button" onClick={goNext}
                                    className={walkthroughButtonClass(true)} style={walkthroughButtonStyle(true)}>
                                    Дальше
                                </button>
                            )
                        }
                        const enabled = !choiceBusy && selectedChoice !== null
                        return (
                            <button type="button" onClick={handleChoiceCheck} disabled={!enabled}
                                className={walkthroughButtonClass(enabled)} style={walkthroughButtonStyle(enabled)}>
                                Проверить
                            </button>
                        )
                    }
                    // stepIndex === 4
                    if (finalChecked) {
                        return (
                            <button type="button" onClick={handleFinish}
                                className={walkthroughButtonClass(true)} style={walkthroughButtonStyle(true)}>
                                Готово
                            </button>
                        )
                    }
                    const enabled = finalTyped.trim().length > 0
                    return (
                        <button type="button" onClick={handleFinalCheck} disabled={!enabled}
                            className={walkthroughButtonClass(enabled)} style={walkthroughButtonStyle(enabled)}>
                            Проверить
                        </button>
                    )
                })()}
            </div>
        </div>
    )
}
