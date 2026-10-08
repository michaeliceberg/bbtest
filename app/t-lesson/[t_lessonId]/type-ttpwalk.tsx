// app/t-lesson/[t_lessonId]/type-ttpwalk.tsx
//
// Тип TTPWALK — интерактивный разбор «Теорема о Трёх Перпендикулярах (ТТП)» (стереометрия,
// ЕГЭ Математика) на метафоре «из жизни»: земля → копьё, воткнувшееся в землю → линия на земле
// → «копьё ⟂ линии?» → тень копья (ученик сам выбирает точку, откуда падает луч) → угол 90° →
// «по-школьному» (плоскость α, наклонная a, прямая b, проекция a) → вывод ТТП.
// Цвета: копьё/a — голубой, линия/b — зелёный, тень/проекция — тёмно-зелёный «теневой» (GGEGE_SHADOW), земля/плоскость —
// бирюзовый, угол 90° — оранжевый.

'use client'

import { Fragment, createContext, useContext, useEffect, useRef, useState } from 'react'
import { showAnswerMeme } from '@/components/answer-meme-burst'
import { motion } from 'framer-motion'
import type { QuestionType } from './page'
import {
    DiagramBlock,
    pickWalkthroughNextLabel, pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    isFieryMilestoneTrial, FieryFeedbackBanner, CORRECT_COLOR,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    useWalkthroughCombo,
} from '@/components/geometry/WalkthroughLog'
import { Typewriter } from '@/components/geometry/Typewriter'
import { InsightCard, InsightWord } from '@/components/geometry/WalkthroughCards'
import { GGEGE_PALETTE, GGEGE_SHADOW, hexToRgba } from '@/src/constants/lessonButtonColors'
import { cn } from '@/lib/utils'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'
import { AlphaVideo } from '@/components/alpha-video'

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
    isAdmin?: boolean
}

const CONCEPT_PAUSE_MS = 1000

const Sticker = ({ value, color, bg, border }: { value: React.ReactNode; color: string; bg?: string; border?: string }) => (
    <motion.span
        initial={{ scale: 2.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 15 }}
        className="inline-flex items-center justify-center rounded-lg border-2 px-1.5 py-0.5 font-extrabold align-middle leading-none"
        style={{ borderColor: border ?? color, backgroundColor: bg ?? hexToRgba(color, 0.18), color }}
    >
        {value}
    </motion.span>
)

// Печатаемая строка с НЕСКОЛЬКИМИ стикерами в произвольных местах — та же
// техника, что и в LOGCOMBOWALK/FARADAYWALK: Typewriter печатает ПЛОСКУЮ
// строку (значения стикеров как обычный текст), после onDone вид
// подменяется на размеченную версию. break:true — печатается как обычный
// пробел, после onDone превращается в настоящий перенос строки (для
// принудительного разрыва в конкретном месте). bold — жирный текст БЕЗ
// цветной рамки (смысловое усиление слова, не термин-объект).
type LinePart = { text: string } | { sticker: string; color: string; bg?: string; border?: string } | { break: true } | { bold: string }
const TypedLineWithParts = ({ parts, onSettled }: { parts: LinePart[]; onSettled?: () => void }) => {
    const [typed, setTyped] = useState(false)
    const plainText = parts.map((p) => ('text' in p ? p.text : 'sticker' in p ? p.sticker : 'bold' in p ? p.bold : ' ')).join('')
    return (
        <div className="w-full text-center text-base md:text-lg text-[#F2F7FB]">
            {!typed ? (
                <Typewriter text={plainText} onDone={() => { setTyped(true); setTimeout(() => onSettled?.(), 450) }} />
            ) : (
                <>
                    {parts.map((p, i) => ('text' in p
                        ? <span key={i}>{p.text}</span>
                        : 'sticker' in p
                            ? <Sticker key={i} value={p.sticker} color={p.color} bg={p.bg} border={p.border} />
                            : 'bold' in p
                                ? <strong key={i} className="font-extrabold">{p.bold}</strong>
                                : <br key={i} />
                    ))}
                </>
            )}
        </div>
    )
}

// SVG-версия стикера — маленькая рамка+буква, встроенная прямо в
// диаграмму (тот же визуальный язык, что и HTML-Sticker выше). ВАЖНО:
// позиционирующий transform — на СТАТИЧНОМ внешнем <g>, а не на самом
// motion.g — framer-motion для анимируемой группы перезаписывает
// transform/style своими motion-values (нужными для scale) и стирает
// вручную заданный transform-атрибут (тот же гэтча, что уже
// задокументирован в CLAUDE.md для motion.g в геометрических разборах).
const SvgTag = ({ x, y, text, color, delay = 0 }: { x: number; y: number; text: string; color: string; delay?: number }) => (
    <g transform={`translate(${x},${y})`}>
        <motion.g
            initial={{ opacity: 0, scale: 2.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 15, delay }}
        >
            <rect x={-14} y={-14} width={28} height={28} rx={7} fill={hexToRgba(color, 0.18)} stroke={color} strokeWidth={2} />
            <text x={0} y={6} textAnchor="middle" fontSize={16} fontWeight={800} fill={color}>{text}</text>
        </motion.g>
    </g>
)


// Подпись точки O, «лежащая» на земле: рамка и буква нарисованы в плоскости земли
// (матрица из базисных векторов плоскости в проекции), тёмно-зелёная, как трава.
// Базис плоскости земли на экране: единичные векторы вдоль её краёв (оси x и y земли).
// «Буква» идёт вдоль края, поднимающегося вправо (ось y), «вниз» — вдоль края, уходящего
// вправо-вниз (ось x). Так стикер и точка O лежат на земле параллельно её краям.
const groundMatrix = (cx: number, cy: number) => {
    const C = P3(cx, cy, 0), X = P3(cx + 1, cy, 0), Y = P3(cx, cy + 1, 0)
    const ux = { x: X.x - C.x, y: X.y - C.y }, uy = { x: Y.x - C.x, y: Y.y - C.y }
    const lx = Math.hypot(ux.x, ux.y), ly = Math.hypot(uy.x, uy.y)
    const f = (n: number) => n.toFixed(4)
    return `matrix(${f(uy.x / ly)},${f(uy.y / ly)},${f(ux.x / lx)},${f(ux.y / lx)},${C.x.toFixed(1)},${C.y.toFixed(1)})`
}

// Подпись точки O, «лежащая» на земле (тёмно-зелёная, как трава).
const oTagScreen = () => { const Op = P3(O3.x, O3.y, 0); return { x: Op.x - 32, y: Op.y + 18 } }
const GroundOTag = ({ delay = 0, pale = false }: { delay?: number; pale?: boolean }) => {
    const t = oTagScreen()
    const c = unproject(t.x, t.y)
    return (
        <g transform={groundMatrix(c.x, c.y)} opacity={pale ? 0.3 : 1} style={{ transition: 'opacity 0.25s' }}>
            <motion.g initial={{ opacity: 0, scale: 2.2 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 15, delay }}>
                <rect x={-17} y={-17} width={34} height={34} rx={8} fill={O_FILL} stroke={O_TEXT} strokeWidth={2.5} />
                <text x={0} y={8} textAnchor="middle" fontSize={23} fontWeight={900} fill={O_TEXT}>O</text>
            </motion.g>
        </g>
    )
}

// Сама точка O — кружок, лежащий на земле (эллипс в плоскости земли).
const GroundODot = ({ fresh, delay = 0 }: { fresh: boolean; delay?: number }) => (
    <g transform={groundMatrix(O3.x, O3.y)}>
        <motion.circle
            r={7} fill={O_TEXT} stroke={O_FILL} strokeWidth={2}
            initial={fresh ? { opacity: 0 } : { opacity: 1 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay }}
        />
    </g>
)

// ===================================================================
// ЧЕРТЁЖ: земля (плоскость), копьё (наклонная), линия на земле, тень (проекция)
// ===================================================================
// «Из жизни»: спортсмен метнул копьё — оно воткнулось в землю в точке O, на земле проведена
// линия b (ученик сам крутит её «примерно перпендикулярно»). Перпендикулярно ли копьё линии?
// Проверяем по ТЕНИ (солнце в зените ⇒ тень = проекция). Потом всё то же «по-школьному»:
// плоскость α, наклонная a, прямая b, проекция a.
// Косая проекция 3D→2D, сцена повёрнута вокруг вертикали (по часовой, если смотреть сверху).
// Копьё лежит в плоскости, перпендикулярной оси x; линия b вдоль x (φ = 0) ⟂ копью.

const VB_W = 340, VB_H = 290
const ANG = (28 * Math.PI) / 180
const CXW = 5, CYW = 3.5

const A_COLOR = GGEGE_PALETTE.blue.button
const B_COLOR = GGEGE_PALETTE.green.button
const PROJ_COLOR = GGEGE_SHADOW.text // тёмно-зелёный, как сама тень
// стикер слова «тень» — тёмная плашка, как тень
const SH = { color: GGEGE_SHADOW.text, bg: GGEGE_SHADOW.button, border: GGEGE_SHADOW.text }
const SHADOW_LINE = GGEGE_SHADOW.text // отрезок O–H поверх широкой тени — тем же тёмно-зелёным, что и слово «тень»
const PLANE_COLOR = GGEGE_PALETTE.teal.button
const MARK_COLOR = GGEGE_PALETTE.orange.button
const X_COLOR = '#F2F7FB'
// Точка O лежит на земле — «травяная» подпись: светло-зелёная буква в тёмно-зелёной рамке
const O_TEXT = '#9BE3B8'
const O_FILL = '#173A2D'

// Точка O, где копьё входит в землю; a(s) = O + s·(0, 1, 1.05) — наклон ~46° к земле
const O3 = { x: 5, y: 2.8, z: 0 } // ближе к дальнему краю, чтобы длинное копьё и его тень помещались на площадке
const aPoint = (s: number) => ({ x: 5, y: O3.y + s, z: 1.05 * s })
const S_HIGH = 4.2 // тень верхушки копья ровно на краю площадки (y = 7)
const CANDIDATES = [2.7, 3.35, 4.0] // ближе к верхнему концу копья, подальше от O
const DEFAULT_PICK = 3.35
const PLANE_CORNERS: [number, number][] = [[0, 0], [10, 0], [10, 7], [0, 7]]
const LB = 2.8 // полудлина линии b (при любом угле остаётся в пределах земли)
const DEG = Math.PI / 180

const rawProj = (x: number, y: number, z: number) => {
    const dx = x - CXW, dy = y - CYW
    const rx = CXW + dx * Math.cos(ANG) + dy * Math.sin(ANG)
    const ry = CYW - dx * Math.sin(ANG) + dy * Math.cos(ANG)
    return { x: rx + 0.75 * ry, y: -(z + 0.5 * ry) }
}
// Подгоняем сцену под холст: масштаб и сдвиг по крайним точкам (плоскость + верх копья).
const FIT = (() => {
    const top = aPoint(S_HIGH)
    const pts = [...PLANE_CORNERS.map(([x, y]) => rawProj(x, y, 0)), rawProj(top.x, top.y, top.z)]
    const minX = Math.min(...pts.map((q) => q.x)), maxX = Math.max(...pts.map((q) => q.x))
    const minY = Math.min(...pts.map((q) => q.y)), maxY = Math.max(...pts.map((q) => q.y))
    const mX = 12, mT = 16, mB = 16
    const u = Math.min((VB_W - 2 * mX) / (maxX - minX), (VB_H - mT - mB) / (maxY - minY))
    return { u, offX: mX - minX * u + ((VB_W - 2 * mX) - (maxX - minX) * u) / 2, offY: mT - minY * u + ((VB_H - mT - mB) - (maxY - minY) * u) / 2 }
})()
const P3 = (x: number, y: number, z: number) => { const r = rawProj(x, y, z); return { x: FIT.offX + r.x * FIT.u, y: FIT.offY + r.y * FIT.u } }
const ptStr = (x: number, y: number, z: number) => { const p = P3(x, y, z); return `${p.x.toFixed(1)},${p.y.toFixed(1)}` }
// Обратное преобразование: точка экрана (в координатах viewBox) → точка земли (x, y).
const unproject = (sx: number, sy: number) => {
    const ryRaw = (sy - FIT.offY) / FIT.u, rxRaw = (sx - FIT.offX) / FIT.u
    const ry = -ryRaw / 0.5
    const rx = rxRaw - 0.75 * ry
    const dx = rx - CXW, dy = ry - CYW
    return { x: CXW + dx * Math.cos(ANG) - dy * Math.sin(ANG), y: CYW + dx * Math.sin(ANG) + dy * Math.cos(ANG) }
}

// Угол линии b (в градусах, φ=0 — вдоль x, то есть ⟂ копью) приводим к (-90, 90].
const normPhi = (deg: number) => { let d = ((deg % 180) + 180) % 180; if (d > 90) d -= 180; return d }
// «Немного дискретное» вращение: каждые 15° — «залипание», у прямого угла (0°) — сильнее.
const detent = (deg: number) => {
    const d = normPhi(deg)
    const stop = Math.round(d / 15) * 15
    const range = stop === 0 ? 6.5 : 4
    return Math.abs(d - stop) <= range ? normPhi(stop) : d
}
// Плавно догоняем целевой угол по кратчайшему пути (линия не имеет направления, период 180°).
const useEasedAngle = (target: number, init: number) => {
    const [shown, setShown] = useState(init)
    useEffect(() => {
        const id = setInterval(() => {
            setShown((cur) => {
                const d = ((target - cur + 90) % 180 + 180) % 180 - 90
                return Math.abs(d) < 0.15 ? target : normPhi(cur + d * 0.26)
            })
        }, 16)
        return () => clearInterval(id)
    }, [target])
    return shown
}

const PickCtx = createContext<{ pick: number | null; setPick: (s: number | null) => void; phi: number; setPhi: (d: number) => void }>({
    pick: null, setPick: () => {}, phi: 35, setPhi: () => {},
})

const DrawPath = ({ d, color, w = 3, fresh, delay = 0, dur = 0.9 }: { d: string; color: string; w?: number; fresh: boolean; delay?: number; dur?: number }) => (
    <motion.path
        d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"
        initial={fresh ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: dur, delay, ease: 'easeOut' }}
    />
)

const FadeIn = ({ children, fresh, delay = 0 }: { children: React.ReactNode; fresh: boolean; delay?: number }) => (
    <motion.g initial={{ opacity: fresh ? 0 : 1 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay }}>{children}</motion.g>
)

const Dot = ({ x, y, color, fresh, delay = 0 }: { x: number; y: number; color: string; fresh: boolean; delay?: number }) => (
    <g transform={`translate(${x},${y})`}>
        <motion.circle
            r={5.5} fill={color} stroke="#0B1216" strokeWidth={1.5}
            initial={fresh ? { opacity: 0 } : { opacity: 1 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay }}
        />
    </g>
)

// Тег-слово («линия») — как SvgTag, но шире под длину слова.
const SvgWordTag = ({ x, y, text, color, delay = 0, angle = 0 }: { x: number; y: number; text: string; color: string; delay?: number; angle?: number }) => {
    const w = text.length * 8.6 + 18
    return (
        <g transform={`translate(${x},${y}) rotate(${angle.toFixed(1)})`}>
            <motion.g
                initial={{ opacity: 0, scale: 2.2 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 15, delay }}
            >
                <rect x={-w / 2} y={-13} width={w} height={26} rx={7} fill={hexToRgba(color, 0.18)} stroke={color} strokeWidth={2} />
                <text x={0} y={5.5} textAnchor="middle" fontSize={14} fontWeight={800} fill={color}>{text}</text>
            </motion.g>
        </g>
    )
}

const rightAngleMark = (o: { x: number; y: number; z: number }, d1: [number, number, number], d2: [number, number, number]) =>
    `M${ptStr(o.x + d1[0], o.y + d1[1], o.z + d1[2])} L${ptStr(o.x + d1[0] + d2[0], o.y + d1[1] + d2[1], o.z + d1[2] + d2[2])} L${ptStr(o.x + d2[0], o.y + d2[1], o.z + d2[2])}`

// Копьё: летит справа сверху с ускорением (остриём вперёд) и втыкается в точку O: покачивание,
// кольцо пыли и комочки земли. t — миллисекунды от старта (t<0 — ещё не началось).
const FLY_MS = 950
const spearFlight = (t: number) => {
    if (t >= FLY_MS) {
        const te = t - FLY_MS
        return { f: 0, wob: 6 * Math.exp(-te / 240) * Math.cos(te / 48), te, op: 1 }
    }
    if (t < 0) return { f: 1, wob: 0, te: -1, op: 0 }
    return { f: 1 - Math.pow(t / FLY_MS, 2.3), wob: 0, te: -1, op: Math.min(1, t / 140) }
}

const DUST = Array.from({ length: 9 }, (_, i) => ({ ang: (i / 9) * Math.PI * 2 + 0.3, dist: 26 + ((i * 37) % 22), rise: 14 + ((i * 53) % 18), r: 2 + (i % 3) }))

