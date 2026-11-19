'use client'

// Примерка цветов чертежа урока ТТП (497): плоскость (форма, заливка, граница), линия b, стрела,
// тень, перпендикуляр, маркеры слов. Готовые сочетания сверху, каждый элемент можно менять отдельно.
// Страница без входа в аккаунт.

import { useMemo, useState } from 'react'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { CXW, CYW, lineHalf, O3, PLANE_RX, PLANE_RY, S_HIGH, VB_H, VB_W, P3, aPoint, groundMatrix, SLOPE } from '@/app/t-lesson/[t_lessonId]/type-ttpwalk'

const INK = '#10181C'
const WHITE = '#F2F7FB'
const SWATCHES = [
    ...Object.entries(GGEGE_PALETTE).map(([k, v]) => ({ id: k, hex: v.button })),
    { id: 'sky', hex: '#7dd3fc' }, { id: 'sand', hex: '#F0DDB0' }, { id: 'sun', hex: '#FFE27A' },
    { id: 'white', hex: WHITE }, { id: 'shadow', hex: '#3A7D59' }, { id: 'dark', hex: '#1B3428' },
]
const P = GGEGE_PALETTE

type ArrowKind = 'image' | 'color'
type OStroke = 'line' | 'dark' | 'white' | 'none'
type Cfg = {
    planeFill: string; planeOp: number
    planeStroke: string; strokeOp: number; strokeW: number
    line: string
    arrowKind: ArrowKind; arrow: string
    shadow: string
    oFill: string
    oStroke: OStroke
    perp: string
}

// Выбрано для урока 497 (2026-11-19): песочная плоскость, синяя линия, тёмная тень
const DEFAULT: Cfg = {
    planeFill: '#E3CB94', planeOp: 0.16, planeStroke: '#E3CB94', strokeOp: 0.8, strokeW: 2,
    line: P.blue.button, arrowKind: 'image', arrow: P.orange.button, shadow: '#000000', oFill: '#F2F7FB', oStroke: 'line', perp: WHITE,
}

const PRESETS: { name: string; hint: string; cfg: Cfg }[] = [
    { name: 'Песок (выбран)', hint: 'то, что стоит в уроке', cfg: DEFAULT },
    { name: 'Бледная бирюза', hint: 'овал, почти прозрачный', cfg: { ...DEFAULT, planeFill: P.teal.button, planeStroke: P.teal.button, planeOp: 0.1, line: P.purple.button } },
    {
        name: 'Голубой лёд', hint: 'голубая дымка, оранжевая линия',
        cfg: { ...DEFAULT, planeFill: '#7dd3fc', planeStroke: '#7dd3fc', planeOp: 0.09, line: P.orange.button, shadow: '#7dd3fc' },
    },
    {
        name: 'Контур без заливки', hint: 'только граница-овал',
        cfg: { ...DEFAULT, planeOp: 0, strokeOp: 0.85, strokeW: 2.5 },
    },
    {
        name: 'Песок', hint: 'тёплый светлый овал, синяя линия',
        cfg: { ...DEFAULT, planeFill: '#F0DDB0', planeStroke: '#F0DDB0', planeOp: 0.1, line: P.blue.button, arrow: P.orange.button, shadow: '#F0DDB0' },
    },
    {
        name: 'Сиреневая дымка', hint: 'фиолетовая плоскость, зелёная линия',
        cfg: { ...DEFAULT, planeFill: P.purple.button, planeStroke: P.purple.button, planeOp: 0.1, line: P.green.button, shadow: P.purple.button },
    },
    {
        name: 'Контраст', hint: 'синяя плоскость, оранжевая линия и жёлтая стрела',
        cfg: { ...DEFAULT, planeFill: P.blue.button, planeStroke: P.blue.button, planeOp: 0.12, line: P.orange.button, arrowKind: 'color', arrow: '#FFE27A', shadow: '#7dd3fc' },
    },
    {
        name: 'Мята + розовая линия', hint: 'малиновая линия на мятной плоскости',
        cfg: { ...DEFAULT, line: P.raspberry.button, arrowKind: 'color', arrow: WHITE },
    },
]

const f = (n: number) => n.toFixed(1)

const Swatches = ({ value, onChange }: { value: string; onChange: (hex: string) => void }) => (
    <div className="flex flex-wrap items-center gap-1.5">
        {SWATCHES.map((s) => (
            <button
                key={s.id} type="button" onClick={() => onChange(s.hex)} aria-label={s.id}
                className="h-7 w-7 rounded-md border-2"
                style={{ background: s.hex, borderColor: value.toLowerCase() === s.hex.toLowerCase() ? '#fff' : 'transparent', outline: value.toLowerCase() === s.hex.toLowerCase() ? '2px solid #fff' : 'none' }}
            />
        ))}
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-7 w-9 rounded-md bg-transparent" aria-label="свой цвет" />
    </div>
)

