'use client'

// components/hangar-fan.tsx
//
// Потолочный вентилятор в ангаре. Моторчик не крутится.
// Лопасти нарисованы строго снизу (вид в плане) и наклонены в перспективу CSS-ом (rotateX < 0 — ближний к нам
// край лопастей выше, дальний ниже: вентилятор над головой, смотрим на него снизу), внутри наклона
// крутятся вокруг центра. Вращение «lo-fi»: покадрово (steps), медленно и спокойно. 4 одинаковые лопасти —
// цикл 90°, поэтому повтор бесшовный. Сломанный — без лопасти, другая погнута, висит и чуть покачивается.
// Всё на transform — видеокарта крутит без нагрузки. Координаты — в пикселях картинки ангара 1024×1024.

const pct = (v: number) => `${(v / 1024) * 100}%`

// Вентилятор не должен тянуть внимание: всё в тон тёмного сине-серого потолка, тонкие длинные лопасти,
// маленький моторчик. Рисуется кодом (SVG), чтобы цвет точно совпадал с потолком.
// Где висит: ось над круглым окном, top — верх штанги (у потолочной балки).
export const FAN = { x: 512, top: 58, motorW: 34, motorH: 46, bladesD: 580, tilt: -70 }

const EDGE = '#22202D' // контур чуть темнее потолка
const BODY = '#3A3E50' // основной цвет — как потолок, чуть светлее
const BODY_DARK = '#30333F'
const BODY_LIGHT = '#4A4E61' // еле заметный блик

function Blade({ angle, length = 490, bent = false }: { angle: number; length?: number; bent?: boolean }) {
    // длинная лопасть: узкий корень, заметно шире к концу, скруглённый край
    const L = length
    const tip = 500 - L
    const r = 10 // полуширина у корня
    const w = 30 // полуширина у конца
    return (
        <g transform={`rotate(${angle} 500 500)`}>
            <path d={`M ${500 - r} ${500 - 36} L ${500 - r - 3} ${500 - 100} C ${500 - w + 4} ${tip + 150} ${500 - w} ${tip + 50} ${500 - w + 6} ${tip + 16}
                      C ${500 - 14} ${tip - 4} ${500 + 14} ${tip - 4} ${500 + w - 6} ${tip + 16}
                      C ${500 + w} ${tip + 50} ${500 + w - 4} ${tip + 150} ${500 + r + 3} ${500 - 100} L ${500 + r} ${500 - 36} Z`}
                fill={bent ? BODY_DARK : BODY} stroke={EDGE} strokeWidth={5} strokeLinejoin="round" />
            <path d={`M ${500 - r - 4} ${500 - 120} C ${500 - w + 8} ${tip + 150} ${500 - w + 6} ${tip + 60} ${500 - w + 12} ${tip + 24}`} fill="none" stroke={BODY_LIGHT} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
        </g>
    )
}

function Blades({ broken }: { broken: boolean }) {
    return (
        <svg viewBox="0 0 1000 1000" className="h-full w-full" aria-hidden>
            {broken ? (
                <>
                    <Blade angle={0} />
                    <Blade angle={90} length={310} bent />
                    <Blade angle={270} />
                    {/* обломок на месте третьей лопасти */}
                    <path d="M 494 540 L 493 600 L 500 614 L 507 598 L 506 540 Z" fill={BODY_DARK} stroke={EDGE} strokeWidth={5} strokeLinejoin="round" />
                    {/* паутина между лопастями */}
                    <g stroke="#8A8D9C" strokeWidth={2} fill="none" opacity={0.35}>
                        <path d="M 500 330 Q 600 380 670 500" />
                        <path d="M 500 400 Q 560 440 600 500" />
                        <path d="M 500 330 L 590 430 L 670 500" />
                    </g>
                </>
            ) : (
                [0, 90, 180, 270].map((a) => <Blade key={a} angle={a} />)
            )}
            <circle cx={500} cy={500} r={30} fill={BODY_DARK} stroke={EDGE} strokeWidth={5} />
            <circle cx={500} cy={500} r={10} fill={EDGE} />
        </svg>
    )
}

function Motor() {
    // штанга + корпус моторчика, тот же тон
    return (
        <svg viewBox="0 0 34 46" className="h-full w-full overflow-visible" aria-hidden>
            <rect x={14.5} y={0} width={5} height={24} rx={1.5} fill={BODY_DARK} stroke={EDGE} strokeWidth={1.5} />
            <path d="M 4 26 Q 17 20 30 26 L 28 38 Q 17 44 6 38 Z" fill={BODY} stroke={EDGE} strokeWidth={1.8} strokeLinejoin="round" />
            <path d="M 8 28 Q 12 26 15 26" fill="none" stroke={BODY_LIGHT} strokeWidth={1.5} strokeLinecap="round" />
        </svg>
    )
}

export type FanMode = 'lofi' | 'smooth'

/**
 * fps — кадров в секунду для lo-fi (0.5 = кадр раз в 2 секунды), period — секунд на четверть оборота.
 * В lo-fi за период получается fps·period кадров — сделаем шаг кадра заметным, но спокойным.
 */
export function HangarFan({ broken = false, mode = 'lofi', fps = 2, period = 6 }: { broken?: boolean; mode?: FanMode; fps?: number; period?: number }) {
    const hubY = FAN.top + FAN.motorH * 0.86
    const D = FAN.bladesD
    const frames = Math.max(2, Math.round(fps * period))
    const spin = broken ? undefined : `hangar-fan-spin ${period}s ${mode === 'lofi' ? `steps(${frames}, end)` : 'linear'} infinite`
    return (
        <div className="pointer-events-none absolute inset-0" style={{ animation: broken ? 'hangar-fan-sway 7s ease-in-out infinite' : undefined, transformOrigin: `${pct(FAN.x)} ${pct(FAN.top)}` }}>
            <style>{`
                @keyframes hangar-fan-spin { from { transform: rotate(0deg) } to { transform: rotate(90deg) } }
                @keyframes hangar-fan-sway { 0%,100% { transform: rotate(-1.2deg) } 50% { transform: rotate(1.2deg) } }
                @media (prefers-reduced-motion: reduce) { .hangar-fan-rot { animation: none !important } }
            `}</style>
            <div className="absolute" style={{ left: pct(FAN.x - FAN.motorW / 2), top: pct(FAN.top), width: pct(FAN.motorW), height: pct(FAN.motorH), zIndex: 1 }}>
                <Motor />
            </div>
            {/* плоскость лопастей: квадрат D×D с центром у крышки моторчика, наклонён в перспективу */}
            <div className="absolute" style={{ left: pct(FAN.x - D / 2), top: pct(hubY - D / 2), width: pct(D), height: pct(D), perspective: '170cqw', perspectiveOrigin: '50% 50%' }}>
                <div className="h-full w-full" style={{ transform: `rotateX(${FAN.tilt}deg)` }}>
                    <div className="hangar-fan-rot h-full w-full" style={{ animation: spin, transform: broken ? 'rotate(18deg)' : undefined }}>
                        <Blades broken={broken} />
                    </div>
                </div>
            </div>
        </div>
    )
}