// scene: 0 земля · 1 копьё · 2 линия · 3 вопрос · 4 тень · 5 угол 90° · 6-7 «по-школьному»
const Figure = ({ scene, pick, beat = 0, onPick, phi = 0, rotate, fly = false, pre = 3, bushJoke }: {
    scene: number; pick: number | null; beat?: number; onPick?: (s: number) => void
    // сцена 0: шутка «Если что, это кустик» (стрелка + подпись), true — показать, false — убрать
    bushJoke?: boolean
    // сцена 4: 1 — опускается солнце, 2 — с bounce появляется тёмная тень, 3 — можно выбирать точку
    pre?: number
    phi?: number
    rotate?: { onRotate: (rawDeg: number) => void; locked: boolean }
    fly?: boolean
}) => {
    const school = scene >= 6
    const hasSpear = scene >= 1
    const hasB = scene >= 2
    const s = pick ?? (scene >= 5 ? DEFAULT_PICK : null)
    const later = scene > 4
    const showPerp = s != null && (later || (scene === 4 && beat >= 1))
    const showH = s != null && (later || (scene === 4 && beat >= 2))
    const showProj = s != null && (later || (scene === 4 && beat >= 3))
    const fresh4 = scene === 4
    const freshWords = scene === 6 // подписи меняются на школьные
    const sunOn = scene === 4 ? pre >= 1 : scene === 5
    const shadowOn = scene === 4 ? pre >= 2 : scene === 5
    const svgRef = useRef<SVGSVGElement>(null)

    // полёт копья
    const [t, setT] = useState(fly ? -1 : 1e9)
    useEffect(() => {
        if (!fly) return
        const t0 = performance.now() + 450
        const id = setInterval(() => { const e = performance.now() - t0; setT(e); if (e > 2600) clearInterval(id) }, 16)
        return () => clearInterval(id)
    }, [fly])
    const flight = spearFlight(t)

    const Op = P3(O3.x, O3.y, 0)
    const planePts = PLANE_CORNERS.map(([x, y]) => ptStr(x, y, 0)).join(' ')
    const planePath = `M${PLANE_CORNERS.map(([x, y]) => ptStr(x, y, 0)).join(' L')} Z`

    const top = aPoint(S_HIGH)
    const aTop = P3(top.x, top.y, top.z)
    const vx = aTop.x - Op.x, vy = aTop.y - Op.y
    const vLen = Math.hypot(vx, vy)
    const spearRot = (Math.atan2(-vx / vLen, vy / vLen) * 180) / Math.PI
    const spearW = 12.5 // ширина копья фиксирована: длиннее копьё — картинка тянется только в длину

    // линия b через O под углом φ (на земле), ручка — на «ближнем к зрителю» конце
    const ph = phi * DEG
    const e1 = P3(O3.x + LB * Math.cos(ph), O3.y + LB * Math.sin(ph), 0)
    const e2 = P3(O3.x - LB * Math.cos(ph), O3.y - LB * Math.sin(ph), 0)
    const bPath = `M${e2.x.toFixed(1)},${e2.y.toFixed(1)} L${e1.x.toFixed(1)},${e1.y.toFixed(1)}`
    const handle = e1.y > e2.y ? e1 : e2
    const tagEnd = e1.y > e2.y ? e2 : e1
    // подпись «линия» — вдоль линии, ЗА ближним концом (за ручкой): там нет ни копья, ни точки O
    let tagAng = (Math.atan2(e1.y - e2.y, e1.x - e2.x) * 180) / Math.PI
    if (tagAng > 90) tagAng -= 180
    if (tagAng < -90) tagAng += 180
    const tdx = handle.x - tagEnd.x, tdy = handle.y - tagEnd.y, tdl = Math.hypot(tdx, tdy) || 1
    const tagPos = { x: handle.x + (tdx / tdl) * 52, y: handle.y + (tdy / tdl) * 52 }
    // линия (с подписью) проходит по стикеру O — рисуем его бледно
    const segDist = (p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) => {
        const vx2 = b.x - a.x, vy2 = b.y - a.y, l2 = vx2 * vx2 + vy2 * vy2 || 1
        const k = Math.max(0, Math.min(1, ((p.x - a.x) * vx2 + (p.y - a.y) * vy2) / l2))
        return Math.hypot(p.x - a.x - k * vx2, p.y - a.y - k * vy2)
    }
    const oT = oTagScreen()
    const oTagCrossed = hasB && (segDist(oT, e2, e1) < 22 || (!school && Math.hypot(tagPos.x - oT.x, tagPos.y - oT.y) < 40))

    // куст — у левого угла земли
    const cs = PLANE_CORNERS.map(([x, y]) => P3(x, y, 0))
    const farCorner = cs.reduce((best, c) => (c.x < best.x ? c : best), cs[0])
    const center = P3(CXW, CYW, 0)
    const bush = { x: farCorner.x + (center.x - farCorner.x) * 0.3, y: farCorner.y + (center.y - farCorner.y) * 0.3 + 4 }
    const alphaCorner = cs.reduce((best, c) => (c.x + c.y > best.x + best.y ? c : best), cs[0])
    const alphaPos = { x: alphaCorner.x + (center.x - alphaCorner.x) * 0.35, y: alphaCorner.y + (center.y - alphaCorner.y) * 0.35 }

    const onHandleMove = (e: React.PointerEvent) => {
        if (!rotate || rotate.locked || !svgRef.current) return
        const ctm = svgRef.current.getScreenCTM()
        if (!ctm) return
        const pt = svgRef.current.createSVGPoint()
        pt.x = e.clientX; pt.y = e.clientY
        const q = pt.matrixTransform(ctm.inverse())
        const w = unproject(q.x, q.y)
        rotate.onRotate((Math.atan2(w.y - O3.y, w.x - O3.x) * 180) / Math.PI)
    }

    let projEl: React.ReactNode = null
    if (s != null) {
        const pP = aPoint(s)
        const H = P3(5, O3.y + s, 0)
        const Pp = P3(pP.x, pP.y, pP.z)
        const dx = H.x - Op.x, dy = H.y - Op.y
        const len = Math.hypot(dx, dy) || 1
        let nx = -dy / len, ny = dx / len
        if (ny < 0) { nx = -nx; ny = -ny }
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI
        const tx = (Op.x + H.x) / 2 + nx * 20, ty = (Op.y + H.y) / 2 + ny * 20
        projEl = (
            <>
                {showPerp && (
                    <>
                        <DrawPath d={`M${Pp.x},${Pp.y} L${H.x},${H.y}`} color={X_COLOR} w={2.6} fresh={fresh4} dur={0.8} />
                        <Dot x={Pp.x} y={Pp.y} color={A_COLOR} fresh={fresh4} />
                    </>
                )}
                {showH && (
                    <>
                        <FadeIn fresh={fresh4}>
                            <path d={rightAngleMark({ x: 5, y: O3.y + s, z: 0 }, [0, -0.7, 0], [0, 0, 0.7])} fill="none" stroke={X_COLOR} strokeWidth={2.2} strokeLinecap="round" />
                        </FadeIn>
                        <Dot x={H.x} y={H.y} color={X_COLOR} fresh={fresh4} />
                        <SvgTag x={H.x + 22} y={H.y - 4} text="H" color={X_COLOR} delay={fresh4 ? 0.2 : 0} />
                    </>
                )}
                {showProj && (
                    <>
                        <DrawPath d={`M${Op.x},${Op.y} L${H.x},${H.y}`} color={SHADOW_LINE} w={4.5} fresh={fresh4} dur={0.9} />
                        <g transform={`translate(${tx},${ty}) rotate(${angle})`}>
                            <motion.g
                                key={school ? 's' : 'l'}
                                initial={fresh4 || freshWords ? { opacity: 0, scale: 2 } : { opacity: 1, scale: 1 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 320, damping: 15, delay: fresh4 ? 0.9 : freshWords ? 0.3 : 0 }}
                            >
                                {school ? (
                                    <text x={0} y={4} textAnchor="middle" fontSize={12} fontWeight={800} fill={PROJ_COLOR}>проекция a</text>
                                ) : (
                                    <>
                                        <rect x={-22} y={-11} width={44} height={22} rx={6} fill={SH.bg} stroke={SH.border} strokeWidth={2} />
                                        <text x={0} y={5} textAnchor="middle" fontSize={13} fontWeight={800} fill={SH.color}>тень</text>
                                    </>
                                )}
                            </motion.g>
                        </g>
                    </>
                )}
            </>
        )
    }

    const perpendicular = Math.abs(phi) < 0.6
    const shake = flight.te >= 0 && flight.te < 320 ? Math.sin(flight.te / 18) * 2.6 * Math.exp(-flight.te / 110) : 0
    return (
        <svg ref={svgRef} viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full max-w-[448px] mx-auto" style={{ overflow: 'visible', touchAction: rotate && !rotate.locked ? 'none' : undefined }}>
            <defs>
                <radialGradient id="ttpSunGlow">
                    <stop offset="0%" stopColor="#FFE27A" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#FFE27A" stopOpacity="0" />
                </radialGradient>
            </defs>
            <g transform={`translate(${shake},0)`}>
                {/* земля: заливка без яркой обводки (обводка — только «по-школьному») */}
                <motion.polygon
                    points={planePts} fill={hexToRgba(PLANE_COLOR, 0.2)}
                    stroke={hexToRgba(PLANE_COLOR, school ? 0.95 : 0.22)} strokeWidth={school ? 3 : 1.5} strokeLinejoin="round"
                    initial={{ opacity: scene === 0 ? 0 : 1 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
                />
                {school && <DrawPath d={planePath} color={PLANE_COLOR} w={3} fresh dur={0.9} />}
                {school && (
                    <motion.text x={alphaPos.x} y={alphaPos.y + 6} textAnchor="middle" fontSize={20} fontStyle="italic" fill={PLANE_COLOR} fontWeight={800}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}>α</motion.text>
                )}

                {/* куст в углу — чтобы было похоже на настоящую площадку (кружки-крона) */}
                <g transform={`translate(${bush.x},${bush.y}) scale(0.62)`} opacity={0.85}>
                    <motion.g
                        initial={{ opacity: scene === 0 ? 0 : 1 }} animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <ellipse cx={2} cy={2} rx={34} ry={9} fill="#04080A" opacity={0.28} />
                        <circle cx={-17} cy={-9} r={15} fill="#3E7D3C" />
                        <circle cx={19} cy={-8} r={14} fill="#468A42" />
                        <circle cx={1} cy={-16} r={19} fill="#4F9A4A" />
                        <circle cx={-6} cy={-22} r={7} fill="#74BD62" opacity={0.7} />
                    </motion.g>
                </g>
                {bushJoke !== undefined && (
                    <g transform={`translate(${bush.x},${bush.y})`}>
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: bushJoke ? 1 : 0 }} transition={{ duration: 0.4 }}>
                            <motion.path
                                d="M58,-110 C30,-106 12,-74 8,-28" fill="none" stroke="#F2C35B" strokeWidth={3} strokeLinecap="round"
                                initial={{ pathLength: 0 }} animate={{ pathLength: bushJoke ? 1 : 0 }} transition={{ duration: 0.5 }}
                            />
                            <motion.path
                                d="M0,-38 L8,-26 L17,-37" fill="none" stroke="#F2C35B" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
                                initial={{ opacity: 0 }} animate={{ opacity: bushJoke ? 1 : 0 }} transition={{ delay: bushJoke ? 0.45 : 0, duration: 0.2 }}
                            />
                            <text x={64} y={-106} fontSize={15} fontWeight={800} fill="#F2C35B">Это кустик,</text>
                            <text x={64} y={-88} fontSize={15} fontWeight={800} fill="#F2C35B">если что</text>
                        </motion.g>
                    </g>
                )}

                {/* тёмная тень копья на земле (bounce) */}
                {shadowOn && (() => {
                    const Hm = P3(5, O3.y + S_HIGH, 0)
                    const dx = Hm.x - Op.x, dy = Hm.y - Op.y
                    // тень «выстреливает» из точки O вверх-вправо с крупным перелётом (bounce)
                    return (
                        <motion.line
                            x1={Op.x} y1={Op.y} stroke={GGEGE_SHADOW.button} strokeOpacity={0.95} strokeWidth={12} strokeLinecap="round"
                            initial={fresh4 ? { x2: Op.x, y2: Op.y, opacity: 0 } : { x2: Op.x + dx, y2: Op.y + dy, opacity: 1 }}
                            animate={{ x2: Op.x + dx, y2: Op.y + dy, opacity: 1 }}
                            transition={{ type: 'spring', bounce: 0.6, duration: 1.1, opacity: { duration: 0.15 } }}
                        />
                    )
                })()}

                {hasB && (
                    <>
                        <DrawPath d={bPath} color={B_COLOR} w={4} fresh={scene === 2 && !rotate} dur={0.9} />
                        {!school && <SvgWordTag x={tagPos.x} y={tagPos.y} angle={tagAng} text="линия" color={B_COLOR} delay={scene === 2 ? 0.7 : 0} />}
                        {school && <SvgTag x={tagEnd.x - 4} y={tagEnd.y - 18} text="b" color={B_COLOR} delay={0.3} />}
                    </>
                )}

                {/* копьё (картинка): летит и втыкается. Подписей нет — «оно и так копьё» */}
                {hasSpear && flight.op > 0 && (
                    <g transform={`translate(${Op.x + vx * 1.5 * flight.f},${Op.y + vy * 1.5 * flight.f})`} opacity={flight.op}>
                        {flight.f > 0.02 && (
                            <line x1={vx * 0.0} y1={vy * 0.0} x2={vx * 0.55 * flight.f} y2={vy * 0.55 * flight.f} stroke="#F2F7FB" strokeOpacity={0.28 * flight.f} strokeWidth={3} strokeLinecap="round" transform={`translate(${vx},${vy})`} />
                        )}
                        <g transform={`rotate(${flight.wob})`}>
                            <g transform={`rotate(${spearRot})`}>
                                <image href="/lesson-pics/spear.webp" x={-spearW / 2} y={0} width={spearW} height={vLen} preserveAspectRatio="none" />
                            </g>
                        </g>
                    </g>
                )}
                {school && <line x1={Op.x} y1={Op.y} x2={aTop.x} y2={aTop.y} stroke={A_COLOR} strokeWidth={3} strokeLinecap="round" opacity={0.7} />}
                {school && <SvgTag x={aTop.x + 18} y={aTop.y + 2} text="a" color={A_COLOR} delay={0.3} />}

                {/* удар: кольцо пыли и комочки земли */}
                {hasSpear && flight.te >= 0 && flight.te < 800 && (
                    <g transform={`translate(${Op.x},${Op.y})`}>
                        <ellipse rx={10 + 62 * (flight.te / 650)} ry={(10 + 62 * (flight.te / 650)) * 0.38} fill="none" stroke="#E7D3A8" strokeWidth={3} opacity={Math.max(0, 0.7 * (1 - flight.te / 650))} />
                        {DUST.map((d, i) => {
                            const k = Math.min(1, flight.te / 700)
                            return <circle key={i} cx={Math.cos(d.ang) * d.dist * k} cy={Math.sin(d.ang) * d.dist * k * 0.45 - Math.sin(Math.PI * k) * d.rise} r={d.r} fill="#C9A978" opacity={Math.max(0, 1 - k)} />
                        })}
                    </g>
                )}

                {hasSpear && <GroundODot fresh={scene === 1} delay={FLY_MS / 1000 + 0.45} />}
                {hasSpear && <GroundOTag pale={oTagCrossed} delay={scene === 1 ? FLY_MS / 1000 + 0.75 : 0} />}

                {projEl}

                {/* прямой угол между тенью и линией */}
                {scene >= 5 && perpendicular && (
                    <FadeIn fresh={scene === 5} delay={0.1}>
                        <path d={rightAngleMark(O3, [0.8, 0, 0], [0, 0.8, 0])} fill="none" stroke={MARK_COLOR} strokeWidth={2.4} strokeLinecap="round" />
                    </FadeIn>
                )}

                {/* солнце (стикер) опускается слева сверху */}
                {sunOn && (
                    <g transform="translate(48,40)">
                        <motion.g
                            initial={fresh4 ? { y: -110, opacity: 0 } : { y: 0, opacity: 1 }} animate={{ y: 0, opacity: 1 }}
                            transition={{ type: 'spring', bounce: 0.45, duration: 1.1 }}
                        >
                            <g className="animate-sun-bob">
                                <circle r={46} fill="url(#ttpSunGlow)" />
                                <image href="/lesson-pics/sun.svg" x={-32} y={-32} width={64} height={64} />
                            </g>
                        </motion.g>
                    </g>
                )}

                {/* точки на копье, из которых можно «опустить луч» */}
                {scene === 4 && pick == null && onPick && pre >= 3 && CANDIDATES.map((c) => {
                    const p = aPoint(c); const q = P3(p.x, p.y, p.z)
                    return (
                        <g key={c} onClick={() => onPick(c)} style={{ cursor: 'pointer' }}>
                            <circle cx={q.x} cy={q.y} r={20} fill="transparent" />
                            <motion.circle cx={q.x} cy={q.y} r={13} fill="none" stroke={A_COLOR} strokeWidth={2}
                                animate={{ opacity: [0.15, 0.7, 0.15] }} transition={{ duration: 1.4, repeat: Infinity }} />
                            <circle cx={q.x} cy={q.y} r={6.5} fill={A_COLOR} stroke="#0B1216" strokeWidth={1.5} />
                        </g>
                    )
                })}

                {/* ручка вращения линии b */}
                {rotate && (
                    <g
                        onPointerDown={(e) => { if (!rotate.locked) { try { (e.currentTarget as Element).setPointerCapture(e.pointerId) } catch { /* не страшно: ведём по move */ } } }}
                        onPointerMove={(e) => { if (e.buttons || e.pointerType === 'touch') onHandleMove(e) }}
                        style={{ cursor: rotate.locked ? 'default' : 'grab', touchAction: 'none' }}
                    >
                        <circle cx={handle.x} cy={handle.y} r={26} fill="transparent" />
                        {!rotate.locked && (
                            <motion.circle cx={handle.x} cy={handle.y} r={16} fill="none" stroke={B_COLOR} strokeWidth={2}
                                animate={{ opacity: [0.2, 0.9, 0.2] }} transition={{ duration: 1.3, repeat: Infinity }} />
                        )}
                        <circle cx={handle.x} cy={handle.y} r={9} fill={B_COLOR} stroke="#0B1216" strokeWidth={2} />
                    </g>
                )}
            </g>
        </svg>
    )
}

