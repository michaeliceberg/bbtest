// components/geometry/TangentialQuadWalkthrough.tsx
//
// Второй интерактивный разбор по шагам — курс "ЕГЭ Математика Профиль" →
// Планиметрия → "Вписанная окружность" → challenge id=4594: "В
// четырёхугольник ABCD вписана окружность, AB=10, CD=16. Найдите
// периметр четырёхугольника ABCD."
//
// Переписан на "накопительный" лог по прямой просьбе пользователя — по
// мотивам motion.dev "Typewriter: Natural Typing" (см. Typewriter.tsx):
// текст решения печатается по буквам, но НЕ стирается по мере перехода
// к следующему шагу — новые блоки дописываются НИЖЕ уже показанных, а
// страница сама скроллит вниз к новому блоку (только пока пользователь
// сам не проверял листать вверх — см. useStickToBottom). Каждая ссылка
// на условие — не сдвиг маркера по одному и тому же тексту, а НОВАЯ
// короткая цитата с оранжевой пометкой "Условие" рядом (не всё условие
// целиком, только тот кусочек, который сейчас подсвечивается — по
// уточнению пользователя в чате). Если картинка на этом шаге меняется —
// рисуется НОВый экземпляр диаграммы ниже, старый не трогается, так что
// прокрутив вверх видно, как чертёж выглядел на каждом этапе.
//
// Финальный ввод числами — не один "Проверить" на готовую формулу, а
// ДВА независимых клавиатурных ввода прямо в формулу с двумя "?"
// (AB=10 и CD=16, в ЛЮБОМ порядке), и только потом — обычный числовой
// ответ (периметр=52).

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css';
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KeyboardInput } from '@/app/lesson/keyboard-input'
import { HighlightedNumbersText } from '@/components/HighlightedNumbersText'
import { TangentialQuadDiagram } from './TangentialQuadDiagram'
import { Typewriter } from './Typewriter'
import {
    PENDING_COLOR, CORRECT_COLOR, WRONG_COLOR, PENDING_COLOR_RGB, CURSOR_LATEX,
    ConditionCitation, TypedLine, BlinkingExclaim, FormulaBlock, DiagramBlock, useStickToBottom, useGlyphBlink,
} from './WalkthroughLog'

type Props = {
    onComplete: (allCorrect: boolean) => void
}

// Два независимых значения, которые нужно вписать в формулу P=2×(?+?) —
// порядок ввода не важен (сложение коммутативно).
const TARGET_VALUES = ['10', '16']

// Печатаемая строка с эмоциональным акцентом на хвосте фразы — вместо
// маркера-цитаты (тот теперь зарезервирован под "Условие") здесь просто
// жирный янтарный цвет на выводе + мигающий "!" после того, как печать
// дошла до конца. Специфична для ЭТОГО разбора (конкретный текст про
// суммы противоположных сторон), поэтому не вынесена в общий файл.
const ExplainLine = ({ onSettled }: { onSettled?: () => void }) => {
    const [typed, setTyped] = useState(false)
    return (
        <div className="w-full text-base md:text-lg text-[#F2F7FB]">
            {!typed ? (
                <Typewriter
                    text="Это возможно только если суммы противоположных сторон равны!"
                    onDone={() => { setTyped(true); setTimeout(() => onSettled?.(), 500) }}
                />
            ) : (
                <>
                    Это возможно только если{' '}
                    <span style={{ color: '#FBBF24', fontWeight: 800 }}>суммы противоположных сторон равны</span>
                    <BlinkingExclaim />
                </>
            )}
        </div>
    )
}

