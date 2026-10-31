'use client'

// components/hangar-scene.tsx
//
// «Ангар» в «Моём пути»: задания 1–13 — предметы (сломано → на месте), 14–20 — детали ракеты.
// Решил раздел — у предмета появляется кнопка «Починить …», ученик сам жмёт и видит, как ангар меняется.
// Грязь стен/пола проявляется ступенями, хлам исчезает по одному — по числу починенного.
// Время суток — по часам ученика (оттенок поверх, предметы не перерисовываются).
// Картинки и координаты — docs/hangar/tools/build.py → public/hangar/, lib/hangarLayout.json; правки расстановки
// (слой, поворот, место) — из редактора /test-hangar-layout (проп layout, lib/hangarModel.ts). №11 — вентилятор.

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, KeyRound, LogOut, Wrench, X } from 'lucide-react'
import { RepairIcon } from '@/components/repair-icon'
import Link from 'next/link'
import { L, JUNK, FAN_NUM, DECOR, PORTRAIT_NUM, itemOf, place, placeStyle, type LayoutOverrides } from '@/lib/hangarModel'
import { HangarFan, FAN } from '@/components/hangar-fan'
import { HangarCat } from '@/components/hangar-cat'
import { HangarSky, HangarSpider, HangarHangingSpider, HangarBug, HangarPaper, ComputerFlicker, HangarMoon } from '@/components/hangar-life'
import { fixHangarItem } from '@/actions/hangar'
import { playSound, CASE_PRIZE_SOUND } from '@/lib/sound'
import { ZaNaukuArchive } from '@/components/za-nauku-archive'
import { pickShortJoke, ZN_RUBRIC_TITLE, znSource, type ZnJoke } from '@/lib/zaNauku'

export type SceneItem = { num: number; title: string; state: 'broken' | 'ready' | 'fixed'; progress: number; href: string | null }

// По номеру ЗАДАНИЯ: что делаем с его предметом (кнопка «Починить») и шутка — про предмет и про это задание.
// Какой предмет у задания — ITEM_OF_TASK (lib/hangarModel.ts).
const FIX_LABEL: Record<number, string> = {
    1: 'Поставить стремянку', 2: 'Поднять флаг отряда', 3: 'Собрать инструменты в ящик', 4: 'Включить робота', 5: 'Распутать провода',
    6: 'Развесить ключи по местам', 7: 'Починить компьютер Мигеля', 8: 'Зажечь лампу над Фейнманом', 9: 'Зарядить шуруповёрт',
    10: 'Запустить генератор', 11: 'Починить вентилятор', 12: 'Повесить огнетушитель', 13: 'Поднять бочку с топливом',
}
const ITEM_JOKE: Record<number, string> = {
    1: 'Стремянка, стена и пол — готовый прямоугольный треугольник. Залезем по нему повыше по шкале баллов 🪜',
    2: 'Флаг показывает, куда дует ветер: направление и сила — это и есть вектор 🚩',
    3: 'Ящик — прямоугольный параллелепипед. Разложишь инструменты — и стереометрия не страшна 🧰',
    4: 'Робот без батарейки. Включится он или нет — вопрос вероятности. Посчитаем шансы — и он оживёт 🤖',
    5: 'Спутанные провода — как дерево исходов. Распутаем по веточкам — и вероятность посчитается 🔌',
    6: 'Ключи разного размера: какой подойдёт с первой попытки? Мат. ожидание подскажет 🔧',
    7: 'Без компа Команданте не может решить даже простейшее уравнение. Почини — и икс найдётся 💻',
    8: 'Фейнман считал в уме быстрее калькулятора и взламывал сейфы. Включи свет — посчитаем так же 🔐',
    9: 'Обороты шуруповёрта — это скорость, а скорость — производная координаты. Зарядим и закрутим 🪛',
    10: 'Генератор — чистая физика: подставь в формулу — получишь энергию. Как в прикладной задаче ⚡',
    11: 'Две трубы, поезд, бассейн… Вентилятор, чтобы текстовые задачи были не такими душными 🌀',
    12: 'Струя из огнетушителя летит по параболе. Видишь график — тушишь задачу 🧯',
    13: 'Топливо каждый год дорожает на r%. Посчитаем, сколько бочек брать сейчас, — и сэкономим ⛽',
}
// Что откроется после починки (рядом с шуткой в окне задания)
const UNLOCK_HINT: Record<number, string> = {
    7: 'В компьютере откроется архив физтех-шуток из газеты «За науку» 📰',
    4: 'Робот будет рассказывать физтех-шутки из газеты «За науку» 💬',
}
const ARCHIVE_ITEM = 7 // компьютер
const ROBOT_ITEM = 13 // робот (бывший «автомат»)
const ROCKET_JOKE = 'Ракета летит в вуз мечты. Каждое задание второй части — новая деталь. Собери — и на старт 🚀'
const ROCKET_STEP = ['Поставить опоры', 'Поставить сопло', 'Надеть обшивку', 'Прикрутить стабилизаторы', 'Пристегнуть баки', 'Покрасить звезду', 'Надеть нос']
const WALL = new Set([2, 6, 8]) // id предметов на стене (стенд с ключами, флаг, лампа)
const pct = (v: number) => `${(v / 1024) * 100}%`