const Row = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-xl bg-[#202B30] p-3">
        <div className="mb-2 text-sm font-bold text-[#9FB0B8]">{title}</div>
        <div className="flex flex-col gap-2">{children}</div>
    </div>
)

const Slider = ({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) => (
    <label className="flex items-center gap-3 text-sm text-[#C9D6DC]">
        <span className="w-28 shrink-0">{label}</span>
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1" />
        <span className="w-10 text-right tabular-nums">{value}</span>
    </label>
)

const blend = (fg: string, a: number, bg = '#161F23') => {
    const x = parseInt(fg.slice(1), 16), y = parseInt(bg.slice(1), 16)
    const ch = (sh: number) => Math.round(((x >> sh) & 255) * a + ((y >> sh) & 255) * (1 - a)).toString(16).padStart(2, '0')
    return `#${ch(16)}${ch(8)}${ch(0)}`
}

const Mark = ({ color, children, dark }: { color: string; children: React.ReactNode; dark?: boolean }) => (
    <span className="inline-block rounded-[3px] px-[3px] font-extrabold align-middle" style={{ background: color, color: dark ? WHITE : INK, lineHeight: 1.15 }}>{children}</span>
)

const MarkTag = ({ x, y, text, color }: { x: number; y: number; text: string; color: string }) => (
    <g transform={`translate(${x},${y})`}>
        <rect x={-12} y={-13} width={24} height={26} rx={3} fill={color} />
        <text x={0} y={6} textAnchor="middle" fontSize={16} fontWeight={800} fill={INK}>{text}</text>
    </g>
)

const Preview = ({ c, full, labels }: { c: Cfg; full: boolean; labels: boolean }) => {
    const g = useMemo(() => {
        const Op = P3(O3.x, O3.y, 0)
        const top = aPoint(S_HIGH)
        const T = P3(top.x, top.y, top.z)
        const H = P3(O3.x, O3.y + S_HIGH, 0)
        const lh = lineHalf(0)
        const bL = P3(O3.x - lh, O3.y, 0), bR = P3(O3.x + lh, O3.y, 0)
        const rx = PLANE_RX, ry = PLANE_RY
        const oval = Array.from({ length: 96 }, (_, i) => {
            const a = (i / 96) * Math.PI * 2
            const q = P3(CXW + rx * Math.cos(a), CYW + ry * Math.sin(a), 0)
            return `${f(q.x)},${f(q.y)}`
        }).join(' ')
        const vx = T.x - Op.x, vy = T.y - Op.y, vl = Math.hypot(vx, vy)
        return { Op, T, H, bL, bR, oval, vx, vy, vl }
    }, [])
    const { Op, T, H, bL, bR, vx, vy, vl } = g
    const ra = (dy: number, dz: number) => { const q = P3(O3.x, O3.y + S_HIGH + dy, dz); return `${f(q.x)},${f(q.y)}` }
    const rightAngle = `M${ra(-0.9, 0)} L${ra(-0.9, 0.9)} L${ra(0, 0.9)}`
    const ux = vx / vl, uy = vy / vl, nx = -uy, ny = ux
    const mid = { x: (Op.x + H.x) / 2, y: (Op.y + H.y) / 2 }
    const gm = groundMatrix(O3.x, O3.y + S_HIGH / 2)
    const sh = { x: O3.x, y: O3.y + S_HIGH / 2 }
    void sh; void mid; void SLOPE
    const oStrokeColor = c.oStroke === 'line' ? c.line : c.oStroke === 'dark' ? '#0B1216' : c.oStroke === 'white' ? WHITE : 'none'
    const bAng = (Math.atan2(bR.y - bL.y, bR.x - bL.x) * 180) / Math.PI
    const bLen = Math.hypot(bR.x - bL.x, bR.y - bL.y)
    const bu = { x: (bR.x - bL.x) / bLen, y: (bR.y - bL.y) / bLen }
    const spearRot = (Math.atan2(-vx / vl, vy / vl) * 180) / Math.PI
    const oldTop = P3(O3.x, O3.y + 4.2, 1.05 * 4.2)
    const spearW = Math.hypot(oldTop.x - Op.x, oldTop.y - Op.y) / 8.3
    return (
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="mx-auto w-full max-w-[448px]" style={{ overflow: 'visible' }}>
            <polygon
                points={g.oval}
                fill={hexToRgba(c.planeFill, c.planeOp)} stroke={hexToRgba(c.planeStroke, c.strokeOp)}
                strokeWidth={c.strokeW} strokeLinejoin="round"
            />
            {full && <line x1={Op.x} y1={Op.y} x2={H.x} y2={H.y} stroke={c.shadow} strokeOpacity={0.78} strokeWidth={10} strokeLinecap="round" />}
                        <line x1={bL.x} y1={bL.y} x2={bR.x} y2={bR.y} stroke={c.line} strokeWidth={4} strokeLinecap="round" />
            {full && (
                <>
                    {c.arrowKind === 'image' ? (
                        <g transform={`translate(${f(Op.x)},${f(Op.y)})`}>
                            <g transform={`rotate(${spearRot})`}>
                                <g transform={`translate(${-spearW / 2},${vl}) rotate(-90)`}>
                                    <image href="/ttp-arrow-bright.webp" x={0} y={0} width={vl} height={spearW} preserveAspectRatio="none" />
                                </g>
                            </g>
                        </g>
                    ) : (
                        <g>
                            <line x1={Op.x} y1={Op.y} x2={T.x} y2={T.y} stroke={c.arrow} strokeWidth={4} strokeLinecap="round" />
                            <polygon points={`${f(Op.x)},${f(Op.y)} ${f(Op.x + ux * 16 + nx * 6)},${f(Op.y + uy * 16 + ny * 6)} ${f(Op.x + ux * 16 - nx * 6)},${f(Op.y + uy * 16 - ny * 6)}`} fill={c.arrow} />
                            {[0, 10, 20].map((d) => (
                                <path key={d} d={`M${f(T.x - ux * d)},${f(T.y - uy * d)} l${f(nx * 8 - ux * 6)},${f(ny * 8 - uy * 6)} M${f(T.x - ux * d)},${f(T.y - uy * d)} l${f(-nx * 8 - ux * 6)},${f(-ny * 8 - uy * 6)}`} stroke={c.arrow} strokeWidth={3} strokeLinecap="round" fill="none" />
                            ))}
                        </g>
                    )}
                    <line x1={T.x} y1={T.y} x2={H.x} y2={H.y} stroke={c.perp} strokeOpacity={0.78} strokeWidth={3} strokeLinecap="round" strokeDasharray="6 6" />
                    <path d={rightAngle} fill="none" stroke={c.perp} strokeOpacity={0.78} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx={H.x} cy={H.y} r={6} fill={c.oFill} />
                    <text x={H.x + 18} y={H.y + 4} fontSize={14} fontWeight={800} fill={c.perp}>H</text>
                </>
            )}
            <circle cx={Op.x} cy={Op.y} r={6} fill={c.oFill} stroke={oStrokeColor} strokeWidth={c.oStroke === 'none' ? 0 : 2.4} />
            {labels && (
                <>
                    <g transform={`translate(${f(bL.x + bu.x * bLen * 0.88 - bu.y * 19)},${f(bL.y + bu.y * bLen * 0.88 + bu.x * 19)}) rotate(${f(bAng)})`}>
                        <rect x={-30} y={-10} width={60} height={20} rx={3} fill={c.line} />
                        <text x={0} y={4.5} textAnchor="middle" fontSize={12.5} fontWeight={800} fill={INK}>прямая</text>
                    </g>
                    <text x={Op.x - 20} y={Op.y + 19} fontSize={14} fontWeight={800} fill={c.perp}>O</text>
                    {full && (
                        <>
                            <g transform={gm}>
                                <text x={0} y={2.6} textAnchor="middle" fontSize={12} fontWeight={800} fill={WHITE}>проекция</text>
                            </g>
                            <g transform={`translate(${f(H.x + 20)},${f(T.y + (H.y - T.y) * 0.5)}) rotate(-90)`}>
                                <rect x={-54} y={-10} width={108} height={20} rx={3} fill={c.perp} fillOpacity={0.78} />
                                <text x={0} y={4.5} textAnchor="middle" fontSize={12.5} fontWeight={800} fill={INK}>перпендикуляр</text>
                            </g>
                        </>
                    )}
                </>
            )}
        </svg>
    )
}

export default function Page() {
    const [c, setC] = useState<Cfg>(DEFAULT)
    const [full, setFull] = useState(true)
    const [labels, setLabels] = useState(true)
    const [preset, setPreset] = useState(0)
    const planeMark = blend(c.planeFill, c.planeOp)
    const set = <K extends keyof Cfg>(k: K, v: Cfg[K]) => { setC((p) => ({ ...p, [k]: v })); setPreset(-1) }
    return (
        <div className="min-h-screen bg-[#161F23] px-4 py-5 text-[#F2F7FB]">
            <div className="mx-auto flex max-w-[560px] flex-col gap-4">
                <h1 className="text-xl font-extrabold">Цвета чертежа ТТП</h1>

                <div className="flex flex-wrap gap-2">
                    {PRESETS.map((p, i) => (
                        <button
                            key={p.name} type="button" title={p.hint}
                            onClick={() => { setC(p.cfg); setPreset(i) }}
                            className="rounded-xl border-2 border-b-4 px-3 py-2 text-sm font-bold active:border-b-2"
                            style={{ background: preset === i ? '#3A454E' : '#202B30', borderColor: preset === i ? '#F2F7FB' : '#2E383E' }}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>

                <div className="sticky top-0 z-10 -mx-4 bg-[#161F23] px-4 pb-2 pt-1">
                    <div className="rounded-2xl border-2 border-[#2E383E] p-3">
                        <div className="mb-2 text-center text-base">
                            Это <Mark color={planeMark} dark>плоскость</Mark>
                            
                        </div>
                        <Preview c={c} full={full} labels={labels} />
                        <div className="mt-2 flex justify-center gap-2 text-sm">
                            <button type="button" onClick={() => setFull(false)} className="rounded-lg px-3 py-1 font-bold" style={{ background: !full ? '#3A454E' : '#202B30' }}>Начало: плоскость и линия</button>
                            <button type="button" onClick={() => setLabels(!labels)} className="rounded-lg px-3 py-1 font-bold" style={{ background: labels ? '#3A454E' : '#202B30' }}>Подписи: {labels ? 'есть' : 'нет'}</button>
                            <button type="button" onClick={() => setFull(true)} className="rounded-lg px-3 py-1 font-bold" style={{ background: full ? '#3A454E' : '#202B30' }}>Со стрелой и тенью</button>
                        </div>
                    </div>
                </div>
                <Row title="Плоскость: заливка">
                    <Swatches value={c.planeFill} onChange={(v) => set('planeFill', v)} />
                    <Slider label="Прозрачность" value={c.planeOp} min={0} max={0.5} step={0.01} onChange={(v) => set('planeOp', v)} />
                </Row>
                <Row title="Плоскость: граница">
                    <Swatches value={c.planeStroke} onChange={(v) => set('planeStroke', v)} />
                    <Slider label="Яркость" value={c.strokeOp} min={0} max={1} step={0.05} onChange={(v) => set('strokeOp', v)} />
                    <Slider label="Толщина" value={c.strokeW} min={0} max={5} step={0.5} onChange={(v) => set('strokeW', v)} />
                </Row>
                <Row title="Линия b">
                    <Swatches value={c.line} onChange={(v) => set('line', v)} />
                </Row>
                <Row title="Стрела">
                    <div className="flex gap-2">
                        {(['image', 'color'] as ArrowKind[]).map((k) => (
                            <button key={k} type="button" onClick={() => set('arrowKind', k)} className="rounded-lg px-3 py-1.5 text-sm font-bold" style={{ background: c.arrowKind === k ? '#3A454E' : '#161F23', border: '2px solid #2E383E' }}>
                                {k === 'image' ? 'Картинка (деревянная)' : 'Однотонная'}
                            </button>
                        ))}
                    </div>
                    {c.arrowKind === 'color' && <Swatches value={c.arrow} onChange={(v) => set('arrow', v)} />}
                </Row>
                <Row title="Тень стрелы (проекция)">
                    <Swatches value={c.shadow} onChange={(v) => set('shadow', v)} />
                </Row>
                <Row title="Точки O и H: заливка и обводка">
                    <Swatches value={c.oFill} onChange={(v) => set('oFill', v)} />
                    <div className="flex flex-wrap gap-2">
                        {([['line', 'Обводка цвета линии b'], ['dark', 'Тёмная'], ['white', 'Белая'], ['none', 'Без обводки']] as [OStroke, string][]).map(([k, t]) => (
                            <button key={k} type="button" onClick={() => set('oStroke', k)} className="rounded-lg px-3 py-1.5 text-sm font-bold" style={{ background: c.oStroke === k ? '#3A454E' : '#161F23', border: '2px solid #2E383E' }}>{t}</button>
                        ))}
                    </div>
                </Row>
                <Row title="Перпендикуляр">
                    <Swatches value={c.perp} onChange={(v) => set('perp', v)} />
                </Row>

                <pre className="overflow-x-auto rounded-xl bg-[#202B30] p-3 text-xs text-[#9FB0B8]">{JSON.stringify(c, null, 1)}</pre>
            </div>
        </div>
    )
}
