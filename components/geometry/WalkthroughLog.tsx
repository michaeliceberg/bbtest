// components/geometry/WalkthroughLog.tsx
//
// Общие строительные блоки "накопительного" лога для интерактивных
// разборов по шагам (TangentialQuadWalkthrough, TrapezoidWalkthrough) —
// вынесены при переносе принципа со второго разбора на первый, чтобы не
// дублировать одну и ту же хореографию/приёмы дважды. Принцип (по
// прямой просьбе пользователя, обкатан на TangentialQuadWalkthrough):
// текст решения печатается по буквам (Typewriter) и НЕ стирается по
// мере перехода к следующему шагу — новые блоки дописываются НИЖЕ уже
// показанных, страница сама скроллит вниз к новому блоку (пока
// пользователь сам не отскроллил вверх — useStickToBottom). Ссылка на
// условие — не сдвиг маркера по статичному тексту, а НОВАЯ короткая
// цитата с оранжевой пометкой "Условие" рядом. Если диаграмма меняется —
// рисуется НОВый экземпляр ниже, старый не трогается.

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Latex from 'react-latex-next'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'
import { HighlightWord } from './WalkthroughMarker'
import { Typewriter } from './Typewriter'
import { GGEGE_PALETTE } from '@/src/constants/lessonButtonColors'
import { cn } from '@/lib/utils'

// Единый "цвет внимания" ("смотри сюда"/"важно") для всех разборов по
// шагам — оранжевый из «Палитры ggege» (см. CLAUDE.md), используется и
// здесь (BlinkingExclaim), и в других геометрических диаграммах (см.
// LEGS_HIGHLIGHT_COLOR в TrapezoidDiagram.tsx) — одна точка правды,
// чтобы цвет "важно/смотри сюда" не расходился по разным разборам.
export const ATTENTION_COLOR = GGEGE_PALETTE.orange.button

export const PENDING_COLOR = '#5C6B73'
export const CORRECT_COLOR = '#A1D151'
export const WRONG_COLOR = '#DC605B'
// Цвет мигающего курсора-приглашения "|" на месте ещё не введённого
// числового ответа (см. CURSOR_LATEX/useGlyphBlink ниже) — тот же синий
// акцент, что уже используется в проекте для "сюда сейчас вводим"
// (type-insert.tsx ACTIVE_COLOR).
export const ACTIVE_COLOR = '#4A90D9'

// Подписи кнопки "Дальше" в разборах по шагам — по прямой просьбе
// пользователя вместо всегда одинакового "Дальше" иногда показываем что-то
// живое ("Понятно", "Я понял"...), в т.ч. несколько зумерских словечек —
// тот же принцип разнообразия, что уже есть у MOTIVATIONAL_NEXT_PHRASES
// в usefulFunctions.ts, но с другим тоном (не "я молодец", а "ок, погнали
// дальше") — отдельный пул, не смешивается с тем.
export const WALKTHROUGH_NEXT_PHRASES = [
    'Понятно',
    'Давай дальше',
    'Я понял',
    'Пока легко',
    'Го дальше',
    'Всё чётко',
    'Норм, го',
    'Вкатился',
    'Погнали',
    'Изи',
];

// defaultLabel — обычное "Дальше"/"Готово" и т.п., chance — как часто
// вместо него показывать одну из фраз выше.
export const pickWalkthroughNextLabel = (defaultLabel: string, chance: number = 0.4): string => {
    if (Math.random() < chance) {
        return WALKTHROUGH_NEXT_PHRASES[Math.floor(Math.random() * WALKTHROUGH_NEXT_PHRASES.length)];
    }
    return defaultLabel;
};

// Кнопка "Дальше"/"Готово" разборов по шагам — по прямой просьбе
// пользователя (2026-09-18, "не очень похожа на кнопку") приведена к
// ТОЧНО ТОЙ ЖЕ 3D-псевдо-кнопке, что уже использует общая нижняя кнопка
// тренажёра (components/trainer-question.tsx, getButtonColor/style —
// boxShadow-"ступенька" + active:translate-y-1, а не border-b-4), с теми
// же цветами (light-green #A1D151/тёмная тень #876E4A когда активна,
// нейтральный #3A464E/#1A2A3A пока задизейблена) — единый визуальный
// язык вместо своих произвольных цветов на каждый разбор. w-full/flex-1
// (не max-w-xs, как было раньше) — растягивается на всю ширину контента,
// а не остаётся узкой "таблеткой" по центру.
export const walkthroughButtonClass = (enabled: boolean) => cn(
    'flex-1 py-3 rounded-lg font-bold text-lg transition-all duration-200 active:translate-y-1',
    enabled ? 'bg-[#A1D151] text-[#151F24] cursor-pointer' : 'bg-[#3A464E] text-[#F2F7FB] cursor-not-allowed opacity-90',
);
export const walkthroughButtonStyle = (enabled: boolean): { boxShadow: string } => ({
    boxShadow: enabled ? '0 4px 0 #876E4A' : '0 4px 0 #1A2A3A',
});

