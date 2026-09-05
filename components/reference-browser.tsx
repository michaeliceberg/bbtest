// components/reference-browser.tsx
//
// Клиентская часть /reference — держит поиск/фильтр по теме в одном
// состоянии, но показывает ДВЕ копии панели фильтров: справа в
// "сайдбаре" (StickyWrapper, виден только на lg+ — по прямой просьбе
// пользователя, "editbox поиска и кнопки фильтра расположим справа") и
// компактную копию НАД сеткой на мобильном (StickyWrapper там скрыт
// целиком, иначе фильтры вообще негде было бы показать). Сам layout
// (StickyWrapper/UserProgress/FeedWrapper) теперь собирается прямо
// здесь, не в page.tsx — состояние поиска общее для обеих панелей,
// поэтому и разметку удобнее держать в одном клиентском дереве, а не
// пробрасывать через контекст в серверный page.tsx.
//
// Каждая карточка держит зарезервированное место под иллюстрацию к
// формуле (imageSrc пока всегда null — картинки не нарисованы, но
// вёрстка уже рассчитана под них по прямой просьбе пользователя).

'use client'

import { useEffect, useMemo, useState } from 'react'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css'
import { Image as ImageIcon, Search, Dumbbell } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { StickyWrapper } from './sticky-wrapper'
import { FeedWrapper } from './feed-wrapper'
import { UserProgress } from './user-progress'
import { courses } from '@/db/schema'

export type ReferenceEntryData = {
    id: number
    topic: string
    label: string
    symbol: string
    name: string | null
    unit: string | null
    formula: string
    imageSrc: string | null
}

type UserProgressData = {
    activeCourse: typeof courses.$inferSelect
    hearts: number
    points: number
    gems: number
    xp: number
}

// Разные акцентные цвета по темам — чисто навигационная функция (быстро
// отличить тему по цвету плашки), не смысловая (не пересекается с
// цветами "верно/неверно" и т.п. из разборов по шагам).
const TOPIC_ACCENT: Record<string, string> = {
    'Динамика': '#7dd3fc',
    'Кинематика': '#4ADE80',
    'Электростатика': '#FBBF24',
    'Электродинамика': '#8B5CF6',
    'Оптика': '#FB923C',
    'Газ и нагрев': '#F472B6',
}
const DEFAULT_ACCENT = '#9AA7B0'

// Расшифровка ТОЛЬКО для простых именованных единиц (символ — это
// сокращение конкретного слова: Н→Ньютон, Гн→Генри) — по прямой просьбе
// пользователя. Составные единицы (м/с, кг/м³, Н/Кл и т.п.) расшифровки
// не получают — они самоочевидны по своей структуре, просто показываются
// в скобках как есть. "Ом"/"Гц"/"моль" тоже не расшифровываются — это
// уже полные слова, а не сокращения (расшифровывать "Ом" в "Ом" незачем).
const UNIT_NAMES: Record<string, string> = {
    'Н': 'Ньютон',
    'Дж': 'Джоуль',
    'Вт': 'Ватт',
    'Па': 'Паскаль',
    'Ф': 'Фарад',
    'В': 'Вольт',
    'А': 'Ампер',
    'Вб': 'Вебер',
    'Гн': 'Генри',
    'с': 'Секунда',
    'м': 'Метр',
}

type FiltersPanelProps = {
    topics: string[]
    activeTopic: string
    setActiveTopic: (t: string) => void
    query: string
    setQuery: (q: string) => void
    resultCount: number
    className?: string
    // 'sidebar' — узкая колонка справа: темы одна под другой на всю
    // ширину (280px слишком узко, чтобы горизонтальные чипы вроде
    // "Электродинамика" смотрелись опрятно). 'inline' — прежний
    // горизонтальный ряд чипов, для мобильной копии панели над сеткой,
    // где ширина не ограничена.
    layout?: 'sidebar' | 'inline'
}

