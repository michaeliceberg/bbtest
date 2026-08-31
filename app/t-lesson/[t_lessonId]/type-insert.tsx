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

import React, { useState, useRef, useLayoutEffect, useEffect } from 'react'
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

    // Находит узел(ы) формулы по ТОЧНОМУ тексту глифа, а не по позиции —
    // см. подробный комментарий у applyFloatClass ниже про то, почему
    // позиционный индекс здесь ненадёжен (KaTeX иногда рендерит один и
    // тот же "?" двумя соседними DOM-узлами, что при 2 пропусках сдвигает
    // всю последующую индексацию). У букв такой дубликации не бывает, и
    // при 2 пропусках буквы в них всегда РАЗНЫЕ (see handleLetterClick —
    // одинаковая буква не может стоять в двух пропусках одновременно),
    // поэтому поиск "узел с текстом ровно X" однозначно находит нужный
    // пропуск независимо от того, как физически устроена разметка KaTeX
    // и что происходит с ДРУГИМИ пропусками рядом.
    const findGlyphNodes = (text: string): HTMLElement[] => {
        const container = containerRef.current
        if (!container) return []
        return Array.from(container.querySelectorAll<HTMLElement>('[style*="color"]'))
            .filter((el) => BLANK_COLORS_RGB.includes(el.style.color) && el.textContent === text)
    }

    // Старая буква плавно тает клоном при СМЕНЕ уже заполненного пропуска
    // (не первом заполнении "?" → буква, для него остаётся вход сверху,
    // см. useLayoutEffect ниже) — снимок берётся ДО обновления state,
    // пока настоящий узел с текстом ещё есть в DOM. Клон — обычный
    // DOM-узел поверх формулы (position:absolute внутри containerRef,
    // ниже добавлен relative), не связан с React/KaTeX и сам себя убирает
    // по окончании анимации. Раньше буква схлопывалась в точку (scale→0)
    // — по отзыву пользователя заменено на простое затухание без scale,
    // симметрично тому, как новая буква ниже просто проявляется, а не
    // раскрывается из точки с bounce.
    const fadeOutOldGlyph = (oldLetter: string) => {
        const container = containerRef.current
        if (!container) return
        const node = findGlyphNodes(oldLetter)[0]
        if (!node) return

        const containerRect = container.getBoundingClientRect()
        const nodeRect = node.getBoundingClientRect()
        const computed = getComputedStyle(node)

        const clone = document.createElement('span')
        clone.textContent = node.textContent
        clone.style.position = 'absolute'
        clone.style.left = `${nodeRect.left - containerRect.left}px`
        clone.style.top = `${nodeRect.top - containerRect.top}px`
        clone.style.color = node.style.color
        clone.style.fontSize = computed.fontSize
        clone.style.fontFamily = computed.fontFamily
        clone.style.pointerEvents = 'none'
        clone.style.zIndex = '10'
        clone.style.display = 'inline-block'
        container.appendChild(clone)

        const anim = clone.animate(
            [
                { opacity: 1 },
                { opacity: 0 },
            ],
            { duration: 220, easing: 'ease-out' }
        )
        const cleanup = () => clone.remove()
        anim.onfinish = cleanup
        anim.oncancel = cleanup
        // Подстраховка: onfinish/oncancel WAAPI-анимации не всегда надёжно
        // срабатывают (замечено живьём при частых повторных кликах —
        // клон оставался в DOM навсегда, хотя сама анимация визуально
        // отыгрывала) — clone.remove() безопасно вызвать повторно на уже
        // удалённом узле, поэтому setTimeout-подстраховка не мешает
        // штатному срабатыванию onfinish, только гарантирует итог.
        setTimeout(cleanup, 260)
    }

    const handleLetterClick = (letter: string) => {
        if (showResult) return
        if (filledLetters[activeSlot] === letter) return // уже стоит в активном пропуске

        const oldLetter = filledLetters[activeSlot]
        if (oldLetter !== null) {
            fadeOutOldGlyph(oldLetter)
        }

        const next = [...filledLetters]
        // Если эта буква уже стоит в ДРУГОМ пропуске — освобождаем его
        // (буква "переезжает" в активный пропуск, а не дублируется).
        const usedAt = next.indexOf(letter)
        if (usedAt !== -1) next[usedAt] = null
        next[activeSlot] = letter
        setFilledLetters(next)

        // Пока есть пустые пропуски — переключаемся на следующий пустой
        // (обычный порядок заполнения слева направо). Когда пропуски
        // ВСЕ заполнены — целевой пропуск идёт "по кругу" (0→1→0→1→…),
        // а не залипает на последнем заполненном: по просьбе пользователя
        // каждый следующий клик по варианту должен сдвигать позицию
        // заменяемой буквы, а не всегда бить по одному и тому же пропуску.
        const nextEmpty = next.indexOf(null)
        setActiveSlot(nextEmpty !== -1 ? nextEmpty : (activeSlot + 1) % blankCount)

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
    // \textcolor{...}{глиф} — БЕЗ \underset/подчёркивания: то оборачивало
    // букву во "над-под" группу, из-за которой KaTeX ужимал её мельче и
    // выше остальной формулы, вне общей базовой линии (жалоба пользователя
    // — "буква становится выше и меньше и не на одном уровне с другими").
    // Именно \textcolor (не \color) — по умолчанию KaTeX трактует
    // `\color{c}{arg}` как ОДНОАРГУМЕНТНЫЙ TeX-переключатель цвета (arg
    // после него — просто СОСЕДНЯЯ группа скобок, не аргумент самой
    // \color), из-за чего цвет "протекал" на СЛЕДУЮЩИЙ символ формулы,
    // пока не встретится следующий `\color{...}` — пойман живьём на
    // формуле "mgh" при двойном пропуске (m/h пропущены, средняя "g" не
    // должна была окраситься, но красилась в цвет ПЕРВОГО пропуска).
    // \textcolor — всегда явный двухаргументный вариант, применяет цвет
    // ТОЛЬКО к своему аргументу, без утечки на соседей.
    // Цвет сам по себе уже достаточно заметен как визуальная подсказка
    // "это пропуск"; недостающая аффорданс-подсказка "сюда нужно
    // вписать" компенсируется парящей анимацией пустого "?" (см.
    // .animate-insert-float в useLayoutEffect ниже) — эффект "плавающего
    // знака вопроса", который пользователь хотел, но не через LaTeX
    // (LaTeX/KaTeX не умеет непрерывную анимацию сам по себе — плавание
    // применяется отдельно, CSS-классом на уже отрисованном DOM-узле).
    const displayedFormula = React.useMemo(() => {
        let formula = question.blankedFormula ?? ''
        for (let i = 0; i < blankCount; i++) {
            const marker = i + 1
            const filled = filledLetters[i]
            const color = blankColor(i)
            const glyph = filled ?? '?'
            formula = formula.replace(
                `\\boxed{\\phantom{${marker}}}`,
                `\\textcolor{${color}}{${glyph}}`
            )
        }
        return formula
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [question.blankedFormula, filledLetters, showResult])

    const containerRef = useRef<HTMLDivElement>(null)
    const prevFilledRef = useRef<(string | null)[]>(filledLetters)

    // Раньше "какой DOM-узел соответствует какому пропуску" определялось
    // ПОЗИЦИЕЙ в плоском списке всех цветных узлов — ломалось при 2
    // пропусках: KaTeX иногда рендерит один и тот же "?" ДВУМЯ соседними
    // DOM-узлами (`mord`+`mclose`, оба с текстом "?" и тем же inline-
    // цветом — пойман живьём через прямой дамп DOM), из-за чего плоский
    // индекс `blankNodes[1]` для второго пропуска на самом деле указывал
    // на "лишний" второй узел ПЕРВОГО пропуска, а не на второй пропуск
    // вообще (баг, пойманный пользователем: "первый вопросик продолжает
    // качаться" после выбора буквы для него, второй — нет). Теперь вместо
    // позиции — поиск по ТОЧНОМУ ТЕКСТУ глифа (см. findGlyphNodes выше):
    // все узлы с текстом "?" плавают разом (пустых пропусков может быть
    // и 2 — не нужно знать, какой из них "первый/второй"), а под букву X
    // всегда находится узел с текстом ровно X, независимо от того, из
    // скольких DOM-узлов состоит СОСЕДНИЙ "?" пропуск.
    const applyFloatClass = () => {
        const container = containerRef.current
        if (!container) return
        const nodes = Array.from(container.querySelectorAll<HTMLElement>('[style*="color"]'))
            .filter((el) => BLANK_COLORS_RGB.includes(el.style.color))
        nodes.forEach((node) => {
            node.classList.toggle('animate-insert-float', !showResult && node.textContent === '?')
        })
    }

    useLayoutEffect(() => {
        const prev = prevFilledRef.current
        filledLetters.forEach((letter, i) => {
            if (letter === prev[i] || letter === null) return
            // Первое заполнение пустого "?" — буква падает сверху (как и
            // раньше, не жаловались). СМЕНА уже выбранной буквы на другую —
            // раньше новая буква раскрывалась из точки с bounce (её старая
            // версия тем временем схлопывалась в точку клоном) — по отзыву
            // пользователя убрано: теперь новая буква просто плавно
            // проявляется (opacity 0→1, без transform), симметрично тому,
            // что старая просто плавно тает (см. fadeOutOldGlyph выше).
            // WAAPI анимирует конкретный DOM-узел напрямую, минуя React/
            // framer-motion. Узел ищем по тексту НОВОЙ буквы (findGlyphNodes)
            // — буквы в разных пропусках всегда разные (см. handleLetterClick),
            // поэтому поиск однозначен даже без знания позиции этого
            // пропуска среди остальных.
            const isFirstFill = prev[i] === null
            findGlyphNodes(letter).forEach((node) => {
                node.animate(
                    isFirstFill
                        ? [
                            { opacity: 0, transform: 'translateY(-20px)' },
                            { opacity: 1, transform: 'translateY(0)' },
                        ]
                        : [
                            { opacity: 0 },
                            { opacity: 1 },
                        ],
                    isFirstFill
                        ? { duration: 420, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
                        : { duration: 260, easing: 'ease-in' }
                )
            })
        })
        applyFloatClass()
        prevFilledRef.current = filledLetters
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filledLetters, activeSlot, showResult])

    // Подстраховка: react-latex-next пересчитывает и подменяет innerHTML
    // формулы на КАЖДЫЙ ре-рендер родителя (katex.renderToString не
    // мемоизирован внутри библиотеки, и, судя по всему, даёт не побайтово
    // идентичную строку между вызовами) — даже когда сам LaTeX-текст не
    // менялся. Это тихо стирает вручную навешенный класс
    // .animate-insert-float, никак не задевая наш useLayoutEffect (его
    // зависимости filledLetters/activeSlot/showResult при этом не
    // меняются, поэтому он и не перезапускается, чтобы восстановить
    // класс). Найдено живьём — класс пропадал уже через доли секунды
    // после появления, независимо от логики эффекта. Лёгкий интервал
    // просто переприменяет класс по актуальному состоянию, не трогая
    // анимации выше.
    useEffect(() => {
        const id = setInterval(applyFloatClass, 400)
        return () => clearInterval(id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filledLetters, showResult])

    return (
        <div className="mt-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                ref={containerRef}
                className="relative flex items-center justify-center py-6 px-4 mb-6 bg-[#161F23] border-2 border-[#3A464E] rounded-xl text-2xl md:text-3xl text-[#F2F7FB]"
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