// Конфетти на "локальный" верный ответ ВНУТРИ разбора по шагам — по
// прямой просьбе пользователя, во ВСЕХ таких разборах (SINWALK, LOGWALK
// и будущих): и на финальный итог обучающей части (например "Ответ:
// log₂15"), и на каждый верный ответ тренировочного задания. Легче, чем
// уже существующие Confetti в CaseReel.tsx/celebration.tsx (это частый,
// повторяющийся эффект внутри ОДНОГО урока, не разовое празднование
// завершения всего урока) — recycle=false (падает один раз и
// останавливается, не зацикливается), умеренное numberOfPieces. Родитель
// сам решает, когда монтировать/размонтировать (см. TypeSinWalk/
// TypeLogWalk — обычно "пока текущий шаг/задание видно").
export const LocalAnswerConfetti = () => {
    const { width, height } = useWindowSize()
    return (
        <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={130}
            gravity={0.25}
            style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 60 }}
        />
    )
}

// Похвала за верный ответ в тренировочных заданиях разбора — по прямой
// просьбе пользователя вместо всегда одинакового "Верно!" — живые
// зумерские фразы-подбадривания. Гендерно-нейтральные (не "красавчик"/
// "красавица" и т.п.) — пол пользователя не угадываем. Список расширен
// (2026-09-19, по прямой просьбе пользователя — "Бомба" повторялась
// слишком часто) — больше вариантов снижает шанс подряд идущего повтора
// одной и той же фразы на нескольких заданиях одного урока.
export const CORRECT_FEEDBACK_PHRASES = [
    'Верно!',
    'Красава!',
    'Молоток!',
    'Огонь!',
    'Топчик!',
    'Бомба!',
    'Изи!',
    'В точку!',
    'Отпадно!',
    'Красота!',
    'Шик!',
    'Пушка!',
    'Мощно!',
    'Круто!',
    'Респект!',
    'Шаришь!',
    'Вот это да!',
    'Сила!',
    'Годнота!',
    'На волне!',
    'Всё по красоте!',
];

// Тот же приём, что в type-insert.tsx (трейнер) — цвет пропуска задаётся
// через \textcolor и потом ищется в уже отрисованном KaTeX по СВОЕМУ
// computed-цвету (браузер всегда возвращает rgb(), не исходный hex).
export const hexToRgb = (hex: string): string => {
    const n = parseInt(hex.slice(1), 16)
    return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
}
export const PENDING_COLOR_RGB = hexToRgb(PENDING_COLOR)
export const ACTIVE_COLOR_RGB = hexToRgb(ACTIVE_COLOR)

// LaTeX-кусок пустого пропуска — пробел (\;) + синий мигающий "|" —
// вместо статичного "?", который никак не сообщал, что сюда нужно
// что-то ввести (по прямой просьбе пользователя, "надо чтобы было более
// user friendly"). Мигание применяется отдельно, см. useGlyphBlink.
export const CURSOR_LATEX = `\\;\\textcolor{${ACTIVE_COLOR}}{|}`

// Находит в уже отрисованном KaTeX (внутри containerRef) узел-глиф "|"
// нужного цвета и включает мигание — тот же WAAPI/класс-приём, что и у
// .animate-blank-blink/.animate-insert-float (react-latex-next не
// мемоизирует рендер, поэтому переприкладываем и через useLayoutEffect
// сразу после изменения, и интервалом-подстраховкой). В отличие от
// AB/CD-мигания в TangentialQuadWalkthrough — тут не нужно выбирать
// АКТИВНОГО из нескольких кандидатов: пока формула не проверена и ничего
// не набрано, курсор в ней всегда ровно один.
export function useGlyphBlink(containerRef: React.RefObject<HTMLElement | null>, deps: unknown[]) {
    const apply = () => {
        const container = containerRef.current
        if (!container) return
        // KaTeX в математическом режиме рендерит "|" не буквальной
        // вертикальной чертой, а своим каноничным глифом "∣" (U+2223,
        // "divides") — textContent содержит именно ЭТОТ символ, не
        // исходный "|" из LaTeX-строки; сравнение только с "|" никогда
        // не совпадало, мигание тихо не включалось.
        Array.from(container.querySelectorAll<HTMLElement>('[style*="color"]'))
            .filter((el) => el.style.color === ACTIVE_COLOR_RGB && (el.textContent === '|' || el.textContent === '∣'))
            .forEach((el) => el.classList.add('animate-caret-blink'))
    }
    useLayoutEffect(apply, deps) // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        const id = setInterval(apply, 400)
        return () => clearInterval(id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)
}

