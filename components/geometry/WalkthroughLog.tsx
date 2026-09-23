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
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
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
// `topPaddingVh` — необязательный, по умолчанию 22 (см. комментарий ниже)
// — величина верхнего отступа контейнера разбора в vh. Параметризован
// (а не жёстко зашит), потому что для НЕКОТОРЫХ разборов (см. SINWALK —
// короткая первая сцена "просто треугольник", по прямой просьбе
// пользователя "рисовать треугольник выше") 22vh пустого места перед
// самой первой, короткой сценой слишком много — остальные вызовы этого
// хука (LOGWALK/LOGDEFWALK/.../TrapezoidWalkthrough и т.д.) не передают
// этот параметр и получают ТОЧНО прежнее поведение.
export function useSceneFocus(latestKey: string, contentSettled: boolean, topPaddingVh: number = 22) {
    const refs = useRef<Record<string, HTMLDivElement | null>>({})
    const isActive = (key: string) => key === latestKey
    const sceneRef = (key: string) => (el: HTMLDivElement | null) => { refs.current[key] = el }

    // САМАЯ ПЕРВАЯ сцена лога рендерится СРАЗУ под уже видимым облаком
    // маскота (см. trainer-question.tsx) — по прямой жалобе пользователя
    // (2026-09-23, FARADAYWALK) ей НЕ нужны ни верхний паддинг контейнера
    // (создавал "огромное пустое пространство" перед текстом первой сцены),
    // ни автоскролл-центрирование — для высоких первых сцен (увеличенный
    // магнит) скролл уводил страницу ВНИЗ настолько, что облако с Лотти
    // пропадало из вида. Запоминаем ключ самой первой сцены ОДИН раз (при
    // первом рендере, синхронно, не в эффекте) и, пока latestKey всё ещё
    // указывает на неё — полностью пропускаем и паддинг, и скролл (эффект
    // на неё срабатывает дважды — на появление и на contentSettled, оба
    // раза должны быть пропущены). Начиная со ВТОРОЙ сцены — обычное
    // поведение, как и раньше: пользователь уже пролистал лог, мазкот
    // выше уже не единственная точка внимания.
    const firstKeyRef = useRef<string | null>(null)
    if (firstKeyRef.current === null) firstKeyRef.current = latestKey

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
    // Нижний край новой сцены ставим примерно на 3/4 высоты экрана (по
    // просьбе пользователя); первые сцены стартуют примерно с середины
    // экрана за счёт верхнего отступа — под ней остаётся место для кнопок ответа/
    // "Дальше". Если сцена выше 60% экрана — выравниваем по верху с
    // небольшим отступом. Чтобы вообще было куда скроллить (страница
    // кончается сразу за кнопками), контейнеру разбора один раз
    // добавляется большой нижний отступ.
    useEffect(() => {
        const el = refs.current[latestKey]
        if (!el) return
        if (latestKey === firstKeyRef.current) return
        const container = el.parentElement?.parentElement
        if (container && !container.dataset.scrollPad) {
            container.dataset.scrollPad = '1'
            container.style.paddingBottom = '60vh'
            container.style.paddingTop = `${topPaddingVh}vh`
        }
        const rect = el.getBoundingClientRect()
        const vh = window.innerHeight
        const delta = rect.height > vh * 0.6 ? rect.top - 72 : rect.bottom - vh * 0.75
        window.scrollBy({ top: delta, behavior: 'auto' })
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

// ===== Админская "карта этапов" — ШАБЛОННЫЙ переиспользуемый компонент
// (по прямой просьбе пользователя, утверждён на SINWALK 2026-09-23) —
// вертикальный столбик пронумерованных кружков-ссылок, позволяющий
// admin'у прыгать в любую сцену разбора, не проходя урок заново. Любой
// новый *WALK-разбор подключает его ОДНОЙ строкой:
//   {isAdmin && <AdminSceneMap entries={...} onJump={jumpToScene} disabled={advancing} />}
// без единого доп. ref/effect в самом файле разбора — вся логика (в т.ч.
// автоскролл активного кружка и позиционирование панели) — здесь.
//
// Цветовая конвенция (см. историю в CLAUDE.md): вводные/обучающие сцены —
// нейтральный серый (MAP_INTRO_COLOR), а ВЕСЬ тренировочный блок
// (сколько бы заданий в нём ни было) — ОДИН кружок красного цвета
// (MAP_PRACTICE_COLOR), не по кружку на каждое упражнение — иначе карта
// быстро раздувается для уроков с большим числом тренировочных заданий.
// Любые сцены ПОСЛЕ тренировки (recap/новый материал и т.п.) — снова
// серые, как и вводные, если явно не задумана своя роль.
export const MAP_INTRO_COLOR = '#8B98A1'
export const MAP_PRACTICE_COLOR = '#DC605B'

export type AdminMapEntry = { dotKey: string; label: string; jumpKey: string; isActive: boolean; color: string }

// Ширина панели (кружки + подписи) — совпадает с шириной spacer'а ниже
// (w-11 = 44px), одна константа вместо двух мест, которые могли бы
// разойтись.
const MAP_PANEL_WIDTH_PX = 44
// Суммарный горизонтальный отступ ОТ ВЬЮПОРТА до самого max-w-контейнера
// разбора — сумма ВСЕХ обёрточных px-* на пути от <body> до этого
// контейнера. Общий для ЛЮБОГО *WALK-разбора, т.к. все они рендерятся
// внутри ОДНОЙ и той же общей "оболочки вопроса"
// (components/trainer-question.tsx): px-4 (16px) на моушн-обёртке
// вопроса + px-1 (4px) на обёртке над ней = 20px с каждой стороны. Если
// эта оболочка когда-нибудь поменяет свои паддинги — поправить только
// здесь, один раз на все разборы.
const QUESTION_SHELL_INSET_PX = 20

export const AdminSceneMap = ({
    entries, onJump, disabled, containerMaxWidthRem = 46,
}: { entries: AdminMapEntry[]; onJump: (jumpKey: string) => void; disabled?: boolean; containerMaxWidthRem?: number }) => {
    // position:sticky для этой панели на практике НЕ работает — ближайший
    // "overflow-y-auto" предок (motion.div вопроса в components/trainer-
    // question.tsx) сам никогда не скроллится (его высота просто растёт
    // вместе с контентом внутри min-h-screen, а не h-screen с реально
    // ограниченной высотой) — реальный скролл идёт на уровне <html>.
    // sticky, посчитанный относительно якоря, который сам никогда не
    // скроллится, не отражает реальный скролл страницы вообще
    // (подтверждено живьём — top уезжал в -474px при scrollY=614) — карта
    // просто уезжала за пределы экрана вместо того, чтобы "тащиться" за
    // пользователем. Исправлено настоящим position:fixed — он всегда
    // честно относительно вьюпорта, "прикноплен" к экрану независимо от
    // прокрутки. Вертикально — по прямой просьбе пользователя, по центру
    // экрана (top:50%+translateY(-50%)), а не у верхнего края.
    //
    // Горизонталь (left) — ЧИСТЫЙ CSS calc(), НЕ JS-замер через ref. Первая
    // версия мерила позицию spacer'а через getBoundingClientRect() в
    // эффекте — и на телефоне после первой загрузки панель иногда не
    // появлялась вовсе (поворот экрана её "чинил"). Причина глубже, чем
    // просто "рано измерили": контейнер вопроса — framer-motion motion.div
    // со slide-in анимацией (x:100→0); ЛЮБОЙ ненулевой transform на
    // предке — по спецификации CSS — на время своего действия делает ЕГО
    // (а не вьюпорт) точкой отсчёта для ВСЕХ потомков с position:fixed.
    // Пока анимация играет (обычно доли секунды, но эффект тот же
    // механизм, что и сам баг), JS-замер попадал на непрогнозируемый
    // момент — то до, то после того как transform схлопнется обратно в
    // "none". Чистый calc() эту гонку не устраняет полностью (доля
    // секунды self-fix, как и у самого слайда текста), зато не зависит ни
    // от какого асинхронного момента ПОСЛЕ анимации — тот же результат,
    // что и у измерения, но БЕЗ состояния/эффекта/ререндера. Формула:
    // контейнер разбора — max-w-{containerMaxWidthRem}rem, отцентрирован
    // (mx-auto) внутри доступной ширины (100vw минус общий отступ
    // QUESTION_SHELL_INSET_PX с каждой стороны) — при СИММЕТРИЧНЫХ
    // отступах слева/справа центр контейнера совпадает с центром вьюпорта
    // (50vw) независимо от величины отступа, поэтому правый край
    // контейнера = 50vw + containerWidth/2, а left панели = этот край
    // минус её собственная ширина (панель — последний элемент в
    // flex-row, физически прижата к правому краю контейнера).
    const containerWidthCss = `min(calc(100vw - ${QUESTION_SHELL_INSET_PX * 2}px), ${containerMaxWidthRem}rem)`
    const panelLeftCss = `calc(50vw + (${containerWidthCss}) / 2 - ${MAP_PANEL_WIDTH_PX}px)`

    // Автопрокрутка карты к активному кружку — тот же ref+scrollIntoView
    // паттерн, что уже проверен в ChallengeNav (/lesson/376), срабатывает
    // на КАЖДУЮ смену активной сцены. Панель — настоящий position:fixed,
    // поэтому этот scrollIntoView трогает ТОЛЬКО собственный маленький
    // overflow-y-auto список кружков, не всю страницу.
    const activeDotRef = useRef<HTMLButtonElement>(null)
    const activeIdx = entries.findIndex((e) => e.isActive)
    const activeKey = entries[activeIdx]?.dotKey
    useEffect(() => {
        activeDotRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
    }, [activeKey])

    return (
        <>
            <div className="shrink-0" style={{ width: MAP_PANEL_WIDTH_PX }} />
            <div
                className="fixed z-30 flex flex-col items-center gap-1.5 py-2"
                style={{ top: '50%', left: panelLeftCss, transform: 'translateY(-50%)', width: MAP_PANEL_WIDTH_PX }}
            >
                <div className="text-[9px] text-[#6B7A83] font-bold tracking-wide mb-1">ЭТАПЫ</div>
                <div
                    className="flex flex-col items-center gap-2 max-h-[70vh] overflow-y-auto py-1 [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: 'none' }}
                >
                    {entries.map((entry, idx) => (
                        <button
                            key={entry.dotKey}
                            ref={entry.isActive ? activeDotRef : undefined}
                            type="button"
                            title={entry.label}
                            onClick={() => onJump(entry.jumpKey)}
                            disabled={disabled}
                            className="rounded-full transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center justify-center font-black leading-none"
                            style={{
                                width: entry.isActive ? 22 : 16,
                                height: entry.isActive ? 22 : 16,
                                fontSize: entry.isActive ? 10 : 8,
                                backgroundColor: entry.isActive ? entry.color : hexToRgba(entry.color, 0.4),
                                border: entry.isActive ? '2px solid #F2F7FB' : 'none',
                                color: '#F2F7FB',
                            }}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>
                <div className="text-[9px] text-[#6B7A83] mt-1 whitespace-nowrap">{activeIdx + 1}/{entries.length}</div>
            </div>
        </>
    )
}

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

// Milestone-проверка для "огненного" оформления фидбек-плашки
// (FieryFeedbackBanner ниже) в тренировочных заданиях разбора — по
// прямой просьбе пользователя: на первом упражнении (1/N) и далее на
// каждом четвёртом (1, 4, 8, 12...). trialIndex — 0-индексированный (как
// везде в этих файлах: `i`/`trialIndex` в цикле по trials/trialConfigs),
// внутри переводится в порядковый номер упражнения (1-индекс) для
// сравнения.
export function isFieryMilestoneTrial(trialIndex: number): boolean {
    const n = trialIndex + 1
    return n === 1 || n % 4 === 0
}

// Плашка с фидбеком на верный ответ тренировочного задания. Обычная
// (fiery=false) — тонкая однострочная плашка, как и была всегда.
// "Огненная" (fiery=true, только на milestone-заданиях — см.
// isFieryMilestoneTrial) — крупнее по высоте, текст сдвинут правее, а
// слева — зацикленный (loop, без остановки, пока плашка на экране)
// Lottie-ролик, случайно выбранный из 7 присланных пользователем
// (public/Lottie/stepByStepFiery/). Раньше "огненный" эффект был
// отдельным fullscreen-оверлеем (`FieryCelebration`) поверх всего экрана —
// по прямой просьбе пользователя (сливался с фоном, слишком навязчиво)
// заменён на этот инлайн-вариант внутри самой плашки.
// Облачко и Lottie появляются одновременно: ждём подгрузки модуля
// lottie-react (dynamic-импорт), только потом показываем банер.
export const useLottieModuleReady = (needed: boolean) => {
    const [ready, setReady] = useState(false)
    useEffect(() => {
        if (!needed) return
        import('lottie-react').then(() => setReady(true))
    }, [needed])
    return ready
}

export const FieryFeedbackBanner = ({ children, fiery = false }: { children: React.ReactNode; fiery?: boolean }) => {
    const [lottieData] = useState(() => (fiery ? getRandomLottie(LOTTIE_STEP_BY_STEP_FIERY_LIST) : null))
    const lottieReady = useLottieModuleReady(fiery)
    if (!fiery) {
        return (
            <div className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center bg-[#A1D15122] text-[#A1D151]">
                {children}
            </div>
        )
    }
    return (
        <div className={`flex flex-row items-center gap-3 w-full transition-opacity duration-300 ${lottieReady ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-1/4 max-w-[110px] shrink-0">
                {lottieReady && <Lottie animationData={lottieData} loop autoplay />}
            </div>
            <div className="relative flex-1 min-w-0 px-4 py-2.5 bg-[#151F23] rounded-2xl shadow-lg border-2 border-[#3A464E]">
                {/* flex items-center — children здесь обычно "иконка +
                    текст" (например <Check/> + фраза), а Tailwind preflight
                    ставит svg { display:block } по умолчанию: без flex
                    иконка переносилась бы на свою строку (блочный элемент),
                    отсюда и баг "галочка сверху-слева, текст отдельно
                    снизу-по центру" — та же раскладка, что уже у обычной
                    (не fiery) ветки этого компонента выше. */}
                <span className="flex items-center gap-2 text-[#A1D151] font-bold text-base md:text-lg break-words">{children}</span>
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 text-[#3A464E] text-xl font-bold">&lt;</div>
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
