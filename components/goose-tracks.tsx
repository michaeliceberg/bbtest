// components/goose-tracks.tsx — тропинка на карте тренажёра из следов гуся (персонаж приложения — гусь «Га-Га»).
// След — вектор (своя форма по эталону пользователя), цвет задаётся снаружи. Следы идут вдоль кривой
// кубического Безье парами «левая–правая лапа», носком по ходу движения, с небольшим разбросом
// угла и шага, иногда гусь «петляет» (заметный поворот следа).

// Носок вверх (−y), центр в (0,0): три пальца веером, перепонка между ними вогнута к пятке, пятка внизу.
export const GOOSE_FOOT_PATH = 'M0 10 C-2.4 10 -3.4 7 -4.4 4 L-11.4 -5.4 Q-11.8 -7.6 -9.8 -7.6 Q-5.8 -4.2 -2.2 -9.4 L-1 -12 Q0 -13.6 1 -12 L2.2 -9.4 Q5.8 -4.2 9.8 -7.6 Q11.8 -7.6 11.4 -5.4 L4.4 4 C3.4 7 2.4 10 0 10 Z'

type P = { x: number; y: number }

const mulberry = (seed: number) => () => {
    seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const bez = (a: P, c1: P, c2: P, b: P, t: number): P => {
    const u = 1 - t
    return {
        x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
        y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
    }
}

// Следы вдоль одного отрезка тропинки. skip — сколько отступить от кнопок урока на концах.
export const GooseTracks = ({ a, c1, c2, b, seed, color, opacity = 1, step = 20, size = 0.85, skip = 26 }: {
    a: P; c1: P; c2: P; b: P; seed: number; color: string; opacity?: number; step?: number; size?: number; skip?: number
}) => {
    const rnd = mulberry(seed)
    // точки кривой с длиной дуги
    const N = 80
    const pts: (P & { s: number })[] = []
    let s = 0
    let prev = a
    for (let i = 0; i <= N; i++) {
        const p = bez(a, c1, c2, b, i / N)
        s += Math.hypot(p.x - prev.x, p.y - prev.y)
        pts.push({ ...p, s })
        prev = p
    }
    const total = s
    const at = (d: number) => {
        let k = pts.findIndex((p) => p.s >= d)
        if (k <= 0) k = 1
        const p0 = pts[k - 1], p1 = pts[k]
        const f = p1.s === p0.s ? 0 : (d - p0.s) / (p1.s - p0.s)
        return { x: p0.x + (p1.x - p0.x) * f, y: p0.y + (p1.y - p0.y) * f, dx: p1.x - p0.x, dy: p1.y - p0.y }
    }
    const feet: { x: number; y: number; rot: number }[] = []
    let side = rnd() < 0.5 ? 1 : -1
    for (let d = skip; d < total - skip; d += step * (0.85 + rnd() * 0.3)) {
        const p = at(d)
        const len = Math.hypot(p.dx, p.dy) || 1
        const nx = -p.dy / len, ny = p.dx / len // перпендикуляр
        const off = side * (6.5 + rnd() * 1.5)
        const loop = rnd() < 0.08 ? (rnd() < 0.5 ? -1 : 1) * (28 + rnd() * 18) : 0 // гусь петляет
        const ang = (Math.atan2(p.dy, p.dx) * 180) / Math.PI + 90 + side * 10 + (rnd() - 0.5) * 22 + loop
        feet.push({ x: p.x + nx * off, y: p.y + ny * off, rot: ang })
        side = -side
    }
    return (
        <g style={{ opacity }}>
            {feet.map((f, i) => (
                <path key={i} d={GOOSE_FOOT_PATH} fill={color} transform={`translate(${f.x.toFixed(1)} ${f.y.toFixed(1)}) rotate(${f.rot.toFixed(1)}) scale(${size})`} />
            ))}
        </g>
    )
}