type SceneProps = { onSettled?: (nextLabel?: string) => void; leaving?: boolean; onAutoNext?: () => void }

const SceneBox = ({ children }: { children: React.ReactNode }) => <div className="w-full flex flex-col items-center gap-3">{children}</div>

// Диаграмма появляется ПОСЛЕ печати текста (текст → чертёж → пауза), а потом сцена готова.
const useAfterTyped = () => {
    const [typed, setTyped] = useState(false)
    return { typed, onTyped: () => setTyped(true) }
}

// Шутка: после появления площадки — стрелка на куст «Если что, это кустик» (остаётся в этой сцене, в следующих её нет).
const GroundScene = ({ onSettled }: SceneProps) => {
    const { typed, onTyped } = useAfterTyped()
    const [joke, setJoke] = useState<boolean | undefined>(undefined)
    const timers = useRef<ReturnType<typeof setTimeout>[]>([])
    useEffect(() => () => timers.current.forEach(clearTimeout), [])
    const afterDiagram = () => {
        timers.current.push(
            setTimeout(() => setJoke(true), 500),
            setTimeout(() => onSettled?.(), 1100),
        )
    }
    return (
        <SceneBox>
            <TypedLineWithParts parts={[{ text: 'Вот площадка для метания копья 🌿' }]} onSettled={onTyped} />
            {typed && <DiagramBlock onSettled={afterDiagram}><Figure scene={0} pick={null} bushJoke={joke} /></DiagramBlock>}
        </SceneBox>
    )
}

// «Спортсменка бросает копьё..» → видео броска (один раз) → видео убираем, копьё летит и
// втыкается → «оно воткнулось в землю в точке O.»
const SpearScene = ({ onSettled }: SceneProps) => {
    // 0 печать · 1 видео · 2 копьё втыкается · 3 подпись про точку O
    const [phase, setPhase] = useState(0)
    const videoRef = useRef<HTMLVideoElement>(null)
    const endedRef = useRef(false)
    const finishVideo = () => { if (endedRef.current) return; endedRef.current = true; setPhase(2) }
    useEffect(() => {
        if (phase !== 1) return
        const v = videoRef.current
        if (v) v.play().catch(() => { v.muted = true; v.play().catch(() => null) })
        const t = setTimeout(finishVideo, 7000) // страховка, если ended не придёт
        return () => clearTimeout(t)
    }, [phase])
    useEffect(() => {
        if (phase !== 2) return
        const t = setTimeout(() => setPhase(3), 450 + FLY_MS + 1300)
        return () => clearTimeout(t)
    }, [phase])
    return (
        <SceneBox>
            <TypedLineWithParts
                parts={[{ text: 'Спортсменка 🏃 бросает ' }, { sticker: 'копьё', color: A_COLOR }, { text: '..' }]}
                onSettled={() => setPhase(1)}
            />
            {phase === 1 && (
                <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }} className="w-full flex justify-center">
                    <video
                        ref={videoRef} src="/video/spear-throw.mp4" playsInline preload="auto" onEnded={finishVideo}
                        className="w-full max-w-[360px] rounded-2xl border-2 border-[#3A464E]"
                    />
                </motion.div>
            )}
            {phase >= 2 && <DiagramBlock><Figure scene={1} pick={null} fly /></DiagramBlock>}
            {phase >= 3 && (
                <TypedLineWithParts
                    parts={[{ text: 'Оно воткнулось в землю в точке ' }, { sticker: 'O', color: O_TEXT, bg: O_FILL, border: O_TEXT }, { text: '.' }]}
                    onSettled={() => onSettled?.()}
                />
            )}
        </SceneBox>
    )
}

const LineScene = ({ onSettled, onAutoNext }: SceneProps) => {
    const { phi: _phi, setPhi } = useContext(PickCtx)
    const [typed, setTyped] = useState(false)
    const [locked, setLocked] = useState(false)
    // стартовый угол — случайный и НЕ перпендикулярный (32–58° в любую сторону)
    const [initial] = useState(() => (Math.random() < 0.5 ? -1 : 1) * (32 + Math.random() * 26))
    const [target, setTarget] = useState(initial)
    const shown = useEasedAngle(target, initial)
    const [moved, setMoved] = useState(false)
    useEffect(() => { setPhi(initial) }, [setPhi, initial])
    return (
        <SceneBox>
            <TypedLineWithParts
                parts={[
                    { text: 'И пусть через ' }, { bold: 'ЭТУ' }, { text: ' точку проведена ' }, { sticker: 'линия', color: B_COLOR }, { text: '.' }, { break: true },
                    { bold: 'Крути её так, чтобы она ПРИМЕРНО стала ' }, { sticker: 'перпендикулярна', color: MARK_COLOR }, { text: ' ' },
                    { sticker: 'копью', color: A_COLOR }, { text: '.' },
                ]}
                onSettled={() => setTyped(true)}
            />
            {typed && (
                <>
                    <DiagramBlock>
                        <Figure
                            scene={2} pick={null} phi={shown}
                            rotate={{ locked, onRotate: (raw) => { setTarget(detent(raw)); setMoved(true) } }}
                        />
                    </DiagramBlock>
                    {!locked && (
                        <>
                            {!moved && <p className="text-sm text-[#9AA7B0]">👆 тяни за зелёный кружок</p>}
                            {/* анимируем обёртку, кнопка внутри статична (иначе CSS-transition дерётся с framer) */}
                            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className="mx-auto">
                                <button
                                    type="button"
                                    onClick={() => { setLocked(true); setPhi(target); onSettled?.(); setTimeout(() => onAutoNext?.(), 300) }}
                                    className="h-[52px] rounded-lg bg-[#A1D151] px-8 text-lg font-bold text-[#151F24] active:translate-y-1"
                                    style={walkthroughButtonStyle(true)}
                                >
                                    Примерно так 👌
                                </button>
                            </motion.div>
                        </>
                    )}
                </>
            )}
        </SceneBox>
    )
}

const GuessBtn = ({ children, onClick, color }: { children: React.ReactNode; onClick: () => void; color: string }) => (
    <button type="button" onClick={onClick} className="flex-1 rounded-xl border-2 px-3 py-3 text-base font-black active:translate-y-[2px]"
        style={{ borderColor: color, backgroundColor: hexToRgba(color, 0.14), color }}>
        {children}
    </button>
)

// Пауза-«многоточие»: . → .. → ... (два круга), потом остаётся «...»
const ThinkingDots = ({ done, onDone }: { done: boolean; onDone: () => void }) => {
    const [n, setN] = useState(1)
    useEffect(() => {
        if (done) return
        let k = 1
        const id = setInterval(() => {
            k += 1
            if (k > 6) { clearInterval(id); setN(3); onDone(); return }
            setN(((k - 1) % 3) + 1)
        }, 450)
        return () => clearInterval(id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return (
        <div className="h-8 text-3xl font-black leading-none text-[#F2F7FB] tracking-[0.2em]">
            {'.'.repeat(done ? 3 : n)}
        </div>
    )
}

const QuestionScene = ({ onSettled, leaving }: SceneProps) => {
    const { phi } = useContext(PickCtx)
    const [shown, setShown] = useState(false)
    const [asked, setAsked] = useState(false)
    // после ответа: текст → пауза с «многоточием» → сам вопрос → видео
    const [phase, setPhase] = useState(0) // 0 — текст, 0.5 — «надо ответить на вопрос», 1 — многоточие, 2 — вопрос, 3 — видео
    const officeRef = useRef<HTMLVideoElement>(null)
    useEffect(() => { if (leaving) officeRef.current?.pause() }, [leaving])
    return (
        <SceneBox>
            <DiagramBlock><Figure scene={3} pick={null} phi={phi} /></DiagramBlock>
            <TypedLineWithParts
                parts={[{ text: 'А ' }, { bold: 'точно' }, { text: ' ли ' }, { sticker: 'копьё', color: A_COLOR }, { text: ' перпендикулярно ' }, { sticker: 'линии', color: B_COLOR }, { text: '? 🤔' }]}
                onSettled={() => setShown(true)}
            />
            {shown && !asked && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full flex gap-2">
                    <GuessBtn color={A_COLOR} onClick={() => setAsked(true)}>Да</GuessBtn>
                    <GuessBtn color={A_COLOR} onClick={() => setAsked(true)}>Нет</GuessBtn>
                    <GuessBtn color={MARK_COLOR} onClick={() => setAsked(true)}>Не знаю 🤔</GuessBtn>
                </motion.div>
            )}
            {asked && (
                <TypedLineWithParts
                    parts={[
                        { text: 'Глазами не заметно 😅' }, { break: true },
                        { text: 'А чтобы это узнать точно —' },
                    ]}
                    onSettled={() => setTimeout(() => setPhase(0.5), 900)}
                />
            )}
            {phase >= 0.5 && (
                <TypedLineWithParts parts={[{ text: 'надо ответить на вопрос' }]} onSettled={() => setPhase(1)} />
            )}
            {phase >= 1 && <ThinkingDots done={phase >= 2} onDone={() => setPhase(2)} />}
            {phase >= 2 && (
                <TypedLineWithParts
                    parts={[
                        { text: 'а будет ли перпендикулярна ' }, { sticker: 'ТЕНЬ', ...SH }, { text: ' к этой ' },
                        { sticker: 'линии', color: B_COLOR }, { text: '?' },
                    ]}
                    onSettled={() => { setPhase(3); setTimeout(() => onSettled?.('Понял-принял'), 1500) }}
                />
            )}
            {phase >= 3 && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.4 }} className="flex justify-center">
                    <AlphaVideo ref={officeRef} src="/video/office-steve.webm" autoPlay loop muted playsInline className="w-full max-w-[240px]" />
                </motion.div>
            )}
        </SceneBox>
    )
}

const ShadowScene = ({ onSettled }: SceneProps) => {
    const { pick, setPick, phi } = useContext(PickCtx)
    const [typed, setTyped] = useState(false)
    const [pre, setPre] = useState(0)
    const [beat, setBeat] = useState(0)
    const [askOk, setAskOk] = useState(false) // кнопка «Агась» после перпендикуляра
    const [found, setFound] = useState(false) // нажали «Агась» → рисуем тень OH
    // сцена начинается заново — прошлый выбор точки сбрасываем
    useEffect(() => { setPick(null) }, [setPick])
    // после печати: солнце опускается → с bounce появляется тень → можно выбирать точку
    useEffect(() => {
        if (!typed) return
        const t1 = setTimeout(() => setPre(1), 250)
        const t2 = setTimeout(() => setPre(2), 1750)
        const t3 = setTimeout(() => setPre(3), 3000)
        return () => { [t1, t2, t3].forEach(clearTimeout) }
    }, [typed])
    // выбрали точку: перпендикуляр на землю → точка H и прямой угол (белым) → «Агась»
    useEffect(() => {
        if (pick == null) return
        const t1 = setTimeout(() => setBeat(1), 150)
        const t2 = setTimeout(() => setBeat(2), 1100)
        const t3 = setTimeout(() => setAskOk(true), 1900)
        return () => { [t1, t2, t3].forEach(clearTimeout) }
    }, [pick])
    const onAgree = () => { setAskOk(false); setFound(true); setBeat(3) }
    return (
        <SceneBox>
            <TypedLineWithParts
                parts={[{ text: 'Выглянуло солнце ☀️ и копьё стало отбрасывать ' }, { sticker: 'тень', ...SH }, { text: '.' }]}
                onSettled={() => setTyped(true)}
            />
            {typed && (
                <DiagramBlock>
                    <Figure scene={4} pick={pick} beat={beat} phi={phi} pre={pre} onPick={(s) => setPick(s)} />
                </DiagramBlock>
            )}
            {pre >= 3 && (
                <TypedLineWithParts
                    parts={[{ text: 'Давай от любой точки ' }, { sticker: 'копья', color: A_COLOR }, { text: ' нарисуем ' }, { bold: 'ПЕРПЕНДИКУЛЯР' }, { text: ' на землю' }]}
                />
            )}
            {askOk && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto">
                    <button type="button" onClick={onAgree}
                        className="h-[52px] rounded-lg bg-[#A1D151] px-8 text-lg font-bold text-[#151F24] active:translate-y-1"
                        style={walkthroughButtonStyle(true)}>
                        Агась
                    </button>
                </motion.div>
            )}
            {found && (
                <TypedLineWithParts
                    parts={[
                        { bold: 'УРА! Вот она!' }, { break: true },
                        { sticker: 'OH', ...SH }, { text: ' — ' }, { sticker: 'тень', ...SH }, { text: ' от «копья»' },
                    ]}
                    onSettled={() => setTimeout(() => onSettled?.('Изи катка'), 600)}
                />
            )}
        </SceneBox>
    )
}

const NinetyScene = ({ onSettled }: SceneProps) => {
    const { pick, phi: phi0 } = useContext(PickCtx)
    const off = Math.abs(phi0) > 1
    const angleBetween = Math.round(90 - Math.abs(phi0))
    const [typed, setTyped] = useState(false)
    const [msg, setMsg] = useState(false)
    const [fix, setFix] = useState(false)
    const [final, setFinal] = useState(false)
    const [party, setParty] = useState(false)
    const shown = useEasedAngle(fix ? 0 : phi0, phi0)
    return (
        <SceneBox>
            <TypedLineWithParts
                parts={[{ text: 'Смотрим, какой угол между ' }, { sticker: 'тенью', ...SH }, { text: ' и ' }, { sticker: 'линией', color: B_COLOR }, { text: '…' }]}
                onSettled={() => setTyped(true)}
            />
            {typed && <DiagramBlock onSettled={() => setTimeout(() => setMsg(true), 1100)}><Figure scene={5} pick={pick} phi={shown} /></DiagramBlock>}
            {msg && (
                <TypedLineWithParts
                    parts={off
                        ? [{ text: `Получилось ${angleBetween}° — не 90°! Подкрутим линию до прямого угла 🔧` }]
                        : [{ text: 'Ровно ' }, { sticker: '90°', color: MARK_COLOR }, { text: '! Глаз — алмаз 🎯' }]}
                    onSettled={() => { setFix(true); setTimeout(() => setFinal(true), off ? 1700 : 300) }}
                />
            )}
            {final && (
                <>
                    <TypedLineWithParts
                        parts={[
                            { text: 'Теперь ' }, { sticker: 'тень', ...SH }, { text: ' ⟂ ' }, { sticker: 'линии', color: B_COLOR },
                            { text: ' — значит и ' }, { sticker: 'копьё', color: A_COLOR }, { text: ' ⟂ ' }, { sticker: 'линии', color: B_COLOR }, { text: '!' },
                        ]}
                        onSettled={() => { setParty(true); onSettled?.() }}
                    />
                    {party && <LocalAnswerConfetti />}
                </>
            )}
        </SceneBox>
    )
}

