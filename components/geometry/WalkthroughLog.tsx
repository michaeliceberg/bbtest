// components/geometry/WalkthroughLog.tsx
//
// Общие строительные блоки "накопительного" лога для ВСЕХ интерактивных
// разборов по шагам — и курсовых (TangentialQuadWalkthrough,
// TrapezoidWalkthrough), и тренажёрных (SINWALK/LOGWALK/LOGSUBWALK/
// LOGDEFWALK/LOGPOWWALK, app/t-lesson/[t_lessonId]/type-*walk.tsx). Принцип
// (по прямой просьбе пользователя, обкатан на TangentialQuadWalkthrough):
// текст решения печатается по буквам (Typewriter) и НЕ стирается по
// мере перехода к следующему шагу — новые блоки дописываются НИЖЕ уже
// показанных, страница сама скроллит к новому блоку так, чтобы он был
// примерно посередине экрана (см. useSceneFocus). Ссылка на
// условие — не сдвиг маркера по статичному тексту, а НОВАЯ короткая
// цитата с оранжевой пометкой "Условие" рядом. Если диаграмма меняется —
// рисуется НОВый экземпляр ниже, старый не трогается.

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import Latex from 'react-latex-next'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { HighlightWord } from './WalkthroughMarker'
import { Typewriter } from './Typewriter'
import { GGEGE_PALETTE } from '@/src/constants/lessonButtonColors'
import { LOTTIE_STEP_BY_STEP_FIERY_LIST, getRandomLottie } from '@/src/constants/lottieConstants'
import { cn } from '@/lib/utils'

// lottie-react трогает document при монтировании — статический импорт в
// SSR-путь уже не раз ронял dev/prod в этом проекте (см. CLAUDE.md,
// TrainerMascot.tsx и др.), поэтому всегда через dynamic(ssr:false).
const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

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

// Подписи той же кнопки "Дальше", но ПОСЛЕ НЕВЕРНОГО ответа тренировочного
// задания — по прямой просьбе пользователя (2026-09-19, "текст будет не
// тот же самый подбадривающий... а например 'Да понял я, понял'/
// 'Андестенд'") другой тон: не поздравление ("Изи"/"Погнали" после ошибки
// читалось бы как издёвка), а зумерское "принял, проехали" — согласие с
// объяснением, не самопохвала. Отдельный пул, чтобы не смешивать с
// WALKTHROUGH_NEXT_PHRASES.
export const WALKTHROUGH_WRONG_NEXT_PHRASES = [
    'Да понял я, понял',
    'Андестенд',
    'Кэп, принято',
    'Всё, звучит логично',
    'Ясно-понятно',
    'Затер себе на подкорку',
    'Ну лан, погнали дальше',
    'Чекнул, го дальше',
    'Забрал урок',
    'Мотаю на ус',
    'Слышь, ну ладно',
    'Бывает, го дальше',
];

export const pickWalkthroughWrongLabel = (defaultLabel: string, chance: number = 0.4): string => {
    if (Math.random() < chance) {
        return WALKTHROUGH_WRONG_NEXT_PHRASES[Math.floor(Math.random() * WALKTHROUGH_WRONG_NEXT_PHRASES.length)];
    }
    return defaultLabel;
};

// Транзиентный (автоматически гаснущий) баннер при клике на НЕВЕРНЫЙ
// вариант в режиме "пробуй, пока не угадаешь" тренировочных заданий —
// по прямой просьбе пользователя (2026-09-20) отдельный зумерский пул,
// не смешивается ни с WALKTHROUGH_WRONG_NEXT_PHRASES (та — тон кнопки
// "Дальше" ПОСЛЕ завершения попытки), ни с CORRECT_FEEDBACK_PHRASES.
export const WRONG_TRY_PHRASES = [
    'О нет, попробуй ещё',
    'Мимо, го ещё разок',
    'Не в этот раз, бро',
    'Упс, не то',
    'Стоп, не он — пробуй дальше',
    'Мимо кассы',
    'Ауч, давай ещё раз',
    'Неа, не считово',
    'Промах — пробуй дальше',
    'Так не пойдёт, го снова',
    'Кринж, но бывает — пробуй ещё',
    'Не туда, чекни другой',
];