const topicChipStyle = (active: boolean, accent: string, layout: 'sidebar' | 'inline') => ({
    className: cn(
        'font-semibold border-2 transition-colors',
        layout === 'sidebar' ? 'w-full text-left px-3 py-2 rounded-lg text-sm' : 'px-3 py-1.5 rounded-full text-xs whitespace-nowrap',
        active ? '' : 'bg-[#161F23] border-[#3A464E] text-[#9AA7B0] hover:text-[#F2F7FB]'
    ),
    style: active ? { backgroundColor: `${accent}22`, borderColor: `${accent}66`, color: accent } : undefined,
})

const FiltersPanel = ({ topics, activeTopic, setActiveTopic, query, setQuery, resultCount, className, layout = 'inline' }: FiltersPanelProps) => (
    <div className={cn('flex flex-col gap-3 rounded-xl border-2 border-[#3A464E] bg-[#161F23] p-4', layout === 'sidebar' && 'lg:w-[260px]', className)}>
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6A72]" />
            <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Название, символ, формула..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#1A252B] border-2 border-[#3A464E] text-[#F2F7FB] placeholder:text-[#5A6A72] focus:outline-none focus:border-[#4A90D9] transition-colors text-sm"
            />
        </div>

        <div className={cn(layout === 'sidebar' ? 'flex flex-col gap-1.5' : 'flex flex-wrap gap-1.5')}>
            {(() => {
                const all = topicChipStyle(activeTopic === 'all', DEFAULT_ACCENT, layout)
                return (
                    <button type="button" onClick={() => setActiveTopic('all')} className={all.className} style={all.style}>
                        Все темы
                    </button>
                )
            })()}
            {topics.map((t) => {
                const active = activeTopic === t
                const accent = TOPIC_ACCENT[t] ?? DEFAULT_ACCENT
                const s = topicChipStyle(active, accent, layout)
                return (
                    <button key={t} type="button" onClick={() => setActiveTopic(t)} className={s.className} style={s.style}>
                        {t}
                    </button>
                )
            })}
        </div>

        <div className="text-xs text-[#5A6A72]">
            {resultCount} {resultCount === 1 ? 'формула' : 'формул'}
        </div>

        {/* Ссылка обратно в тренажёр на конкретную тему — по прямой
            просьбе пользователя (пара к "Справочник" в trainer-grade-tree.tsx).
            Показывается только когда выбрана конкретная тема (не "Все темы"),
            иначе непонятно, на какую тему тренажёра вести. */}
        {activeTopic !== 'all' && (
            <Link
                href={`/trainer?topic=${encodeURIComponent(activeTopic)}`}
                className="flex items-center justify-center gap-1.5 rounded-lg border-2 border-[#3A464E] bg-[#1A252B] px-3 py-2 text-xs font-semibold text-[#9AA7B0] hover:text-[#F2F7FB] hover:border-[#4A90D9] transition-colors"
            >
                <Dumbbell className="w-3.5 h-3.5" />
                Потренировать «{activeTopic}»
            </Link>
        )}
    </div>
)