// «А теперь по-школьному»: те же объекты, но с настоящими названиями.
const SCHOOL_ROWS: { life: string; lifeColor: string; school: string; schoolColor: string }[] = [
    { life: 'земля', lifeColor: PLANE_COLOR, school: 'плоскость α', schoolColor: PLANE_COLOR },
    { life: 'копьё', lifeColor: A_COLOR, school: 'наклонная a', schoolColor: A_COLOR },
    { life: 'линия', lifeColor: B_COLOR, school: 'прямая b', schoolColor: B_COLOR },
    { life: 'тень', lifeColor: PROJ_COLOR, school: 'проекция a', schoolColor: PROJ_COLOR },
]
const SchoolScene = ({ onSettled }: SceneProps) => {
    const { pick } = useContext(PickCtx)
    const [typed, setTyped] = useState(false)
    const [rows, setRows] = useState(0)
    useEffect(() => {
        if (!typed) return
        const timers = SCHOOL_ROWS.map((_, i) => setTimeout(() => setRows(i + 1), 900 + i * 1000))
        const done = setTimeout(() => onSettled?.(), 900 + SCHOOL_ROWS.length * 1000 + 600)
        return () => { [...timers, done].forEach(clearTimeout) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [typed])
    return (
        <SceneBox>
            <TypedLineWithParts parts={[{ text: 'А теперь — ' }, { bold: 'по-школьному 🎓' }]} onSettled={() => setTyped(true)} />
            {typed && <DiagramBlock><Figure scene={6} pick={pick} phi={0} /></DiagramBlock>}
            <div className="w-full flex flex-col gap-2">
                {SCHOOL_ROWS.slice(0, rows).map((r) => (
                    <motion.div key={r.life} initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-base md:text-lg">
                        <span className="justify-self-end"><Sticker value={r.life} {...(r.life === 'тень' ? SH : { color: r.lifeColor })} /></span>
                        <span className="font-black text-[#9AA7B0]">→</span>
                        <span className="justify-self-start"><Sticker value={r.school} {...(r.life === 'тень' ? SH : { color: r.schoolColor })} /></span>
                    </motion.div>
                ))}
            </div>
        </SceneBox>
    )
}

// ===== Итог: ТТП ещё раз на чертеже (по шагам) =====
// «Наклонная ⟂ прямой» → наклонная (+подпись), прямая (+подпись), угол 90° между ними →
// «ТОЛЬКО если проекция ⟂ прямой» → проекция (+подпись), угол 90° между проекцией и прямой.
const tagAlong = (a: { x: number; y: number }, b: { x: number; y: number }, t: number, off: number) => {
    const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1
    let ang = (Math.atan2(dy, dx) * 180) / Math.PI
    if (ang > 90) ang -= 180
    if (ang < -90) ang += 180
    const r = (ang * Math.PI) / 180
    // off > 0 — над линией (по экрану), off < 0 — под ней
    return { x: a.x + dx * t + Math.sin(r) * off, y: a.y + dy * t - Math.cos(r) * off, ang }
}

// Значок прямого угла: белый, появляется крупно с отскоком (масштаб вокруг самого значка).
const BounceMark = ({ d }: { d: string }) => (
    <motion.g initial={{ scale: 3.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.6, duration: 0.9 }}>
        <path d={d} fill="none" stroke={X_COLOR} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </motion.g>
)

const TheoremFigure = ({ stage }: { stage: number }) => {
    const Op = P3(O3.x, O3.y, 0)
    const top = aPoint(S_HIGH)
    const T = P3(top.x, top.y, top.z)
    const Hf = P3(O3.x, O3.y + S_HIGH, 0)
    const bL = P3(O3.x - LB, O3.y, 0), bR = P3(O3.x + LB, O3.y, 0)
    const planePts = PLANE_CORNERS.map(([x, y]) => ptStr(x, y, 0)).join(' ')
    const cs = PLANE_CORNERS.map(([x, y]) => P3(x, y, 0))
    const farCorner = cs.reduce((best, c) => (c.x < best.x ? c : best), cs[0])
    const center = P3(CXW, CYW, 0)
    const bush = { x: farCorner.x + (center.x - farCorner.x) * 0.3, y: farCorner.y + (center.y - farCorner.y) * 0.3 + 4 }
    const aTag = tagAlong(Op, T, 0.62, 18)
    const bTag = tagAlong(Op, bL, 0.78, -17)
    const pTag = tagAlong(Op, Hf, 0.55, -17)
    const aLen = Math.hypot(0, 1, 1.05)
    return (
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full max-w-[448px] mx-auto" style={{ overflow: 'visible' }}>
            <polygon points={planePts} fill={hexToRgba(PLANE_COLOR, 0.2)} stroke={hexToRgba(PLANE_COLOR, 0.22)} strokeWidth={1.5} strokeLinejoin="round" />
            <g transform={`translate(${bush.x},${bush.y}) scale(0.62)`} opacity={0.85}>
                <ellipse cx={2} cy={2} rx={34} ry={9} fill="#04080A" opacity={0.28} />
                <circle cx={-17} cy={-9} r={15} fill="#3E7D3C" />
                <circle cx={19} cy={-8} r={14} fill="#468A42" />
                <circle cx={1} cy={-16} r={19} fill="#4F9A4A" />
                <circle cx={-6} cy={-22} r={7} fill="#74BD62" opacity={0.7} />
            </g>
            {stage >= 4 && (
                <>
                    <DrawPath d={`M${Op.x},${Op.y} L${Hf.x},${Hf.y}`} color={PROJ_COLOR} w={5} fresh dur={0.8} />
                    <SvgWordTag x={pTag.x} y={pTag.y} angle={pTag.ang} text="проекция" color={PROJ_COLOR} delay={0.6} />
                </>
            )}
            {stage >= 2 && (
                <>
                    <DrawPath d={`M${bL.x},${bL.y} L${bR.x},${bR.y}`} color={B_COLOR} w={4} fresh dur={0.8} />
                    <SvgWordTag x={bTag.x} y={bTag.y} angle={bTag.ang} text="прямая" color={B_COLOR} delay={0.6} />
                </>
            )}
            {stage >= 3 && (
                <BounceMark d={rightAngleMark(O3, [0.95, 0, 0], [0, 0.95 / aLen, (0.95 * 1.05) / aLen])} />
            )}
            {stage >= 5 && (
                <BounceMark d={rightAngleMark(O3, [-0.9, 0, 0], [0, 0.9, 0])} />
            )}
            {stage >= 1 && (
                <>
                    <DrawPath d={`M${Op.x},${Op.y} L${T.x},${T.y}`} color={A_COLOR} w={4} fresh dur={0.8} />
                    <SvgWordTag x={aTag.x} y={aTag.y} angle={aTag.ang} text="наклонная" color={A_COLOR} delay={0.6} />
                </>
            )}
            <circle cx={Op.x} cy={Op.y} r={4.5} fill={X_COLOR} stroke="#0B1216" strokeWidth={1.5} />
        </svg>
    )
}

const TheoremScene = ({ onSettled }: SceneProps) => {
    // 0 печать «Наклонная ⟂ прямой» · 1 наклонная · 2 прямая · 3 угол 90° · 4 «ТОЛЬКО если…» напечатано → проекция · 5 угол 90°
    const [stage, setStage] = useState(0)
    const [onlyIf, setOnlyIf] = useState(false)
    const [final, setFinal] = useState(false)
    const timers = useRef<ReturnType<typeof setTimeout>[]>([])
    useEffect(() => () => timers.current.forEach(clearTimeout), [])
    const later = (ms: number, f: () => void) => { timers.current.push(setTimeout(f, ms)) }
    return (
        <SceneBox>
            <TypedLineWithParts
                parts={[{ sticker: 'Наклонная', color: A_COLOR }, { text: ' перпендикулярна ' }, { sticker: 'прямой', color: B_COLOR }]}
                onSettled={() => {
                    setStage(1)
                    later(1600, () => setStage(2))
                    later(3200, () => setStage(3))
                    later(4300, () => setOnlyIf(true))
                }}
            />
            <DiagramBlock><TheoremFigure stage={stage} /></DiagramBlock>
            {onlyIf && (
                <TypedLineWithParts
                    parts={[
                        { bold: 'ТОЛЬКО' }, { break: true },
                        { text: 'если ' }, { sticker: 'проекция', ...SH }, { text: ' перпендикулярна ' }, { sticker: 'прямой', color: B_COLOR },
                    ]}
                    onSettled={() => {
                        setStage(4)
                        later(1600, () => setStage(5))
                        later(3800, () => setFinal(true))
                    }}
                />
            )}
            {final && (
                <TypedLineWithParts
                    parts={[{ text: 'Это и есть ' }, { bold: 'Теорема о Трёх Перпендикулярах' }, { text: ' (ТТП) 🎉' }]}
                    onSettled={() => onSettled?.()}
                />
            )}
        </SceneBox>
    )
}

const CONCEPT_SCENES = [GroundScene, SpearScene, LineScene, QuestionScene, ShadowScene, NinetyScene, SchoolScene, TheoremScene]

const ConceptPhase = ({ onDone, scenes = CONCEPT_SCENES }: { onDone: () => void; scenes?: ((p: SceneProps) => JSX.Element)[] }) => {
    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)
    const [nextLabel, setNextLabel] = useState('Дальше')
    useEffect(() => { setNextLabel(pickWalkthroughNextLabel('Дальше')) }, [step])

    const { bump: bumpNonce, nonceFor } = useReplayNonces()
    const latestSceneKey = `step-${step}`
    const { isActive: isSceneActive, sceneRef } = useSceneFocus(latestSceneKey, stepReady)
    const canGoBack = step > 0
    const handleReplay = () => { bumpNonce(latestSceneKey); setStepReady(false) }
    const handleBack = () => {
        if (advancing || step === 0) return
        const target = step - 1
        bumpNonce(`step-${target}`)
        setStep(target)
        setStepReady(false)
    }
    const handleNext = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            if (step + 1 >= scenes.length) onDone()
            else { setStep((s) => s + 1); setStepReady(false) }
            setAdvancing(false)
        }, CONCEPT_PAUSE_MS)
    }

    return (
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-1 pb-8">
            <div className="w-full flex flex-col gap-4">
                {scenes.map((Scene, i) =>
                    step >= i ? (
                        <SceneWrapper key={`step-${i}`} innerRef={sceneRef(`step-${i}`)} active={isSceneActive(`step-${i}`)}>
                            <Fragment key={`step-${i}-${nonceFor(`step-${i}`)}`}>
                                <Scene onSettled={(label?: string) => { if (i !== step) return; if (label) setNextLabel(label); setStepReady(true) }} onAutoNext={() => i === step && handleNext()} leaving={advancing && i === step} />
                            </Fragment>
                        </SceneWrapper>
                    ) : null,
                )}
            </div>
            <div className="w-full flex items-center gap-2">
                <ReplayButton onClick={handleReplay} disabled={advancing} />
                <BackButton onClick={handleBack} disabled={advancing || !canGoBack} />
                <button type="button" onClick={handleNext} disabled={!stepReady || advancing}
                    className={walkthroughButtonClass(stepReady && !advancing)} style={walkthroughButtonStyle(stepReady && !advancing)}>
                    {nextLabel}
                </button>
            </div>
        </div>
    )
}

type ConceptQuizItem = {
    renderPrompt: () => React.ReactNode
    renderOptions: () => React.ReactNode[]
    correct: number
    feedback: string
    // Опциональная картинка над вопросом (мнемоника/шутка) — рендерится
    // ТОЛЬКО у этого конкретного вопроса, см. renderImage в JSX ниже.
    renderImage?: () => React.ReactNode
    // крупный чертёж под вопросом (на всю ширину)
    renderFigure?: () => React.ReactNode
}
const CONCEPT_QUIZ: ConceptQuizItem[] = [
    {
        renderPrompt: () => <><Sticker value="Копьё" color={A_COLOR} /> воткнулось. Как проверить, перпендикулярно ли оно <Sticker value="линии" color={B_COLOR} /> на земле?</>,
        renderOptions: () => ['Посмотреть, перпендикулярна ли линии ТЕНЬ копья', 'Измерить длину копья'],
        correct: 0,
        feedback: 'Тень (солнце над головой) — это проекция копья на землю. Смотрим на неё.',
    },
    {
        renderPrompt: () => <><Sticker value="Тень" {...SH} /> копья перпендикулярна <Sticker value="линии" color={B_COLOR} />. Тогда само <Sticker value="копьё" color={A_COLOR} /> и линия…</>,
        renderOptions: () => ['перпендикулярны (90°)', 'параллельны'],
        correct: 0,
        feedback: 'Тень ⟂ линии — значит и копьё ⟂ линии. Это ТТП!',
    },
    {
        renderPrompt: () => <><Sticker value="Тень" {...SH} /> <b>НЕ</b> перпендикулярна <Sticker value="линии" color={B_COLOR} />. Тогда <Sticker value="копьё" color={A_COLOR} /> и линия…</>,
        renderOptions: () => ['не перпендикулярны', 'всё равно перпендикулярны'],
        correct: 0,
        feedback: 'Работает в обе стороны: нет 90° у тени — нет 90° и у копья.',
    },
    {
        renderPrompt: () => <>Как «тень копья» называется <b>по-школьному</b>?</>,
        renderOptions: () => ['Проекция наклонной', 'Диагональ плоскости'],
        correct: 0,
        feedback: 'Копьё — наклонная, земля — плоскость, тень — проекция наклонной.',
    },
    {
        renderPrompt: () => <>Как называется эта теорема?</>,
        renderOptions: () => ['Теорема о Трёх Перпендикулярах (ТТП)', 'Теорема о Трёх Медведях'],
        correct: 0,
        feedback: 'ТТП: перпендикуляр к плоскости, проекция (тень) и наклонная (копьё).',
    },
    {
        renderPrompt: () => <>Бонус! Кто теперь чемпион по метанию стереометрии? 🏆</>,
        renderOptions: () => ['Я! 🔥'],
        correct: 0,
        feedback: 'Без вариантов — ты! Дальше будем решать задачи ЕГЭ 🚀',
    },
]

const pickQuizFeedbackPhrase = (i: number): string =>
    CORRECT_FEEDBACK_PHRASES[i % CORRECT_FEEDBACK_PHRASES.length]

const CONCEPT_QUIZ_TITLE = 'Проверим себя'

const QuizAnswerButton = ({
    children, onClick, disabled, state,
}: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; state: 'idle' | 'correct' | 'wrong' }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
            'flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl border-2 text-base md:text-lg font-bold text-center transition-colors',
            state === 'correct' && 'border-[#A1D151] bg-[#A1D15122] text-[#A1D151]',
            state === 'wrong' && 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]',
            state === 'idle' && 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]',
        )}
    >
        {children}
    </button>
)

