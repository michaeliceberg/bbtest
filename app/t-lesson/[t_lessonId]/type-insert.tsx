// app/t-lesson/[t_lessonId]/type-insert.tsx
//
// Тип задания INSERT: формула с 1 или 2 пропущенными буквами-переменными
// (см. lib/formulaLetters.ts), под ней — кнопки-буквы на выбор. Тот же
// флоу ответа, что у ASSIST (onOptionSelected/isAnswerChecked/
// isAnswerCorrect приходят сверху из trainer-question.tsx, кнопка
// "ответить" общая).
//
// При 2 пропусках буквы заполняются по очереди слева направо — активный
// (ожидающий буквы) пропуск подсвечен ярче второго. Правильность
// проверяется БЕЗ учёта того, в какой конкретно пропуск какая буква
// попала: обе загаданные буквы всегда берутся из одного слитного
// произведения (mgh = m·g·h), а порядок сомножителей не важен —
// "mgh" и "hgm" одинаково верны (см. lib/formulaLetters.ts).

import React, { useState, useRef, useLayoutEffect } from 'react'
import { QuestionType } from './page'
import { AnimatedOptionButton } from '@/components/AnimatedOptionButton'
import { motion } from 'framer-motion'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css';

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onOptionSelected?: (answer: string | null) => void
    isAnswerChecked?: boolean
    isAnswerCorrect?: boolean
}

const ACTIVE_COLOR = '#4A90D9'
const PENDING_COLOR = '#5C6B73'
const CORRECT_COLOR = '#A1D151'
const WRONG_COLOR = '#DC605B'
const BLANK_COLORS = [ACTIVE_COLOR, PENDING_COLOR, CORRECT_COLOR, WRONG_COLOR]

// Пунктирное подчёркивание вместо сплошного \underline (KaTeX не умеет
// dashed-линии как отдельный стиль без \trust, который react-latex-next
// не пробрасывает) — три маленьких \rule-штриха, поставленные под
// буквой/? через \underset. Цвет — через общий \color снаружи, он
// каскадируется и на буквы, и на сами rule-штрихи.
const DASH = '\\rule[0pt]{0.22em}{0.09em}'
const DASH_ROW = `${DASH}\\mkern3mu${DASH}\\mkern3mu${DASH}`

const hexToRgb = (hex: string): string => {
    const n = parseInt(hex.slice(1), 16)
    return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
}
const BLANK_COLORS_RGB = BLANK_COLORS.map(hexToRgb)

