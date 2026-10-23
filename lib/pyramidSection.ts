// lib/pyramidSection.ts — геометрия сечений пирамид (урок «Пирамиды», SECTWALK, 2026-10-23).
// Чистые функции без React: их использует и урок (app/t-lesson/[t_lessonId]/type-sectwalk.tsx), и скрипт
// подбора точек (scripts/sect-tools/pyr_search.ts). Правила для пирамиды — только 1 (соединить) и 3 (продлить):
// параллельных граней у пирамиды нет, правило 2 не работает.
//
// Координаты: x вправо, y вглубь, z вверх; проекция та же, что у кубика (передняя плоскость без искажений,
// глубина уходит вправо-вверх под 45° с коэффициентом 0.5).

export type V3 = [number, number, number]
export type Solid = {
    V: Record<string, V3>
    faces: { id: string; v: string[] }[] // вершины грани по кругу
    edges: [string, string][]
}

export const S = 150, DEPTH = 0.5, OX = 62, OY = 252
export const proj = (v: V3) => ({ x: OX + S * v[0] + S * DEPTH * v[1] * Math.SQRT1_2, y: OY - S * v[2] - S * DEPTH * v[1] * Math.SQRT1_2 })

export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
export const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k]
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
export const dist3 = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
export const same = (a: V3, b: V3) => dist3(a, b) < 1e-4
export const lerp3 = (a: V3, b: V3, t: number): V3 => add(a, mul(sub(b, a), t))
const EPS = 1e-6

const pyramid = (base: Record<string, V3>, apex: V3): Solid => {
    const names = Object.keys(base)
    const V: Record<string, V3> = { ...base, S: apex }
    const faces = [
        { id: 'base', v: [...names] },
        ...names.map((n, i) => ({ id: `S${n}${names[(i + 1) % names.length]}`, v: ['S', n, names[(i + 1) % names.length]] })),
    ]
    const edges: [string, string][] = [
        ...names.map((n, i) => [n, names[(i + 1) % names.length]] as [string, string]),
        ...names.map((n) => ['S', n] as [string, string]),
    ]
    return { V, faces, edges }
}

// Треугольная пирамида SABC (C — сзади) и четырёхугольная SABCD (D — сзади слева, основание — не квадрат,
// чтобы противоположные рёбра основания не были параллельны и правило 3 работало с любым ребром).
export const TRI: Solid = pyramid({ A: [0, 0, 0], B: [1.3, 0, 0], C: [1.1, 1.4, 0] }, [0.4, 0.45, 1.3])
export const QUAD: Solid = pyramid({ A: [0, 0, 0], B: [1.1, 0, 0], C: [1.2, 1, 0], D: [0.25, 1.1, 0] }, [0.6, 0.45, 1.25])

const centroid = (s: Solid) => {
    const vs = Object.values(s.V)
    return mul(vs.reduce((a, b) => add(a, b), [0, 0, 0] as V3), 1 / vs.length)
}
// Внешняя нормаль грани
export const faceNormal = (s: Solid, fid: string): V3 => {
    const f = s.faces.find((x) => x.id === fid)!
    const [a, b, c] = f.v.map((k) => s.V[k])
    let n = cross(sub(b, a), sub(c, a))
    if (dot(n, sub(centroid(s), a)) > 0) n = mul(n, -1)
    return n
}
// Направление взгляда (в сторону «от зрителя»): вектор, который проекция переводит в ноль
export const VIEW_DIR: V3 = [-DEPTH * Math.SQRT1_2, 1, -DEPTH * Math.SQRT1_2]
export const faceVisible = (s: Solid, fid: string) => dot(faceNormal(s, fid), VIEW_DIR) < 0
export const facesOfEdge = (s: Solid, a: string, b: string) =>
    s.faces.filter((f) => f.v.includes(a) && f.v.includes(b)).map((f) => f.id)
// Ребро невидимо, если обе соседние грани смотрят от нас
export const edgeHidden = (s: Solid, a: string, b: string) => facesOfEdge(s, a, b).every((f) => !faceVisible(s, f))

// Плоскости граней, на которых лежит точка (без границ — как у кубика: X вне пирамиды тоже «лежит» на гранях)
export const planesOf = (s: Solid, p: V3): string[] =>
    s.faces.filter((f) => { const n = faceNormal(s, f.id); return Math.abs(dot(n, sub(p, s.V[f.v[0]]))) / Math.hypot(...n) < 1e-5 }).map((f) => f.id)

// Хорда грани: часть прямой p + t·d внутри многоугольника грани (Сайрус–Бек)
export const chordIn = (s: Solid, fid: string, p: V3, d: V3): [V3, V3] | null => {
    const f = s.faces.find((x) => x.id === fid)!
    const n = faceNormal(s, fid)
    const pts = f.v.map((k) => s.V[k])
    const c = mul(pts.reduce((a, b) => add(a, b), [0, 0, 0] as V3), 1 / pts.length)
    let t0 = -Infinity, t1 = Infinity
    for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length]
        let m = cross(n, sub(b, a))
        if (dot(m, sub(c, a)) < 0) m = mul(m, -1) // внутрь грани
        const den = dot(m, d), num = dot(m, sub(p, a))
        if (Math.abs(den) < 1e-12) { if (num < -EPS) return null; continue }
        const t = -num / den
        if (den > 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t)
    }
    if (t1 - t0 < 1e-6) return null
    return [add(p, mul(d, t0)), add(p, mul(d, t1))]
}
// Пересечение двух прямых одной плоскости; null — параллельны
export const meet = (p: V3, d: V3, q: V3, e: V3): V3 | null => {
    const de = cross(d, e), den = dot(de, de)
    if (den < 1e-12) return null
    const t = dot(cross(sub(q, p), e), de) / den
    return add(p, mul(d, t))
}
// Точка внутри или на поверхности пирамиды
export const inSolid = (s: Solid, p: V3) => s.faces.every((f) => dot(faceNormal(s, f.id), sub(p, s.V[f.v[0]])) <= 1e-6)

// Ожидаемое сечение: плоскость через 3 точки ∩ рёбра; грани, на которых есть хотя бы 2 вершины сечения
export const expectedOf = (s: Solid, start: V3[]) => {
    const [A, B, C] = start
    const n = cross(sub(B, A), sub(C, A))
    const verts: V3[] = []
    for (const [a, b] of s.edges) {
        const P0 = s.V[a], P1 = s.V[b]
        const f0 = dot(n, sub(P0, A)), f1 = dot(n, sub(P1, A))
        if (Math.abs(f0 - f1) < 1e-12) continue
        const t = f0 / (f0 - f1)
        if (t < -1e-6 || t > 1 + 1e-6) continue
        const X = lerp3(P0, P1, t)
        if (!verts.some((v) => same(v, X))) verts.push(X)
    }
    const faces = s.faces.map((f) => f.id).filter((fid) => verts.filter((v) => planesOf(s, v).includes(fid)).length >= 2)
    return { verts, faces }
}
// Точка на ребре a–b
export const onEdge = (s: Solid, a: string, b: string, t: number): V3 => lerp3(s.V[a], s.V[b], t)
// Точка внутри грани PQR: P·(1−u−w) + Q·u + R·w
export const onFace = (s: Solid, [p, q, r]: [string, string, string], u: number, w: number): V3 =>
    [0, 1, 2].map((k) => s.V[p][k] * (1 - u - w) + s.V[q][k] * u + s.V[r][k] * w) as V3
