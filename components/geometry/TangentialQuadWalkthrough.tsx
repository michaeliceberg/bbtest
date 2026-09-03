// components/geometry/TangentialQuadWalkthrough.tsx
//
// Второй интерактивный разбор по шагам — курс "ЕГЭ Математика Профиль" →
// Планиметрия → "Вписанная окружность" → challenge id=4594: "В
// четырёхугольник ABCD вписана окружность, AB=10, CD=16. Найдите
// периметр четырёхугольника ABCD."
//
// Переписан по итогам обратной связи — первая версия объясняла факт
// через "касательные из одной точки равны" + буквы a/b/c/d на чертеже,
// пользователь счёл это громоздким и просил ЕЩЁ проще: без терминов
// "касательная", без букв на чертеже — просто констатация факта
// ("вписана окружность возможно только если суммы противоположных
// сторон равны") текстом, с маркером-подсветкой конкретных фраз и
// мигающим "!" на главном выводе.
//
// Финальный ввод числами — не один "Проверить" на готовую формулу, а
// ДВА независимых клавиатурных ввода прямо в формулу с двумя "?"
// (AB=10 и CD=16, в ЛЮБОМ порядке — пользователь явно попросил, чтобы
// значения принимались независимо от того, какое из двух ввели первым),
// и только потом — обычный числовой ответ (периметр=52).

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css';
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KeyboardInput } from '@/app/lesson/keyboard-input'
import { HighlightedNumbersText } from '@/components/HighlightedNumbersText'
import { HighlightWord } from './WalkthroughMarker'
import { TangentialQuadDiagram, TangentialQuadVisual } from './TangentialQuadDiagram'

type Props = {
    onComplete: (allCorrect: boolean) => void
}

// Два независимых значения, которые нужно вписать в формулу P=2×(?+?) —
// порядок ввода не важен (сложение коммутативно, и пользователь явно
// попросил принимать оба варианта: "10 потом 16" или "16 потом 10").
const TARGET_VALUES = ['10', '16']