export const TypeInsert = ({
    question,
    onAnswer,
    onOptionSelected,
    isAnswerChecked = false,
}: Props) => {
    const correctLetters = question.insertCorrectLetters ?? []
    const blankCount = correctLetters.length || 1

    const [filledLetters, setFilledLetters] = useState<(string | null)[]>(
        () => Array.from({ length: blankCount }, () => null)
    )
    // Какой пропуск сейчас "целевой" для следующего клика по букве — раньше
    // им управлял indexOf(null), из-за чего после заполнения ВСЕХ пропусков
    // (activeBlankIndex вставал в -1) клик по любой ДРУГОЙ букве ничего не
    // делал: приходилось сначала кликнуть по уже выбранной, чтобы её снять,
    // и только тогда выбирать новую. Явный activeSlot всегда указывает
    // куда именно попадёт следующий клик, поэтому переключение работает
    // одним кликом даже когда все пропуски уже заполнены.
    const [activeSlot, setActiveSlot] = useState(0)
    const [showResult, setShowResult] = useState(false)

    // Тот же паттерн, что в type-assist.tsx: эффект двунаправленный, иначе
    // showResult может залипнуть true при key-ремаунте на новый вопрос.
    React.useEffect(() => {
        setShowResult(isAnswerChecked)
    }, [isAnswerChecked])

    const handleLetterClick = (letter: string) => {
        if (showResult) return
        if (filledLetters[activeSlot] === letter) return // уже стоит в активном пропуске

        const next = [...filledLetters]
        // Если эта буква уже стоит в ДРУГОМ пропуске — освобождаем его
        // (буква "переезжает" в активный пропуск, а не дублируется).
        const usedAt = next.indexOf(letter)
        if (usedAt !== -1) next[usedAt] = null
        next[activeSlot] = letter
        setFilledLetters(next)

        // Переключаемся на следующий пустой пропуск; если пустых больше
        // нет — остаёмся на только что заполненном, чтобы повторный клик
        // по другой букве сразу же заменял именно его.
        const nextEmpty = next.indexOf(null)
        setActiveSlot(nextEmpty !== -1 ? nextEmpty : activeSlot)

        if (next.every((l) => l !== null)) {
            // Порядок неважен — сравниваем как множество букв (см. шапку
            // файла), поэтому отправляем отсортированный список.
            onOptionSelected?.([...next].sort().join(','))
        } else {
            onOptionSelected?.(null)
        }
    }

    const blankColor = (i: number): string => {
        const filled = filledLetters[i]
        if (showResult) {
            if (!filled) return PENDING_COLOR
            return correctLetters.includes(filled) ? CORRECT_COLOR : WRONG_COLOR
        }
        if (filled) return ACTIVE_COLOR
        return i === activeSlot ? ACTIVE_COLOR : PENDING_COLOR
    }

    // Формула — ОДНА скомпилированная KaTeX-строка (не разбита на
    // сегменты — так было в предыдущей версии, но это ЛОМАЕТ формулы,
    // где пропуск сидит ВНУТРИ вложенной группы наравне с обычным
    // текстом, например `\sqrt{\frac{\boxed{\phantom{1}}}{k}}`: разрыв
    // сырой строки ровно на маркере даёт несбалансированные половинки
    // ("\frac{" без закрытия в одном фрагменте, "}{k}}" с лишней
    // закрывающей скобкой в другом) — баг, пойманный пользователем
    // живьём на формуле периода колебаний (2π√(m/k)). KaTeX/react-latex-next
    // корректно рендерит ЛЮБУЮ вложенность только когда получает формулу
    // целиком одним вызовом — поэтому анимация "только буквы" ниже
    // сделана НЕ через раздельные React-узлы на пропуск, а через прямой
    // Web Animations API вызов на уже отрисованном KaTeX-узле (см.
    // useLayoutEffect ниже) — форма формулы всегда остаётся
    // единственным источником истины для корректности рендера.
    const displayedFormula = React.useMemo(() => {
        let formula = question.blankedFormula ?? ''
        for (let i = 0; i < blankCount; i++) {
            const marker = i + 1
            const filled = filledLetters[i]
            const color = blankColor(i)
            const glyph = filled ?? '?'
            formula = formula.replace(
                `\\boxed{\\phantom{${marker}}}`,
                `\\color{${color}}{\\underset{${DASH_ROW}}{${glyph}}}`
            )
        }
        return formula
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [question.blankedFormula, filledLetters, showResult])

    const containerRef = useRef<HTMLDivElement>(null)
    const prevFilledRef = useRef<(string | null)[]>(filledLetters)

    // Каждый пропуск — единственный узел формулы с явным инлайновым
    // `\color{...}` (обычный текст формулы KaTeX-цвет не задаёт вообще,
    // наследует текущий) — поэтому все "цветные" span'ы внутри контейнера,
    // в порядке DOM (совпадает с порядком пропусков слева направо),
    // однозначно соответствуют пропускам 0..blankCount-1, без хрупкой
    // привязки к внутренней структуре/классам KaTeX.
    useLayoutEffect(() => {
        const container = containerRef.current
        if (!container) return
        const blankNodes = Array.from(container.querySelectorAll<HTMLElement>('[style*="color"]'))
            .filter((el) => BLANK_COLORS_RGB.includes(el.style.color))

        const prev = prevFilledRef.current
        filledLetters.forEach((letter, i) => {
            const node = blankNodes[i]
            if (!node) return
            if (letter !== prev[i]) {
                // Буква (или "?") в этом пропуске реально изменилась —
                // слайд сверху с естественным замедлением ТОЛЬКО на этом
                // узле, соседние пропуски и остальная формула не
                // затронуты (WAAPI анимирует конкретный DOM-элемент
                // напрямую, минуя React/framer-motion — обходит и разрыв
                // вложенности выше, и застревание repeat:Infinity, см.
                // ниже про покачивание).
                node.animate(
                    [
                        { opacity: 0, transform: 'translateY(-20px)' },
                        { opacity: 1, transform: 'translateY(0)' },
                    ],
                    { duration: 420, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
                )
            }
            // Покачивание активного пропуска — тот же класс, что и раньше
            // (.animate-insert-wobble, чистый CSS @keyframes, см.
            // app/globals.css), теперь навешивается/снимается напрямую на
            // найденный узел, а не через React className — независимо от
            // того, как формула скомпилирована в разметку.
            node.classList.toggle('animate-insert-wobble', !showResult && i === activeSlot)
        })
        prevFilledRef.current = filledLetters
    }, [filledLetters, activeSlot, showResult])

    return (
        <div className="mt-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                ref={containerRef}
                className="flex items-center justify-center py-6 px-4 mb-6 bg-[#161F23] border-2 border-[#3A464E] rounded-xl text-2xl md:text-3xl text-[#F2F7FB]"
            >
                <Latex>{displayedFormula || ''}</Latex>
            </motion.div>

            <motion.div
                className="grid grid-cols-2 gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
            >
                {question.options.map((option, idx) => {
                    const usedAt = filledLetters.indexOf(option)
                    const isUsed = usedAt !== -1
                    return (
                        <AnimatedOptionButton
                            key={idx}
                            option={option}
                            onClick={() => handleLetterClick(option)}
                            index={idx}
                            isSelected={isUsed}
                            isCorrect={showResult && isUsed && correctLetters.includes(option)}
                            isWrong={showResult && isUsed && !correctLetters.includes(option)}
                            disabled={showResult}
                        />
                    )
                })}
            </motion.div>
        </div>
    )
}
