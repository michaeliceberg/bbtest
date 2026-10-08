// app/t-lesson/[t_lessonId]/type-ttpwalk.tsx
//
// Тип TTPWALK — интерактивный разбор «Теорема о Трёх Перпендикулярах (ТТП)» (стереометрия,
// ЕГЭ Математика) на метафоре «из жизни»: земля → копьё, воткнувшееся в землю → линия на земле
// → «копьё ⟂ линии?» → тень копья (ученик сам выбирает точку, откуда падает луч) → угол 90° →
// «по-школьному» (плоскость α, наклонная a, прямая b, проекция a) → вывод ТТП.
// Цвета: копьё/a — малиновый, линия/b — зелёный, тень/проекция — синий, земля/плоскость —
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
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { cn } from '@/lib/utils'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
    isAdmin?: boolean
}

const CONCEPT_PAUSE_MS = 1000

const Sticker = ({ value, color }: { value: React.ReactNode; color: string }) => (
    <motion.span
        initial={{ scale: 2.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 15 }}
        className="inline-flex items-center justify-center rounded-lg border-2 px-1.5 py-0.5 font-extrabold align-middle leading-none"
        style={{ borderColor: color, backgroundColor: hexToRgba(color, 0.18), color }}
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
type LinePart = { text: string } | { sticker: string; color: string } | { break: true } | { bold: string }
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
                            ? <Sticker key={i} value={p.sticker} color={p.color} />
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


// ===================================================================
// ЧЕРТЁЖ: земля (плоскость), копьё (наклонная), линия на земле, тень (проекция)
// ===================================================================
// «Из жизни»: спортсмен метнул копьё — оно воткнулось в землю, на земле начерчена линия.
// Перпендикулярно ли копьё линии? Проверяем по ТЕНИ (солнце в зените ⇒ тень = проекция).
// Потом всё то же «по-школьному»: плоскость α, наклонная a, прямая b, проекция a.
// Косая проекция 3D→2D; сцена повёрнута вокруг вертикали (по часовой, если смотреть сверху),
// чтобы линии не сливались. Копьё лежит в одной вертикальной плоскости, линия перпендикулярна
// ей ⇒ в 3D копьё и линия честно перпендикулярны (угол 90° — не обман глаза).

const VB_W = 340, VB_H = 262
const ANG = (28 * Math.PI) / 180
const CXW = 5, CYW = 2.5

const A_COLOR = GGEGE_PALETTE.raspberry.button
const B_COLOR = GGEGE_PALETTE.green.button
const PROJ_COLOR = GGEGE_PALETTE.blue.button
const PLANE_COLOR = GGEGE_PALETTE.teal.button
const MARK_COLOR = GGEGE_PALETTE.orange.button
const X_COLOR = '#F2F7FB'

// Точка X, где копьё входит в землю; a(s) = X + s·(0, 1, 1.4)
const X3 = { x: 5, y: 1.2, z: 0 }
const aPoint = (s: number) => ({ x: 5, y: X3.y + s, z: 1.4 * s })
const S_LOW = -1.2, S_HIGH = 3.4
const CANDIDATES = [1.8, 2.6, 3.3]
const DEFAULT_PICK = 2.6
const PLANE_CORNERS: [number, number][] = [[0, 0], [10, 0], [10, 5], [0, 5]]

const rawProj = (x: number, y: number, z: number) => {
    const dx = x - CXW, dy = y - CYW
    const rx = CXW + dx * Math.cos(ANG) + dy * Math.sin(ANG)
    const ry = CYW - dx * Math.sin(ANG) + dy * Math.cos(ANG)
    return { x: rx + 0.75 * ry, y: -(z + 0.5 * ry) }
}
// Подгоняем сцену под холст: масштаб и сдвиг по крайним точкам (плоскость + концы копья).
const FIT = (() => {
    const pts = [...PLANE_CORNERS.map(([x, y]) => rawProj(x, y, 0)), rawProj(aPoint(S_LOW).x, aPoint(S_LOW).y, aPoint(S_LOW).z), rawProj(aPoint(S_HIGH).x, aPoint(S_HIGH).y, aPoint(S_HIGH).z)]
    const minX = Math.min(...pts.map((q) => q.x)), maxX = Math.max(...pts.map((q) => q.x))
    const minY = Math.min(...pts.map((q) => q.y)), maxY = Math.max(...pts.map((q) => q.y))
    const mX = 40, mT = 30, mB = 34
    const u = Math.min((VB_W - 2 * mX) / (maxX - minX), (VB_H - mT - mB) / (maxY - minY))
    return { u, offX: mX - minX * u + ((VB_W - 2 * mX) - (maxX - minX) * u) / 2, offY: mT - minY * u + ((VB_H - mT - mB) - (maxY - minY) * u) / 2 }
})()
const P3 = (x: number, y: number, z: number) => { const r = rawProj(x, y, z); return { x: FIT.offX + r.x * FIT.u, y: FIT.offY + r.y * FIT.u } }
const ptStr = (x: number, y: number, z: number) => { const p = P3(x, y, z); return `${p.x.toFixed(1)},${p.y.toFixed(1)}` }

const PickCtx = createContext<{ pick: number | null; setPick: (s: number | null) => void }>({ pick: null, setPick: () => {} })

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

// Тег-слово («копьё», «линия») — как SvgTag, но шире под длину слова.
const SvgWordTag = ({ x, y, text, color, delay = 0 }: { x: number; y: number; text: string; color: string; delay?: number }) => {
    const w = text.length * 8.6 + 18
    return (
        <g transform={`translate(${x},${y})`}>
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

// scene: 0 земля · 1 копьё · 2 линия · 3 вопрос · 4 тень · 5 угол 90° · 6-7 «по-школьному»
const Figure = ({ scene, pick, beat = 0, onPick }: { scene: number; pick: number | null; beat?: number; onPick?: (s: number) => void }) => {
    const school = scene >= 6
    const hasA = scene >= 1
    const hasB = scene >= 2
    const s = pick ?? (scene >= 5 ? DEFAULT_PICK : null)
    const later = scene > 4
    const showPerp = s != null && (later || (scene === 4 && beat >= 1))
    const showH = s != null && (later || (scene === 4 && beat >= 2))
    const showProj = s != null && (later || (scene === 4 && beat >= 3))
    const fresh4 = scene === 4
    const freshWords = scene === 6 // подписи-слова меняются на школьные

    const Xp = P3(X3.x, X3.y, 0)
    const planePts = PLANE_CORNERS.map(([x, y]) => ptStr(x, y, 0)).join(' ')
    const planePath = `M${PLANE_CORNERS.map(([x, y]) => ptStr(x, y, 0)).join(' L')} Z`

    const lowEnd = aPoint(S_LOW), hiEnd = aPoint(S_HIGH)
    const aSolid = `M${ptStr(X3.x, X3.y, 0)} L${ptStr(hiEnd.x, hiEnd.y, hiEnd.z)}`
    const aHidden = `M${ptStr(lowEnd.x, lowEnd.y, lowEnd.z)} L${ptStr(X3.x, X3.y, 0)}`
    const bPath = `M${ptStr(0.8, X3.y, 0)} L${ptStr(9.2, X3.y, 0)}`
    const aTop = P3(hiEnd.x, hiEnd.y, hiEnd.z)
    const bStart = P3(0.8, X3.y, 0)

    // подпись плоскости — у ближнего нижнего угла, чуть к центру
    const cs = PLANE_CORNERS.map(([x, y]) => P3(x, y, 0))
    const corner = cs.reduce((best, c) => (c.x + c.y > best.x + best.y ? c : best), cs[0])
    const center = P3(CXW, CYW, 0)
    const planeLabel = { x: corner.x + (center.x - corner.x) * 0.4, y: corner.y + (center.y - corner.y) * 0.4 }

    let projEl: React.ReactNode = null
    if (s != null) {
        const pP = aPoint(s)
        const H = P3(5, X3.y + s, 0)
        const Pp = P3(pP.x, pP.y, pP.z)
        const dx = H.x - Xp.x, dy = H.y - Xp.y
        const len = Math.hypot(dx, dy) || 1
        let nx = -dy / len, ny = dx / len
        if (ny < 0) { nx = -nx; ny = -ny }
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI
        const tx = (Xp.x + H.x) / 2 + nx * 16, ty = (Xp.y + H.y) / 2 + ny * 16
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
                            <path d={rightAngleMark({ x: 5, y: X3.y + s, z: 0 }, [0, -0.7, 0], [0, 0, 0.7])} fill="none" stroke={MARK_COLOR} strokeWidth={2} strokeLinecap="round" />
                        </FadeIn>
                        <Dot x={H.x} y={H.y} color={PROJ_COLOR} fresh={fresh4} />
                        <SvgTag x={H.x + 22} y={H.y - 4} text="H" color={PROJ_COLOR} delay={fresh4 ? 0.2 : 0} />
                    </>
                )}
                {showProj && (
                    <>
                        <DrawPath d={`M${Xp.x},${Xp.y} L${H.x},${H.y}`} color={PROJ_COLOR} w={4.5} fresh={fresh4} dur={0.9} />
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

    return (
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full max-w-[340px] mx-auto" style={{ overflow: 'visible' }}>
            {/* земля / плоскость */}
            <motion.polygon
                points={planePts} fill={hexToRgba(PLANE_COLOR, 0.16)}
                initial={{ opacity: scene === 0 ? 0 : 1 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }}
            />
            <DrawPath d={planePath} color={PLANE_COLOR} w={3} fresh={scene === 0} dur={1.1} />
            <motion.text
                key={school ? 'pa' : 'pl'}
                x={planeLabel.x} y={planeLabel.y + 5} textAnchor="middle" fontSize={school ? 18 : 14} fontStyle="italic" fill={PLANE_COLOR} fontWeight={800}
                initial={{ opacity: scene === 0 || freshWords ? 0 : 1 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: scene === 0 ? 1.0 : 0.3 }}
            >
                {school ? 'α' : 'земля'}
            </motion.text>

            {/* часть копья под землёй — пунктир */}
            {hasA && (
                <FadeIn fresh={scene === 1} delay={0.2}>
                    <path d={aHidden} fill="none" stroke={A_COLOR} strokeWidth={3} strokeDasharray="6 6" strokeLinecap="round" opacity={0.55} />
                </FadeIn>
            )}
            {hasB && <DrawPath d={bPath} color={B_COLOR} w={4} fresh={scene === 2} />}
            {hasA && <DrawPath d={aSolid} color={A_COLOR} w={4} fresh={scene === 1} />}
            {hasA && <Dot x={Xp.x} y={Xp.y} color={X_COLOR} fresh={scene === 1} delay={1.0} />}
            {hasA && <SvgTag x={Xp.x - 17} y={Xp.y + 16} text="X" color={X_COLOR} delay={scene === 1 ? 1.1 : 0} />}
            {hasA && (school
                ? <SvgTag key="a" x={aTop.x + 18} y={aTop.y + 2} text="a" color={A_COLOR} delay={0.3} />
                : <SvgWordTag key="kopyo" x={aTop.x + 32} y={aTop.y + 2} text="копьё" color={A_COLOR} delay={scene === 1 ? 1.0 : 0} />)}
            {hasB && (school
                ? <SvgTag key="b" x={bStart.x - 6} y={bStart.y - 18} text="b" color={B_COLOR} delay={0.3} />
                : <SvgWordTag key="liniya" x={bStart.x - 4} y={bStart.y - 19} text="линия" color={B_COLOR} delay={scene === 2 ? 0.9 : 0} />)}

            {projEl}

            {/* угол 90° между тенью и линией */}
            {scene >= 5 && (
                <FadeIn fresh={scene === 5} delay={0.2}>
                    <path d={rightAngleMark(X3, [0.8, 0, 0], [0, 0.8, 0])} fill="none" stroke={MARK_COLOR} strokeWidth={2.4} strokeLinecap="round" />
                </FadeIn>
            )}

            {/* солнце над головой — когда падает тень */}
            {scene >= 4 && scene <= 5 && (
                <motion.text
                    x={VB_W - 26} y={26} fontSize={26} textAnchor="middle"
                    initial={{ opacity: scene === 4 ? 0 : 1 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
                >
                    ☀️
                </motion.text>
            )}

            {/* точки на копье, из которых можно «опустить луч» */}
            {scene === 4 && pick == null && onPick && CANDIDATES.map((c) => {
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
        </svg>
    )
}

type SceneProps = { onSettled?: () => void; leaving?: boolean }

const SceneBox = ({ children }: { children: React.ReactNode }) => <div className="w-full flex flex-col items-center gap-3">{children}</div>

// Диаграмма появляется ПОСЛЕ печати текста (текст → чертёж → пауза), а потом сцена готова.
const useAfterTyped = () => {
    const [typed, setTyped] = useState(false)
    return { typed, onTyped: () => setTyped(true) }
}

const GroundScene = ({ onSettled }: SceneProps) => {
    const { typed, onTyped } = useAfterTyped()
    return (
        <SceneBox>
            <TypedLineWithParts parts={[{ text: 'Вот ' }, { sticker: 'земля', color: PLANE_COLOR }, { text: ' — площадка для метания копья.' }]} onSettled={onTyped} />
            {typed && <DiagramBlock onSettled={() => setTimeout(() => onSettled?.(), 1700)}><Figure scene={0} pick={null} /></DiagramBlock>}
        </SceneBox>
    )
}

const SpearScene = ({ onSettled }: SceneProps) => {
    const { typed, onTyped } = useAfterTyped()
    return (
        <SceneBox>
            <TypedLineWithParts
                parts={[{ text: 'Спортсмен 🏃 метнул ' }, { sticker: 'копьё', color: A_COLOR }, { text: ' — оно воткнулось в землю в точке ' }, { sticker: 'X', color: X_COLOR }, { text: '.' }]}
                onSettled={onTyped}
            />
            {typed && <DiagramBlock onSettled={() => setTimeout(() => onSettled?.(), 1800)}><Figure scene={1} pick={null} /></DiagramBlock>}
        </SceneBox>
    )
}

const LineScene = ({ onSettled }: SceneProps) => {
    const { typed, onTyped } = useAfterTyped()
    return (
        <SceneBox>
            <TypedLineWithParts
                parts={[{ text: 'На земле была начерчена ' }, { sticker: 'линия', color: B_COLOR }, { text: ' — прямо через эту точку.' }]}
                onSettled={onTyped}
            />
            {typed && <DiagramBlock onSettled={() => setTimeout(() => onSettled?.(), 1600)}><Figure scene={2} pick={null} /></DiagramBlock>}
        </SceneBox>
    )
}

const GuessBtn = ({ children, onClick, color }: { children: React.ReactNode; onClick: () => void; color: string }) => (
    <button type="button" onClick={onClick} className="flex-1 rounded-xl border-2 px-3 py-3 text-base font-black active:translate-y-[2px]"
        style={{ borderColor: color, backgroundColor: hexToRgba(color, 0.14), color }}>
        {children}
    </button>
)

const QuestionScene = ({ onSettled }: SceneProps) => {
    const [shown, setShown] = useState(false)
    const [asked, setAsked] = useState(false)
    return (
        <SceneBox>
            <DiagramBlock><Figure scene={3} pick={null} /></DiagramBlock>
            <TypedLineWithParts
                parts={[{ sticker: 'Копьё', color: A_COLOR }, { text: ' воткнулось ' }, { bold: 'перпендикулярно' }, { text: ' ' }, { sticker: 'линии', color: B_COLOR }, { text: '?' }]}
                onSettled={() => setShown(true)}
            />
            {shown && !asked && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full flex gap-2">
                    <GuessBtn color={PROJ_COLOR} onClick={() => setAsked(true)}>Да</GuessBtn>
                    <GuessBtn color={PROJ_COLOR} onClick={() => setAsked(true)}>Нет</GuessBtn>
                    <GuessBtn color={MARK_COLOR} onClick={() => setAsked(true)}>Не знаю 🤔</GuessBtn>
                </motion.div>
            )}
            {asked && (
                <TypedLineWithParts
                    parts={[
                        { text: 'Глазами не поймёшь 😅 Проверим: ' }, { bold: 'перпендикулярна ли линии ' },
                        { sticker: 'тень', color: PROJ_COLOR }, { text: ' от копья?' },
                    ]}
                    onSettled={() => onSettled?.()}
                />
            )}
        </SceneBox>
    )
}

const ShadowScene = ({ onSettled }: SceneProps) => {
    const { pick, setPick } = useContext(PickCtx)
    const [typed, setTyped] = useState(false)
    const [beat, setBeat] = useState(0)
    const [lineTwo, setLineTwo] = useState(false)
    // сцена начинается заново — прошлый выбор точки сбрасываем
    useEffect(() => { setPick(null) }, [setPick])
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
                parts={[{ text: 'Солнце ☀️ прямо над головой: от любой точки ' }, { sticker: 'копья', color: A_COLOR }, { text: ' луч падает на землю отвесно. ' }, { bold: 'Выбери точку 👇' }]}
                onSettled={() => setTyped(true)}
            />
            {typed && (
                <DiagramBlock>
                    <Figure scene={4} pick={pick} beat={beat} onPick={(s) => setPick(s)} />
                </DiagramBlock>
            )}
            {lineTwo && (
                <TypedLineWithParts
                    parts={[
                        { text: 'Луч попал в точку ' }, { sticker: 'H', color: PROJ_COLOR }, { text: '. Соединим ' }, { sticker: 'H', color: PROJ_COLOR },
                        { text: ' с ' }, { sticker: 'X', color: X_COLOR }, { text: ' — это ' }, { sticker: 'тень', color: PROJ_COLOR }, { text: ' копья.' },
                    ]}
                />
            )}
        </SceneBox>
    )
}

const NinetyScene = ({ onSettled }: SceneProps) => {
    const { pick } = useContext(PickCtx)
    const [typed, setTyped] = useState(false)
    const [second, setSecond] = useState(false)
    return (
        <SceneBox>
            <TypedLineWithParts
                parts={[
                    { text: 'Если тень перпендикулярна ' }, { sticker: 'линии', color: B_COLOR }, { text: ' — получился угол ' }, { sticker: '90°', color: MARK_COLOR }, { text: '…' },
                ]}
                onSettled={() => setTyped(true)}
            />
            {typed && <DiagramBlock onSettled={() => setTimeout(() => setSecond(true), 1300)}><Figure scene={5} pick={pick} /></DiagramBlock>}
            {second && (
                <>
                    <TypedLineWithParts
                        parts={[{ text: '…то и ' }, { sticker: 'копьё', color: A_COLOR }, { text: ' воткнулось под ' }, { sticker: '90°', color: MARK_COLOR }, { text: ' к ' }, { sticker: 'линии', color: B_COLOR }, { text: '!' }]}
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
            {typed && <DiagramBlock><Figure scene={6} pick={pick} /></DiagramBlock>}
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
                                <Scene onSettled={() => i === step && setStepReady(true)} leaving={advancing && i === step} />
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
        renderPrompt: () => <><Sticker value="Тень" color={PROJ_COLOR} /> копья перпендикулярна <Sticker value="линии" color={B_COLOR} />. Тогда само <Sticker value="копьё" color={A_COLOR} /> и линия…</>,
        renderOptions: () => ['перпендикулярны (90°)', 'параллельны'],
        correct: 0,
        feedback: 'Тень ⟂ линии — значит и копьё ⟂ линии. Это ТТП!',
    },
    {
        renderPrompt: () => <><Sticker value="Тень" color={PROJ_COLOR} /> <b>НЕ</b> перпендикулярна <Sticker value="линии" color={B_COLOR} />. Тогда <Sticker value="копьё" color={A_COLOR} /> и линия…</>,
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
    const finishedRef = useRef(false)

    const handleFinish = (hadMistake: boolean) => {
        if (finishedRef.current) return
        finishedRef.current = true
        onComplete(!hadMistake)
        onAnswer(hadMistake ? 'wrong' : 'right')
    }

    if (phase === 'concept') {
        return (
            <PickCtx.Provider value={{ pick, setPick }}>
                <ConceptPhase onDone={() => setPhase('quiz')} />
            </PickCtx.Provider>
        )
    }
    return <ConceptQuizPhase onDone={handleFinish} />
}