type Time = 'day' | 'evening' | 'night'
const TIME_TINT: Record<Time, string> = {
    day: 'transparent',
    evening: 'linear-gradient(180deg, rgba(255,120,60,0.28), rgba(120,40,80,0.25))',
    night: 'linear-gradient(180deg, rgba(10,20,60,0.6), rgba(10,15,40,0.5))',
}
const timeOf = (h: number): Time => (h >= 7 && h < 18 ? 'day' : h >= 18 && h < 21 ? 'evening' : 'night')

// Значок задания — жёлтая плашка с номером (как номер задания на карточке юнита /trainer), без ключика и подложки.
// Раздел решён — плашка подпрыгивает. Наводишь или жмёшь — предмет, который починится, подсвечивается;
// по нажатию — окошко «Перейти в задачник».
function KeyBadge({ x, y, n, ready, active, onHover, onOpen }: { x: number; y: number; n: number; ready: boolean; active: boolean; onHover: (n: number | null) => void; onOpen: (n: number) => void }) {
    return (
        <span className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: pct(x), top: pct(y), zIndex: 1150 }}>
            <button type="button" aria-label={`Задание №${n}`}
                onMouseEnter={() => onHover(n)} onMouseLeave={() => onHover(null)} onFocus={() => onHover(n)} onBlur={() => onHover(null)}
                onClick={() => onOpen(n)}
                className={`flex h-[clamp(18px,4.4cqw,27px)] min-w-[clamp(18px,4.4cqw,27px)] items-center justify-center rounded-[7px] px-1 text-[clamp(11px,2.7cqw,15px)] font-black leading-none transition-transform active:scale-90 ${ready ? 'animate-bounce' : ''}`}
                style={{ background: 'linear-gradient(180deg,#FFE58A,#F2C35B)', color: '#3A2A08',
                    boxShadow: active ? '0 2px 0 #B8862E, 0 0 0 2px #FFF4C2, 0 0 10px 2px rgba(242,195,91,.8)' : '0 2px 0 #B8862E, 0 2px 6px rgba(0,0,0,.45)' }}>
                {n}
            </button>
        </span>
    )
}

/** Подсветка предмета, который починится: золотой контур по форме картинки (drop-shadow) и чуть ярче. */
const HIGHLIGHT = 'drop-shadow(0 0 2px #FFF4C2) drop-shadow(0 0 6px #F2C35B) drop-shadow(0 0 14px #F2C35B) brightness(1.15)'

export type HangarTime = Time

/**
 * onFix / time / decorFixed — для тестовой страницы /test-hangar: починка без сервера, своё время суток,
 * состояние портрета вручную. В приложении не передаются.
 */