const ConceptQuizPhase = ({ onDone, items = CONCEPT_QUIZ }: { onDone: (hadMistake: boolean) => void; items?: ConceptQuizItem[] }) => {
    const [trialIndex, setTrialIndex] = useState(0)
    const [checked, setChecked] = useState(false)
    const [wrongTried, setWrongTried] = useState<number[]>([])
    const registerCombo = useWalkthroughCombo()
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)
    const [hadMistake, setHadMistake] = useState(false)
    const [advancing, setAdvancing] = useState(false)
    const [nextLabel, setNextLabel] = useState('Дальше')

    const { bump: bumpNonce, nonceFor } = useReplayNonces()
    const latestSceneKey = `q-${trialIndex}`
    const { isActive: isSceneActive, sceneRef } = useSceneFocus(latestSceneKey, checked)
    const canGoBack = trialIndex > 0
    const handleReplay = () => bumpNonce(latestSceneKey)
    const handleBack = () => {
        if (advancing || trialIndex === 0) return
        const target = trialIndex - 1
        bumpNonce(`q-${target}`)
        setTrialIndex(target)
        setChecked(false)
        setWrongTried([])
        setWrongFlash(null)
    }

    const handlePick = (i: number, k: number) => {
        if (checked || wrongTried.includes(k)) return
        if (k === items[i].correct) {
            registerCombo(wrongTried.length === 0)
            showAnswerMeme(true)
            setChecked(true)
            setNextLabel(pickWalkthroughNextLabel(trialIndex + 1 >= items.length ? 'Готово' : 'Дальше'))
        } else {
            playSound(WRONG_ANSWER_SOUND)
            setHadMistake(true)
            showAnswerMeme(false)
            setWrongTried((w) => [...w, k])
            setWrongFlash(pickWrongTryPhrase())
        }
    }

    const handleNext = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            const isLast = trialIndex + 1 >= items.length
            if (isLast) {
                setAdvancing(false)
                onDone(hadMistake)
                return
            }
            setTrialIndex((i) => i + 1)
            setChecked(false)
            setWrongTried([])
            setWrongFlash(null)
            setAdvancing(false)
        }, CONCEPT_PAUSE_MS)
    }

    return (
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-1 pb-8">
            <div className="w-full flex flex-col gap-4">
                {Array.from({ length: trialIndex + 1 }).map((_, i) => {
                    const qq = items[i]
                    const isCurrent = i === trialIndex
                    const isDone = i < trialIndex || (isCurrent && checked)
                    const opts = qq.renderOptions()
                    return (
                        <SceneWrapper key={`q-${i}`} innerRef={sceneRef(`q-${i}`)} active={isSceneActive(`q-${i}`)}>
                            <Fragment key={`q-${i}-${nonceFor(`q-${i}`)}`}>
                                {i === 0 && (
                                    <div className="w-full flex items-center gap-3" aria-hidden>
                                        <div className="flex-1 h-px bg-[#3A464E]" />
                                        <span className="text-xs font-bold uppercase tracking-wide text-[#5C6B73]">{CONCEPT_QUIZ_TITLE}</span>
                                        <div className="flex-1 h-px bg-[#3A464E]" />
                                    </div>
                                )}
                                <div className="relative w-full flex items-center gap-2">
                                    <div
                                        className="absolute left-0 top-1/2 -translate-y-1/2 shrink-0 flex items-center gap-0.5 px-3 h-9 rounded-full border-2 font-black text-sm tabular-nums"
                                        style={{
                                            borderColor: hexToRgba(GGEGE_PALETTE.purple.button, 0.55),
                                            backgroundColor: hexToRgba(GGEGE_PALETTE.purple.button, 0.16),
                                            color: GGEGE_PALETTE.purple.button,
                                        }}
                                    >
                                        <span>{i + 1}</span>
                                        <span className="opacity-50 font-normal">/</span>
                                        <span>{items.length}</span>
                                    </div>
                                    <p className={cn(
                                        'flex-1 min-w-0 pl-16 text-base md:text-lg text-[#F2F7FB] text-center font-bold',
                                        qq.renderImage ? 'pr-1' : 'pr-16',
                                    )}>
                                        {qq.renderPrompt()}
                                    </p>
                                    {qq.renderImage && (
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                                            className="shrink-0"
                                        >
                                            {qq.renderImage()}
                                        </motion.div>
                                    )}
                                </div>
                                {qq.renderFigure && <div className="w-full max-w-[320px] mx-auto">{qq.renderFigure()}</div>}
                                {isCurrent && !checked && (
                                    <>
                                        <div className="grid grid-cols-1 gap-3">
                                            {opts.map((opt, oi) => {
                                                const isWrongTriedOpt = wrongTried.includes(oi)
                                                return (
                                                    <QuizAnswerButton
                                                        key={oi}
                                                        state={isWrongTriedOpt ? 'wrong' : 'idle'}
                                                        disabled={isWrongTriedOpt}
                                                        onClick={() => handlePick(i, oi)}
                                                    >
                                                        {opt}
                                                    </QuizAnswerButton>
                                                )
                                            })}
                                        </div>
                                        {wrongFlash && (
                                            <div className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center bg-[#DC605B22] text-[#DC605B]">
                                                {wrongFlash}
                                            </div>
                                        )}
                                    </>
                                )}
                                {isDone && (
                                    <>
                                        <div className="grid grid-cols-1 gap-3">
                                            {opts.map((opt, oi) => {
                                                const isCorrectOpt = oi === qq.correct
                                                const isWrongTriedOpt = isCurrent && wrongTried.includes(oi)
                                                return (
                                                    <QuizAnswerButton
                                                        key={oi}
                                                        disabled
                                                        state={isCorrectOpt ? 'correct' : (isWrongTriedOpt ? 'wrong' : 'idle')}
                                                    >
                                                        {opt}
                                                    </QuizAnswerButton>
                                                )
                                            })}
                                        </div>
                                        <FieryFeedbackBanner fiery={isCurrent && isFieryMilestoneTrial(i)}>
                                            <div className="text-center">
                                                <div className="font-extrabold" style={{ color: CORRECT_COLOR }}>
                                                    {pickQuizFeedbackPhrase(i)}
                                                </div>
                                                <div className="mt-1 text-sm text-[#F2F7FB]">{qq.feedback}</div>
                                            </div>
                                        </FieryFeedbackBanner>
                                    </>
                                )}
                                {isCurrent && checked && <LocalAnswerConfetti />}
                            </Fragment>
                        </SceneWrapper>
                    )
                })}
            </div>

            {checked && (
                <div className="w-full flex items-center gap-2">
                    <ReplayButton onClick={handleReplay} disabled={advancing} />
                    <BackButton onClick={handleBack} disabled={advancing || !canGoBack} />
                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={advancing}
                        className={walkthroughButtonClass(!advancing)}
                        style={walkthroughButtonStyle(!advancing)}
                    >
                        {trialIndex + 1 >= items.length ? 'Готово' : nextLabel}
                    </button>
                </div>
            )}
        </div>
    )
}
// ===== Основной компонент =====


// ===================================================================
// КОРОТКАЯ ВЕРСИЯ (урок «ТТП: коротко»): без метафор и без вращения прямой.
// Плоскость → прямая b → наклонная a «втыкается» в точку O на b → вопрос →
// перпендикуляр на плоскость и проекция OH → угол 90° → мини-игра «где a ⟂ b» → теорема.
// ===================================================================
// stage: 1 плоскость · 2 прямая b · 3 наклонная a · 4 перпендикуляр и H · 5 проекция OH
//        6 угол (проекция, b) = 90° · 7 угол (a, b) = 90°
const QuickFigure = ({ stage, phi = 0, angleLabel = false, fresh = true, compact = false }: { stage: number; phi?: number; angleLabel?: boolean; fresh?: boolean; compact?: boolean }) => {
    const Op = P3(O3.x, O3.y, 0)
    const top = aPoint(S_HIGH)
    const T = P3(top.x, top.y, top.z)
    const Hp = P3(O3.x, O3.y + S_HIGH, 0)
    const ph = phi * DEG
    const LQ = 4.3 // прямая b длиннее, чем в «копейном» уроке — её не крутят
    const bL = P3(O3.x - LQ * Math.cos(ph), O3.y - LQ * Math.sin(ph), 0)
    const bR = P3(O3.x + LQ * Math.cos(ph), O3.y + LQ * Math.sin(ph), 0)
    const planePts = PLANE_CORNERS.map(([x, y]) => ptStr(x, y, 0)).join(' ')
    const cs = PLANE_CORNERS.map(([x, y]) => P3(x, y, 0))
    const center = P3(CXW, CYW, 0)
    const ac = cs.reduce((best, c) => (c.x + c.y > best.x + best.y ? c : best), cs[0])
    const alphaPos = { x: ac.x + (center.x - ac.x) * 0.3, y: ac.y + (center.y - ac.y) * 0.3 }
    const aTag = tagAlong(Op, T, 0.6, 18)
    const bTag = tagAlong(Op, bR, 0.8, -17)
    const pTag = tagAlong(Op, Hp, 0.55, -17)
    const aLen = Math.hypot(1, 1.05)
    const bdir: [number, number, number] = [-0.9 * Math.cos(ph), -0.9 * Math.sin(ph), 0]
    return (
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full max-w-[448px] mx-auto" style={{ overflow: 'visible' }}>
            {stage >= 1 && (
                <motion.g initial={fresh ? { opacity: 0 } : { opacity: 1 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                    <polygon points={planePts} fill={hexToRgba(PLANE_COLOR, 0.2)} stroke={hexToRgba(PLANE_COLOR, 0.9)} strokeWidth={2.5} strokeLinejoin="round" />
                    <text x={alphaPos.x} y={alphaPos.y + 6} textAnchor="middle" fontSize={22} fontStyle="italic" fill={PLANE_COLOR} fontWeight={800}>α</text>
                </motion.g>
            )}
            {stage >= 5 && (
                <>
                    <DrawPath d={`M${Op.x},${Op.y} L${Hp.x},${Hp.y}`} color={PROJ_COLOR} w={5} fresh={fresh && stage === 5} dur={0.8} />
                    {!compact && <SvgWordTag x={pTag.x} y={pTag.y} angle={pTag.ang} text="проекция" color={PROJ_COLOR} delay={fresh && stage === 5 ? 0.6 : 0} />}
                </>
            )}
            {stage >= 2 && (
                <>
                    <DrawPath d={`M${bL.x},${bL.y} L${bR.x},${bR.y}`} color={B_COLOR} w={4} fresh={fresh && stage === 2} dur={0.8} />
                    {compact ? <SvgTag x={bR.x + 6} y={bR.y + 18} text="b" color={B_COLOR} /> : <SvgWordTag x={bTag.x} y={bTag.y} angle={bTag.ang} text="прямая b" color={B_COLOR} delay={fresh && stage === 2 ? 0.6 : 0} />}
                </>
            )}
            {stage >= 4 && (
                <>
                    <DrawPath d={`M${T.x},${T.y} L${Hp.x},${Hp.y}`} color={X_COLOR} w={2.6} fresh={fresh && stage === 4} dur={0.7} />
                    <motion.g initial={fresh && stage === 4 ? { opacity: 0 } : { opacity: 1 }} animate={{ opacity: 1 }} transition={{ delay: fresh && stage === 4 ? 0.7 : 0 }}>
                        <path d={rightAngleMark({ x: O3.x, y: O3.y + S_HIGH, z: 0 }, [0, -0.7, 0], [0, 0, 0.7])} fill="none" stroke={X_COLOR} strokeWidth={2.2} strokeLinecap="round" />
                        <circle cx={Hp.x} cy={Hp.y} r={4.5} fill={X_COLOR} stroke="#0B1216" strokeWidth={1.5} />
                    </motion.g>
                    <SvgTag x={Hp.x + 20} y={Hp.y + 4} text="H" color={X_COLOR} delay={fresh && stage === 4 ? 0.8 : 0} />
                </>
            )}
            {stage >= 6 && (fresh && stage === 6 ? <BounceMark d={rightAngleMark(O3, bdir, [0, 0.9, 0])} /> : (
                <path d={rightAngleMark(O3, bdir, [0, 0.9, 0])} fill="none" stroke={X_COLOR} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            ))}
            {stage >= 7 && <BounceMark d={rightAngleMark(O3, [0.95, 0, 0], [0, 0.95 / aLen, (0.95 * 1.05) / aLen])} />}
            {angleLabel && (
                (() => { const L = bisectorPoint(Op, Hp, bR, 44); return <text x={L.x} y={L.y + 7} textAnchor="middle" fontSize={20} fontWeight={900} fill={MARK_COLOR}>{Math.round(90 - Math.abs(phi))}°</text> })()
            )}
            {stage >= 3 && (
                <>
                    <DrawPath d={`M${T.x},${T.y} L${Op.x},${Op.y}`} color={A_COLOR} w={4} fresh={fresh && stage === 3} dur={0.7} />
                    {compact ? <SvgTag x={T.x - 22} y={T.y + 6} text="a" color={A_COLOR} /> : <SvgWordTag x={aTag.x} y={aTag.y} angle={aTag.ang} text="наклонная a" color={A_COLOR} delay={fresh && stage === 3 ? 0.6 : 0} />}
                    <motion.g initial={fresh && stage === 3 ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: fresh && stage === 3 ? 0.75 : 0 }}>
                        <circle cx={Op.x} cy={Op.y} r={5} fill={X_COLOR} stroke="#0B1216" strokeWidth={1.5} />
                    </motion.g>
                    <SvgTag x={Op.x - 24} y={Op.y + 2} text="O" color={X_COLOR} delay={fresh && stage === 3 ? 0.9 : 0} />
                </>
            )}
        </svg>
    )
}

// Точка для подписи угла: между направлениями O→A и O→B (по биссектрисе), на расстоянии r.
const bisectorPoint = (O: { x: number; y: number }, A: { x: number; y: number }, B: { x: number; y: number }, r = 40) => {
    const ua = { x: A.x - O.x, y: A.y - O.y }, ub = { x: B.x - O.x, y: B.y - O.y }
    const la = Math.hypot(ua.x, ua.y) || 1, lb = Math.hypot(ub.x, ub.y) || 1
    const m = { x: ua.x / la + ub.x / lb, y: ua.y / la + ub.y / lb }
    const lm = Math.hypot(m.x, m.y) || 1
    return { x: O.x + (m.x / lm) * r, y: O.y + (m.y / lm) * r }
}

// Сцена: печатаем строку, потом показываем чертёж на нужной стадии.
const quickScene = (parts: LinePart[], stage: number, nextLabel?: string) => {
    const S = ({ onSettled }: SceneProps) => {
        const [typed, setTyped] = useState(false)
        return (
            <SceneBox>
                <TypedLineWithParts parts={parts} onSettled={() => setTyped(true)} />
                {typed && <DiagramBlock onSettled={() => setTimeout(() => onSettled?.(nextLabel), 900)}><QuickFigure stage={stage} /></DiagramBlock>}
            </SceneBox>
        )
    }
    return S
}

const QPlaneScene = quickScene([{ text: 'Вот ' }, { sticker: 'плоскость α', color: PLANE_COLOR }], 1)
const QLineScene = quickScene([{ text: 'На ней лежит ' }, { sticker: 'прямая b', color: B_COLOR }], 2)
const QSlantScene = quickScene([
    { sticker: 'Наклонная a', color: A_COLOR }, { text: ' втыкается в плоскость прямо' }, { break: true },
    { text: 'на прямую b — в точке O' },
], 3)

const QAskScene = ({ onSettled }: SceneProps) => {
    const [asked, setAsked] = useState(false)
    return (
        <SceneBox>
            <DiagramBlock><QuickFigure stage={3} fresh={false} /></DiagramBlock>
            <TypedLineWithParts parts={[{ text: 'Вопрос: ' }, { sticker: 'a', color: A_COLOR }, { text: ' ' }, { sticker: 'перпендикулярна', color: MARK_COLOR }, { text: ' ' }, { sticker: 'b', color: B_COLOR }, { text: '? 🤔' }]} />
            {!asked && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6 }} className="w-full flex gap-2">
                    <GuessBtn color={A_COLOR} onClick={() => setAsked(true)}>Да</GuessBtn>
                    <GuessBtn color={A_COLOR} onClick={() => setAsked(true)}>Нет</GuessBtn>
                    <GuessBtn color={MARK_COLOR} onClick={() => setAsked(true)}>Не знаю 🤔</GuessBtn>
                </motion.div>
            )}
            {asked && (
                <TypedLineWithParts
                    parts={[{ text: 'На глаз не понять — рисунок объёмный, углы искажаются 😅' }, { break: true }, { text: 'Поможет ' }, { sticker: 'проекция', ...SH }]}
                    onSettled={() => onSettled?.()}
                />
            )}
        </SceneBox>
    )
}

const QProjScene = ({ onSettled }: SceneProps) => {
    const [st, setSt] = useState(3)
    const [second, setSecond] = useState(false)
    return (
        <SceneBox>
            <TypedLineWithParts
                parts={[{ text: 'Опустим из верхней точки a ' }, { bold: 'перпендикуляр' }, { text: ' на плоскость — попадём в точку ' }, { sticker: 'H', color: X_COLOR }]}
                onSettled={() => { setSt(4); setTimeout(() => setSecond(true), 1500) }}
            />
            <DiagramBlock><QuickFigure stage={st} fresh={st >= 4} /></DiagramBlock>
            {second && (
                <TypedLineWithParts
                    parts={[{ sticker: 'OH', ...SH }, { text: ' — это ' }, { sticker: 'проекция', ...SH }, { text: ' наклонной a на плоскость' }]}
                    onSettled={() => { setSt(5); setTimeout(() => onSettled?.(), 1500) }}
                />
            )}
        </SceneBox>
    )
}

const QAnswerScene = ({ onSettled }: SceneProps) => {
    const [st, setSt] = useState(5)
    const [two, setTwo] = useState(false)
    const [party, setParty] = useState(false)
    return (
        <SceneBox>
            <TypedLineWithParts
                parts={[{ text: 'Смотрим угол между ' }, { sticker: 'проекцией', ...SH }, { text: ' и ' }, { sticker: 'b', color: B_COLOR }, { text: '…' }]}
                onSettled={() => { setSt(6); setTimeout(() => setTwo(true), 1400) }}
            />
            <DiagramBlock><QuickFigure stage={st} fresh={st >= 6} /></DiagramBlock>
            {two && (
                <TypedLineWithParts
                    parts={[
                        { text: 'Ровно 90°! ' }, { sticker: 'Проекция', ...SH }, { text: ' ⟂ ' }, { sticker: 'b', color: B_COLOR }, { break: true },
                        { text: '— значит и ' }, { sticker: 'наклонная a', color: A_COLOR }, { text: ' ⟂ ' }, { sticker: 'b', color: B_COLOR }, { text: '!' },
                    ]}
                    onSettled={() => { setSt(7); setParty(true); setTimeout(() => onSettled?.('Изи катка'), 1200) }}
                />
            )}
            {party && <LocalAnswerConfetti />}
        </SceneBox>
    )
}

