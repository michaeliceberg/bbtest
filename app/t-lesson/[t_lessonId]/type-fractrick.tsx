// app/t-lesson/[t_lessonId]/type-fractrick.tsx
//
// Тип FRACTRICK — "умножить/разделить на унитарную дробь" (0,5/0,25/
// 0,125), ДВУХЭТАПНЫЙ:
//
// Этап 1 — переписать decimal дробью: "N × 0,25 = N × 1/?" (rightOp='/')
// или "N ÷ 0,5 = N × ?" (rightOp='times') — выбираем знаменатель,
// подтверждаем своей кнопкой "Ответить".
// Этап 2 — старая левая часть "N op decimal =" исчезает, а НЕ ВСЯ
// карточка целиком: по прямой просьбе пользователя ("хочется чтобы на
// ТОЙ же карточке сам текст вопроса сдвинулся левее, а не смахивался
// новой картой") — "N × 1/answer" остаётся ТЕМ ЖЕ, физически не
// перерисовывающимся фрагментом (свой собственный <Latex>, отдельный от
// исчезающего префикса), и к нему просто дорисовывается новый суффикс
// "= ?". Формула поэтому разбита на 3 независимых KaTeX-фрагмента в
// одном flex-ряду (prefix/middle/suffix) — не один монолитный
// <Latex>-вызов, как раньше: react-latex-next перекомпилирует ВЕСЬ
// переданный ему текст при любом изменении, поэтому единственный способ
// у части формулы физически "остаться на месте" — вообще не менять её
// props между этапами (middle рендерится идентично что при stage=1, что
// при stage=2). Уход префикса и приход суффикса — через AnimatePresence
// mode="popLayout": exit-анимация префикса тут декоративная (ничто не
// ждёт её завершения перед переходом дальше — сам переход этапов уже
// произошёл синхронно по клику кнопки), поэтому не подвержена
// задокументированному в проекте риску "exit никогда не завершается,
// стейт обгоняет DOM" — тот баг был именно про то, что ЛОГИКА ждала
// колбэк; здесь не ждёт никто.
//
// Только после второго подтверждения onAnswer('right'/'wrong') вызывается
// ОДИН раз на весь t_challenge — тот же принцип "самодостаточный
// многошаговый тип со своей кнопкой", что уже используется в
// type-multistep.tsx (ошибка на этапе 1 не прерывает прохождение,
// пользователь всё равно доходит до конца и видит верный ответ, но итог
// всего задания зависит от ОБОИХ этапов — hadMistake).
//
// Оператор/черта дроби — белые (нейтральные), N и пара decimal/ответ
// красятся по цветовому соответствию (см. FracTrickVisual в page.tsx),
// палитра варьируется между примерами. Клик по варианту мгновенно морфит
// "?" в цифру — та же WAAPI-анимация, что и у INSERT.

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css';
import { motion, AnimatePresence } from 'framer-motion'
import { AnimatedOptionButton } from '@/components/AnimatedOptionButton'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
}

// Цвет пропуска этапа 2 — там уже только ОДНО число без "парного"
// соответствия (в отличие от colorN/colorDecimal этапа 1), но он НЕ
// должен НИ СОВПАДАТЬ, НИ быть визуально ПОХОЖИМ ни на colorN, ни на
// colorDecimal конкретного примера: одинаковый (или "почти тот же")
// цвет в этом проекте читается как "это то же самое число" (см.
// FracTrickVisual в page.tsx), а результат этапа 2 — НОВОЕ, не связанное
// с ними число. Точное сравнение строк (a===c) ловило только буквальное
// совпадение хекса — пользователь поймал живьём случай, где выбранный
// "разный" янтарный (#F59E0B) был визуально почти неотличим от
// оранжевого colorN (#E8A23D) из той же палитры, хоть строки и не
// совпадали. Теперь сравниваем РАССТОЯНИЕ в RGB-пространстве и требуем
// от кандидата быть достаточно ДАЛЕКО от ОБОИХ цветов этапа 1 — не
// просто "не тем же самым hex".
const STAGE2_COLOR_CANDIDATES = ['#4A90D9', '#F59E0B', '#34D399', '#F472B6', '#818CF8', '#FB923C', '#EAB308', '#22D3EE']
const MIN_COLOR_DISTANCE = 100