export const ReferenceBrowser = ({ entries, userProgress }: { entries: ReferenceEntryData[]; userProgress: UserProgressData }) => {
    const topics = useMemo(() => Array.from(new Set(entries.map((e) => e.topic))), [entries])
    // Переход из /trainer?... → /reference?topic=Тема (ссылка "Справочник"
    // у карточки темы в trainer-grade-tree.tsx) — сразу открывает нужную
    // тему, а не общий "Все темы". Инициализация из URL один раз при
    // монтировании (не useEffect) — иначе фильтр на долю секунды мигнул
    // бы "все темы" перед тем, как переключиться.
    const searchParams = useSearchParams()
    const topicParam = searchParams.get('topic')
    const [activeTopic, setActiveTopic] = useState<string>(() =>
        topicParam && entries.some((e) => e.topic === topicParam) ? topicParam : 'all'
    )
    const [query, setQuery] = useState('')

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        return entries.filter((e) => {
            if (activeTopic !== 'all' && e.topic !== activeTopic) return false
            if (!q) return true
            return (
                e.label.toLowerCase().includes(q) ||
                (e.name ?? '').toLowerCase().includes(q) ||
                e.symbol.toLowerCase().includes(q) ||
                e.formula.toLowerCase().includes(q) ||
                (e.unit ?? '').toLowerCase().includes(q)
            )
        })
    }, [entries, activeTopic, query])

    const filtersProps = { topics, activeTopic, setActiveTopic, query, setQuery, resultCount: filtered.length }

    return (
        <div className='flex flex-row-reverse gap-[48px] px-6'>
            <StickyWrapper>
                <UserProgress
                    activeCourse={userProgress.activeCourse}
                    hearts={userProgress.hearts}
                    points={userProgress.points}
                    gems={userProgress.gems}
                    xp={userProgress.xp}
                    hasActiveSubscription={false}
                />
                <FiltersPanel {...filtersProps} layout="sidebar" />
            </StickyWrapper>

            <FeedWrapper>
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">📖 Справочник</h1>
                    <p className="text-[#9AA7B0] mt-1">
                        Все формулы и единицы измерения по физике — открой и повтори любую тему.
                    </p>
                </div>

                <FiltersPanel {...filtersProps} className="lg:hidden mb-4" />

                {filtered.length === 0 ? (
                    <div className="text-center py-16 text-[#5A6A72]">Ничего не найдено</div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {filtered.map((e) => {
                            const accent = TOPIC_ACCENT[e.topic] ?? DEFAULT_ACCENT
                            const unitName = e.unit ? UNIT_NAMES[e.unit] : null
                            return (
                                <div key={e.id} className="rounded-xl border-2 overflow-hidden bg-[#161F23]" style={{ borderColor: `${accent}55` }}>
                                    {/* Шапка — контекст (тема/название/картинка/единица),
                                        специально сдержанная по размеру, чтобы не спорить
                                        с формулой ниже за внимание. */}
                                    <div className="flex items-center gap-3 px-4 pt-3 pb-2">
                                        {/* Зарезервированное место под иллюстрацию к ЭТОЙ
                                            конкретной формуле — по одной картинке на
                                            карточку. imageSrc пока не заполнен ни у одной
                                            записи (см. scripts/seedPhysicsReference.ts) —
                                            показываем placeholder-иконку. */}
                                        <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-[#1A252B] border border-[#2A363D] flex items-center justify-center overflow-hidden">
                                            {e.imageSrc ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={e.imageSrc} alt="" className="w-full h-full object-contain" />
                                            ) : (
                                                <ImageIcon className="w-4 h-4 text-[#3A464E]" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accent }}>
                                                {e.topic}
                                            </div>
                                            <div className="text-sm text-[#F2F7FB] font-semibold truncate">{e.label}</div>
                                        </div>
                                        {e.unit && (
                                            <div className="text-xs text-[#9AA7B0] text-right flex-shrink-0">
                                                <span className="font-semibold text-[#7dd3fc]">[{e.unit}]</span>
                                                {unitName && <div>{unitName}</div>}
                                            </div>
                                        )}
                                    </div>

                                    {/* Сама формула — главный акцент карточки: отдельная
                                        подсвеченная (в цвет темы) панель, крупный шрифт,
                                        по центру — по прямой просьбе пользователя ("чтобы
                                        сразу было видно формулу, бросалась в глаза"). */}
                                    <div className="px-4 py-4 overflow-x-auto" style={{ backgroundColor: `${accent}14` }}>
                                        <div className="text-2xl md:text-3xl font-bold text-[#F2F7FB] text-center whitespace-nowrap">
                                            <Latex>{`$${e.symbol} = ${e.formula}$`}</Latex>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </FeedWrapper>
        </div>
    )
}
