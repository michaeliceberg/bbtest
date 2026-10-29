'use client'

// components/hangar-fan.tsx
//
// Потолочный вентилятор в ангаре. Моторчик — картинка (/hangar/fan-motor.webp), не крутится.
// Лопасти нарисованы строго снизу (вид в плане) и наклонены в перспективу CSS-ом (rotateX), внутри наклона
// крутятся вокруг центра. Вращение «lo-fi»: покадрово (steps), медленно и спокойно. 4 одинаковые лопасти —
// цикл 90°, поэтому повтор бесшовный. Сломанный — без лопасти, другая погнута, висит и чуть покачивается.
// Всё на transform — видеокарта крутит без нагрузки. Координаты — в пикселях картинки ангара 1024×1024.

const pct = (v: number) => `${(v / 1024) * 100}%`

// Лопасти — картинка /hangar/fan-blades.webp (вид строго снизу, втулка в центре квадрата); сломанные пока рисуются кодом.
// Где висит: ось над круглым окном, низ моторчика (место крепления лопастей).
export const FAN = { x: 512, top: 46, motorW: 104, bladesD: 720, tilt: 74 }
const MOTOR_RATIO = 360 / 276 // высота / ширина картинки моторчика
const HUB_AT = 0.9 // где по высоте моторчика центр нижней крышки (куда крепятся лопасти)

const EDGE = '#3A2A24'
const METAL = '#8E877C'
const METAL_DARK = '#6E675D'
const METAL_LIGHT = '#A9A194'

function Blade({ angle, length = 470, bent = false }: { angle: number; length?: number; bent?: boolean }) {
    // лопасть «вёслом»: узкий корень у втулки, широкий скруглённый конец
    const L = length
    return (
        <g transform={`rotate(${angle} 500 500)`}>
            <path d={`M 488 470 L 488 ${500 - 70} C 470 ${500 - 120} 448 ${500 - L + 60} 452 ${500 - L + 22}
                      C 456 ${500 - L - 4} 544 ${500 - L - 4} 548 ${500 - L + 22}
                      C 552 ${500 - L + 60} 530 ${500 - 120} 512 ${500 - 70} L 512 470 Z`}
                fill={bent ? METAL_DARK : METAL} stroke={EDGE} strokeWidth={9} strokeLinejoin="round" />
            {/* блик и тёмная кромка — спокойная «живописная» тень */}
            <path d={`M 470 ${500 - 150} C 462 ${500 - L + 80} 470 ${500 - L + 30} 486 ${500 - L + 22}`} fill="none" stroke={METAL_LIGHT} strokeWidth={10} strokeLinecap="round" opacity={0.7} />
            <path d={`M 532 ${500 - 140} C 540 ${500 - L + 80} 534 ${500 - L + 40} 526 ${500 - L + 24}`} fill="none" stroke={METAL_DARK} strokeWidth={9} strokeLinecap="round" opacity={0.8} />
            {/* заклёпки у корня */}
            <circle cx={494} cy={500 - 96} r={6} fill={EDGE} />
            <circle cx={506} cy={500 - 118} r={6} fill={EDGE} />
        </g>
    )
}

function Blades({ broken }: { broken: boolean }) {
    return (
        <svg viewBox="0 0 1000 1000" className="h-full w-full" aria-hidden>
            {broken ? (
                <>
                    <Blade angle={0} />
                    <Blade angle={90} length={330} bent />
                    <Blade angle={270} />
                    {/* обломок на месте третьей лопасти */}
                    <path d="M 488 530 L 486 590 L 500 610 L 514 588 L 512 530 Z" fill={METAL_DARK} stroke={EDGE} strokeWidth={9} strokeLinejoin="round" />
                    {/* паутина между лопастями */}
                    <g stroke="#E8E2D4" strokeWidth={3} fill="none" opacity={0.55}>
                        <path d="M 500 330 Q 600 380 670 500" />
                        <path d="M 500 380 Q 580 420 620 500" />
                        <path d="M 500 430 Q 545 460 565 500" />
                        <path d="M 500 330 L 590 430 L 670 500" />
                    </g>
                </>
            ) : (
                [0, 90, 180, 270].map((a) => <Blade key={a} angle={a} />)
            )}
            <circle cx={500} cy={500} r={58} fill={METAL_DARK} stroke={EDGE} strokeWidth={9} />
            <circle cx={500} cy={500} r={22} fill={EDGE} />
        </svg>
    )
}

export type FanMode = 'lofi' | 'smooth'

/**
 * fps — кадров в секунду для lo-fi (0.5 = кадр раз в 2 секунды), period — секунд на четверть оборота.
 * В lo-fi за период получается fps·period кадров — сделаем шаг кадра заметным, но спокойным.
 */
export function HangarFan({ broken = false, mode = 'lofi', fps = 2, period = 6 }: { broken?: boolean; mode?: FanMode; fps?: number; period?: number }) {
    const motorH = FAN.motorW * MOTOR_RATIO
    const hubY = FAN.top + motorH * HUB_AT
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hangar/fan-motor.webp" alt="" draggable={false} className="absolute select-none"
                style={{ left: pct(FAN.x - FAN.motorW / 2), top: pct(FAN.top), width: pct(FAN.motorW) }} />
            {/* плоскость лопастей: квадрат D×D с центром у крышки моторчика, наклонён в перспективу */}
            <div className="absolute" style={{ left: pct(FAN.x - D / 2), top: pct(hubY - D / 2), width: pct(D), height: pct(D), perspective: '170cqw', perspectiveOrigin: '50% 50%' }}>
                <div className="h-full w-full" style={{ transform: `rotateX(${FAN.tilt}deg)` }}>
                    <div className="hangar-fan-rot h-full w-full" style={{ animation: spin, transform: broken ? 'rotate(18deg)' : undefined }}>
                        {broken ? <Blades broken /> : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src="/hangar/fan-blades.webp" alt="" draggable={false} className="h-full w-full select-none" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
