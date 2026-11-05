'use client'

// components/hangar-life.tsx
//
// «Жизнь» в ангаре (components/hangar-scene.tsx), чтобы картинка не была статичной:
// • HangarSky — в круглом окне за ракетой: плывут облака, пролетают птицы и кукурузник с транспарантом
//   (лозунги Команданте, меняются на каждом пролёте; летит то вправо, то влево). Слой обрезан по кругу окна и лежит под предметами.
// • HangarSpider — паучок бегает по деревянной балке под потолком; HangarBug — жучок перебегает пол;
//   HangarPaper — два листка из хлама (большой у кучи и поменьше у компьютера) кружат на сквозняке своими ритмами. Пока в ангаре бардак.
// • ComputerFlicker — сломанный компьютер (№7) иногда мигает экраном и гаснет.
// Координаты — в пикселях картинки 1024×1024; размеры в cqw (контейнер сцены — containerType: inline-size).
// Всё на transform/opacity (CSS), при «уменьшить движение» стоит (globals.css).

import { useState } from 'react'

const cq = (v: number) => `${v / 10.24}cqw`
const pct = (v: number) => `${(v / 1024) * 100}%`

// Окно: круг с центром (515, 458) и радиусом 238. Настоящий горизонт (горы, домики) — y ≈ 490–520, поэтому слой неба
// доходит до 530, а облака, звёзды и ночное свечение к низу плавно растворяются (HORIZON_FADE) — без ровной полосы.
const WIN = { cx: 515, cy: 458, r: 238, top: 220, bottom: 530 }
const HORIZON_FADE = (() => {
    const h = WIN.bottom - WIN.top
    const a = ((440 - WIN.top) / h) * 100
    const b = ((505 - WIN.top) / h) * 100
    const m = `linear-gradient(180deg, #000 ${a}%, transparent ${b}%)`
    return { WebkitMaskImage: m, maskImage: m } as React.CSSProperties
})()

/**
 * Силуэт главного здания МГУ далеко на горизонте, справа от ракеты — под облаками.
 * Днём — голубая дымка, ночью — тёмный силуэт с огоньками окон и звездой на шпиле.
 * viewBox 100×80, основание — низ рамки.
 */
const MGU = { x: 622, base: 512, w: 104 }
export function MguSilhouette({ night = false }: { night?: boolean }) {
    const fill = night ? '#1B2238' : '#5E8C93'
    const h = (MGU.w * 80) / 100
    return (
        <svg viewBox="0 0 100 80" className="absolute" aria-hidden
            style={{ left: cq(MGU.x - (WIN.cx - WIN.r) - MGU.w / 2), top: cq(MGU.base - WIN.top - h), width: cq(MGU.w), opacity: night ? 0.95 : 0.5,
                // низ уходит в дымку горизонта
                WebkitMaskImage: 'linear-gradient(180deg, #000 72%, transparent 100%)', maskImage: 'linear-gradient(180deg, #000 72%, transparent 100%)' }}>
            <g fill={fill}>
                {/* крылья со ступеньками и боковые башенки */}
                <rect x="4" y="66" width="92" height="14" />
                <rect x="10" y="58" width="22" height="22" /><rect x="68" y="58" width="22" height="22" />
                <rect x="17" y="50" width="8" height="10" /><rect x="75" y="50" width="8" height="10" />
                <path d="M19 50 L21 41 L23 50 Z" /><path d="M77 50 L79 41 L81 50 Z" />
                {/* центральный корпус — уступами вверх */}
                <rect x="32" y="44" width="36" height="36" />
                <rect x="36" y="33" width="28" height="13" />
                <rect x="40" y="24" width="20" height="11" />
                <rect x="43.5" y="17" width="13" height="9" />
                {/* шпиль */}
                <path d="M46.5 19 L50 4 L53.5 19 Z" />
                <rect x="49.4" y="1" width="1.2" height="4" />
            </g>
            {night && (
                <>
                    <path d="M50 -1.2 L50.8 0.9 L53 0.9 L51.2 2.1 L51.9 4.2 L50 2.9 L48.1 4.2 L48.8 2.1 L47 0.9 L49.2 0.9 Z" fill="#FF5A4E" className="hangar-mgu-star" />
                    <g fill="#FFD27A" opacity={0.85}>
                        {[[37, 52], [44, 56], [55, 50], [61, 60], [47, 40], [52, 31], [14, 62], [26, 70], [72, 64], [84, 70], [40, 70], [58, 72]].map(([x, y], i) => (
                            <rect key={i} x={x} y={y} width="1.6" height="1.6" className={i % 3 === 0 ? 'hangar-window-blink' : undefined} style={{ animationDelay: `${-i * 1.7}s` }} />
                        ))}
                    </g>
                </>
            )}
        </svg>
    )
}