export function HangarScene({ items, layout, onFix, time: forcedTime, decorFixed, bare = false, onClose, catStage = 0, catFridgeFixed = false, catName = null, onCatHome }: {
    items: SceneItem[]; layout?: LayoutOverrides | null; onFix?: (num: number) => void; time?: Time; decorFixed?: boolean
    /** Только сама картинка ангара — без заголовка и подсказок снизу (превью на /learn). */
    bare?: boolean
    /** Крестик в шапке (окно ангара на /learn). */
    onClose?: () => void
    /** Котик: 0 нет, 1 мяукает у ворот, 2 живёт на картонке (user_progress.cat_stage). */
    catStage?: number
    /** Холодильник котика починен. */
    catFridgeFixed?: boolean
    /** Имя котика. */
    catName?: string | null
    /** Тестовая страница: котик приручён без сервера. */
    onCatHome?: () => void
}) {
    const router = useRouter()
    const [pending, start] = useTransition()
    const [justFixed, setJustFixed] = useState<number | null>(null)
    const [time, setTime] = useState<Time>('day')
    const [hover, setHover] = useState<number | null>(null)
    const [openNum, setOpenNum] = useState<number | null>(null)
    const lit = (n: number) => hover === n || openNum === n
    // Плашка задания появляется на середине зума (зум 1,1 с → через 0,55 с) — не сразу и без долгого ожидания; закрывается сразу.
    const ZOOM_MS = 550
    const [panelNum, setPanelNum] = useState<number | null>(null)
    const [archiveOpen, setArchiveOpen] = useState(false)
    const [robotJoke, setRobotJoke] = useState<{ joke: ZnJoke; key: number } | null>(null)
    useEffect(() => {
        if (!robotJoke) return
        const t = setTimeout(() => setRobotJoke(null), Math.min(18000, Math.max(8000, robotJoke.joke.text.length * 110)))
        return () => clearTimeout(t)
    }, [robotJoke])
    const robotSay = () => setRobotJoke({ joke: pickShortJoke(), key: Date.now() })
    useEffect(() => {
        setPanelNum(null)
        if (openNum === null) return
        const t = setTimeout(() => setPanelNum(openNum), ZOOM_MS)
        return () => clearTimeout(t)
    }, [openNum])
    useEffect(() => { setTime(forcedTime ?? timeOf(new Date().getHours())) }, [forcedTime])

    const byNum = new Map(items.map((i) => [i.num, i]))
    const room = items.filter((i) => i.num <= 13)
    const rocketParts = items.filter((i) => i.num >= 14)
    const stage = rocketParts.filter((i) => i.state === 'fixed').length
    const fixedCount = items.filter((i) => i.state === 'fixed').length
    const dirt = [1, 0.75, 0.5, 0.25, 0][Math.min(4, Math.floor(fixedCount / 4))]
    const junkLeft = Math.max(0, JUNK.length - Math.round((fixedCount * JUNK.length) / 16))
    const lampOn = byNum.get(8)?.state === 'fixed'
    const RS = L.rocket[Math.min(7, stage)]
    const R = { ...RS, ...place(layout, stage >= 7 ? 'a' : 'b', 'rocket', RS) }
    const fan = byNum.get(FAN_NUM)
    const decorDone = decorFixed ?? (PORTRAIT_NUM !== null && byNum.get(PORTRAIT_NUM)?.state === 'fixed')
    const decorState = decorDone ? 'a' : 'b'
    const lampP = place(layout, decorState, 'lamp', DECOR[1][decorState])
    const readyRocket = rocketParts.find((i) => i.state === 'ready')
    const nextRocket = readyRocket ?? rocketParts.find((i) => i.state !== 'fixed')
    const ready = [...room.filter((i) => i.state === 'ready'), ...(readyRocket ? [readyRocket] : [])]

    const fixed = (num: number) => { setJustFixed(num); playSound(CASE_PRIZE_SOUND); setTimeout(() => setJustFixed(null), 1500) }
    const fix = (num: number) => {
        if (onFix) { onFix(num); fixed(num); return }
        start(async () => {
            const r = await fixHangarItem(num)
            if (r.ok) { fixed(num); router.refresh() }
        })
    }
    const openItem = openNum !== null ? byNum.get(openNum) ?? null : null
    const panelItem = panelNum !== null && panelNum === openNum ? byNum.get(panelNum) ?? null : null
    // Точка, к которой приближается картинка при выборе задания (в пикселях картинки 1024×1024).
    const focusOf = (num: number): { x: number; y: number } => {
        if (num >= 14) return { x: R.x, y: R.y - R.h / 2 }
        if (num === FAN_NUM) return { x: FAN.x, y: FAN.top + FAN.motorH }
        const it = byNum.get(num)
        const st = it?.state === 'fixed' ? 'a' : 'b'
        const sl = L[itemOf(num)]?.[st]
        if (!sl) return { x: 512, y: 512 }
        const p = place(layout, st, `${itemOf(num)}`, sl)
        const c = { x: p.x, y: p.y - p.h / 2 }
        if (num !== PORTRAIT_NUM) return c
        // лампа чинится вместе с портретом — приближаемся к середине между ними
        const pp = place(layout, decorState, 'portrait', DECOR[0][decorState])
        return { x: (c.x + pp.x) / 2, y: (c.y + pp.y - pp.h / 2) / 2 }
    }
    const focus = openNum !== null ? focusOf(openNum) : null
    // Крупный ангар на телефоне: квадрат картинки не по ширине экрана, а по высоте (~62% экрана) — предметы
    // в полтора раза крупнее, картинку листаем вбок пальцем. На компьютере (и в превью) — квадрат по ширине.
    const frameRef = useRef<HTMLDivElement>(null)
    const [frame, setFrame] = useState<{ w: number; s: number } | null>(null)
    // при первом замере и смене размера — встаём по центру картинки
    useEffect(() => { if (frame && frameRef.current) frameRef.current.scrollLeft = (frame.s - frame.w) / 2 }, [frame])
    useLayoutEffect(() => {
        if (bare) return
        const el = frameRef.current
        if (!el) return
        const measure = () => {
            // ширину берём у внешнего блока (рамка на компьютере сужается под квадрат) минус рамка 2+2 px
            const w = (el.parentElement?.parentElement?.clientWidth ?? el.clientWidth + 4) - 4
            // компьютер: квадрат не выше экрана — нижний край виден целиком без прокрутки страницы
            const s = w < 480 ? Math.max(w, Math.round(Math.min(window.innerHeight * 0.62, 640))) : Math.min(w, Math.max(360, window.innerHeight - 40))
            setFrame((prev) => {
                if (prev && prev.w === w && prev.s === s) return prev
                return { w, s }
            })
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el.parentElement?.parentElement ?? el)
        window.addEventListener('resize', measure)
        return () => { ro.disconnect(); window.removeEventListener('resize', measure) }
    }, [bare])
    const scrollMode = !!frame && frame.s > frame.w
    // можно ли ещё листать влево/вправо (стрелки под ангаром гаснут у края)
    const [edge, setEdge] = useState({ l: true, r: true })
    const onFrameScroll = () => {
        const el = frameRef.current
        if (!el) return
        const l = el.scrollLeft > 4
        const r = el.scrollLeft < el.scrollWidth - el.clientWidth - 4
        setEdge((e) => (e.l === l && e.r === r ? e : { l, r }))
    }
    useEffect(() => { onFrameScroll() }, [frame]) // eslint-disable-line react-hooks/exhaustive-deps
    // своя плавная прокрутка (разгон-торможение) + страховка в конце: scroll-behavior smooth не везде срабатывает
    const slide = (dir: -1 | 1) => {
        const el = frameRef.current
        if (!el) return
        const from = el.scrollLeft
        const to = Math.max(0, Math.min(el.scrollWidth - el.clientWidth, from + dir * (frame ? frame.w * 0.6 : 200)))
        const t0 = performance.now()
        const D = 420
        const step = (now: number) => {
            const k = Math.min(1, (now - t0) / D)
            el.scrollLeft = from + (to - from) * (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2)
            if (k < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
        setTimeout(() => { el.scrollLeft = to }, D + 80)
    }
    // где была прокрутка в момент выбора задания (зум считается относительно видимой части)
    const [zoomFrom, setZoomFrom] = useState(0)
    const ZOOM = scrollMode ? 1.8 : 2.2
    // Приближение с предметом в центре кадра: масштаб от левого верхнего угла + сдвиг так, чтобы точка предмета
    // встала в середину видимой части; сдвиг ограничен, чтобы за краем картинки не было пустоты.
    const zoomTransform = (() => {
        if (!focus) return 'translate(0px, 0px) scale(1)'
        const S = frame?.s ?? 1024
        const vw = Math.min(frame?.w ?? S, S) // видимая ширина: на компьютере рамка сужена под квадрат
        const fx = (focus.x / 1024) * S
        const fy = (focus.y / 1024) * S
        const tx = Math.min(zoomFrom, Math.max(zoomFrom + vw - ZOOM * S, zoomFrom + vw / 2 - ZOOM * fx))
        const ty = Math.min(0, Math.max(S - ZOOM * S, S / 2 - ZOOM * fy))
        return `translate(${tx}px, ${ty}px) scale(${ZOOM})`
    })()
    // открыть окошко задания: по ключику или по самому предмету (если он ещё не починен)
    const openTask = (num: number) => {
        if (byNum.get(num)?.state === 'fixed') return
        setZoomFrom(frameRef.current?.scrollLeft ?? 0)
        setOpenNum(num)
        // большой ангар на компьютере выше экрана: ставим его серединой в кадр (предмет после зума — в центре квадрата)
        const el = frameRef.current
        if (el && el.getBoundingClientRect().height > window.innerHeight * 0.9) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
    const label = (i: SceneItem) => (i.num >= 14 ? ROCKET_STEP[Math.min(6, stage)] : FIX_LABEL[i.num] ?? 'Починить')

    return (
        <div className={bare ? '' : 'mt-6 lg:mt-0'}>
            <style>{`@keyframes hangar-pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.1);opacity:1}100%{transform:scale(1)}}`}</style>
            {/* ключ «N/20» и «Выйти» — плашками поверх картинки, вне прокручиваемой рамки (не уезжают при листании) */}
            <div className="relative mx-auto" style={{ width: frame && frame.s < frame.w ? frame.s + 4 : '100%' }}>
            {!bare && (
                <span className="pointer-events-none absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-xl border-2 border-[#4A3A14] bg-[#151F23]/90 px-2.5 py-1 text-sm font-black text-[#F2E3C2] shadow-lg"
                    style={{ zIndex: 1200 }} title="Починено">
                    <RepairIcon className="h-4 w-4 text-[#F2C35B]" />{fixedCount}/20
                </span>
            )}
            {!bare && onClose && (
                <button type="button" onClick={onClose}
                    className="absolute right-2.5 top-2.5 flex items-center gap-1.5 rounded-xl border-2 border-b-4 border-[#2A363C] bg-[#161F23]/95 px-3 py-1.5 text-sm font-black text-[#E6EDF1] shadow-lg active:border-b-0"
                    style={{ zIndex: 1200 }}>
                    <LogOut className="h-4 w-4" />Выйти
                </button>
            )}
            <div ref={frameRef} onScroll={onFrameScroll}
                className={`hangar-frame relative w-full rounded-2xl border-2 border-[#2C3A41] ${scrollMode && !openItem ? 'overflow-x-auto overflow-y-hidden' : 'overflow-hidden'} ${frame ? '' : 'aspect-square'}`}
                style={frame ? { height: frame.s + 4 } : undefined}>
            <div className="relative overflow-hidden" style={frame ? { width: frame.s, height: frame.s, containerType: 'inline-size' } : { position: 'absolute', inset: 0, containerType: 'inline-size' }}>
                {/* все слои сцены — в одной обёртке: при выборе задания она плавно приближается к предмету */}
                <div className="absolute inset-0"
                    style={{ transform: zoomTransform, transformOrigin: '0 0', transition: 'transform 1.1s cubic-bezier(.45,0,.2,1)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/hangar/bg.webp" alt="" className="absolute inset-0 h-full w-full" draggable={false} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/hangar/bg-dirty.webp" alt="" className="absolute inset-0 h-full w-full transition-opacity duration-1000" style={{ opacity: dirt }} draggable={false} />
                {/* небо в окне живёт: облака, птицы, кукурузник с транспарантом (под всеми предметами) */}
                <HangarSky time={time} />
                {/* пока бардак — по балке бегает паучок, по полу жучок, на сквозняке кружит листок */}
                {junkLeft > 0 && <><HangarSpider /><HangarHangingSpider /><HangarBug /><HangarPaper /><HangarPaper second /></>}
                {JUNK.map((jp, j) => {
                    const p = place(layout, 'b', jp.key, jp)
                    return (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={jp.key} src={jp.src} alt="" draggable={false} className="absolute select-none transition-[opacity,transform] duration-700"
                            style={{ ...placeStyle(p), opacity: j < junkLeft ? 1 : 0, transform: j < junkLeft ? 'scale(1)' : 'scale(0.3)' }} />
                    )
                })}
                {DECOR.map((d) => {
                    const sl = d[decorState]
                    const p = place(layout, decorState, d.key, sl)
                    return (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={sl.src} src={sl.src} alt={d.label} draggable={false} className={`absolute select-none ${!decorDone && PORTRAIT_NUM !== null ? 'cursor-pointer' : ''}`}
                            onClick={() => { if (!decorDone && PORTRAIT_NUM !== null) openTask(PORTRAIT_NUM) }}
                            onMouseEnter={() => { if (!decorDone && PORTRAIT_NUM !== null) setHover(PORTRAIT_NUM) }} onMouseLeave={() => setHover(null)}
                            style={{ ...placeStyle(p), filter: PORTRAIT_NUM !== null && !decorDone && lit(PORTRAIT_NUM) ? HIGHLIGHT : undefined, transition: 'filter .25s' }} />
                    )
                })}
                {decorDone && (
                    // тёплый конус света от лампы на портрет
                    <div className="pointer-events-none absolute"
                        style={{ left: pct(lampP.x - lampP.w * 1.1), top: pct(lampP.y - lampP.h * 0.2), width: pct(lampP.w * 2.2), height: pct(lampP.h * 5.5), zIndex: Math.round(lampP.z * 10) + 11,
                            background: 'radial-gradient(ellipse 50% 60% at 50% 0%, rgba(255,214,140,0.45), transparent 75%)', mixBlendMode: 'screen' }} />
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img key={R.src} src={R.src} alt="Ракета" draggable={false} className={`absolute select-none ${nextRocket ? 'cursor-pointer' : ''}`}
                    onClick={() => { if (nextRocket) openTask(nextRocket.num) }}
                    onMouseEnter={() => { if (nextRocket) setHover(nextRocket.num) }} onMouseLeave={() => setHover(null)}
                    style={{ ...placeStyle(R), filter: nextRocket && lit(nextRocket.num) ? HIGHLIGHT : undefined, transition: 'filter .25s', animation: justFixed && justFixed >= 14 ? 'hangar-pop .6s ease-out' : undefined }} />
                <HangarCat stage={catStage} layout={layout} fridgeFixed={catFridgeFixed} catName={catName} bare={bare} night={time === 'night'} onHome={onCatHome} />
                {nextRocket && !bare && <KeyBadge x={R.x + R.w * 0.42} y={R.y - R.h * 0.55} n={nextRocket.num} ready={!!readyRocket} active={lit(nextRocket.num)} onHover={setHover} onOpen={openTask} />}
                {room.filter((i) => i.num !== FAN_NUM).map((i) => {
                    const done = i.state === 'fixed'
                    const id = itemOf(i.num) // картинка предмета этого задания
                    const sl = done ? L[id].a : L[id].b
                    const p = { ...sl, ...place(layout, done ? 'a' : 'b', `${id}`, sl) }
                    const onWall = WALL.has(id) && !(id === 6 && !done)
                    return (
                        <div key={i.num}>
                            {!onWall && <div className="pointer-events-none absolute rounded-[50%]"
                                style={{ left: pct(p.x - p.w * 0.45), top: pct(p.y - p.h * 0.07 - 4), width: pct(p.w * 0.9), height: pct(p.h * 0.12 + 8), background: 'radial-gradient(closest-side, rgba(20,10,15,0.5), transparent)', zIndex: Math.round(p.z * 10) + 9 }} />}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img key={p.src} src={p.src} alt={i.title} draggable={false} className={`absolute select-none ${!done || (!bare && (id === ARCHIVE_ITEM || id === ROBOT_ITEM)) ? 'cursor-pointer' : ''}`}
                                onClick={() => {
                                    if (done && !bare && id === ARCHIVE_ITEM) setArchiveOpen(true)
                                    else if (done && !bare && id === ROBOT_ITEM) robotSay()
                                    else openTask(i.num)
                                }}
                                onMouseEnter={() => { if (!done) setHover(i.num) }} onMouseLeave={() => setHover(null)}
                                style={{ ...placeStyle(p), filter: !done && lit(i.num) ? HIGHLIGHT : undefined, transition: 'filter .25s', animation: justFixed === i.num ? 'hangar-pop .6s ease-out' : undefined }} />
                            {id === 7 && !done && <ComputerFlicker style={placeStyle(p)} />}
                            {!done && !bare && <KeyBadge x={p.x} y={p.y - p.h - 14} n={i.num} ready={i.state === 'ready'} active={lit(i.num)} onHover={setHover} onOpen={openTask} />}
                            {done && !bare && (id === ARCHIVE_ITEM || id === ROBOT_ITEM) && !(id === ROBOT_ITEM && robotJoke) && (
                                <FunBadge x={p.x} y={p.y - p.h - 6} label={id === ARCHIVE_ITEM ? 'Читать' : 'Шутка'}
                                    onClick={() => (id === ARCHIVE_ITEM ? setArchiveOpen(true) : robotSay())} />
                            )}
                            {id === ROBOT_ITEM && robotJoke && (
                                <RobotBubble key={robotJoke.key} x={p.x} y={p.y - p.h - 4} joke={robotJoke.joke} onClose={() => setRobotJoke(null)} />
                            )}
                        </div>
                    )
                })}
                {fan && (
                    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 900, filter: fan.state !== 'fixed' && lit(FAN_NUM) ? HIGHLIGHT : undefined, transition: 'filter .25s', animation: justFixed === FAN_NUM ? 'hangar-pop .6s ease-out' : undefined }}>
                        <HangarFan broken={fan.state !== 'fixed'} />
                    </div>
                )}
                {fan && fan.state !== 'fixed' && !bare && <KeyBadge x={FAN.x} y={FAN.top + FAN.motorH + 46} n={FAN_NUM} ready={fan.state === 'ready'} active={lit(FAN_NUM)} onHover={setHover} onOpen={openTask} />}
                <div className="pointer-events-none absolute inset-0 transition-[background] duration-700" style={{ background: TIME_TINT[time], mixBlendMode: 'multiply', zIndex: 1100 }} />
                {time === 'night' && <HangarMoon cutout={R.rot ? undefined : { src: R.src, x: R.x, y: R.y, w: R.w, h: R.h }} />}
                <div className="pointer-events-none absolute rounded-full transition-opacity duration-700"
                    style={{ left: pct(232 - 170), top: pct(415 - 170), width: pct(340), height: pct(340), opacity: lampOn ? (time === 'day' ? 0.55 : 0.9) : 0, background: 'radial-gradient(closest-side, rgba(255,200,110,0.55), transparent)', mixBlendMode: 'screen', zIndex: 1101 }} />
                </div>
                {openItem && (
                    // клик мимо предмета — закрыть (картинка отъезжает обратно)
                    <button type="button" aria-label="Закрыть" className="absolute inset-0 cursor-default bg-black/15" style={{ zIndex: 1190 }} onClick={() => setOpenNum(null)} />
                )}
            </div>
            </div>
            </div>

            {scrollMode && !openItem && (
                // большие деревянные стрелки-указатели: подсказка, что ангар листается вбок (и сами листают)
                <div className="mt-3 flex items-center justify-between gap-2">
                    <PlankArrow dir={-1} disabled={!edge.l} onClick={() => slide(-1)} />
                    <span className="text-center text-sm font-black leading-tight text-[#C9B48C]">Листай<br />ангар</span>
                    <PlankArrow dir={1} disabled={!edge.r} onClick={() => slide(1)} />
                </div>
            )}
            {!bare && panelItem && (
                // Плашка задания — под картинкой, чтобы не закрывать ангар; на компьютере ангар большой и выше экрана —
                // там плашка висит внизу экрана поверх (центрирование — на обёртке, анимация — на самой плашке)
                <div className="lg:pointer-events-none lg:fixed lg:inset-x-0 lg:bottom-5 lg:z-[95] lg:flex lg:justify-center lg:px-4">
                <div className="mt-3 rounded-2xl border-2 border-[#4A3A14] bg-[#151F23] p-3.5 shadow-xl lg:pointer-events-auto lg:mt-0 lg:w-full lg:max-w-[540px]" style={{ animation: 'hangar-pop .35s ease-out' }}>
                    <div className="flex items-start gap-2">
                        <KeyRound className="mt-1 h-5 w-5 shrink-0 text-[#F2C35B]" strokeWidth={2.6} />
                        <span className="min-w-0 flex-1 text-lg font-black leading-tight text-[#F2F7FB]">Раздел {panelItem.num} — {panelItem.title}</span>
                        <button type="button" aria-label="Закрыть" onClick={() => setOpenNum(null)} className="-mr-1 -mt-1 rounded-lg p-1 text-[#9AA7B0] hover:text-white"><X className="h-5 w-5" /></button>
                    </div>
                    <p className="mt-2 text-base font-bold leading-snug text-[#E8D9B8]">{panelItem.num >= 14 ? ROCKET_JOKE : ITEM_JOKE[panelItem.num]}</p>
                    {UNLOCK_HINT[panelItem.num] && <p className="mt-1.5 text-sm font-bold leading-snug text-[#9EE8B0]">{UNLOCK_HINT[panelItem.num]}</p>}
                    <div className="mt-3 flex gap-2">
                        {panelItem.state === 'ready' ? (
                            <button type="button" disabled={pending} onClick={() => { setOpenNum(null); fix(panelItem.num) }}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl border-b-4 px-3 py-2.5 text-sm font-black text-[#151F24] active:border-b-0 disabled:opacity-60"
                                style={{ background: 'linear-gradient(180deg,#FFD84D,#F2C35B)', borderBottomColor: '#B8862E' }}>
                                <Wrench className="h-4 w-4 shrink-0" />{label(panelItem)}
                            </button>
                        ) : null}
                        <Link href={`/learn?task=${panelItem.num}`}
                            className="flex flex-1 items-center justify-center rounded-xl border-b-4 px-3 py-2.5 text-center text-sm font-black text-[#0F171B] active:border-b-0"
                            style={{ background: '#53ADEF', borderBottomColor: '#3A85BC' }}>
                            Перейти в раздел {panelItem.num}
                        </Link>
                    </div>
                </div>
                </div>
            )}
            {bare || openItem ? null : ready.length > 0 ? (
                <div className="mt-3 space-y-2">
                    <p className="text-center text-sm font-black text-[#F2C35B]">Раздел решён — наводи порядок!</p>
                    {ready.map((i) => (
                        <button key={i.num} type="button" disabled={pending} onClick={() => fix(i.num)}
                            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-black text-[#151F24] transition-transform active:translate-y-[4px] disabled:opacity-60"
                            style={{ background: 'linear-gradient(180deg,#FFD84D,#F2C35B)', boxShadow: '0 4px 0 #B8862E' }}>
                            <Wrench className="h-5 w-5 shrink-0" />
                            <span className="flex-1">{label(i)}</span>
                            <span className="text-xs font-bold opacity-70">№{i.num}</span>
                        </button>
                    ))}
                </div>
            ) : null}
            {archiveOpen && <ZaNaukuArchive onClose={() => setArchiveOpen(false)} />}
        </div>
    )
}

// Кнопочка над починенным компьютером/роботом: «Читать» / «Шутка»
function FunBadge({ x, y, label, onClick }: { x: number; y: number; label: string; onClick: () => void }) {
    return (
        <button type="button" onClick={onClick}
            className="absolute -translate-x-1/2 -translate-y-full rounded-full border-2 border-[#3D8A55] bg-[#163322]/90 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#9EE8B0] shadow-[0_0_10px_rgba(120,220,150,0.45)]"
            style={{ left: pct(x), top: pct(y), zIndex: 1150 }}>
            {label}
        </button>
    )
}

// Облачко робота с шуткой из «За науку» — над его головой
function RobotBubble({ x, y, joke, onClose }: { x: number; y: number; joke: ZnJoke; onClose: () => void }) {
    // Центрирование (translate) — на внешней обёртке, анимация появления (scale) — на самом облачке:
    // если оба на одном элементе, анимация затирает translate и облачко сначала стоит правее, а потом прыгает на место.
    return (
        <div className="absolute w-[66%] -translate-x-1/2 -translate-y-full" style={{ left: pct(Math.min(Math.max(x, 345), 679)), top: pct(y), zIndex: 1180 }}>
            <button type="button" onClick={onClose}
                className="block w-full rounded-xl border-2 border-[#3D8A55] bg-[#10231A]/95 px-3 py-2 text-left shadow-xl"
                style={{ animation: 'hangar-pop .35s ease-out', transformOrigin: '50% 100%' }}>
                <span className="block text-[10px] font-black uppercase tracking-wide text-[#9EE8B0] sm:text-[11px]">{ZN_RUBRIC_TITLE[joke.rubric]}</span>
                <span className="mt-0.5 block text-sm font-bold leading-snug text-[#E9F7EE] sm:text-[15px]">{joke.text}</span>
                <span className="mt-1 block text-[10px] font-bold text-[#7FA48B]">{znSource(joke)}</span>
            </button>
        </div>
    )
}

// Стрелка-указатель «из доски» (та же доска, что у таблички «Наш ангар»), как на деревянном столбе-указателе.
// Нажатие по стандарту: тёмная нижняя грань (тень-фильтр) исчезает, стрелка опускается на её высоту.
function PlankArrow({ dir, disabled, onClick }: { dir: -1 | 1; disabled: boolean; onClick: () => void }) {
    const shape = dir === 1
        ? 'polygon(0 18%, 70% 18%, 70% 0, 100% 50%, 70% 100%, 70% 82%, 0 82%)'
        : 'polygon(100% 18%, 30% 18%, 30% 0, 0 50%, 30% 100%, 30% 82%, 100% 82%)'
    return (
        <button type="button" onClick={onClick} disabled={disabled} aria-label={dir === 1 ? 'Листать ангар вправо' : 'Листать ангар влево'}
            className={`shrink-0 transition-[opacity,transform] duration-200 active:translate-y-[4px] active:[filter:none] disabled:opacity-35 disabled:active:translate-y-0 ${dir === 1 ? 'rotate-[2deg]' : '-rotate-[2deg]'}`}
            style={{ filter: 'drop-shadow(0 4px 0 #2A190B) drop-shadow(0 6px 8px rgba(0,0,0,0.4))' }}>
            <span className="relative flex h-14 w-28 items-center justify-center"
                style={{ clipPath: shape, background: 'url(/hangar/life/sign-plank.webp) center / 190% 100%' }}>
                <span style={{ filter: 'drop-shadow(0 2px 0 #3B2412)', paddingLeft: dir === 1 ? 0 : 12, paddingRight: dir === 1 ? 12 : 0 }}>
                    {dir === 1 ? <ChevronRight className="h-8 w-8 text-[#FFF1D6]" strokeWidth={4} /> : <ChevronLeft className="h-8 w-8 text-[#FFF1D6]" strokeWidth={4} />}
                </span>
            </span>
        </button>
    )
}