const hexToRgbTuple = (hex: string): [number, number, number] => {
    const n = parseInt(hex.replace('#', ''), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const colorDistance = (a: string, b: string): number => {
    const [r1, g1, b1] = hexToRgbTuple(a)
    const [r2, g2, b2] = hexToRgbTuple(b)
    return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}

const pickStage2Color = (avoid: string[]): string => {
    const farEnough = STAGE2_COLOR_CANDIDATES.find((c) => avoid.every((a) => colorDistance(a, c) >= MIN_COLOR_DISTANCE))
    if (farEnough) return farEnough
    // Ни один кандидат не прошёл строгий порог (в теории возможно при
    // очень насыщенной палитре) — берём того, кто суммарно дальше всего
    // от обоих цветов этапа 1, а не первого попавшегося вслепую.
    return STAGE2_COLOR_CANDIDATES.reduce((best, c) => {
        const score = avoid.reduce((sum, a) => sum + colorDistance(a, c), 0)
        const bestScore = avoid.reduce((sum, a) => sum + colorDistance(a, best), 0)
        return score > bestScore ? c : best
    })
}

const CORRECT_COLOR = '#A1D151'
const WRONG_COLOR = '#DC605B'

const hexToRgb = (hex: string): string => {
    const n = parseInt(hex.replace('#', ''), 16)
    return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
}

// stage2Answer иногда дробный ("3,5") — голая запятая в KaTeX-формуле
// (в отличие от plain-text кнопок-вариантов ниже, которые НЕ проходят
// через реальный KaTeX, см. AnimatedOptionButton) получает лишний
// TeX-отступ после себя; {,} — та же самая конвенция, что уже
// используется у trick.decimal (см. DecimalDef.tex в rebuildFractionsUnit.ts).
const forKatex = (text: string) => text.replace(',', '{,}')

export const TypeFracTrick = ({ question, onAnswer }: Props) => {
    const trick = question.fracTrick
    const containerRef = useRef<HTMLDivElement>(null)

    const [stage, setStage] = useState<1 | 2>(1)
    const [stage1Selected, setStage1Selected] = useState<string | null>(null)
    const [stage1Checked, setStage1Checked] = useState(false)
    const [stage2Selected, setStage2Selected] = useState<string | null>(null)
    const [stage2Checked, setStage2Checked] = useState(false)
    const hadMistakeRef = useRef(false)
    const prevGlyphRef = useRef<string | null>(null)

    useEffect(() => {
        setStage(1)
        setStage1Selected(null)
        setStage1Checked(false)
        setStage2Selected(null)
        setStage2Checked(false)
        hadMistakeRef.current = false
        prevGlyphRef.current = null
    }, [question])

    if (!trick) return null

    const stage2Color = pickStage2Color([trick.colorN, trick.colorDecimal])

    // "Средний" фрагмент — знаменатель дроби этапа 1. Пока мы В этапе 1,
    // это активный пропуск (цвет trick.colorDecimal, либо CORRECT/WRONG
    // после проверки); как только переходим в этап 2 — навсегда
    // застывает на ПРАВИЛЬНОМ значении (trick.answer, не обязательно том,
    // что выбрал пользователь — тот же принцип, что и у MULTISTEP) в
    // своём "родном" цвете соответствия, без дальнейшей подсветки
    // верно/неверно (та уже была показана в момент проверки этапа 1).
    const middleGlyph = stage === 1 ? (stage1Selected ?? '?') : trick.answer
    const middleGlyphColor = stage === 1
        ? (stage1Checked ? (stage1Selected === question.correctAnswer ? CORRECT_COLOR : WRONG_COLOR) : trick.colorDecimal)
        : trick.colorDecimal

    const stage2Glyph = stage2Selected ?? '?'
    const stage2GlyphColor = stage2Checked
        ? (stage2Selected === trick.stage2Answer ? CORRECT_COLOR : WRONG_COLOR)
        : stage2Color

    // Активный (сейчас анимируемый падением сверху) глиф — только тот,
    // что реально меняется прямо сейчас: на этапе 1 это middleGlyph, на
    // этапе 2 — уже застывший middleGlyph больше не трогаем, анимируем
    // только stage2Glyph.
    const activeGlyph = stage === 1 ? middleGlyph : stage2Glyph
    const activeGlyphColorRgb = hexToRgb(stage === 1 ? middleGlyphColor : stage2GlyphColor)

    // Тот же приём, что в type-insert.tsx: находим узел(ы) формулы по
    // ТОЧНОМУ тексту глифа среди тех, что покрашены ЗАДАННЫМ цветом — не
    // по позиции (KaTeX иногда рендерит один и тот же глиф несколькими
    // соседними DOM-узлами). Цвет передаём явно (не берём из замыкания),
    // т.к. на этапе 2 на экране одновременно два разных "числа-ответа"
    // (застывший middleGlyph и активный stage2Glyph), у каждого свой цвет.
    const findGlyphNodes = (text: string, colorRgb: string): HTMLElement[] => {
        const container = containerRef.current
        if (!container) return []
        return Array.from(container.querySelectorAll<HTMLElement>('[style*="color"]'))
            .filter((el) => el.style.color === colorRgb && el.textContent === text)
    }

    // Три независимых KaTeX-фрагмента вместо одной строки — см. шапку
    // файла. prefix виден только на этапе 1, suffix — только на этапе 2;
    // middle виден ВСЕГДА и не меняет своих props между этапами (кроме
    // самого содержимого пропуска, который и должен морфиться).
    // \boldsymbol — по прямой просьбе пользователя сделать текст задания
    // жирнее (\huge меняет только размер, не насыщенность); оборачивает
    // ВЕСЬ фрагмент целиком, включая \dfrac — KaTeX корректно применяет
    // жирность и к числителю/знаменателю дроби, не только к плоским цифрам.
    const prefixFormula = `$\\huge \\boldsymbol{\\textcolor{${trick.colorN}}{${trick.n}} ${trick.op} \\textcolor{${trick.colorDecimal}}{${trick.decimal}} =}$`
    const middleFormula = trick.rightOp === '/'
        ? `$\\huge \\boldsymbol{\\textcolor{${trick.colorN}}{${trick.n}} \\times \\dfrac{1}{\\textcolor{${middleGlyphColor}}{${forKatex(middleGlyph)}}}}$`
        : `$\\huge \\boldsymbol{\\textcolor{${trick.colorN}}{${trick.n}} \\times \\textcolor{${middleGlyphColor}}{${forKatex(middleGlyph)}}}$`
    const suffixFormula = `$\\huge \\boldsymbol{= \\textcolor{${stage2GlyphColor}}{${forKatex(stage2Glyph)}}}$`

    // Тот же WAAPI-вход, что у первого заполнения пропуска в type-insert.tsx
    // (падение сверху с лёгким пружинным перехлёстом).
    useLayoutEffect(() => {
        if (activeGlyph !== '?' && activeGlyph !== prevGlyphRef.current) {
            findGlyphNodes(activeGlyph, activeGlyphColorRgb).forEach((node) => {
                node.animate(
                    [
                        { opacity: 0, transform: 'translateY(-20px)' },
                        { opacity: 1, transform: 'translateY(0)' },
                    ],
                    { duration: 420, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
                )
            })
        }
        prevGlyphRef.current = activeGlyph
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeGlyph])

    const handlePick = (option: string) => {
        if (stage === 1) {
            if (stage1Checked) return
            setStage1Selected(option)
        } else {
            if (stage2Checked) return
            setStage2Selected(option)
        }
    }

    const handleButtonClick = () => {
        if (stage === 1) {
            if (!stage1Checked) {
                if (stage1Selected === null) return
                if (stage1Selected !== question.correctAnswer) hadMistakeRef.current = true
                setStage1Checked(true)
                return
            }
            // "Далее" — старая левая часть уходит, средний фрагмент
            // застывает на месте, справа дорисовывается "= ?" (см. шапку
            // файла) — сама карточка не перемонтируется.
            setStage(2)
            setStage2Selected(null)
            setStage2Checked(false)
            prevGlyphRef.current = null
            return
        }

        if (!stage2Checked) {
            if (stage2Selected === null) return
            if (stage2Selected !== trick.stage2Answer) hadMistakeRef.current = true
            setStage2Checked(true)
            return
        }

        // "Готово" — итог всего задания зависит от ОБОИХ этапов (тот же
        // принцип hadMistake, что уже используется в type-multistep.tsx).
        onAnswer(hadMistakeRef.current ? 'wrong' : 'right')
    }

    const options = stage === 1 ? question.options : trick.stage2Options
    const checked = stage === 1 ? stage1Checked : stage2Checked
    const selected = stage === 1 ? stage1Selected : stage2Selected
    const correctValue = stage === 1 ? question.correctAnswer : trick.stage2Answer
    const isStepCorrect = checked ? selected === correctValue : null

    const buttonDisabled = !checked && selected === null
    const buttonLabel = !checked
        ? 'Ответить'
        : stage === 1
            ? 'Далее'
            : 'Готово'

    return (
        <div className="mt-6">
            <div className="flex items-center justify-center gap-1.5 mb-4">
                <span className={cn('h-2 w-6 rounded-full transition-all', stage >= 1 ? 'bg-[#4A90D9]' : 'bg-[#3A464E]')} />
                <span className={cn('h-2 w-6 rounded-full transition-all', stage >= 2 ? 'bg-[#4A90D9]' : 'bg-[#3A464E]')} />
            </div>

            <motion.div
                layout="position"
                ref={containerRef}
                transition={{ layout: { duration: 0.4, ease: 'easeInOut' } }}
                className="flex items-baseline justify-center flex-wrap gap-x-2 py-8 px-4 mb-6 bg-[#161F23] border-2 border-[#3A464E] rounded-xl text-[#F2F7FB] overflow-hidden"
            >
                {/* layout="position" (не просто layout) — принципиально:
                    обычный layout заставляет framer-motion интерполировать
                    scale между старым/новым размером бокса при ЛЮБОМ
                    изменении ширины контента, включая смену цифры внутри
                    одного и того же фрагмента (не только уход/приход
                    prefix/suffix) — а глифы KaTeX внутри НЕ являются
                    motion-компонентами и не участвуют в компенсирующем
                    масштабировании framer'а, поэтому визуально
                    "растягиваются" на время transition, если новая цифра
                    ощутимо шире старой (например "5"→"10", однозначное
                    → двузначное; на "5"→"8", той же ширины, эффект
                    незаметен — это и заметил пользователь). "position"
                    анимирует только смещение (нужное для реального
                    сценария — реакция на исчезновение prefix), но не сам
                    размер — смена ширины при новой цифре происходит
                    мгновенно, без растягивающего рескейла. */}
                <AnimatePresence mode="popLayout">
                    {stage === 1 && (
                        <motion.span
                            key="prefix"
                            layout="position"
                            initial={false}
                            exit={{ opacity: 0, x: -24, filter: 'blur(3px)' }}
                            transition={{ duration: 0.3 }}
                        >
                            <Latex>{prefixFormula}</Latex>
                        </motion.span>
                    )}
                </AnimatePresence>

                <motion.span layout="position">
                    <Latex>{middleFormula}</Latex>
                </motion.span>

                <AnimatePresence mode="popLayout">
                    {stage === 2 && (
                        <motion.span
                            key="suffix"
                            layout="position"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.15 }}
                        >
                            <Latex>{suffixFormula}</Latex>
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.div>

            <motion.div
                key={`${stage}-options`}
                className="grid grid-cols-2 gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
            >
                {options.map((option, idx) => (
                    <AnimatedOptionButton
                        key={idx}
                        option={option}
                        onClick={() => handlePick(option)}
                        index={idx}
                        isSelected={selected === option}
                        isCorrect={checked && option === correctValue}
                        isWrong={checked && selected === option && option !== correctValue}
                        disabled={checked}
                    />
                ))}
            </motion.div>

            {checked && (
                <div
                    className={cn(
                        'flex items-center gap-2 rounded-xl px-4 py-2 font-bold mt-4',
                        isStepCorrect ? 'bg-[#A1D15122] text-[#A1D151]' : 'bg-[#DC605B22] text-[#DC605B]'
                    )}
                >
                    {isStepCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    {isStepCorrect ? 'Верно!' : `Правильный ответ: ${correctValue}`}
                </div>
            )}

            <button
                type="button"
                onClick={handleButtonClick}
                disabled={buttonDisabled}
                className={cn(
                    'w-full py-3 mt-4 rounded-xl font-bold text-lg border-2 border-b-4 active:border-b-2 transition-colors',
                    buttonDisabled
                        ? 'bg-[#161F23] border-[#3A464E] text-[#5A6A72] cursor-not-allowed'
                        : 'bg-[#A1D151] border-[#78C93C] text-[#151F24]'
                )}
            >
                {buttonLabel}
            </button>
        </div>
    )
}