// Мини-игра: две готовые картинки (прямую никто не крутит) — где a ⟂ b?
const QGameScene = ({ onSettled }: SceneProps) => {
    const [typed, setTyped] = useState(false)
    // правильная картинка случайно слева или справа
    const [rightFirst] = useState(() => Math.random() < 0.5)
    const [wrong, setWrong] = useState<number | null>(null)
    const [done, setDone] = useState(false)
    const cards = rightFirst ? [{ ok: true, phi: 0 }, { ok: false, phi: 38 }] : [{ ok: false, phi: 38 }, { ok: true, phi: 0 }]
    const pick = (i: number) => {
        if (done) return
        if (cards[i].ok) {
            setDone(true)
            showAnswerMeme(true)
            setTimeout(() => onSettled?.(), 900)
        } else {
            setWrong(i)
            showAnswerMeme(false)
            playSound(WRONG_ANSWER_SOUND)
        }
    }
    return (
        <SceneBox>
            <TypedLineWithParts
                parts={[{ text: 'Проверим! На каком рисунке ' }, { sticker: 'a', color: A_COLOR }, { text: ' ⟂ ' }, { sticker: 'b', color: B_COLOR }, { text: '? Нажми 👇' }]}
                onSettled={() => setTyped(true)}
            />
            {typed && (
                <div className="w-full max-w-[340px] mx-auto grid grid-cols-1 gap-3">
                    {cards.map((c, i) => {
                        const isWrong = wrong === i
                        const isRight = done && c.ok
                        return (
                            <motion.button
                                key={i} type="button" onClick={() => pick(i)}
                                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.25 }}
                                disabled={isWrong || done}
                                className="rounded-2xl border-2 p-1"
                                style={{
                                    borderColor: isRight ? CORRECT_COLOR : isWrong ? '#DC605B' : '#3A464E',
                                    backgroundColor: isRight ? hexToRgba(CORRECT_COLOR, 0.12) : isWrong ? 'rgba(220,96,91,0.12)' : '#161F23',
                                }}
                            >
                                <QuickFigure stage={c.ok ? 6 : 5} phi={c.phi} angleLabel={!c.ok} fresh={false} compact />
                            </motion.button>
                        )
                    })}
                </div>
            )}
            {wrong !== null && !done && (
                <p className="text-center text-base font-bold text-[#DC605B]">Тут проекция не ⟂ b — значит и a не ⟂ b. Пробуй другой 😉</p>
            )}
            {done && (
                <TypedLineWithParts parts={[{ text: 'Верно! Где ' }, { sticker: 'проекция', ...SH }, { text: ' ⟂ ' }, { sticker: 'b', color: B_COLOR }, { text: ' — там и ' }, { sticker: 'a', color: A_COLOR }, { text: ' ⟂ ' }, { sticker: 'b', color: B_COLOR }]} />
            )}
        </SceneBox>
    )
}

const QUICK_SCENES = [QPlaneScene, QLineScene, QSlantScene, QAskScene, QProjScene, QAnswerScene, QGameScene, TheoremScene]

const QUICK_QUIZ: ConceptQuizItem[] = [
    {
        renderPrompt: () => <>Как проверить, что <Sticker value="наклонная a" color={A_COLOR} /> ⟂ <Sticker value="прямой b" color={B_COLOR} /> в плоскости?</>,
        renderOptions: () => ['Проверить, что её проекция ⟂ b', 'Измерить длину наклонной'],
        correct: 0,
        feedback: 'Смотрим на проекцию: проекция ⟂ b ⇔ наклонная ⟂ b.',
    },
    {
        renderPrompt: () => <><Sticker value="Проекция" {...SH} /> ⟂ <Sticker value="b" color={B_COLOR} />. Тогда <Sticker value="a" color={A_COLOR} /> и <Sticker value="b" color={B_COLOR} />…</>,
        renderOptions: () => ['перпендикулярны', 'параллельны'],
        correct: 0,
        feedback: 'Это и есть ТТП.',
    },
    {
        renderPrompt: () => <><Sticker value="Проекция" {...SH} /> <b>НЕ</b> ⟂ <Sticker value="b" color={B_COLOR} />. Тогда <Sticker value="a" color={A_COLOR} /> и <Sticker value="b" color={B_COLOR} />…</>,
        renderOptions: () => ['не перпендикулярны', 'всё равно перпендикулярны'],
        correct: 0,
        feedback: 'Работает в обе стороны: нет 90° у проекции — нет и у наклонной.',
    },
    {
        renderPrompt: () => <>Как получить <Sticker value="проекцию" {...SH} /> наклонной на плоскость?</>,
        renderOptions: () => ['Опустить перпендикуляр из точки наклонной на плоскость и соединить его основание H с O', 'Провести любую прямую через O'],
        correct: 0,
        feedback: 'Перпендикуляр на плоскость → точка H → проекция OH.',
    },
    {
        renderPrompt: () => <>Бонус! Кто теперь знает ТТП? 🏆</>,
        renderOptions: () => ['Я! 🔥'],
        correct: 0,
        feedback: 'Без вариантов — ты! 🚀',
    },
]


// ===================================================================
// РАЗМИНКА (урок «ТТП: разминка»): учимся узнавать наклонную, перпендикуляр,
// проекцию и прямую — мини-упражнения → 5 примеров из жизни → проверка.
// Всё рисуется в той же 3D-проекции P3 (плоскость земли z = 0).
// ===================================================================
type V3 = [number, number, number]
const NEU = '#C9D3D9' // «ещё не названный» отрезок — нейтральный светлый
const HL = '#F2C35B' // подсветка «вот этот»
const PERP_COLOR = X_COLOR

const Seg3 = ({ p, q, color, w = 4, dash, opacity = 1, glow, onClick }: { p: V3; q: V3; color: string; w?: number; dash?: string; opacity?: number; glow?: string; onClick?: () => void }) => {
    const A = P3(...p), B = P3(...q)
    return (
        <g onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined} opacity={opacity}>
            {glow && <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={glow} strokeOpacity={0.35} strokeWidth={w + 10} strokeLinecap="round" />}
            <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash} />
            {onClick && <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="transparent" strokeWidth={26} strokeLinecap="round" />}
        </g>
    )
}
const Pt3 = ({ p, color = X_COLOR, r = 4.5 }: { p: V3; color?: string; r?: number }) => {
    const A = P3(...p)
    return <circle cx={A.x} cy={A.y} r={r} fill={color} stroke="#0B1216" strokeWidth={1.5} />
}
const Tag3 = ({ p, text, color, dx = 0, dy = 0 }: { p: V3; text: string; color: string; dx?: number; dy?: number }) => {
    const A = P3(...p)
    return text.length <= 2 ? <SvgTag x={A.x + dx} y={A.y + dy} text={text} color={color} /> : <SvgWordTag x={A.x + dx} y={A.y + dy} text={text} color={color} />
}
const Ground = ({ fill = hexToRgba(PLANE_COLOR, 0.2), stroke = hexToRgba(PLANE_COLOR, 0.9) }: { fill?: string; stroke?: string }) => (
    <polygon points={PLANE_CORNERS.map(([x, y]) => ptStr(x, y, 0)).join(' ')} fill={fill} stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" />
)
const WarmSvg = ({ children }: { children: React.ReactNode }) => (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full max-w-[448px] mx-auto" style={{ overflow: 'visible' }}>{children}</svg>
)
const RightMark3 = ({ o, d1, d2, bounce = false }: { o: V3; d1: V3; d2: V3; bounce?: boolean }) => {
    const d = rightAngleMark({ x: o[0], y: o[1], z: o[2] }, d1, d2)
    return bounce ? <BounceMark d={d} /> : <path d={d} fill="none" stroke={X_COLOR} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
}

// общая логика «нажми правильный»: верно → дальше, неверно → подсказка (без штрафа)
const useWarmPick = (onSettled?: (l?: string) => void) => {
    const [done, setDone] = useState(false)
    const [hint, setHint] = useState<string | null>(null)
    const [wrongIds, setWrongIds] = useState<string[]>([])
    const pick = (id: string, ok: boolean, wrongHint: string) => {
        if (done) return
        if (ok) { setDone(true); setHint(null); showAnswerMeme(true); setTimeout(() => onSettled?.(), 1200) }
        else { setHint(wrongHint); setWrongIds((w) => [...w, id]); showAnswerMeme(false); playSound(WRONG_ANSWER_SOUND) }
    }
    return { done, hint, wrongIds, pick }
}
const WarmHint = ({ text }: { text: string | null }) =>
    text ? <motion.p key={text} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-center text-base font-bold text-[#DC605B]">{text}</motion.p> : null

// --- Упражнения на КУБЕ-КОМНАТЕ: пол ABCD — плоскость, вертикальные рёбра — перпендикуляры,
// диагональ стены A₁B — наклонная, ребро пола BA — её проекция, ребро BC — прямая.
const W_O: V3 = [5, 2.8, 0]
const W_T: V3 = [5, 6.2, 3.57]
const W_H: V3 = [5, 6.2, 0]

// Куб рисуем отдельной «учебниковой» проекцией: передняя грань ABB₁A₁ — настоящий квадрат,
// глубина уходит вправо-вверх под 45° с коэффициентом 0.5 (в общем ракурсе урока куб выглядел бы коробкой).
// Координаты вершин — единичный куб: x вправо, y вглубь, z вверх.
const CUBE_S = 150, CUBE_D = 0.5, CUBE_OX = 62, CUBE_OY = 252
const CP = (x: number, y: number, z: number) => ({
    x: CUBE_OX + CUBE_S * x + CUBE_S * CUBE_D * y * Math.SQRT1_2,
    y: CUBE_OY - CUBE_S * z - CUBE_S * CUBE_D * y * Math.SQRT1_2,
})
const CV: Record<string, V3> = {
    A: [0, 0, 0], B: [1, 0, 0], C: [1, 1, 0], D: [0, 1, 0],
    A1: [0, 0, 1], B1: [1, 0, 1], C1: [1, 1, 1], D1: [0, 1, 1],
}
const CUBE_EDGES: [string, string][] = [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'], ['A1', 'B1'], ['B1', 'C1'], ['C1', 'D1'], ['D1', 'A1'], ['A', 'A1'], ['B', 'B1'], ['C', 'C1'], ['D', 'D1']]
// дальний нижний угол D скрыт — его рёбра пунктиром
const isHiddenEdge = (a: string, b: string) => a === 'D' || b === 'D'
const vName = (k: string) => (k.endsWith('1') ? `${k[0]}₁` : k)
const CUBE_CENTER = CP(0.5, 0.5, 0.5)
const CSeg = ({ a, b, color, w = 4, dash, opacity = 1, glow, onClick }: { a: V3; b: V3; color: string; w?: number; dash?: string; opacity?: number; glow?: string; onClick?: () => void }) => {
    const A = CP(...a), B = CP(...b)
    return (
        <g onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined} opacity={opacity}>
            {glow && <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={glow} strokeOpacity={0.35} strokeWidth={w + 10} strokeLinecap="round" />}
            <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash} />
            {onClick && <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="transparent" strokeWidth={26} strokeLinecap="round" />}
        </g>
    )
}
// значок прямого угла в кубе (o — вершина угла, d1/d2 — короткие векторы вдоль сторон)
const CubeMark = ({ o, d1, d2, bounce = false }: { o: V3; d1: V3; d2: V3; bounce?: boolean }) => {
    const p1 = CP(o[0] + d1[0], o[1] + d1[1], o[2] + d1[2])
    const p2 = CP(o[0] + d1[0] + d2[0], o[1] + d1[1] + d2[1], o[2] + d1[2] + d2[2])
    const p3 = CP(o[0] + d2[0], o[1] + d2[1], o[2] + d2[2])
    const d = `M${p1.x.toFixed(1)},${p1.y.toFixed(1)} L${p2.x.toFixed(1)},${p2.y.toFixed(1)} L${p3.x.toFixed(1)},${p3.y.toFixed(1)}`
    return bounce ? <BounceMark d={d} /> : <path d={d} fill="none" stroke={X_COLOR} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
}

type CubeLine = { id: string; a: string; b: string; color: string; w?: number; glow?: string; dash?: string; onClick?: () => void; opacity?: number }
const CubeFig = ({ lines = [], children, floorGlow = false }: { lines?: CubeLine[]; children?: React.ReactNode; floorGlow?: boolean }) => (
    <WarmSvg>
        <polygon points={['A', 'B', 'C', 'D'].map((k) => { const P = CP(...CV[k]); return `${P.x.toFixed(1)},${P.y.toFixed(1)}` }).join(' ')} fill={hexToRgba(PLANE_COLOR, floorGlow ? 0.38 : 0.22)} stroke={hexToRgba(PLANE_COLOR, 0.9)} strokeWidth={floorGlow ? 3 : 2} />
        {CUBE_EDGES.map(([a, b]) => <CSeg key={a + b} a={CV[a]} b={CV[b]} color="#6B7A83" w={2} dash={isHiddenEdge(a, b) ? '5 5' : undefined} />)}
        {lines.map((l) => <CSeg key={l.id} a={CV[l.a]} b={CV[l.b]} color={l.color} w={l.w ?? 5} glow={l.glow} dash={l.dash} onClick={l.onClick} opacity={l.opacity} />)}
        {Object.keys(CV).map((k) => {
            const P = CP(...CV[k])
            const dx = P.x - CUBE_CENTER.x, dy = P.y - CUBE_CENTER.y, l = Math.hypot(dx, dy) || 1
            return <text key={k} x={P.x + (dx / l) * 16} y={P.y + (dy / l) * 16 + 5} textAnchor="middle" fontSize={15} fontWeight={800} fill="#9AA7B0">{vName(k)}</text>
        })}
        {children}
    </WarmSvg>
)
const cubeNeu = (id: string, a: string, b: string, isW: boolean, done: boolean, ok: boolean, okColor: string, onClick: () => void): CubeLine => ({
    id, a, b, onClick, color: done && ok ? okColor : isW ? '#DC605B' : NEU, glow: done && ok ? okColor : undefined,
})

// 0. Знакомство с кубом-комнатой
const K0Scene = ({ onSettled }: SceneProps) => {
    const [typed, setTyped] = useState(false)
    const [floor, setFloor] = useState(false)
    return (
        <SceneBox>
            <TypedLineWithParts parts={[{ text: 'Вот куб. Представь, что это ' }, { bold: 'комната 🏠' }]} onSettled={() => setTyped(true)} />
            {typed && <DiagramBlock onSettled={() => setTimeout(() => setFloor(true), 600)}><CubeFig floorGlow={floor} /></DiagramBlock>}
            {floor && (
                <TypedLineWithParts
                    parts={[{ text: 'Пол ' }, { sticker: 'ABCD', color: PLANE_COLOR }, { text: ' — это наша ' }, { sticker: 'плоскость', color: PLANE_COLOR }]}
                    onSettled={() => onSettled?.()}
                />
            )}
        </SceneBox>
    )
}

// 1. Нажми перпендикуляр к полу
const K1Scene = ({ onSettled }: SceneProps) => {
    const [typed, setTyped] = useState(false)
    const { done, hint, wrongIds, pick } = useWarmPick(onSettled)
    const c = (id: string, a: string, b: string, ok: boolean, why: string) =>
        cubeNeu(id, a, b, wrongIds.includes(id), done, ok, PERP_COLOR, () => pick(id, ok, why))
    return (
        <SceneBox>
            <TypedLineWithParts parts={[{ bold: 'Нажми перпендикуляр' }, { text: ' к полу — отрезок, который стоит к нему под 90°' }]} onSettled={() => setTyped(true)} />
            {typed && (
                <DiagramBlock>
                    <CubeFig lines={[
                        c('bd', 'B', 'D', false, 'BD лежит на полу — это прямая в плоскости'),
                        c('ba1', 'B', 'A1', false, 'A₁B идёт по стене вкось — это наклонная'),
                        c('aa1', 'A', 'A1', true, ''),
                    ]}>
                        {done && <CubeMark o={CV.A} d1={[0.14, 0, 0]} d2={[0, 0, 0.14]} bounce />}
                    </CubeFig>
                </DiagramBlock>
            )}
            <WarmHint text={hint} />
            {done && <TypedLineWithParts parts={[{ text: 'Да! Ребро ' }, { sticker: 'AA₁', color: PERP_COLOR }, { text: ' — ' }, { sticker: 'перпендикуляр', color: PERP_COLOR }, { text: ' к полу. Как угол комнаты: строго вверх ⬆️' }]} />}
        </SceneBox>
    )
}