/**
 * Слева от ракеты — лабораторный корпус МФТИ вдалеке: прямоугольный корпус с большой аркой (сквозь неё видно небо),
 * над ним крупные буквы «МФТИ» — читаются на фоне неба, но в той же дымке, что и МГУ. Ночью буквы тепло светятся.
 */
const MIPT = { x: 342, base: 512, w: 118 }
/** Ночью буквы «МФТИ» — неоновая вывеска: обычно бледные, раз в ~11 с по ним слева направо пробегает ток —
 *  буквы вспыхивают по очереди, мигают, держатся и гаснут. Свечение — та же буква толстой полупрозрачной обводкой
 *  (без SVG/CSS-фильтров: слой внутри приближаемой сцены ангара). */
const NEON_LETTERS: [string, number][] = [['М', 26.4], ['Ф', 43.1], ['Т', 57.8], ['И', 71.6]]
function MiptNeon() {
    return (
        <g fontFamily="var(--font-nunito), Arial, sans-serif" fontWeight={500} fontSize="16" textAnchor="middle">
            {NEON_LETTERS.map(([ch, x], i) => (
                <g key={ch} className="hangar-neon" style={{ animationDelay: `${i * 0.13}s` }}>
                    <text x={x} y={18} fill="none" stroke="#FF5FD2" strokeOpacity={0.35} strokeWidth={3.4} strokeLinejoin="round">{ch}</text>
                    <text x={x} y={18} fill="#FFD6F4" stroke="#FF5FD2" strokeWidth={0.7}>{ch}</text>
                </g>
            ))}
        </g>
    )
}

export function MiptSilhouette({ night = false }: { night?: boolean }) {
    const fill = night ? '#1B2238' : '#5E8C93'
    const h = (MIPT.w * 80) / 100
    return (
        <svg viewBox="0 0 100 80" className="absolute" aria-hidden
            style={{ left: cq(MIPT.x - (WIN.cx - WIN.r) - MIPT.w / 2), top: cq(MIPT.base - WIN.top - h), width: cq(MIPT.w), opacity: night ? 0.8 : 0.62,
                WebkitMaskImage: 'linear-gradient(180deg, #000 72%, transparent 100%)', maskImage: 'linear-gradient(180deg, #000 72%, transparent 100%)' }}>
            {/* корпус с аркой: арка вырезана (evenodd), сквозь неё небо */}
            <path fillRule="evenodd" fill={fill}
                d="M8 34 H92 V80 H8 Z M33 80 V54 A17 17 0 0 1 67 54 V80 Z" />
            {/* карниз и боковые пилоны */}
            <rect x="6" y="31" width="88" height="4" fill={fill} />
            <rect x="8" y="27" width="20" height="5" fill={fill} /><rect x="72" y="27" width="20" height="5" fill={fill} />
            {/* аттик над аркой, над ним крупные буквы на фоне неба */}
            <rect x="26" y="22" width="48" height="10" fill={fill} />
            <text x="50" y="18" textAnchor="middle" fontFamily="var(--font-nunito), Arial, sans-serif" fontWeight={500} fontSize="16" letterSpacing="3"
                fill={night ? '#323E62' : '#40686F'}>МФТИ</text>
            {night && <MiptNeon />}
            {night && (
                <g fill="#FFD27A" opacity={0.85}>
                    {[[14, 44], [22, 52], [78, 46], [86, 54], [16, 62], [82, 64]].map(([x, y], i) => (
                        <rect key={i} x={x} y={y} width="1.6" height="1.6" className={i % 2 === 0 ? 'hangar-window-blink' : undefined} style={{ animationDelay: `${-i * 2.1}s` }} />
                    ))}
                </g>
            )}
        </svg>
    )
}

