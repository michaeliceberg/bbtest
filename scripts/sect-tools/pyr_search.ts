// Подбор точек для урока «Пирамиды»: решаем правилами 1 и 3 (как ученик) и проверяем читаемость на экране.
// npx tsx scripts/sect-tools/pyr_search.ts
import { TRI, QUAD, type Solid, type V3, proj, sub, dist3, same, chordIn, meet, inSolid, planesOf, expectedOf, onEdge } from '../../lib/pyramidSection'

type Seg = { a: V3; b: V3; face: string }
const viewScale = (s: Solid, vs: V3[]) => {
    const ps = [...Object.values(s.V), ...vs].map(proj)
    const base = Object.values(s.V).map(proj)
    const w0 = Math.max(...base.map((p) => p.x)) - Math.min(...base.map((p) => p.x)) + 52
    const h0 = Math.max(...base.map((p) => p.y)) - Math.min(...base.map((p) => p.y)) + 52
    const w = Math.max(...ps.map((p) => p.x)) - Math.min(...ps.map((p) => p.x)) + 52
    const h = Math.max(...ps.map((p) => p.y)) - Math.min(...ps.map((p) => p.y)) + 52
    return Math.min(w0 / w, h0 / h)
}
export const solve = (s: Solid, start: V3[]) => {
    const exp = expectedOf(s, start)
    let pts: V3[] = [...start]
    const segs: Seg[] = []
    let r3 = 0
    const log: string[] = []
    const addPt = (v: V3) => { if (!pts.some((p) => same(p, v))) pts.push(v) }
    for (let guard = 0; guard < 20; guard++) {
        if (exp.faces.every((f) => segs.some((x) => x.face === f))) return { ok: true, r3, log, pts, segs, exp }
        let did = false
        for (let i = 0; i < pts.length && !did; i++) for (let j = i + 1; j < pts.length && !did; j++) {
            const common = planesOf(s, pts[i]).filter((f) => planesOf(s, pts[j]).includes(f) && !segs.some((x) => x.face === f))
            for (const f of common) {
                const ch = chordIn(s, f, pts[i], sub(pts[j], pts[i]))
                if (!ch) continue
                segs.push({ a: ch[0], b: ch[1], face: f }); addPt(ch[0]); addPt(ch[1]); log.push(`1:${f}`); did = true; break
            }
        }
        if (did) continue
        // правило 3: ближайшая к пирамиде новая точка
        let best: { X: V3; d: number; desc: string } | null = null
        for (const sg of segs) {
            const f = s.faces.find((x) => x.id === sg.face)!
            for (let k = 0; k < f.v.length; k++) {
                const a = f.v[k], b = f.v[(k + 1) % f.v.length]
                const X = meet(sg.a, sub(sg.b, sg.a), s.V[a], sub(s.V[b], s.V[a]))
                if (!X || inSolid(s, X) || pts.some((p) => same(p, X))) continue
                if (viewScale(s, [...pts, X]) < 0.6) continue
                // самая «читаемая» X: дальше всего (на экране) от вершин, но в пределах рамки
                const d = Math.min(...Object.values(s.V).map((v) => Math.hypot(proj(v).x - proj(X).x, proj(v).y - proj(X).y)))
                if (!best || d > best.d) best = { X, d, desc: `3:${sg.face}x${a}${b}` }
            }
        }
        if (!best) return { ok: false, r3, log, pts, segs, exp }
        addPt(best.X); r3++; log.push(best.desc)
    }
    return { ok: false, r3, log, pts, segs, exp }
}
const segDist = (p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) => {
    const dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L))
    return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy)
}
export const issues = (s: Solid, verts: V3[], extra: V3[] = []) => {
    const out: string[] = []
    const all = [...verts, ...extra]
    const P2 = all.map(proj)
    for (let i = 0; i < P2.length; i++) for (let j = i + 1; j < P2.length; j++) if (Math.hypot(P2[i].x - P2[j].x, P2[i].y - P2[j].y) < 32) out.push('points close')
    for (let i = 0; i < all.length; i++) {
        if (i >= verts.length) { for (const v of Object.values(s.V)) if (Math.hypot(P2[i].x - proj(v).x, P2[i].y - proj(v).y) < 30) out.push('X near vertex'); continue }
        for (const v of Object.values(s.V)) if (Math.hypot(P2[i].x - proj(v).x, P2[i].y - proj(v).y) < 24) out.push('near vertex')
        for (const [a, b] of s.edges) {
            const onIt = Math.abs(dist3(s.V[a], all[i]) + dist3(all[i], s.V[b]) - dist3(s.V[a], s.V[b])) < 1e-6
            if (onIt) continue
            if (segDist(P2[i], proj(s.V[a]), proj(s.V[b])) < 16) out.push(`near edge ${a}${b}`)
        }
    }
    return out
}
if (process.argv[1]?.endsWith("pyr_search.ts")) {
    const report = (name: string, s: Solid, start: V3[]) => {
        const r = solve(s, start)
        console.log(name, r.ok, 'r3=', r.r3, r.log.join(' '), 'verts', r.exp.verts.length, issues(s, r.exp.verts, r.pts.filter((p) => !inSolid(s, p))))
    }
    // пример из разбора: K на SA, L на SB, M на BC
    report('demo', TRI, [onEdge(TRI, 'S', 'A', 0.45), onEdge(TRI, 'S', 'B', 0.65), onEdge(TRI, 'B', 'C', 0.5)])
    // поиск
    const ts = [0.3, 0.4, 0.5, 0.6, 0.7]
    for (const [name, s] of [['TRI', TRI], ['QUAD', QUAD]] as const) {
        const found: Record<string, string[]> = {}
        for (let i = 0; i < s.edges.length; i++) for (let j = i + 1; j < s.edges.length; j++) for (let k = j + 1; k < s.edges.length; k++)
            for (const a of ts) for (const b of ts) for (const c of ts) {
                const E = [s.edges[i], s.edges[j], s.edges[k]]
                const start = [onEdge(s, E[0][0], E[0][1], a), onEdge(s, E[1][0], E[1][1], b), onEdge(s, E[2][0], E[2][1], c)]
                const r = solve(s, start)
                if (!r.ok) continue
                const out = r.pts.filter((p) => !inSolid(s, p))
                if (issues(s, r.exp.verts, out).length) continue
                const key = `r3=${r.r3} n=${r.exp.verts.length}`
                ;(found[key] ??= []).push(`${E.map((e) => e.join('')).join(',')} t=${a},${b},${c} | ${r.log.join(' ')}`)
            }
        for (const [k, v] of Object.entries(found)) console.log(name, k, v.length, '\n  ' + v.filter((_, i) => i % Math.ceil(v.length / 6) === 0).slice(0, 6).join('\n  '))
    }
}
