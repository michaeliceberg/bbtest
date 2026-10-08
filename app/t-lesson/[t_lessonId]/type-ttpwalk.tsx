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
const PROJ_COLOR = GGEGE_SHADOW.text
// стикер слова «тень» — тёмная плашка, как тень
const SH = { color: GGEGE_SHADOW.text, bg: GGEGE_SHADOW.button, border: GGEGE_SHADOW.bottom }
const SHADOW_LINE = '#0A100D' // сама тень O–H поверх тёмно-зелёной тени — почти чёрная
const PLANE_COLOR = GGEGE_PALETTE.teal.button
const MARK_COLOR = GGEGE_PALETTE.orange.button
const X_COLOR = '#F2F7FB'
// Точка O лежит на земле — «травяная» подпись: светло-зелёная буква в тёмно-зелёной рамке
const O_TEXT = '#9BE3B8'
const O_FILL = '#173A2D'

// Точка O, где копьё входит в землю; a(s) = O + s·(0, 1, 1.4)
const O3 = { x: 5, y: 3.5, z: 0 }
const aPoint = (s: number) => ({ x: 5, y: O3.y + s, z: 1.4 * s })
const S_HIGH = 3.3
const CANDIDATES = [1.7, 2.4, 3.1]
const DEFAULT_PICK = 2.4
const PLANE_CORNERS: [number, number][] = [[0, 0], [10, 0], [10, 7], [0, 7]]
const LB = 3.4 // полудлина линии b (при любом угле остаётся в пределах земли)
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
    const spearW = (vLen * 67) / 912 // пропорции картинки spear.webp (67×912)

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
        const tx = (Op.x + H.x) / 2 + nx * 16, ty = (Op.y + H.y) / 2 + ny * 16
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
                            <path d={rightAngleMark({ x: 5, y: O3.y + s, z: 0 }, [0, -0.7, 0], [0, 0, 0.7])} fill="none" stroke={MARK_COLOR} strokeWidth={2} strokeLinecap="round" />
                        </FadeIn>
                        <Dot x={H.x} y={H.y} color={PROJ_COLOR} fresh={fresh4} />
                        <SvgTag x={H.x + 22} y={H.y - 4} text="H" color={PROJ_COLOR} delay={fresh4 ? 0.2 : 0} />
                    </>
                )}
                {showProj && (
                    <>
                        <DrawPath d={`M${Op.x},${Op.y} L${H.x},${H.y}`} color={SHADOW_LINE} w={4.5} fresh={fresh4} dur={0.9} />
                        <g transform={`translate(${tx},${ty}) rotate(${angle})`}>
                            <motion.text
                                key={school ? 's' : 'l'}
                                x={0} y={4} textAnchor="middle" fontSize={school ? 12 : 14} fontWeight={800} fill={PROJ_COLOR}
                                initial={fresh4 || freshWords ? { opacity: 0 } : { opacity: 1 }} animate={{ opacity: 1 }}
                                transition={{ duration: 0.5, delay: fresh4 ? 0.9 : freshWords ? 0.3 : 0 }}
                            >
                                {school ? 'проекция a' : 'тень'}
                            </motion.text>
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
                            <text x={64} y={-106} fontSize={15} fontWeight={800} fill="#F2C35B">Если что,</text>
                            <text x={64} y={-88} fontSize={15} fontWeight={800} fill="#F2C35B">это кустик 🌳</text>
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

type SceneProps = { onSettled?: () => void; leaving?: boolean; onAutoNext?: () => void }

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

// «Спортсмен бросает копьё..» → видео броска (один раз) → видео убираем, копьё летит и
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
                parts={[{ text: 'Спортсмен 🏃 бросает ' }, { sticker: 'копьё', color: A_COLOR }, { text: '..' }]}
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
                    { bold: 'Крути её так, чтобы она ПРИМЕРНО стала перпендикулярна ' },
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

const QuestionScene = ({ onSettled, leaving }: SceneProps) => {
    const { phi } = useContext(PickCtx)
    const [shown, setShown] = useState(false)
    const [asked, setAsked] = useState(false)
    const [thinking, setThinking] = useState(false)
    const pharaonRef = useRef<HTMLVideoElement>(null)
    useEffect(() => { if (leaving) pharaonRef.current?.pause() }, [leaving])
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
                        { text: 'А чтобы точно узнать — надо понять,' }, { break: true },
                        { text: 'а перпендикулярна ли ' }, { sticker: 'ТЕНЬ', ...SH }, { text: ' от копья к этой ' },
                        { sticker: 'линии', color: B_COLOR }, { text: '?' },
                    ]}
                    onSettled={() => { setThinking(true); setTimeout(() => onSettled?.(), 1500) }}
                />
            )}
            {thinking && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.4 }} className="flex justify-center">
                    <AlphaVideo ref={pharaonRef} src="/video/pharaon-think.webm" autoPlay loop muted playsInline className="w-full max-w-[240px]" />
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
    const [lineTwo, setLineTwo] = useState(false)
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
    useEffect(() => {
        if (pick == null) return
        const t1 = setTimeout(() => setBeat(1), 150)
        const t2 = setTimeout(() => { setBeat(2); setLineTwo(true) }, 1250)
        const t3 = setTimeout(() => setBeat(3), 2600)
        const t4 = setTimeout(() => onSettled?.(), 4300)
        return () => { [t1, t2, t3, t4].forEach(clearTimeout) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pick])
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
            {pre >= 3 && pick == null && (
                <TypedLineWithParts
                    parts={[{ text: 'Давай от любой точки ' }, { sticker: 'копья', color: A_COLOR }, { text: ' нарисуем ' }, { bold: 'ПЕРПЕНДИКУЛЯР' }, { text: ' на землю 👇' }]}
                />
            )}
            {lineTwo && (
                <TypedLineWithParts
                    parts={[
                        { text: 'Луч попал в точку ' }, { sticker: 'H', ...SH }, { text: '. Соединим ' }, { sticker: 'H', ...SH },
                        { text: ' с ' }, { sticker: 'O', color: O_TEXT, bg: O_FILL, border: O_TEXT }, { text: ' — это ' }, { sticker: 'тень', ...SH }, { text: ' копья.' },
                    ]}
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
                        parts={[{ text: 'Тень ⟂ линии — значит и ' }, { sticker: 'копьё', color: A_COLOR }, { text: ' воткнулось под ' }, { sticker: '90°', color: MARK_COLOR }, { text: ' к ' }, { sticker: 'линии', color: B_COLOR }, { text: '!' }]}
                        onSettled={() => onSettled?.()}
                    />
                    <motion.div
                        initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.55, delay: 0.4 }}
                        className="rounded-2xl border-2 px-5 py-3 text-xl font-black"
                        style={{ borderColor: MARK_COLOR, backgroundColor: hexToRgba(MARK_COLOR, 0.16), color: MARK_COLOR }}
                    >
                        ∠(копьё, линия) = 90°
                    </motion.div>
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
                    <motion.div key={r.life} initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-center gap-2 text-base md:text-lg">
                        <Sticker value={r.life} color={r.lifeColor} />
                        <span className="font-black text-[#9AA7B0]">→</span>
                        <Sticker value={r.school} color={r.schoolColor} />
                    </motion.div>
                ))}
            </div>
        </SceneBox>
    )
}