export const pickWrongTryPhrase = (): string => {
    return WRONG_TRY_PHRASES[Math.floor(Math.random() * WRONG_TRY_PHRASES.length)];
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
// а не остаётся узкой "таблеткой" по центру. h-[52px] — явная высота
// (вместо одного лишь py-3, которое давало высоту от line-height текста)
// — нужна, чтобы иконочные BackButton/ReplayButton рядом (их контент —
// иконка 20px, не строка текста) могли совпасть по высоте день-в-день, а
// не только по py-* (см. их же комментарий: без явной высоты кнопки
// расходились на 2px — 50px у иконочных vs 52px у этой, пойман
// пользователем визуально).
export const walkthroughButtonClass = (enabled: boolean) => cn(
    'flex-1 h-[52px] flex items-center justify-center rounded-lg font-bold text-lg transition-all duration-200 active:translate-y-1',
    enabled ? 'bg-[#A1D151] text-[#151F24] cursor-pointer' : 'bg-[#3A464E] text-[#F2F7FB] cursor-not-allowed opacity-90',
);
export const walkthroughButtonStyle = (enabled: boolean): { boxShadow: string } => ({
    boxShadow: enabled ? '0 4px 0 #876E4A' : '0 4px 0 #1A2A3A',
});

// ===== "Фокус" на текущей сцене накопительного лога — по прямой просьбе
// пользователя (2026-09-18): когда начинается новая сцена, все ПРЕДЫДУЩИЕ
// становятся бледнее (opacity), чтобы взгляд сразу понимал, куда смотреть
// теперь; плюс автоскролл, чтобы новая сцена оказалась ПОСЕРЕДИНЕ экрана
// (не внизу, см. useEffect ниже). Общий кусок для ВСЕХ разборов —
// тренажёрных (SINWALK/LOGWALK/LOGDEFWALK/LOGSUBWALK/LOGPOWWALK) и
// курсовых (TrapezoidWalkthrough/TangentialQuadWalkthrough, 2026-09-19) —
// каждый передаёт свой `latestKey` (какая сцена сейчас новая) и
// `contentSettled` (напечатался ли текст текущей сцены — см. ниже, зачем).
//
// "Назад" (см. BackButton) больше НЕ живёт в этом хуке — по прямой
// просьбе пользователя (2026-09-19, "надо сделать полный шаг назад,
// чтобы сцена начала заново проигрываться, а последнюю сцену стереть")
// кнопка "назад" стала настоящим откатом РЕАЛЬНОГО состояния
// (step/trialIndex и т.п.), а не просто визуальным "полистать". Раз
// откат состояния всегда РЕАЛЕН, "активная" сцена — просто latestKey
// БЕЗ отдельного focusedKey/goBack — сцены, которых больше нет
// (step/trialIndex откатились до них), сами перестают рендериться. Сам
// откат состояния — уникальный для каждого разбора (свои квизы/answers)
// и реализован в каждом type-*walk.tsx отдельно, эта функция уже не
// про него.
export function useSceneFocus(latestKey: string, contentSettled: boolean) {
    const refs = useRef<Record<string, HTMLDivElement | null>>({})
    const isActive = (key: string) => key === latestKey
    const sceneRef = (key: string) => (el: HTMLDivElement | null) => { refs.current[key] = el }

    // Скроллим к САМОЙ СЦЕНЕ (не к маркеру в конце лога) — раньше
    // useStickToBottom целился в пустой `endRef`, стоящий ПОСЛЕДНИМ в
    // потоке (сразу за ним в DOM только кнопочная панель) — центрировать
    // точку, под которой физически нет контента, browser не может
    // (скролл упирается в максимум раньше, чем достигает центра) —
    // реальная причина жалобы "новая сцена внизу экрана". У самой сцены
    // есть протяжённость, такой проблемы нет. Срабатывает дважды: сразу
    // по появлению (сцена уже примерно на месте) и повторно, когда
    // contentSettled меняется (текст дописан начисто — на случай если
    // печать текста успела подрасти высоту уже после первого скролла).
    useEffect(() => {
        refs.current[latestKey]?.scrollIntoView({ behavior: 'auto', block: 'center' })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [latestKey, contentSettled])

    return { isActive, sceneRef }
}

// Счётчики "повторов" на ключ сцены — раньше жили только в SINWALK (для
// кнопки "Повторить"), теперь общие: тот же механизм двигает и
// "Повторить", и полный откат "назад" (обоим нужно ПЕРЕМОНТИРОВАТЬ
// содержимое сцены, чтобы её анимация — Typewriter/DiagramBlock/
// NumSticker bounce — проигралась заново, а не осталась в уже
// осевшем состоянии). Key самой сцены/SceneWrapper — СТАБИЛЬНЫЙ (`step-N`,
// без nonce), а вложенный внутрь неё контент — `key={`step-N-${nonceFor('step-N')}`}`.
export function useReplayNonces() {
    const [nonces, setNonces] = useState<Record<string, number>>({})
    const bump = (key: string) => setNonces((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }))
    const nonceFor = (key: string) => nonces[key] ?? 0
    return { bump, nonceFor }
}

// Обёртка ОДНОЙ сцены лога — тускнеет, когда перестаёт быть "текущей" (см.
// useSceneFocus). Key/ref на НЕЙ обязаны быть СТАБИЛЬНЫМИ (не завязаны на
// replay-nonce конкретного разбора, см. SINWALK) — иначе клик "Повторить"
// пересоздавал бы саму обёртку вместе с DOM-узлом, который нужен для
// скролла "назад", вместо того чтобы пересоздавать только содержимое.
export const SceneWrapper = ({ active, innerRef, children }: { active: boolean; innerRef?: React.Ref<HTMLDivElement>; children: React.ReactNode }) => (
    <motion.div
        ref={innerRef}
        animate={{ opacity: active ? 1 : 0.4 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        className="w-full flex flex-col gap-4"
    >
        {children}
    </motion.div>
)

// Общий визуальный язык квадратных иконочных кнопок (Back/Replay) — та
// же boxShadow-"ступенька" + active:translate-y-1, что и у зелёной
// walkthroughButtonClass (см. её комментарий выше) вместо старого
// border-2/border-b-4 — тот старый вариант был на 2px ниже зелёной
// кнопки (50px vs 52px, border добавлял высоту в layout, boxShadow — нет)
// и визуально "гулял" по высоте относительно неё, что и заметил
// пользователь. h-[52px] — та же явная высота, что и у walkthroughButtonClass.
const iconButtonClass = (disabled: boolean | undefined) => cn(
    'shrink-0 w-12 h-[52px] rounded-lg transition-all duration-200 active:translate-y-1 flex items-center justify-center',
    disabled ? 'bg-[#3A464E] text-[#5C6B73] cursor-not-allowed opacity-90' : 'bg-[#1B252B] text-[#9AA7B0] hover:text-[#F2F7FB] cursor-pointer',
)
const iconButtonStyle = (disabled: boolean | undefined): { boxShadow: string } => ({
    boxShadow: disabled ? '0 4px 0 #1A2A3A' : '0 4px 0 #0A1216',
})

// Кнопка-стрелка "назад" — реальный откат к предыдущей сцене (см.
// useSceneFocus выше) — ставится РЯДОМ с ReplayButton там, где она есть,
// и отдельно там, где её нет.
export const BackButton = ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title="Вернуться к предыдущей сцене"
        className={iconButtonClass(disabled)}
        style={iconButtonStyle(disabled)}
    >
        <ArrowLeft className="w-5 h-5" />
    </button>
)

// Кнопка "повторить" — переигрывает анимацию ТЕКУЩЕЙ (уже показанной)
// сцены заново, не трогая состояние (в отличие от BackButton, которая
// откатывает состояние на предыдущую сцену). Раньше жила только локально
// в SINWALK — по прямой просьбе пользователя ("почему в этом stepbystep
// нет кнопки повтора") обобщена сюда и подключена во всех разборах:
// вызывающий просто зовёт `bumpNonce(latestSceneKey)` (та же пара из
// useReplayNonces(), что уже используется для отката BackButton'ом), не
// трогая ни `step`, ни ответы — сцена ремонтируется с тем же состоянием,
// проигрывая entrance-анимацию (Typewriter/DiagramBlock/NumSticker bounce)
// заново.
export const ReplayButton = ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title="Повторить анимацию"
        className={iconButtonClass(disabled)}
        style={iconButtonStyle(disabled)}
    >
        <RotateCcw className="w-5 h-5" />
    </button>
)

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

// Milestone-проверка для "огненной" анимации-подбадривания
// (FieryCelebration ниже) в тренировочных заданиях разбора — по прямой
// просьбе пользователя: на первом упражнении (1/N) и далее на каждом
// четвёртом (1, 4, 8, 12...). trialIndex — 0-индексированный (как везде
// в этих файлах: `i`/`trialIndex` в цикле по trials/trialConfigs), внутри
// переводится в порядковый номер упражнения (1-индекс) для сравнения.
export function isFieryMilestoneTrial(trialIndex: number): boolean {
    const n = trialIndex + 1
    return n === 1 || n % 4 === 0
}

// "Огненная" анимация-подбадривание — редкий, более выразительный акцент
// поверх обычного LocalAnswerConfetti, показывается ТОЛЬКО на milestone-
// заданиях (см. isFieryMilestoneTrial у вызывающей стороны — сам
// компонент ничего не проверяет, родитель монтирует его условно). Каждое
// появление выбирает СВОЙ случайный файл из 7 присланных пользователем
// (public/Lottie/stepByStepFiery/) — не персистентный на весь урок,
// родитель монтирует этот компонент заново на каждый milestone. Играет
// один раз (loop=false) и самоубирается по СОБСТВЕННОМУ событию
// завершения анимации (onComplete из lottie-react), а не по таймеру —
// надёжнее произвольно угаданной длительности.
export const FieryCelebration = () => {
    const [lottieData] = useState(() => getRandomLottie(LOTTIE_STEP_BY_STEP_FIERY_LIST))
    const [done, setDone] = useState(false)
    if (done) return null
    return (
        <div className="pointer-events-none fixed inset-0 z-[65] flex items-center justify-center">
            <div className="w-48 h-48 md:w-64 md:h-64">
                <Lottie animationData={lottieData} loop={false} autoplay onComplete={() => setDone(true)} />
            </div>
        </div>
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