// 2. Нажми наклонную
const K2Scene = ({ onSettled }: SceneProps) => {
    const [typed, setTyped] = useState(false)
    const { done, hint, wrongIds, pick } = useWarmPick(onSettled)
    const c = (id: string, a: string, b: string, ok: boolean, why: string) =>
        cubeNeu(id, a, b, wrongIds.includes(id), done, ok, A_COLOR, () => pick(id, ok, why))
    return (
        <SceneBox>
            <TypedLineWithParts parts={[{ bold: 'Нажми наклонную' }, { text: ' к полу — отрезок, который упирается в пол ' }, { bold: 'не под 90°' }]} onSettled={() => setTyped(true)} />
            {typed && (
                <DiagramBlock>
                    <CubeFig lines={[
                        c('cc1', 'C', 'C1', false, 'CC₁ стоит ровно — это перпендикуляр'),
                        c('ac', 'A', 'C', false, 'AC лежит на полу — это прямая в плоскости'),
                        c('ba1', 'B', 'A1', true, ''),
                    ]} />
                </DiagramBlock>
            )}
            <WarmHint text={hint} />
            {done && <TypedLineWithParts parts={[{ text: 'Верно! Диагональ стены ' }, { sticker: 'A₁B', color: A_COLOR }, { text: ' — ' }, { sticker: 'наклонная', color: A_COLOR }, { text: ': из точки B на полу идёт вкось' }]} />}
        </SceneBox>
    )
}

// 3. Куда упадёт перпендикуляр из A₁?
const K3Scene = ({ onSettled }: SceneProps) => {
    const [typed, setTyped] = useState(false)
    const { done, hint, wrongIds, pick } = useWarmPick(onSettled)
    const pts: { id: string; k: string; ok: boolean }[] = [{ id: 'd', k: 'D', ok: false }, { id: 'a', k: 'A', ok: true }, { id: 'c', k: 'C', ok: false }]
    return (
        <SceneBox>
            <TypedLineWithParts parts={[{ text: 'Из точки ' }, { sticker: 'A₁', color: A_COLOR }, { text: ' опустим перпендикуляр на пол. ' }, { bold: 'Куда он упадёт?' }, { text: ' Нажми точку' }]} onSettled={() => setTyped(true)} />
            {typed && (
                <DiagramBlock>
                    <CubeFig lines={[{ id: 'ba1', a: 'B', b: 'A1', color: A_COLOR }, ...(done ? [{ id: 'a1a', a: 'A1', b: 'A', color: PERP_COLOR, w: 4 } as CubeLine] : [])]}>
                        {done && <CubeMark o={CV.A} d1={[0.14, 0, 0]} d2={[0, 0, 0.14]} bounce />}
                        {!done && pts.map((p) => {
                            const A = CP(...CV[p.k])
                            const isW = wrongIds.includes(p.id)
                            return (
                                <g key={p.id} onClick={() => pick(p.id, p.ok, 'Мимо — перпендикуляр из A₁ падает строго вниз, по углу комнаты')} style={{ cursor: 'pointer' }}>
                                    <circle cx={A.x} cy={A.y} r={13} fill="transparent" stroke={isW ? '#DC605B' : HL} strokeWidth={2} className={isW ? '' : 'animate-pulse'} />
                                    <circle cx={A.x} cy={A.y} r={5} fill={isW ? '#DC605B' : HL} />
                                </g>
                            )
                        })}
                    </CubeFig>
                </DiagramBlock>
            )}
            <WarmHint text={hint} />
            {done && <TypedLineWithParts parts={[{ text: 'Точно! Перпендикуляр ' }, { sticker: 'A₁A', color: PERP_COLOR }, { text: ' падает в точку ' }, { sticker: 'A', color: X_COLOR }]} />}
        </SceneBox>
    )
}

// 4. Нажми проекцию наклонной A₁B
const K4Scene = ({ onSettled }: SceneProps) => {
    const [typed, setTyped] = useState(false)
    const { done, hint, wrongIds, pick } = useWarmPick(onSettled)
    const c = (id: string, a: string, b: string, ok: boolean, why: string) =>
        cubeNeu(id, a, b, wrongIds.includes(id), done, ok, PROJ_COLOR, () => pick(id, ok, why))
    return (
        <SceneBox>
            <TypedLineWithParts parts={[{ sticker: 'Проекция', ...SH }, { text: ' наклонной — путь по полу от её «ноги» B до точки A, куда упал перпендикуляр. ' }, { bold: 'Нажми проекцию' }]} onSettled={() => setTyped(true)} />
            {typed && (
                <DiagramBlock>
                    <CubeFig lines={[
                        { id: 'ba1', a: 'B', b: 'A1', color: A_COLOR },
                        { id: 'a1a', a: 'A1', b: 'A', color: PERP_COLOR, w: 3.5 },
                        c('bc', 'B', 'C', false, 'BC — ребро пола, но оно не идёт в точку A'),
                        c('bd', 'B', 'D', false, 'BD — диагональ пола, она не идёт в точку A'),
                        c('ba', 'B', 'A', true, ''),
                    ]}>
                        <CubeMark o={CV.A} d1={[0.14, 0, 0]} d2={[0, 0, 0.14]} />
                    </CubeFig>
                </DiagramBlock>
            )}
            <WarmHint text={hint} />
            {done && <TypedLineWithParts parts={[{ text: 'Есть! ' }, { sticker: 'BA', ...SH }, { text: ' — ' }, { sticker: 'проекция', ...SH }, { text: ' наклонной A₁B на пол' }]} />}
        </SceneBox>
    )
}

// 5. Подпиши всё
const LABEL_ITEMS: { id: string; a: string; b: string; name: string; color: string; sh?: boolean }[] = [
    { id: 'a', a: 'B', b: 'A1', name: 'наклонная', color: A_COLOR },
    { id: 'perp', a: 'A1', b: 'A', name: 'перпендикуляр', color: PERP_COLOR },
    { id: 'proj', a: 'B', b: 'A', name: 'проекция', color: PROJ_COLOR, sh: true },
    { id: 'b', a: 'B', b: 'C', name: 'прямая', color: B_COLOR },
]
const W5Scene = ({ onSettled }: SceneProps) => {
    const [typed, setTyped] = useState(false)
    const [order] = useState(() => [...LABEL_ITEMS].sort(() => Math.random() - 0.5).map((i) => i.id))
    const [round, setRound] = useState(0)
    const [named, setNamed] = useState<string[]>([])
    const [hint, setHint] = useState<string | null>(null)
    const cur = order[round]
    const choose = (name: string) => {
        if (!cur) return
        const it = LABEL_ITEMS.find((i) => i.id === cur)!
        if (it.name === name) {
            setHint(null)
            setNamed((n) => [...n, cur])
            if (round + 1 >= order.length) { showAnswerMeme(true); setTimeout(() => onSettled?.(), 1000) }
            setRound((r) => r + 1)
        } else {
            setHint(`Нет, это не ${name}. Посмотри ещё раз 👀`)
            showAnswerMeme(false)
            playSound(WRONG_ANSWER_SOUND)
        }
    }
    return (
        <SceneBox>
            <TypedLineWithParts parts={[{ bold: 'Подпиши всё!' }, { text: ' Как называется подсвеченный отрезок?' }]} onSettled={() => setTyped(true)} />
            {typed && (
                <DiagramBlock>
                    <CubeFig lines={LABEL_ITEMS.map((it) => {
                        const isNamed = named.includes(it.id)
                        const isCur = cur === it.id
                        return { id: it.id, a: it.a, b: it.b, color: isNamed ? it.color : NEU, w: it.id === 'perp' ? 3.5 : 5, glow: isCur ? HL : undefined, opacity: isNamed || isCur ? 1 : 0.55 }
                    })}>
                        <CubeMark o={CV.A} d1={[0.14, 0, 0]} d2={[0, 0, 0.14]} />
                    </CubeFig>
                </DiagramBlock>
            )}
            {typed && cur && (
                <div className="w-full grid grid-cols-2 gap-2">
                    {LABEL_ITEMS.map((it) => (
                        <GuessBtn key={it.id} color={it.sh ? '#6FB08C' : it.color} onClick={() => choose(it.name)}>{it.name}</GuessBtn>
                    ))}
                </div>
            )}
            <WarmHint text={hint} />
            {!cur && (
                <TypedLineWithParts parts={[
                    { sticker: 'A₁B', color: A_COLOR }, { text: ' — наклонная, ' }, { sticker: 'A₁A', color: PERP_COLOR }, { text: ' — перпендикуляр,' }, { break: true },
                    { sticker: 'BA', ...SH }, { text: ' — проекция, ' }, { sticker: 'BC', color: B_COLOR }, { text: ' — прямая 💪' },
                ]} />
            )}
        </SceneBox>
    )
}

// 6. ТТП прямо в кубе: BC ⟂ BA (пол квадратный) → BC ⟂ A₁B
const K6Scene = ({ onSettled }: SceneProps) => {
    const [st, setSt] = useState(0)
    return (
        <SceneBox>
            <TypedLineWithParts
                parts={[{ text: 'Фокус! В квадратном полу ' }, { sticker: 'BC', color: B_COLOR }, { text: ' ⟂ ' }, { sticker: 'BA', ...SH }, { text: ' — прямая ⟂ проекции' }]}
                onSettled={() => { setSt(1); setTimeout(() => setSt(2), 1600) }}
            />
            <DiagramBlock>
                <CubeFig lines={[
                    { id: 'ba1', a: 'B', b: 'A1', color: A_COLOR },
                    { id: 'a1a', a: 'A1', b: 'A', color: PERP_COLOR, w: 3.5 },
                    { id: 'ba', a: 'B', b: 'A', color: PROJ_COLOR },
                    { id: 'bc', a: 'B', b: 'C', color: B_COLOR },
                ]}>
                    {st >= 1 && st < 3 && <CubeMark o={CV.B} d1={[-0.14, 0, 0]} d2={[0, 0.22, 0]} bounce />}
                    {st >= 3 && <CubeMark o={CV.B} d1={[0, 0.3, 0]} d2={[-0.16, 0, 0.16]} bounce />}
                </CubeFig>
            </DiagramBlock>
            {st >= 2 && (
                <TypedLineWithParts
                    parts={[{ text: 'Значит по ТТП и ' }, { sticker: 'BC', color: B_COLOR }, { text: ' ⟂ ' }, { sticker: 'A₁B', color: A_COLOR }, { text: ' — прямая ⟂ наклонной! 🎯' }]}
                    onSettled={() => { setSt(3); setTimeout(() => onSettled?.(), 1200) }}
                />
            )}
        </SceneBox>
    )
}

// ===== Примеры из жизни =====
type LifeEx = {
    phi: number // угол прямой b (0 — b ⟂ проекции)
    ground: { fill: string; stroke: string }
    intro: LinePart[]
    aName: string; perpName: string; projName: string; bName: string
    aText: LinePart[]; perpText: LinePart[]; projText: LinePart[]; bText: LinePart[]
    yesText: LinePart[]; noText: LinePart[]
    decor: (step: number) => React.ReactNode // фон: стена, вода, солнце и т.п.
    aDraw: (glow: boolean) => React.ReactNode // сам объект (лестница, удочка…)
    perpDraw: (on: boolean) => React.ReactNode
    bDraw: (glow: boolean) => React.ReactNode
}
const L_O: V3 = W_O, L_T: V3 = W_T, L_H: V3 = W_H
const bEnds = (phi: number, len = 4.3): [V3, V3] => {
    const ph = phi * DEG
    return [[L_O[0] - len * Math.cos(ph), L_O[1] - len * Math.sin(ph), 0], [L_O[0] + len * Math.cos(ph), L_O[1] + len * Math.sin(ph), 0]]
}
const polyStr = (pts: V3[]) => pts.map((p) => ptStr(...p)).join(' ')