const TheoremScene = ({ onSettled }: SceneProps) => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { const t = setTimeout(() => onSettled?.(), 1800); return () => clearTimeout(t) }, [])
    return (
        <SceneBox>
            <InsightCard label="💡 ТТП">
                Проекция наклонной ⟂ прямой в плоскости — значит и <InsightWord>сама наклонная ⟂ ей</InsightWord>
            </InsightCard>
            <p className="text-center text-base md:text-lg text-[#F2F7FB]">
                Это и есть <b>Теорема о Трёх Перпендикулярах</b> (ТТП) 🎉
            </p>
        </SceneBox>
    )
}

const CONCEPT_SCENES = [GroundScene, SpearScene, LineScene, QuestionScene, ShadowScene, NinetyScene, SchoolScene, TheoremScene]
const INTRO_CONCEPT_STEPS = CONCEPT_SCENES.length

const ConceptPhase = ({ onDone }: { onDone: () => void }) => {
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
            if (step + 1 >= INTRO_CONCEPT_STEPS) onDone()
            else { setStep((s) => s + 1); setStepReady(false) }
            setAdvancing(false)
        }, CONCEPT_PAUSE_MS)
    }

    return (
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-1 pb-8">
            <div className="w-full flex flex-col gap-4">
                {CONCEPT_SCENES.map((Scene, i) =>
                    step >= i ? (
                        <SceneWrapper key={`step-${i}`} innerRef={sceneRef(`step-${i}`)} active={isSceneActive(`step-${i}`)}>
                            <Fragment key={`step-${i}-${nonceFor(`step-${i}`)}`}>
                                <Scene onSettled={() => i === step && setStepReady(true)} onAutoNext={() => i === step && handleNext()} leaving={advancing && i === step} />
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

const ConceptQuizPhase = ({ onDone }: { onDone: (hadMistake: boolean) => void }) => {
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
        if (k === CONCEPT_QUIZ[i].correct) {
            registerCombo(wrongTried.length === 0)
            showAnswerMeme(true)
            setChecked(true)
            setNextLabel(pickWalkthroughNextLabel(trialIndex + 1 >= CONCEPT_QUIZ.length ? 'Готово' : 'Дальше'))
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
            const isLast = trialIndex + 1 >= CONCEPT_QUIZ.length
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
                    const qq = CONCEPT_QUIZ[i]
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
                                        <span>{CONCEPT_QUIZ.length}</span>
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
                        {trialIndex + 1 >= CONCEPT_QUIZ.length ? 'Готово' : nextLabel}
                    </button>
                </div>
            )}
        </div>
    )
}
// ===== Основной компонент =====

export const TypeTtpWalk = ({ onAnswer, onComplete }: Props) => {
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
                <ConceptPhase onDone={() => setPhase('quiz')} />
            </PickCtx.Provider>
        )
    }
    return <ConceptQuizPhase onDone={handleFinish} />
}