export const BlinkingExclaim = () => (
    <motion.span
        className="inline-block ml-1 font-black"
        style={{ color: ATTENTION_COLOR }}
        animate={{ opacity: [1, 0.25, 1] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
    >!</motion.span>
)

// Короткая цитата из условия — не всё условие, только та часть, которую
// сейчас разбираем; печатается по буквам, затем подсвечивается маркером.
export const ConditionCitation = ({ text, onSettled }: { text: string; onSettled?: () => void }) => {
    const [typed, setTyped] = useState(false)
    const [marked, setMarked] = useState(false)
    return (
        <div className="flex items-start gap-2.5 w-full">
            <span className="shrink-0 mt-[3px] text-[10px] font-bold uppercase tracking-wider" style={{ color: '#F0A868' }}>
                Условие
            </span>
            <div className="flex-1 text-sm md:text-base text-[#F2F7FB] leading-relaxed">
                <HighlightWord active={marked}>
                    <Typewriter
                        text={text}
                        cursor={!typed}
                        onDone={() => {
                            setTyped(true)
                            setTimeout(() => {
                                setMarked(true)
                                setTimeout(() => onSettled?.(), 700)
                            }, 200)
                        }}
                    />
                </HighlightWord>
            </div>
        </div>
    )
}

// Обычная печатаемая строка объяснения (без цитирования условия).
export const TypedLine = ({ text, className, onSettled, delayAfter = 500 }: { text: string; className?: string; onSettled?: () => void; delayAfter?: number }) => {
    return (
        <div className={className}>
            <Typewriter text={text} onDone={() => setTimeout(() => onSettled?.(), delayAfter)} />
        </div>
    )
}

// Печатаемая строка объяснения с ОДНОЙ ключевой фразой внутри — печатается
// целиком обычным Typewriter'ом (так печать не спотыкается о разметку
// посреди слова), а после завершения печати именно эта фраза заменяется на
// специально оформленную версию (жирный цвет, опционально мигающая) —
// привлекает внимание к новому термину. Параметризуема цветом, чтобы
// разные разборы переиспользовали один и тот же приём под свою
// терминологию/палитру (см. TypeSinWalk — "гипотенуза"/"противолежащий
// катет", каждая тем же цветом, что и её подпись на диаграмме).
export const TypedKeyPhraseLine = ({
    before, phrase, after = '.', color, pulse = false, highlight = false, className, onSettled,
}: {
    before: string; phrase: string; after?: string; color: string; pulse?: boolean; highlight?: boolean
    className?: string; onSettled?: () => void
}) => {
    const [typed, setTyped] = useState(false)
    return (
        <div className={className ?? 'w-full text-base md:text-lg text-[#F2F7FB]'}>
            {!typed ? (
                <Typewriter
                    text={`${before}${phrase}${after}`}
                    onDone={() => { setTyped(true); setTimeout(() => onSettled?.(), 450) }}
                />
            ) : (
                <>
                    {before}
                    {highlight ? (
                        <HighlightWord active color={color}>{phrase}</HighlightWord>
                    ) : pulse ? (
                        <motion.span
                            style={{ color, fontWeight: 800 }}
                            animate={{ opacity: [1, 0.4, 1] }}
                            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
                        >{phrase}</motion.span>
                    ) : (
                        <span style={{ color, fontWeight: 800 }}>{phrase}</span>
                    )}
                    {after}
                </>
            )}
        </div>
    )
}

const formulaBounce = {
    initial: { opacity: 0, y: 10, scale: 0.85 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { type: 'spring' as const, duration: 0.5, bounce: 0.4 },
}

// latex может меняться реактивно (например, живая подстановка цифр
// прямо в формулу) — сам блок при этом НЕ ремаунтится, входная
// bounce-анимация проигрывается один раз при первом появлении блока.
export const FormulaBlock = ({ latex, onSettled, innerRef, className }: { latex: string; onSettled?: () => void; innerRef?: React.Ref<HTMLDivElement>; className?: string }) => {
    useEffect(() => {
        const t = setTimeout(() => onSettled?.(), 550)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return (
        <motion.div
            ref={innerRef}
            initial={formulaBounce.initial}
            animate={formulaBounce.animate}
            transition={formulaBounce.transition}
            className={className ?? 'text-xl md:text-2xl font-bold text-[#F2F7FB] py-1 text-center w-full'}
        >
            <Latex>{latex}</Latex>
        </motion.div>
    )
}

// Обёртка для новой диаграммы-снимка в логе — сама диаграмма передаётся
// children'ом (разная для разных разборов), обёртка только даёт общий
// bounce/fade-эффект появления + сигнал "готово" в цепочку раскрытия.
export const DiagramBlock = ({ children, onSettled }: { children: React.ReactNode; onSettled?: () => void }) => {
    useEffect(() => {
        const t = setTimeout(() => onSettled?.(), 400)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="w-full"
        >
            {children}
        </motion.div>
    )
}

// Держит скролл страницы "прилипшим" к низу лога — но только пока
// пользователь сам не отскроллил вверх почитать предыдущие шаги; в этом
// случае автоскролл не мешает, а возобновляется, как только пользователь
// снова окажется у низа сам. block:'center' (не 'end') — новый блок
// должен оказаться примерно ПОСЕРЕДИНЕ экрана, а не впритык к нижнему
// краю (по прямой просьбе пользователя "скроль ещё дальше вниз").
export function useStickToBottom(deps: unknown[]) {
    const endRef = useRef<HTMLDivElement>(null)
    const stickRef = useRef(true)

    useEffect(() => {
        const onScroll = () => {
            const nearBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 120
            stickRef.current = nearBottom
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        if (!stickRef.current) return
        endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)

    return endRef
}
