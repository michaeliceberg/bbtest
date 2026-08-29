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

import React, { useState } from 'react'
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

// Пунктирное подчёркивание вместо сплошного \underline (KaTeX не умеет
// dashed-линии как отдельный стиль без \trust, который react-latex-next
// не пробрасывает) — три маленьких \rule-штриха, поставленные под
// буквой/? через \underset. Цвет — через общий \color снаружи, он
// каскадируется и на буквы, и на сами rule-штрихи.
const DASH = '\\rule[0pt]{0.22em}{0.09em}'
const DASH_ROW = `${DASH}\\mkern3mu${DASH}\\mkern3mu${DASH}`

// Непрерывное покачивание ТЕКУЩЕГО целевого пропуска (не просто цвет —
// пользователь явно попросил визуально показывать, какую позицию
// заменит следующий клик по букве, особенно важно при 2 пропусках,
// когда оба уже заполнены и неясно, что поменяется при выборе новой
// буквы). Покачивается "?" (ещё не заполнен) ИЛИ уже подставленная
// буква (если активный пропуск уже занят) — то же самое activeSlot,
// что уже управляет цветом.
//
// Реализовано ЧИСТЫМ CSS-keyframe (см. app/globals.css,
// .animate-insert-wobble), НЕ через framer-motion `repeat: Infinity` —
// последнее было опробовано первым и на практике залипало на одном
// кадре навсегда (проверено вживую: `getComputedStyle().transform`
// возвращал один и тот же угол много секунд подряд, анимация реально
// не крутилась, хотя framer-motion её формально запускал). CSS-анимация
// крутится на компоузере, независимо от React-рендер-цикла компонента.
function BlankGlyph({ glyph, color, isActive }: { glyph: string; color: string; isActive: boolean }) {
    // Покачивание включаем только ПОСЛЕ того, как буква долетела (иначе
    // падение и покачивание накладываются друг на друга и выглядят
    // хаотично) — onAnimationComplete framer-motion (для entrance-
    // анимации y/opacity, которая как раз НЕ бесконечная и поэтому не
    // страдает от того же залипания) сигналит, что можно включать CSS-
    // класс покачивания.
    const [settled, setSettled] = useState(false)
    return (
        <motion.span
            // key на саму букву — при КАЖДОЙ подстановке/смене буквы этого
            // конкретного пропуска React пересоздаёт именно этот маленький
            // узел (тот же паттерн key-ремаунта вместо AnimatePresence, что
            // и везде в проекте) и проигрывает entrance замедленным слайдом
            // сверху — ТОЛЬКО для этой буквы, соседние сегменты формулы не
            // трогаются и не перерисовываются. settled сбрасывается сам
            // собой при таком ремаунте (обычный useState на новом узле).
            key={glyph}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22, mass: 0.6 }}
            onAnimationComplete={() => setSettled(true)}
            className={`inline-block ${settled && isActive ? 'animate-insert-wobble' : ''}`}
        >
            <Latex>{`$\\color{${color}}{\\underset{${DASH_ROW}}{${glyph}}}$`}</Latex>
        </motion.span>
    )
}

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

    // Формула — НЕ одна скомпилированная KaTeX-строка (как было раньше),
    // а последовательность кусков: обычный (неизменный) текст формулы
    // рендерится через <Latex> как есть, а каждый пропуск — отдельный,
    // React-управляемый BlankGlyph-компонент того же массива. Только
    // так можно анимировать ИМЕННО букву при подстановке: KaTeX (через
    // react-latex-next) на каждое изменение строки перезаписывает ВЕСЬ
    // innerHTML синхронно — ни один кусок внутри одной скомпилированной
    // строки не переживает такую замену, значит и анимировать в ней
    // можно только весь блок целиком (так и было сделано в первой
    // версии — пользователь справедливо отверг: "не всю карточку, а
    // только букву"). Разбивка на сегменты по маркеру `\boxed{\phantom{N}}`
    // (тот же маркер, что уже кладёт lib/formulaLetters.ts в
    // question.blankedFormula) даёт каждому пропуску СВОЙ, отдельный
    // React-узел — react-latex-next не трогает соседние сегменты при
    // перерисовке одного из них, поэтому framer-motion animate на
    // BlankGlyph отвечает только за свою букву.
    const segments = React.useMemo(() => {
        // question.blankedFormula целиком — ОДНА пара "$...$" (чистая
        // формула-ответ, а не текст с математикой вперемешку, как у
        // question) — например "$ \huge \boxed{\phantom{1}}g$". Снимаем
        // внешние $ здесь и оборачиваем КАЖДЫЙ текстовый кусок между
        // пропусками СВОЕЙ независимой парой $...$ при рендере ниже —
        // без этого несбалансированный одиночный "$" в изолированном
        // фрагменте react-latex-next не распознаёт как математику и
        // показывает его сырым текстом (баг, пойманный живьём: "$ \huge"
        // рисовался буквально вместо перехода в math-режим).
        let raw = (question.blankedFormula ?? '').trim()
        if (raw.startsWith('$') && raw.endsWith('$')) raw = raw.slice(1, -1)
        return raw.split(/\\boxed\{\\phantom\{(\d+)\}\}/)
    }, [question.blankedFormula])

    return (
        <div className="mt-6">
            <div className="flex items-center justify-center flex-wrap py-6 px-4 mb-6 bg-[#161F23] border-2 border-[#3A464E] rounded-xl text-2xl md:text-3xl text-[#F2F7FB]">
                {segments.map((seg, i) => {
                    // Чётные индексы .split() — куски обычного текста формулы
                    // между пропусками (могут быть пустыми на краях строки).
                    if (i % 2 === 0) {
                        return seg ? <Latex key={`t${i}`}>{`$${seg}$`}</Latex> : null
                    }
                    // Нечётные — захваченный номер маркера (marker = i+1 при
                    // вставке, см. lib/formulaLetters.ts), переводим обратно
                    // в 0-based индекс пропуска.
                    const blankIdx = parseInt(seg, 10) - 1
                    const filled = filledLetters[blankIdx]
                    return (
                        <BlankGlyph
                            key={`b${blankIdx}`}
                            glyph={filled ?? '?'}
                            color={blankColor(blankIdx)}
                            isActive={!showResult && blankIdx === activeSlot}
                        />
                    )
                })}
            </div>

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