const LIFE: LifeEx[] = [
    {
        // 🪜 лестница у стены, щель между досками пола
        phi: 0,
        ground: { fill: '#3B2E25', stroke: '#6B5444' },
        intro: [{ text: '🪜 Лестница прислонена к стене' }],
        aName: 'лестница', perpName: 'по стене вниз', projName: 'след на полу', bName: 'щель в полу',
        aText: [{ text: 'Лестница — это ' }, { sticker: 'наклонная', color: A_COLOR }],
        perpText: [{ text: 'Отвес от верха лестницы — вниз по стене: ' }, { sticker: 'перпендикуляр', color: PERP_COLOR }],
        projText: [{ text: '«След» лестницы на полу — ' }, { sticker: 'проекция', ...SH }],
        bText: [{ text: 'Щель между досками пола — ' }, { sticker: 'прямая', color: B_COLOR }],
        yesText: [{ text: 'След ⟂ щели — значит и ' }, { sticker: 'лестница', color: A_COLOR }, { text: ' ⟂ щели ✅' }],
        noText: [],
        decor: () => (
            <>
                <polygon points={polyStr([[0.5, 6.2, 0], [9.5, 6.2, 0], [9.5, 6.2, 4.6], [0.5, 6.2, 4.6]])} fill="#4A5560" stroke="#6B7882" strokeWidth={2} />
                {[1.2, 2.0, 3.6, 4.4, 5.2].map((y) => <Seg3 key={y} p={[0, y, 0]} q={[10, y, 0]} color="#56453A" w={2} />)}
            </>
        ),
        aDraw: (glow) => (
            <>
                {glow && <Seg3 p={L_O} q={L_T} color={A_COLOR} w={2} glow={A_COLOR} />}
                <Seg3 p={[L_O[0] - 0.35, L_O[1], 0]} q={[L_T[0] - 0.35, L_T[1], L_T[2]]} color={glow ? A_COLOR : '#C08A4A'} w={3.5} />
                <Seg3 p={[L_O[0] + 0.35, L_O[1], 0]} q={[L_T[0] + 0.35, L_T[1], L_T[2]]} color={glow ? A_COLOR : '#C08A4A'} w={3.5} />
                {[0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((t) => {
                    const p: V3 = [L_O[0], L_O[1] + (L_T[1] - L_O[1]) * t, L_T[2] * t]
                    return <Seg3 key={t} p={[p[0] - 0.35, p[1], p[2]]} q={[p[0] + 0.35, p[1], p[2]]} color={glow ? A_COLOR : '#C08A4A'} w={2.5} />
                })}
            </>
        ),
        perpDraw: (on) => on ? <Seg3 p={L_T} q={L_H} color={PERP_COLOR} w={2.5} dash="5 4" /> : null,
        bDraw: (glow) => <Seg3 p={bEnds(0)[0]} q={bEnds(0)[1]} color={glow ? B_COLOR : '#56453A'} w={glow ? 4 : 2} glow={glow ? B_COLOR : undefined} />,
    },
    {
        // 🎣 удочка над рекой, леска отвесно, берег
        phi: 0,
        ground: { fill: hexToRgba('#3E8FD0', 0.35), stroke: '#5FA9E0' },
        intro: [{ text: '🎣 Удочка торчит с берега над рекой' }],
        aName: 'удочка', perpName: 'леска', projName: 'от руки до поплавка', bName: 'берег',
        aText: [{ text: 'Удочка — это ' }, { sticker: 'наклонная', color: A_COLOR }],
        perpText: [{ text: 'Леска висит отвесно — это ' }, { sticker: 'перпендикуляр', color: PERP_COLOR }],
        projText: [{ text: 'От удочки на берегу до поплавка — ' }, { sticker: 'проекция', ...SH }],
        bText: [{ text: 'Линия берега — ' }, { sticker: 'прямая', color: B_COLOR }],
        yesText: [{ text: 'Проекция ⟂ берегу — значит и ' }, { sticker: 'удочка', color: A_COLOR }, { text: ' ⟂ берегу ✅' }],
        noText: [],
        decor: () => (
            <polygon points={polyStr([[0, 0, 0], [10, 0, 0], [10, 2.8, 0], [0, 2.8, 0]])} fill="#3E6B35" stroke="#5C8F4E" strokeWidth={2} />
        ),
        aDraw: (glow) => <Seg3 p={L_O} q={L_T} color={glow ? A_COLOR : '#8A5A2B'} w={glow ? 4 : 3} glow={glow ? A_COLOR : undefined} />,
        perpDraw: (on) => (
            <>
                <Seg3 p={L_T} q={L_H} color={on ? PERP_COLOR : '#E6EEF2'} w={on ? 2.5 : 1.2} />
                {(() => { const A = P3(...L_H); return <><ellipse cx={A.x} cy={A.y} rx={14} ry={5} fill="none" stroke="#BFE3FF" strokeWidth={1.5} opacity={0.7} /><circle cx={A.x} cy={A.y - 3} r={4} fill="#E2574C" /></> })()}
            </>
        ),
        bDraw: (glow) => <Seg3 p={[0, 2.8, 0]} q={[10, 2.8, 0]} color={glow ? B_COLOR : '#7DB06A'} w={glow ? 4 : 2.5} glow={glow ? B_COLOR : undefined} />,
    },
    {
        // 🌞 палка и полуденная тень, край дорожки под углом
        phi: 30,
        ground: { fill: hexToRgba('#4F9A4A', 0.45), stroke: '#6FB565' },
        intro: [{ text: '🌞 Полдень. В землю воткнута палка' }],
        aName: 'палка', perpName: 'луч', projName: 'тень', bName: 'дорожка',
        aText: [{ text: 'Палка — это ' }, { sticker: 'наклонная', color: A_COLOR }],
        perpText: [{ text: 'Солнце над головой — луч падает отвесно: ' }, { sticker: 'перпендикуляр', color: PERP_COLOR }],
        projText: [{ text: 'Тень палки — ' }, { sticker: 'проекция', ...SH }],
        bText: [{ text: 'Край дорожки — ' }, { sticker: 'прямая', color: B_COLOR }],
        yesText: [],
        noText: [{ text: 'Тень и дорожка — 60°, не 90° ❌ Значит и ' }, { sticker: 'палка', color: A_COLOR }, { text: ' НЕ ⟂ дорожке' }],
        decor: () => {
            const [p, q] = bEnds(30, 5)
            const off = 0.7
            return <polygon points={polyStr([[p[0], p[1] - off, 0], [q[0], q[1] - off, 0], [q[0], q[1] + off, 0], [p[0], p[1] + off, 0]])} fill="#C9B48A" opacity={0.55} />
        },
        aDraw: (glow) => <Seg3 p={L_O} q={L_T} color={glow ? A_COLOR : '#8A5A2B'} w={glow ? 5 : 4.5} glow={glow ? A_COLOR : undefined} />,
        perpDraw: (on) => on ? (
            <>
                <Seg3 p={[5, 6.2, 5.6]} q={L_H} color={HL} w={2} dash="4 5" />
                {(() => { const A = P3(5, 6.2, 5.9); return <image href="/lesson-pics/sun.svg" x={A.x - 18} y={A.y - 30} width={36} height={36} /> })()}
            </>
        ) : null,
        bDraw: (glow) => { const [p, q] = bEnds(30, 5); return <Seg3 p={p} q={q} color={glow ? B_COLOR : '#B49C6E'} w={glow ? 4 : 2} glow={glow ? B_COLOR : undefined} /> },
    },
    {
        // ♿ пандус к двери, бордюр
        phi: 0,
        ground: { fill: '#3D4247', stroke: '#5E666D' },
        intro: [{ text: '♿ Пандус ведёт к двери' }],
        aName: 'пандус', perpName: 'опора', projName: 'след пандуса', bName: 'бордюр',
        aText: [{ text: 'Пандус — это ' }, { sticker: 'наклонная', color: A_COLOR }],
        perpText: [{ text: 'Опора под верхом пандуса — ' }, { sticker: 'перпендикуляр', color: PERP_COLOR }],
        projText: [{ text: '«След» пандуса на асфальте — ' }, { sticker: 'проекция', ...SH }],
        bText: [{ text: 'Бордюр — ' }, { sticker: 'прямая', color: B_COLOR }],
        yesText: [{ text: 'След ⟂ бордюру — значит и ' }, { sticker: 'пандус', color: A_COLOR }, { text: ' ⟂ бордюру ✅' }],
        noText: [],
        decor: () => (
            <>
                <polygon points={polyStr([[3.6, 6.2, 3.57], [6.4, 6.2, 3.57], [6.4, 6.9, 3.57], [3.6, 6.9, 3.57]])} fill="#6B737A" stroke="#8A939A" strokeWidth={1.5} />
                <polygon points={polyStr([[4.2, 6.9, 3.57], [5.8, 6.9, 3.57], [5.8, 6.9, 6.0], [4.2, 6.9, 6.0]])} fill="#7A4E2D" stroke="#A06A40" strokeWidth={2} />
            </>
        ),
        aDraw: (glow) => (
            <>
                <polygon points={polyStr([[L_O[0] - 0.9, L_O[1], 0], [L_O[0] + 0.9, L_O[1], 0], [L_T[0] + 0.9, L_T[1], L_T[2]], [L_T[0] - 0.9, L_T[1], L_T[2]]])} fill={glow ? hexToRgba(A_COLOR, 0.35) : '#8A939A'} stroke={glow ? A_COLOR : '#A9B2B8'} strokeWidth={2} />
                {glow && <Seg3 p={L_O} q={L_T} color={A_COLOR} w={3} />}
            </>
        ),
        perpDraw: (on) => <Seg3 p={L_T} q={L_H} color={on ? PERP_COLOR : '#9AA3A9'} w={on ? 3 : 4} />,
        bDraw: (glow) => <Seg3 p={bEnds(0, 5)[0]} q={bEnds(0, 5)[1]} color={glow ? B_COLOR : '#B8BEC2'} w={glow ? 5 : 5} glow={glow ? B_COLOR : undefined} />,
    },
    {
        // ⚡ столб и трос-растяжка, забор под углом
        phi: -10,
        ground: { fill: hexToRgba('#4F9A4A', 0.45), stroke: '#6FB565' },
        intro: [{ text: '⚡ Столб держит трос-растяжка' }],
        aName: 'трос', perpName: 'столб', projName: 'по земле', bName: 'забор',
        aText: [{ text: 'Трос — это ' }, { sticker: 'наклонная', color: A_COLOR }],
        perpText: [{ text: 'Сам столб — ' }, { sticker: 'перпендикуляр', color: PERP_COLOR }, { text: ' к земле' }],
        projText: [{ text: 'От колышка до основания столба — ' }, { sticker: 'проекция', ...SH }],
        bText: [{ text: 'Забор — ' }, { sticker: 'прямая', color: B_COLOR }],
        yesText: [],
        noText: [{ text: 'Проекция и забор — 80°: почти, но не 90° ❌ Значит и ' }, { sticker: 'трос', color: A_COLOR }, { text: ' НЕ ⟂ забору' }],
        decor: () => null,
        aDraw: (glow) => <Seg3 p={L_O} q={L_T} color={glow ? A_COLOR : '#9AA3A9'} w={glow ? 3.5 : 2} glow={glow ? A_COLOR : undefined} />,
        perpDraw: (on) => <Seg3 p={[5, 6.2, 5.2]} q={L_H} color={on ? PERP_COLOR : '#7A5434'} w={on ? 5 : 7} />,
        bDraw: (glow) => {
            const [p, q] = bEnds(-10, 5)
            const posts = [0, 0.25, 0.5, 0.75, 1].map((t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t] as [number, number])
            const c = glow ? B_COLOR : '#A07A52'
            return (
                <>
                    {posts.map(([x, y], i) => <Seg3 key={i} p={[x, y, 0]} q={[x, y, 0.9]} color={c} w={3} />)}
                    <Seg3 p={[p[0], p[1], 0.75]} q={[q[0], q[1], 0.75]} color={c} w={2.5} />
                    <Seg3 p={[p[0], p[1], 0.4]} q={[q[0], q[1], 0.4]} color={c} w={2.5} />
                    <Seg3 p={p} q={q} color={glow ? B_COLOR : 'transparent'} w={3} glow={glow ? B_COLOR : undefined} />
                </>
            )
        },
    },
]

// step: 0 сцена · 1 наклонная · 2 перпендикуляр · 3 проекция · 4 прямая · 5 ответ (угол)
const LifeFigure = ({ ex, step }: { ex: LifeEx; step: number }) => {
    const [bP, bQ] = bEnds(ex.phi)
    const Op = P3(...L_O)
    return (
        <WarmSvg>
            <Ground fill={ex.ground.fill} stroke={ex.ground.stroke} />
            {ex.decor(step)}
            {ex.bDraw(step >= 4)}
            {step >= 3 && <DrawPath d={`M${Op.x},${Op.y} L${P3(...L_H).x},${P3(...L_H).y}`} color={PROJ_COLOR} w={5} fresh={step === 3} dur={0.8} />}
            {ex.perpDraw(step >= 2)}
            {step >= 2 && <RightMark3 o={L_H} d1={[0, -0.7, 0]} d2={[0, 0, 0.7]} />}
            {ex.aDraw(step >= 1)}
            {step >= 5 && (ex.phi === 0
                ? <RightMark3 o={L_O} d1={[-0.9, 0, 0]} d2={[0, 0.9, 0]} bounce />
                : <motion.text x={bisectorPoint(Op, P3(...L_H), P3(...(ex.phi > 0 ? bQ : bP)), 46).x} y={bisectorPoint(Op, P3(...L_H), P3(...(ex.phi > 0 ? bQ : bP)), 46).y + 8} textAnchor="middle" fontSize={22} fontWeight={900} fill={MARK_COLOR}
                    initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.55 }}>{90 - Math.abs(ex.phi)}°</motion.text>)}
            <circle cx={Op.x} cy={Op.y} r={4} fill={X_COLOR} stroke="#0B1216" strokeWidth={1.5} />
            {step >= 1 && <Tag3 p={[5, 4.4, 1.85]} text="наклонная" color={A_COLOR} dx={-74} dy={-14} />}
            {step >= 3 && <Tag3 p={[5, 4.7, 0]} text="проекция" color={PROJ_COLOR} dx={38} dy={18} />}
            {step >= 4 && <Tag3 p={P3(...bP).y > P3(...bQ).y ? bP : bQ} text="прямая" color={B_COLOR} dx={4} dy={22} />}
        </WarmSvg>
    )
}

const lifeScene = (ex: LifeEx) => {
    const S = ({ onSettled }: SceneProps) => {
        const [step, setStep] = useState(-1) // -1 печатаем интро
        const [answered, setAnswered] = useState<null | boolean>(null)
        const isYes = ex.phi === 0
        const next = (n: number) => setTimeout(() => setStep(n), 500)
        return (
            <SceneBox>
                <TypedLineWithParts parts={ex.intro} onSettled={() => setStep(0)} />
                {step >= 0 && <DiagramBlock onSettled={() => next(1)}><LifeFigure ex={ex} step={answered !== null ? 5 : Math.min(4, Math.max(0, step))} /></DiagramBlock>}
                {step >= 1 && <TypedLineWithParts parts={ex.aText} onSettled={() => next(2)} />}
                {step >= 2 && <TypedLineWithParts parts={ex.perpText} onSettled={() => next(3)} />}
                {step >= 3 && <TypedLineWithParts parts={ex.projText} onSettled={() => next(4)} />}
                {step >= 4 && <TypedLineWithParts parts={ex.bText} onSettled={() => next(5)} />}
                {step >= 5 && (
                    <TypedLineWithParts parts={[{ text: 'Вопрос: ' }, { sticker: ex.aName, color: A_COLOR }, { text: ' ⟂ ' }, { sticker: ex.bName, color: B_COLOR }, { text: '? Смотри на угол проекции с прямой 👀' }]}
                        onSettled={() => setStep(6)} />
                )}
                {step >= 6 && answered === null && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full flex gap-2">
                        <GuessBtn color={A_COLOR} onClick={() => { setAnswered(true); showAnswerMeme(isYes); if (!isYes) playSound(WRONG_ANSWER_SOUND) }}>Да, ⟂</GuessBtn>
                        <GuessBtn color={A_COLOR} onClick={() => { setAnswered(false); showAnswerMeme(!isYes); if (isYes) playSound(WRONG_ANSWER_SOUND) }}>Нет</GuessBtn>
                    </motion.div>
                )}
                {answered !== null && (
                    <>
                        <p className="text-center text-lg font-black" style={{ color: answered === isYes ? CORRECT_COLOR : '#DC605B' }}>
                            {answered === isYes ? 'Верно! 🎯' : 'Не совсем 🙃'}
                        </p>
                        <TypedLineWithParts parts={isYes ? ex.yesText : ex.noText} onSettled={() => onSettled?.()} />
                    </>
                )}
            </SceneBox>
        )
    }
    return S
}

const WarmIntroScene = ({ onSettled }: SceneProps) => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { const t = setTimeout(() => onSettled?.(), 600); return () => clearTimeout(t) }, [])
    return (
        <SceneBox>
            <InsightCard label="🌍 А теперь — из жизни">
                Наклонные, перпендикуляры и проекции — <InsightWord>везде вокруг</InsightWord>. Найдём их!
            </InsightCard>
        </SceneBox>
    )
}

const WarmRuleScene = ({ onSettled }: SceneProps) => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { const t = setTimeout(() => onSettled?.(), 1500); return () => clearTimeout(t) }, [])
    return (
        <SceneBox>
            <InsightCard label="💡 Главное">
                Хочешь узнать, <InsightWord>наклонная ⟂ прямой</InsightWord>? Посмотри на её <InsightWord>проекцию</InsightWord>: проекция ⟂ прямой — значит и наклонная ⟂.
            </InsightCard>
        </SceneBox>
    )
}

const WARM_SCENES = [K0Scene, K1Scene, K2Scene, K3Scene, K4Scene, W5Scene, K6Scene, WarmIntroScene, ...LIFE.map(lifeScene), WarmRuleScene]

const WARM_QUIZ: ConceptQuizItem[] = [
    {
        renderPrompt: () => <>Угол между <Sticker value="проекцией" {...SH} /> и <Sticker value="b" color={B_COLOR} /> — 90°. Тогда <Sticker value="a" color={A_COLOR} /> и <Sticker value="b" color={B_COLOR} />…</>,
        renderFigure: () => <QuickFigure stage={6} phi={0} fresh={false} compact />,
        renderOptions: () => ['перпендикулярны', 'не перпендикулярны'],
        correct: 0,
        feedback: 'Проекция ⟂ b — значит и наклонная ⟂ b.',
    },
    {
        renderPrompt: () => <>Угол между <Sticker value="проекцией" {...SH} /> и <Sticker value="b" color={B_COLOR} /> — 60°. Тогда <Sticker value="a" color={A_COLOR} /> и <Sticker value="b" color={B_COLOR} />…</>,
        renderFigure: () => <QuickFigure stage={5} phi={30} angleLabel fresh={false} compact />,
        renderOptions: () => ['перпендикулярны', 'не перпендикулярны'],
        correct: 1,
        feedback: 'У проекции не 90° — значит и у наклонной не 90°.',
    },
    {
        renderPrompt: () => <>Угол между <Sticker value="проекцией" {...SH} /> и <Sticker value="b" color={B_COLOR} /> — 45°. Тогда <Sticker value="a" color={A_COLOR} /> и <Sticker value="b" color={B_COLOR} />…</>,
        renderFigure: () => <QuickFigure stage={5} phi={45} angleLabel fresh={false} compact />,
        renderOptions: () => ['не перпендикулярны', 'перпендикулярны'],
        correct: 0,
        feedback: '45° — не прямой угол. Значит a не ⟂ b.',
    },
    {
        renderPrompt: () => <>Известно: <Sticker value="наклонная a" color={A_COLOR} /> ⟂ <Sticker value="b" color={B_COLOR} />. Что можно сказать про <Sticker value="проекцию" {...SH} />?</>,
        renderOptions: () => ['Она тоже ⟂ b', 'Ничего нельзя сказать'],
        correct: 0,
        feedback: 'Правило работает и в обратную сторону: наклонная ⟂ b ⇔ проекция ⟂ b.',
    },
    {
        renderPrompt: () => <>В кубе <Sticker value="A₁B" color={A_COLOR} /> — наклонная к полу ABCD. Её <Sticker value="проекция" {...SH} /> на пол — это…</>,
        renderFigure: () => <CubeFig lines={[{ id: 'ba1', a: 'B', b: 'A1', color: A_COLOR }]} />,
        renderOptions: () => ['BA', 'BC', 'AC'],
        correct: 0,
        feedback: 'Перпендикуляр из A₁ падает в A, значит проекция — BA.',
    },
    {
        renderPrompt: () => <>Где <Sticker value="проекция" {...SH} /> у лестницы, прислонённой к стене?</>,
        renderOptions: () => ['«След» лестницы на полу', 'Сама лестница', 'Стена'],
        correct: 0,
        feedback: 'Лестница — наклонная, её след на полу — проекция.',
    },
    {
        renderPrompt: () => <>Бонус! Кто теперь видит наклонные везде? 👀</>,
        renderOptions: () => ['Я! 🔥'],
        correct: 0,
        feedback: 'Теперь ты готов к ТТП 🚀',
    },
]

export const TypeTtpWalk = ({ question, onAnswer, onComplete }: Props) => {
    // короткая версия урока — без метафор (урок «ТТП: коротко»)
    const quick = question.question.startsWith('ТТП коротко')
    // разминка перед ТТП (урок «ТТП: разминка»)
    const warm = question.question.startsWith('ТТП разминка')
    const [phase, setPhase] = useState<'concept' | 'quiz'>('concept')
    const [pick, setPick] = useState<number | null>(null)
    const [phi, setPhi] = useState(35)
    const finishedRef = useRef(false)

    const handleFinish = (hadMistake: boolean) => {
        if (finishedRef.current) return
        finishedRef.current = true
        onComplete(!hadMistake)
        onAnswer(hadMistake ? 'wrong' : 'right')
    }

    if (phase === 'concept') {
        return (
            <PickCtx.Provider value={{ pick, setPick, phi, setPhi }}>
                <ConceptPhase onDone={() => setPhase('quiz')} scenes={warm ? WARM_SCENES : quick ? QUICK_SCENES : CONCEPT_SCENES} />
            </PickCtx.Provider>
        )
    }
    return <ConceptQuizPhase onDone={handleFinish} items={warm ? WARM_QUIZ : quick ? QUICK_QUIZ : CONCEPT_QUIZ} />
}