export const TangentialQuadWalkthrough = ({ onComplete }: Props) => {
    const [stepIndex, setStepIndex] = useState(0)
    const [typedAnswer, setTypedAnswer] = useState('')
    const [checked, setChecked] = useState(false)
    const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)
    const [hadMistake, setHadMistake] = useState(false)

    // Раскрытие блоков внутри шага 0 (интро) — теперь по колбэкам onSettled
    // предыдущего блока, а не по фиксированным таймерам: печать занимает
    // разное время в зависимости от длины фразы, поэтому таймер был бы
    // либо слишком быстрым, либо слишком медленным.
    const [introReveal, setIntroReveal] = useState(0) // 0..3
    const [showFormula1, setShowFormula1] = useState(false)
    // Шаг 1: 0..2 (цитата "AB=10,CD=16" → диаграмма с числами → текст)
    const [numbersReveal, setNumbersReveal] = useState(0)

    const [doubleValues, setDoubleValues] = useState<(string | null)[]>([null, null])
    const [doubleTyped, setDoubleTyped] = useState('')
    const [doubleWrongFlash, setDoubleWrongFlash] = useState(false)

    const doubleBothFilled = doubleValues[0] !== null && doubleValues[1] !== null

    const introBusy = stepIndex === 0 && introReveal < 3
    const numbersBusy = stepIndex === 1 && numbersReveal < 3

    const handleObserveNext = () => {
        setStepIndex((i) => i + 1)
    }

    const handleDoubleSubmit = () => {
        const val = doubleTyped.trim().replace('.', ',')
        const already = doubleValues.filter((v): v is string => v !== null)
        const remaining = TARGET_VALUES.filter((v) => !already.includes(v))
        if (remaining.includes(val)) {
            const nextSlot = doubleValues[0] === null ? 0 : 1
            setDoubleValues((prev) => {
                const next = [...prev]
                next[nextSlot] = val
                return next
            })
            setDoubleTyped('')
        } else {
            setHadMistake(true)
            setDoubleWrongFlash(true)
            setTimeout(() => {
                setDoubleWrongFlash(false)
                setDoubleTyped('')
            }, 1200)
        }
    }

    const handleFinalCheck = () => {
        const correct = typedAnswer.trim().replace('.', ',') === '52'
        setLastCorrect(correct)
        setChecked(true)
        if (!correct) setHadMistake(true)
    }

    const handleFinalNext = () => {
        onComplete(!hadMistake)
    }

    // Вместо "?" — само имя стороны (AB/CD) бледно-серым, пока пропуск не
    // заполнен; активный пропуск заполняется первым (порядок ввода не
    // важен — принимается любое из двух чисел, см. handleDoubleSubmit),
    // и то, что печатается на клавиатуре, сразу видно ПРЯМО в формуле на
    // месте пропуска — отдельного "экранчика" с набранным числом больше
    // нет (см. KeyboardInput{showDisplay=false} ниже).
    const activeDoubleSlot: 0 | 1 = doubleValues[0] === null ? 0 : 1
    const slotContent = (slotIndex: 0 | 1, letters: string) => {
        const committed = doubleValues[slotIndex]
        if (committed !== null) return committed
        if (slotIndex === activeDoubleSlot && doubleTyped.length > 0) return doubleTyped
        return `\\textcolor{${PENDING_COLOR}}{${letters}}`
    }
    const doubleFormula = `$P = 2\\times(${slotContent(0, 'AB')}+${slotContent(1, 'CD')})$`
    const activeDoubleLetters = activeDoubleSlot === 0 ? 'AB' : 'CD'

    // Финальный ответ — раньше "?" всегда оставался статичным placeholder,
    // а набранное число показывалось в отдельном экранчике клавиатуры;
    // теперь набранные цифры сразу подставляются на место "?", а после
    // проверки ответ красится в цвет результата (зелёный/красный) — та же
    // самая \textcolor-логика, что и у пропусков выше. Пока не проверено —
    // курсор ВСЕГДА дописан СРАЗУ ПОСЛЕ уже набранных цифр (а не только
    // когда пусто) — по образцу motion.dev "Typewriter": курсор не
    // пропадает после первого символа, а продолжает мигать и сдвигается
    // вправо по мере ввода, показывая, где именно сейчас идёт набор.
    const finalAnswerContent = checked
        ? `\\textcolor{${lastCorrect ? CORRECT_COLOR : WRONG_COLOR}}{${typedAnswer || '?'}}`
        : `${typedAnswer}${CURSOR_LATEX}`
    const finalFormula = `$P = 2\\times(10+16) = ${finalAnswerContent}$`
    const finalFormulaRef = useRef<HTMLDivElement>(null)
    useGlyphBlink(finalFormulaRef, [typedAnswer, checked])

    // ---------- мигание активного пропуска (AB или CD) ----------
    // Тот же приём, что и у .animate-insert-wobble/.animate-insert-float в
    // трейнерном type-insert.tsx: KaTeX перерисовывает формулу целиком на
    // каждый ре-рендер (react-latex-next не мемоизирован), поэтому вручную
    // навешенный класс нужно переприкладывать — как через useLayoutEffect
    // сразу после смены состояния, так и лёгким интервалом-подстраховкой.
    const doubleFormulaRef = useRef<HTMLDivElement>(null)
    const applyBlinkClass = () => {
        const container = doubleFormulaRef.current
        if (!container) return
        const nodes = Array.from(container.querySelectorAll<HTMLElement>('[style*="color"]'))
            .filter((el) => el.style.color === PENDING_COLOR_RGB)
        // KaTeX рендерит "AB" не одним узлом с текстом "AB", а ДВУМЯ
        // соседними mathnormal-глифами "A" и "B" по отдельности — сравнение
        // node.textContent === 'AB' никогда бы не совпало. AB и CD не имеют
        // общих букв, поэтому достаточно проверить "буква входит в состав
        // активной пары" через includes на односимвольном textContent.
        nodes.forEach((node) => {
            const isActiveTarget = !doubleBothFilled && doubleTyped.length === 0 && activeDoubleLetters.includes(node.textContent || '')
            node.classList.toggle('animate-blank-blink', isActiveTarget)
        })
    }
    useLayoutEffect(() => {
        applyBlinkClass()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [doubleValues, doubleTyped, stepIndex])
    useEffect(() => {
        const id = setInterval(applyBlinkClass, 400)
        return () => clearInterval(id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [doubleValues, doubleTyped, stepIndex])

    const endRef = useStickToBottom([stepIndex, introReveal, numbersReveal, doubleBothFilled, doubleWrongFlash, checked])

    return (
        <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-1.5">
                {[0, 1, 2, 3].map((i) => (
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
                конкретные фразы из него дальше цитируются по кусочкам в
                самом логе (см. ConditionCitation), а не подсвечиваются
                прямо здесь. */}
            <div className="w-full rounded-xl border-2 border-[#3A464E] bg-[#161F23] px-4 py-3 text-center text-sm md:text-base text-[#F2F7FB] leading-relaxed">
                В четырёхугольник <Latex>{'$ABCD$'}</Latex> вписана окружность,{' '}
                <HighlightedNumbersText text="AB=10, CD=16" />.
                {' '}Найдите периметр четырёхугольника <Latex>{'$ABCD$'}</Latex>.
            </div>

            {/* ---------- накопительный лог ---------- */}
            <div className="w-full flex flex-col gap-4">

                <DiagramBlock><TangentialQuadDiagram /></DiagramBlock>

                <ConditionCitation
                    text="В четырёхугольник ABCD вписана окружность"
                    onSettled={() => setIntroReveal((r) => Math.max(r, 1))}
                />

                {introReveal >= 1 && (
                    <ExplainLine onSettled={() => setIntroReveal((r) => Math.max(r, 2))} />
                )}

                {introReveal >= 2 && (
                    <TypedLine
                        className="w-full text-base md:text-lg text-[#F2F7FB]"
                        text="Поэтому AB+CD = BC+AD. А периметр — сумма всех сторон, значит:"
                        onSettled={() => setShowFormula1(true)}
                    />
                )}

                {showFormula1 && (
                    <FormulaBlock latex="$P = 2\times(AB+CD)$" onSettled={() => setIntroReveal(3)} />
                )}

                {stepIndex >= 1 && (
                    <ConditionCitation
                        text="AB = 10, CD = 16"
                        onSettled={() => setNumbersReveal((r) => Math.max(r, 1))}
                    />
                )}

                {stepIndex >= 1 && numbersReveal >= 1 && (
                    <DiagramBlock onSettled={() => setNumbersReveal((r) => Math.max(r, 2))}>
                        <TangentialQuadDiagram numbersShown />
                    </DiagramBlock>
                )}

                {stepIndex >= 1 && numbersReveal >= 2 && (
                    <TypedLine
                        className="w-full text-base md:text-lg text-[#F2F7FB]"
                        text="Теперь у нас есть конкретные числа."
                        onSettled={() => setNumbersReveal(3)}
                    />
                )}

                {stepIndex >= 2 && (
                    <div className="w-full flex flex-col items-center gap-3">
                        <div ref={doubleFormulaRef} className="text-2xl md:text-3xl font-bold text-[#F2F7FB] py-1 text-center">
                            <Latex>{doubleFormula}</Latex>
                        </div>
                        {!doubleBothFilled && (
                            <KeyboardInput value={doubleTyped} onChange={setDoubleTyped} disabled={false} showDisplay={false} allowNegative={false} />
                        )}
                        {doubleWrongFlash && (
                            <div className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center bg-[#DC605B22] text-[#DC605B]">
                                <X className="w-5 h-5" /> Это не одна из данных сторон — попробуй ещё
                            </div>
                        )}
                    </div>
                )}

                {stepIndex >= 3 && (
                    <TypedLine
                        className="w-full text-base md:text-lg text-[#F2F7FB]"
                        text="Теперь вычислим:"
                    />
                )}

                {stepIndex >= 3 && (
                    <>
                        <FormulaBlock latex={finalFormula} innerRef={finalFormulaRef} />
                        <div className="w-full flex flex-col items-center gap-3">
                            <KeyboardInput value={typedAnswer} onChange={setTypedAnswer} disabled={checked} showDisplay={false} allowNegative={false} />
                            {checked && (
                                <div
                                    className={cn(
                                        'flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center',
                                        lastCorrect ? 'bg-[#A1D15122] text-[#A1D151]' : 'bg-[#DC605B22] text-[#DC605B]'
                                    )}
                                >
                                    {lastCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                    {lastCorrect ? 'Верно!' : 'Правильный ответ: 52'}
                                </div>
                            )}
                        </div>
                    </>
                )}

                <div ref={endRef} />
            </div>

            {(() => {
                if (stepIndex === 0) {
                    const disabled = introBusy
                    return (
                        <button type="button" onClick={handleObserveNext} disabled={disabled}
                            className={cn('w-full max-w-xs py-3 rounded-xl font-bold text-lg border-2 border-b-4 active:border-b-2 transition-colors',
                                disabled ? 'bg-[#161F23] border-[#3A464E] text-[#5A6A72] cursor-not-allowed' : 'bg-[#A1D151] border-[#78C93C] text-[#151F24]')}>
                            Дальше
                        </button>
                    )
                }
                if (stepIndex === 1) {
                    const disabled = numbersBusy
                    return (
                        <button type="button" onClick={handleObserveNext} disabled={disabled}
                            className={cn('w-full max-w-xs py-3 rounded-xl font-bold text-lg border-2 border-b-4 active:border-b-2 transition-colors',
                                disabled ? 'bg-[#161F23] border-[#3A464E] text-[#5A6A72] cursor-not-allowed' : 'bg-[#A1D151] border-[#78C93C] text-[#151F24]')}>
                            Дальше
                        </button>
                    )
                }
                if (stepIndex === 2) {
                    if (doubleBothFilled) {
                        return (
                            <button type="button" onClick={handleObserveNext}
                                className="w-full max-w-xs py-3 rounded-xl font-bold text-lg border-2 border-b-4 active:border-b-2 transition-colors bg-[#A1D151] border-[#78C93C] text-[#151F24]">
                                Дальше
                            </button>
                        )
                    }
                    const disabled = doubleTyped.trim().length === 0
                    return (
                        <button type="button" onClick={handleDoubleSubmit} disabled={disabled}
                            className={cn('w-full max-w-xs py-3 rounded-xl font-bold text-lg border-2 border-b-4 active:border-b-2 transition-colors',
                                disabled ? 'bg-[#161F23] border-[#3A464E] text-[#5A6A72] cursor-not-allowed' : 'bg-[#A1D151] border-[#78C93C] text-[#151F24]')}>
                            Проверить
                        </button>
                    )
                }
                // stepIndex === 3
                if (!checked) {
                    const disabled = typedAnswer.trim().length === 0
                    return (
                        <button type="button" onClick={handleFinalCheck} disabled={disabled}
                            className={cn('w-full max-w-xs py-3 rounded-xl font-bold text-lg border-2 border-b-4 active:border-b-2 transition-colors',
                                disabled ? 'bg-[#161F23] border-[#3A464E] text-[#5A6A72] cursor-not-allowed' : 'bg-[#A1D151] border-[#78C93C] text-[#151F24]')}>
                            Проверить
                        </button>
                    )
                }
                return (
                    <button type="button" onClick={handleFinalNext}
                        className="w-full max-w-xs py-3 rounded-xl font-bold text-lg border-2 border-b-4 active:border-b-2 transition-colors bg-[#A1D151] border-[#78C93C] text-[#151F24]">
                        Готово
                    </button>
                )
            })()}
        </div>
    )
}