export const BANNER_PHRASES = [
    '¡VAMOS, AMIGO!',
    'ЛОГАРИФМЫ — ИМБА',
    'ЕГЭ НА СОТКУ',
    'НЕ БОИМСЯ ЕГЭ',
    'В МГУ — VAMOS!',
    'ПАРАМЕТР? ИЗИ',
    'VIVA LA МАТЕША',
    'СТЕРЕОМЕТРИЯ? ИЗИ',
    'ФАРМИМ БАЛЛЫ',
    'МАНЬЯНА — ВРАГ',
]

// Ночью кукурузник желает спокойной ночи (≤17 знаков — иначе не читается на телефоне).
export const NIGHT_BANNER_PHRASES = [
    'ОТБОЙ, ГУСИКИ!',
    'СИНУС ТОЖЕ СПИТ',
    'МОЗГ НА ЗАРЯДКЕ',
    'СОН = +10 БАЛЛОВ',
    'ТЕЛЕФОН — СПАТЬ!',
    'СЛАДКИХ СНОВ!',
    'ИКСЫ УЖЕ СПЯТ',
    'ЕГЭ НЕ УБЕЖИТ',
    'ЗЗЗ… ДО ЗАВТРА',
    'BUENAS NOCHES!',
    'ДАЖЕ МИГЕЛЬ СПИТ',
    'ПОРА БАИНЬКИ',
]