// Мигающий "!" — акцентирует ГЛАВНЫЙ вывод задачи (сумма противоположных
// сторон равна). Янтарный, не красный — не должен читаться как "ошибка".
const BlinkingExclaim = () => (
    <motion.span
        className="inline-block ml-1 font-black"
        style={{ color: '#FBBF24' }}
        animate={{ opacity: [1, 0.25, 1] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
    >!</motion.span>
)

const INTRO_TIMELINE = [350, 2050, 3750]  // шаг 0: маркер "вписана окружность" → маркер+"!" вывода → формула P=2(AB+CD)
const NUMBERS_TIMELINE = [300, 1900]       // шаг 1: маркер "AB=10,CD=16" + числа на чертеже → пауза

export const TangentialQuadWalkthrough = ({ onComplete }: Props) => {
    const [stepIndex, setStepIndex] = useState(0)
    const [typedAnswer, setTypedAnswer] = useState('')
    const [checked, setChecked] = useState(false)
    const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)
    const [hadMistake, setHadMistake] = useState(false)

    // Шаг 0: 0=ничего, 1=маркер "вписана окружность", 2=маркер+"!" на выводе, 3=формула P=2(AB+CD)
    const [introPhase, setIntroPhase] = useState(0)
    // Шаг 1: 0=ничего, 1=маркер "AB=10,CD=16" + числа на чертеже, 2=пауза (можно дальше)
    const [numbersPhase, setNumbersPhase] = useState(0)

    // Шаг 2 (двойной ввод в формулу) — независимое состояние, не часть
    // общего STEPS-цикла: два слота, каждый заполняется по отдельному
    // клавиатурному вводу, в любом порядке.
    const [doubleValues, setDoubleValues] = useState<(string | null)[]>([null, null])
    const [doubleTyped, setDoubleTyped] = useState('')
    const [doubleWrongFlash, setDoubleWrongFlash] = useState(false)

    useEffect(() => {
        if (stepIndex !== 0) return
        setIntroPhase(0)
        const timers = INTRO_TIMELINE.map((t, i) => setTimeout(() => setIntroPhase(i + 1), t))
        return () => timers.forEach(clearTimeout)
    }, [stepIndex])

    useEffect(() => {
        if (stepIndex !== 1) return
        setNumbersPhase(0)
        const timers = NUMBERS_TIMELINE.map((t, i) => setTimeout(() => setNumbersPhase(i + 1), t))
        return () => timers.forEach(clearTimeout)
    }, [stepIndex])

    const doubleBothFilled = doubleValues[0] !== null && doubleValues[1] !== null

    const conditionCircleMarkerActive = stepIndex === 0 && introPhase >= 1
    const explainMarkerActive = stepIndex === 0 && introPhase >= 2
    const numbersMarkerActive = stepIndex >= 1

    const numbersShown = stepIndex >= 1
    const perimeterValue = stepIndex === 3 && checked && lastCorrect !== null ? '52' : null

    const visual: TangentialQuadVisual = { numbersShown, perimeterValue }

    const introBusy = stepIndex === 0 && introPhase < INTRO_TIMELINE.length
    const numbersBusy = stepIndex === 1 && numbersPhase < NUMBERS_TIMELINE.length

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

    // Формула шага 2 — "?" подставляются РЕАЛЬНЫМИ введёнными числами по
    // мере заполнения слотов (не обязательно в порядке AB→CD, а в
    // порядке фактического ввода пользователя).
    const doubleFormula = `$P = 2\\times(${doubleValues[0] ?? '?'}+${doubleValues[1] ?? '?'})$`

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

            {/* Условие — постоянно видно; маркер переключается между
                "вписана окружность" (шаг 0) и "AB=10, CD=16" (шаг 1+). */}
            <div className="w-full rounded-xl border-2 border-[#3A464E] bg-[#161F23] px-4 py-3 text-center text-sm md:text-base text-[#F2F7FB] leading-relaxed">
                <HighlightWord active={conditionCircleMarkerActive}>В четырёхугольник <Latex>{'$ABCD$'}</Latex> вписана окружность</HighlightWord>,{' '}
                <HighlightWord active={numbersMarkerActive}><HighlightedNumbersText text="AB=10, CD=16" /></HighlightWord>.
                {' '}Найдите периметр четырёхугольника <Latex>{'$ABCD$'}</Latex>.
            </div>

            <TangentialQuadDiagram {...visual} />

            {/* Шаг 0 — объяснение факта простыми словами, без терминов */}
            {stepIndex === 0 && introPhase >= 2 && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full text-center text-base md:text-lg text-[#F2F7FB]"
                >
                    Это возможно только если{' '}
                    <HighlightWord active={explainMarkerActive}>суммы противоположных сторон РАВНЫ</HighlightWord>
                    <BlinkingExclaim />
                </motion.div>
            )}
            {stepIndex === 0 && introPhase >= 3 && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full text-center text-base md:text-lg text-[#F2F7FB]"
                >
                    Поэтому AB+CD = BC+AD. А периметр — сумма всех сторон, значит:
                </motion.div>
            )}
            {stepIndex === 0 && introPhase >= 3 && (
                <div className="text-xl md:text-2xl font-bold text-[#F2F7FB] py-1 text-center">
                    <Latex>{'$P = 2\\times(AB+CD)$'}</Latex>
                </div>
            )}

            {/* Шаг 1 — просто держим паузу, пока числа появляются на чертеже */}
            {stepIndex === 1 && (
                <div className="w-full text-center text-base md:text-lg text-[#F2F7FB]">
                    Теперь у нас есть конкретные числа.
                </div>
            )}

            {/* Шаг 2 — формула с двумя независимыми "?", заполняются по одному */}
            {stepIndex === 2 && (
                <>
                    <div className="text-2xl md:text-3xl font-bold text-[#F2F7FB] py-1 text-center">
                        <Latex>{doubleFormula}</Latex>
                    </div>
                    {!doubleBothFilled && (
                        <KeyboardInput value={doubleTyped} onChange={setDoubleTyped} disabled={false} />
                    )}
                    {doubleWrongFlash && (
                        <div className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center bg-[#DC605B22] text-[#DC605B]">
                            <X className="w-5 h-5" /> Это не одна из данных сторон — попробуй ещё
                        </div>
                    )}
                </>
            )}

            {/* Шаг 3 — финальный числовой ответ (периметр) */}
            {stepIndex === 3 && (
                <>
                    <div className="w-full text-center text-base md:text-lg text-[#F2F7FB]">
                        Теперь вычислим:
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-[#F2F7FB] py-1 text-center">
                        <Latex>{'$P = 2\\times(10+16) = ?$'}</Latex>
                    </div>
                    <KeyboardInput value={typedAnswer} onChange={setTypedAnswer} disabled={checked} />
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
                </>
            )}

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