function Cloud({ w, y, dur, delay, opacity, flip = false, src = 'cloud' }: { w: number; y: number; dur: number; delay: number; opacity: number; flip?: boolean; src?: string }) {
    return (
        <div className="hangar-cloud absolute left-0" style={{ top: cq(y), width: cq(w), opacity, animationDuration: `${dur}s`, animationDelay: `${delay}s` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/hangar/life/${src}.webp`} alt="" draggable={false} className="block w-full select-none" style={flip ? { transform: 'scaleX(-1)' } : undefined} />
        </div>
    )
}

function Birds() {
    // две ласточки (картинка Leonardo), «взмах» — лёгкое сплющивание по вертикали
    return (
        <div className="hangar-birds absolute left-0" style={{ top: cq(70), width: cq(70) }}>
            <span className="hangar-flap absolute left-0 top-0 block" style={{ width: cq(34) }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/hangar/life/swallow.webp" alt="" draggable={false} className="block w-full select-none" />
            </span>
            <span className="hangar-flap absolute block" style={{ left: cq(36), top: cq(26), width: cq(24), animationDelay: '-0.2s' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/hangar/life/swallow.webp" alt="" draggable={false} className="block w-full select-none" />
            </span>
        </div>
    )
}

// Кукурузник — картинка Leonardo (public/hangar/life/biplane.webp, 320×147, носом вправо, крюк с тросом слева).
const PLANE = { w: 76, h: 35, hookX: 0.025, hookY: 0.67 }

function SkyClouds() {
    return (
        <>
            <Cloud src="cloud-wisp" w={190} y={18} dur={140} delay={-30} opacity={0.75} />
            <Cloud src="cloud-puffy" w={120} y={40} dur={95} delay={-20} opacity={0.9} />
            <Cloud src="cloud-round" w={78} y={118} dur={70} delay={-55} opacity={0.85} flip />
            <Cloud src="cloud-puffy" w={140} y={165} dur={120} delay={-90} opacity={0.75} flip />
            <Cloud src="cloud-wisp" w={130} y={92} dur={105} delay={-75} opacity={0.6} flip />
        </>
    )
}

function PlaneWithBanner({ night = false }: { night?: boolean }) {
    const [i, setI] = useState(0)
    const PH = night ? NIGHT_BANNER_PHRASES : BANNER_PHRASES
    // Одна анимация на оба пролёта (64 с): первая половина — слева направо, вторая — справа налево.
    // Самолёт «туда» и «обратно» — две отдельные группы, их видимость переключает та же анимация по времени,
    // поэтому кукурузник всегда летит носом вперёд (раньше направление считалось по событиям и сбивалось).
    return (
        <div className="hangar-plane absolute left-0" style={{ top: cq(70), width: cq(414) }}
            onAnimationIteration={(e) => { if (e.animationName === 'hangar-plane-fly') setI((v) => v + 1) }}>
            <svg viewBox="0 0 290 48" className="block w-full overflow-visible">
                {night && (
                    <defs>
                        {/* ночью кукурузник приглушён, транспарант чуть светлее — его подсвечивает лампочка */}
                        <radialGradient id="hangar-lamp-glow"><stop offset="0" stopColor="#FFE38A" stopOpacity="0.75" /><stop offset="1" stopColor="#FFD060" stopOpacity="0" /></radialGradient>
                        <radialGradient id="hangar-beacon-glow"><stop offset="0" stopColor="#FF4A3A" stopOpacity="0.9" /><stop offset="1" stopColor="#FF2A1A" stopOpacity="0" /></radialGradient>
                    </defs>
                )}
                <g className="hangar-plane-fwd"><PlaneLeg toLeft={false} night={night} text={PH[(2 * i) % PH.length]} /></g>
                <g className="hangar-plane-back"><PlaneLeg toLeft night={night} text={PH[(2 * i + 1) % PH.length]} /></g>
            </svg>
        </div>
    )
}

// Один пролёт: справа налево кукурузник слева (отражён носом влево), транспарант тянется за ним справа;
// текст всегда читается. viewBox 290×48.
function PlaneLeg({ toLeft, text, night = false }: { toLeft: boolean; text: string; night?: boolean }) {
    const bx = toLeft ? 84 : 0 // начало транспаранта
    const px = toLeft ? 0 : 210 // левый край картинки самолёта
    const hook = { x: toLeft ? px + PLANE.w * (1 - PLANE.hookX) : px + PLANE.w * PLANE.hookX, y: -8 + PLANE.h * PLANE.hookY }
    const bannerEnd = toLeft ? bx : bx + 206
    return (
        <>
            <path d={`M${hook.x} ${hook.y} Q${(hook.x + bannerEnd) / 2} ${hook.y + 8} ${bannerEnd} 23`} fill="none" stroke="#5A4A33" strokeWidth={1.3} />
            {/* транспарант на тросе — колышется */}
            <g className="hangar-banner-wave" style={{ transformOrigin: `${bannerEnd}px 23px` }}>
                <g opacity={night ? 0.72 : 1}>
                <path d={`M${bx} 9 Q${bx + 52} 5 ${bx + 103} 9 T${bx + 206} 9 L${bx + 206} 37 Q${bx + 155} 41 ${bx + 103} 37 T${bx} 37 Z`} fill="#F4EEDC" stroke="#5A4A33" strokeWidth={1.6} />
                <path d={`M${bx + 3} 12 Q${bx + 52} 8 ${bx + 103} 12 T${bx + 203} 12`} fill="none" stroke="#C0392B" strokeWidth={1.2} opacity={0.6} />
                <text x={bx + 103} y="29" textAnchor="middle" fontSize="17" fontWeight={900} fill="#C0392B" style={{ fontFamily: 'var(--font-nunito), sans-serif' }}>{text}</text>
                </g>
                {night && (() => {
                    // жёлтая лампочка на дальнем от самолёта краю транспаранта — светит вдоль него
                    const lx = toLeft ? bx + 206 : bx
                    return (
                        <>
                            <ellipse cx={toLeft ? lx - 70 : lx + 70} cy={23} rx={95} ry={26} fill="url(#hangar-lamp-glow)" />
                            <rect x={lx - 1.5} y={4} width={3} height={6} rx={1} fill="#3A3226" />
                            <circle cx={lx} cy={11.5} r={3.2} fill="#FFE58A" />
                            <circle cx={lx} cy={11.5} r={9} fill="url(#hangar-lamp-glow)" />
                        </>
                    )
                })()}
            </g>
            <g transform={toLeft ? `translate(${px + PLANE.w} -8) scale(-1 1)` : `translate(${px} -8)`}>
                {/* пропеллер крутится: картинка без лопастей + лопасть, которая «переворачивается» (scaleY) и прозрачный диск */}
                <ellipse cx={PLANE.w * 0.955} cy={PLANE.h * 0.44} rx={1.7} ry={PLANE.h * 0.34} fill="rgba(235,238,242,0.32)" className="hangar-prop-disc" />
                <g className="hangar-prop">
                    <rect x={PLANE.w * 0.955 - 0.8} y={PLANE.h * 0.44 - PLANE.h * 0.33} width={1.6} height={PLANE.h * 0.66} rx={0.8} fill="#6B4A2E" />
                </g>
                <image href="/hangar/life/biplane-noprop.webp" width={PLANE.w} height={PLANE.h} opacity={night ? 0.6 : 1} />
                {night && (
                    // красный проблесковый огонь на хвосте — как у настоящих самолётов
                    <g className="hangar-beacon">
                        <circle cx={PLANE.w * 0.07} cy={PLANE.h * 0.16} r={9} fill="url(#hangar-beacon-glow)" />
                        <circle cx={PLANE.w * 0.07} cy={PLANE.h * 0.16} r={2.2} fill="#FF5A4A" />
                    </g>
                )}
            </g>
        </>
    )
}

/** Небо в круглом окне: облака, птицы, кукурузник с транспарантом. */
export function HangarSky({ time = 'day' }: { time?: 'day' | 'evening' | 'night' }) {
    const w = WIN.r * 2
    const h = WIN.bottom - WIN.top
    return (
        <div className="pointer-events-none absolute overflow-hidden" aria-hidden
            style={{ left: pct(WIN.cx - WIN.r), top: pct(WIN.top), width: pct(w), height: pct(h),
                clipPath: `ellipse(50% ${(WIN.r / h) * 100}% at 50% ${((WIN.cy - WIN.top) / h) * 100}%)` }}>
            {/* солнце: днём высоко слева, вечером низко у горизонта и краснее; ночью вместо него месяц (HangarMoon) */}
            {time !== 'night' && (
                <div className="absolute" style={{ left: cq(time === 'day' ? 80 : 110), top: cq(time === 'day' ? 30 : 150), width: cq(time === 'day' ? 78 : 88),
                    // вечером солнце просто приглушено (фильтр на вращающемся солнце пересчитывался каждый кадр — тяжело для iPhone)
                    opacity: time === 'evening' ? 0.85 : 1 }}>
                    <div className="hangar-sun">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/hangar/life/sun.webp" alt="" draggable={false} className="block w-full select-none" />
                    </div>
                </div>
            )}
            {/* облака Leonardo без обводки (cloud-puffy/round/wisp) вперемешку со старым cloud; разная скорость — разная «высота» */}
            {/* ночью облака и кукурузник рисуются в слое луны (HangarMoon) — поверх неё, луна дальше всех */}
            {time !== 'night' && <MguSilhouette />}
            {time !== 'night' && <MiptSilhouette />}
            {time !== 'night' && <div className="absolute inset-0" style={HORIZON_FADE}><SkyClouds /><Birds /></div>}
            {time !== 'night' && <PlaneWithBanner />}
        </div>
    )
}

/** Паучок бегает по потолку левее крепления вентилятора (крепление прибито к потолку — под ним не пройти):
 *  петляет, останавливается, разворачивается на месте. Картинка — вид снизу, головой вверх; повёрнута головой по ходу. */
export function HangarSpider() {
    return (
        <div className="hangar-spider pointer-events-none absolute" aria-hidden style={{ left: pct(230), top: pct(40), width: cq(52), zIndex: 850 }}>
            <div className="hangar-scuttle">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/hangar/life/spider.webp" alt="" draggable={false} className="block w-full select-none" style={{ transform: 'rotate(90deg)' }} />
            </div>
        </div>
    )
}

/**
 * Второй паучок висит на паутинке справа под балкой: спускается, пружинит на нити и подтягивается обратно.
 * Нить и паучок — одна и та же раскладка по времени: нить растёт вниз (scaleY от верха), паучок едет на её конец.
 * Тоже за вентилятором — нить проходит позади лопастей.
 */
// Сеть паучка под потолком: центр (откуда идёт нить) — в точке крепления нити, нити-спицы расходятся вверх к потолку
// и в стороны, между ними кольца. Координаты: центр сети = (0, 0), потолок — выше на ~22.
const WEB_SPOKES: [number, number][] = [[-44, -22], [-22, -26], [0, -26], [22, -26], [44, -22], [40, 2], [-40, 2], [24, 16], [-24, 16]]
function HangingWeb() {
    const ring = (f: number) => WEB_SPOKES.map(([x, y]) => `${(x * f).toFixed(1)},${(y * f).toFixed(1)}`)
    // кольцо — по спицам по кругу (порядок по углу), с лёгким провисом между спицами
    const order = [...WEB_SPOKES.keys()].sort((a, b) => Math.atan2(WEB_SPOKES[a][1], WEB_SPOKES[a][0]) - Math.atan2(WEB_SPOKES[b][1], WEB_SPOKES[b][0]))
    const ringPath = (f: number) => {
        const pts = order.map((i) => ring(f)[i].split(',').map(Number))
        return pts.map(([x, y], i) => {
            const [nx, ny] = pts[(i + 1) % pts.length]
            const mx = (x + nx) / 2 * 0.9, my = (y + ny) / 2 * 0.9 // провис к центру
            return `${i === 0 ? `M${x},${y}` : ''} Q${mx.toFixed(1)},${my.toFixed(1)} ${nx},${ny}`
        }).join(' ')
    }
    return (
        <svg className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[57.7%] overflow-visible" style={{ width: cq(110) }} viewBox="-50 -30 100 52" aria-hidden>
            <g fill="none" stroke="#D8D4C8" strokeOpacity={0.5} strokeWidth={0.7} strokeLinecap="round">
                {WEB_SPOKES.map(([x, y], i) => <line key={i} x1={0} y1={0} x2={x} y2={y} />)}
                {[0.3, 0.55, 0.8].map((f) => <path key={f} d={ringPath(f)} />)}
            </g>
        </svg>
    )
}

export function HangarHangingSpider() {
    const L = 230 // длина нити в пикселях картинки при полном спуске
    return (
        <div className="pointer-events-none absolute" aria-hidden style={{ left: pct(708), top: pct(70), width: cq(40), zIndex: 850 }}>
            {/* у потолка — маленькая сплетённая сеть, нить спускается из её центра */}
            <HangingWeb />
            <div className="hangar-thread absolute left-1/2 top-0 w-px -translate-x-1/2 bg-[#C9C6BC]/70" style={{ height: cq(L) }} />
            <div className="hangar-hang absolute left-0 top-0 w-full" style={{ ['--hang' as string]: cq(L) }}>
                <div className="hangar-hang-sway" style={{ transformOrigin: '50% 0%' }}>
                    {/* та же картинка паучка, головой вниз: брюшко к нити */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/hangar/life/spider.webp" alt="" draggable={false} className="block w-full select-none" style={{ transform: 'rotate(180deg)' }} />
                </div>
            </div>
        </div>
    )
}

/** Жучок перебегает пол слева. */
export function HangarBug() {
    return (
        <div className="hangar-bug pointer-events-none absolute" aria-hidden style={{ left: pct(60), top: pct(915), width: cq(44), zIndex: 200 }}>
            <svg viewBox="0 0 22 14" className="block w-full">
                <g stroke="#1C1712" strokeWidth={1.3} strokeLinecap="round" className="hangar-legs" style={{ transformOrigin: '11px 7px' }}>
                    <path d="M8 4 L5 1 M11 3 L11 0 M14 4 L17 1 M8 10 L5 13 M11 11 L11 14 M14 10 L17 13" />
                </g>
                <ellipse cx="11" cy="7" rx="6.5" ry="4.5" fill="#5B3A22" />
                <line x1="11" y1="2.6" x2="11" y2="11.4" stroke="#2B1A0E" strokeWidth={1} />
                <circle cx="18" cy="7" r="2.4" fill="#2B1A0E" />
            </svg>
        </div>
    )
}

/** Сломанный компьютер: экран иногда вспыхивает и гаснет. style — та же коробка, что у картинки предмета. */
export function ComputerFlicker({ style }: { style: React.CSSProperties }) {
    return (
        <div className="pointer-events-none absolute" aria-hidden style={{ ...style, zIndex: (Number(style.zIndex) || 0) + 1 }}>
            <div className="hangar-crt absolute rounded-[12%]"
                style={{ left: '31%', top: '5%', width: '44%', height: '38%', rotate: '-4deg',
                    background: 'radial-gradient(closest-side, rgba(140,255,200,0.85), rgba(70,220,160,0.45) 60%, rgba(40,180,130,0) 100%)' }} />
        </div>
    )
}

/** Листки бумаги из кучи хлама: ветер поднимает их, кружит по ангару и опускает.
 *  Первый — большой, у кучи в середине; второй — поменьше, у компьютера, со своей траекторией и ритмом. */
export function HangarPaper({ second = false }: { second?: boolean }) {
    return (
        <div className={`${second ? 'hangar-paper2' : 'hangar-paper'} pointer-events-none absolute`} aria-hidden
            style={second ? { left: pct(800), top: pct(800), width: cq(22), zIndex: 1050 } : { left: pct(640), top: pct(880), width: cq(34), zIndex: 1050 }}>
            <div className={second ? 'hangar-paper2-spin' : 'hangar-paper-spin'}>
                <svg viewBox="0 0 30 36" className="block w-full">
                    <path d="M3 2 L22 1 L28 8 L27 34 L4 35 Z" fill="#EFE7D2" stroke="#9C8E6E" strokeWidth={1.2} strokeLinejoin="round" />
                    <path d="M22 1 L22 8 L28 8" fill="#D9CFB4" stroke="#9C8E6E" strokeWidth={1} />
                    <g stroke="#A7B2C0" strokeWidth={1.2}><path d="M7 13 H23 M7 18 H24 M7 23 H20 M7 28 H22" /></g>
                    <text x="9" y="11" fontSize="6" fontWeight={900} fill="#C0392B">{second ? 'π' : '5!'}</text>
                </svg>
            </div>
        </div>
    )
}

/** Сломанный генератор: провода у гнёзд изредка искрят (вспышка и разлёт искорок). style — коробка картинки предмета. */
export function GeneratorSparks({ style }: { style: React.CSSProperties }) {
    // точки в % картинки 10-before (гнёзда спереди и штекеры сбоку), у каждой свой ритм — искрят вразнобой и редко
    const points = [
        { x: 57, y: 54, dur: 7.3, delay: 1.2 },
        { x: 68, y: 44, dur: 9.1, delay: 4.6 },
        { x: 33, y: 34, dur: 11.7, delay: 7.9 },
    ]
    return (
        <div className="pointer-events-none absolute" aria-hidden style={{ ...style, zIndex: (Number(style.zIndex) || 0) + 1 }}>
            {points.map((pt, k) => (
                <span key={k} className="absolute" style={{ left: `${pt.x}%`, top: `${pt.y}%`, width: '22%', translate: '-50% -50%' }}>
                    <span className="hangar-spark block" style={{ animationDuration: `${pt.dur}s`, animationDelay: `${pt.delay}s` }}>
                        <svg viewBox="0 0 40 40" className="block w-full overflow-visible">
                            <circle cx="20" cy="20" r="9" fill="rgba(255,236,150,0.55)" />
                            <path d="M20 6 L22.5 17.5 L34 20 L22.5 22.5 L20 34 L17.5 22.5 L6 20 L17.5 17.5 Z" fill="#FFF6C8" stroke="#FFC23D" strokeWidth={1.2} strokeLinejoin="round" />
                            <g stroke="#FFD45C" strokeWidth={1.8} strokeLinecap="round">
                                <path d="M27 11 L32 6 M12 28 L7 33 M29 27 L35 30 M11 12 L5 9" />
                            </g>
                        </svg>
                    </span>
                </span>
            ))}
        </div>
    )
}

// Звёзды ночного неба: детерминированный разброс (одинаково на сервере и в браузере — без ошибок гидрации).
// Координаты — внутри окна (ширина 476, высота 240, горизонт около 200), лишнее обрезает круг окна.
const STARS = (() => {
    let seed = 7
    const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
    const dots = Array.from({ length: 46 }, () => ({ x: 20 + rnd() * 436, y: 6 + rnd() * 190, r: 0.9 + rnd() * 1.8, d: rnd() * 5, t: 2.2 + rnd() * 3 }))
    const big = [{ x: 70, y: 70 }, { x: 150, y: 28 }, { x: 255, y: 92 }, { x: 395, y: 140 }, { x: 205, y: 165 }, { x: 108, y: 150 }, { x: 440, y: 60 }]
        .map((p, i) => ({ ...p, s: 7 + (i % 3) * 2.5, d: i * 0.9, t: 3 + (i % 4) * 0.7 }))
    return { dots, big }
})()

/** Ночью в окне — звёздное небо и светящийся месяц. Рисуется ПОВЕРХ ночного затемнения (z 1105), обрезано по окну. */
export function HangarMoon({ cutout }: { cutout?: { src: string; x: number; y: number; w: number; h: number } }) {
    const w = WIN.r * 2
    const h = WIN.bottom - WIN.top
    // Звёзды рисуются поверх ночного затемнения, поэтому силуэт ракеты из слоя вырезаем маской — иначе звёзды светят сквозь неё.
    const mask = cutout ? (() => {
        const l = ((cutout.x - cutout.w / 2 - (WIN.cx - WIN.r)) / w) * 100
        const t = ((cutout.y - cutout.h - WIN.top) / h) * 100
        const sw = (cutout.w / w) * 100
        const sh = (cutout.h / h) * 100
        // проценты mask-position считаются от (рамка − картинка), поэтому смещение переводим так
        const pos = (off: number, size: number) => (Math.abs(100 - size) < 0.01 ? 0 : (off / (100 - size)) * 100)
        // только отдельные свойства: сокращение mask сбрасывает mask-composite
        const img = `url(${cutout.src}), linear-gradient(#000 0 0)`
        const position = `${pos(l, sw)}% ${pos(t, sh)}%, 0 0`
        const size = `${sw}% ${sh}%, 100% 100%`
        return {
            WebkitMaskImage: img, maskImage: img, WebkitMaskPosition: position, maskPosition: position,
            WebkitMaskSize: size, maskSize: size, WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
            maskComposite: 'exclude',
        } as React.CSSProperties
    })() : undefined
    return (
        <div className="pointer-events-none absolute overflow-hidden" aria-hidden
            style={{ left: pct(WIN.cx - WIN.r), top: pct(WIN.top), width: pct(w), height: pct(h), zIndex: 1105,
                clipPath: `ellipse(50% ${(WIN.r / h) * 100}% at 50% ${((WIN.cy - WIN.top) / h) * 100}%)`, ...mask }}>
            {/* мягкое свечение ночного неба — чтобы не было мрачно: сверху синее, у горизонта тёплое */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(90,120,230,0.22), rgba(130,100,200,0.14) 55%, rgba(255,190,130,0.12) 72%, rgba(255,190,130,0) 92%)' }} />
            {/* полоса «млечного пути» */}
            <div className="absolute" style={{ left: cq(-40), top: cq(60), width: cq(560), height: cq(70), rotate: '-18deg',
                background: 'radial-gradient(closest-side, rgba(200,210,255,0.22), transparent)' }} />
            <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={HORIZON_FADE}>
                {STARS.dots.map((st, i) => (
                    <circle key={i} cx={st.x} cy={st.y} r={st.r} fill="#FFF6D8" className="hangar-twinkle"
                        style={{ animationDelay: `${-st.d}s`, animationDuration: `${st.t}s`, transformOrigin: `${st.x}px ${st.y}px` }} />
                ))}
                {STARS.big.map((st, i) => (
                    <g key={`b${i}`} transform={`translate(${st.x} ${st.y})`}>
                        <g className="hangar-sparkle" style={{ animationDelay: `${-st.d}s`, animationDuration: `${st.t}s` }}>
                            <circle r={st.s * 0.9} fill="rgba(255,230,160,0.25)" />
                            <path d={`M0 ${-st.s} Q${st.s * 0.18} ${-st.s * 0.18} ${st.s} 0 Q${st.s * 0.18} ${st.s * 0.18} 0 ${st.s} Q${-st.s * 0.18} ${st.s * 0.18} ${-st.s} 0 Q${-st.s * 0.18} ${-st.s * 0.18} 0 ${-st.s}Z`} fill="#FFF3C4" />
                        </g>
                    </g>
                ))}
                {/* падающая звезда — раз в 14 с */}
                <g className="hangar-shooting">
                    <line x1="0" y1="0" x2="-46" y2="-16" stroke="url(#hangar-shoot)" strokeWidth="2.4" strokeLinecap="round" />
                    <circle r="2.2" fill="#FFFFFF" />
                </g>
                <defs>
                    <linearGradient id="hangar-shoot" x1="0" y1="0" x2="-46" y2="-16" gradientUnits="userSpaceOnUse">
                        <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="hangar-moon absolute" style={{ left: cq(330), top: cq(36), width: cq(84) }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/hangar/life/moon.webp" alt="" draggable={false} className="block w-full select-none"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(255,236,170,0.9)) drop-shadow(0 0 16px rgba(255,220,140,0.6))' }} />
            </div>
            {/* облака и кукурузник — ближе луны; слой поверх ночного затемнения, поэтому приглушаем их сами */}
            <MguSilhouette night />
            <MiptSilhouette night />
            <div className="absolute inset-0" style={{ opacity: 0.45, ...HORIZON_FADE }}>
                <SkyClouds />
            </div>
            <PlaneWithBanner night />
        </div>
    )
}
