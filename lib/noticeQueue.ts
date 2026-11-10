// lib/noticeQueue.ts — очередь «всплывашек» (тосты, ачивки, реплики Га-Га): показываем строго по одной,
// чтобы они не налезали друг на друга. Каждая задача сама говорит, когда закончила (done); страховка — maxMs.
type Job = { run: (done: () => void) => void; maxMs: number }

const GAP_MS = 450
const jobs: Job[] = []
let busy = false

const pump = () => {
    if (busy) return
    const job = jobs.shift()
    if (!job) return
    busy = true
    let finished = false
    let guard: ReturnType<typeof setTimeout>
    const done = () => {
        if (finished) return
        finished = true
        clearTimeout(guard)
        setTimeout(() => { busy = false; pump() }, GAP_MS)
    }
    guard = setTimeout(done, job.maxMs)
    try { job.run(done) } catch { done() }
}

export const enqueueNotice = (run: (done: () => void) => void, maxMs: number) => {
    if (typeof window === 'undefined') return
    jobs.push({ run, maxMs })
    pump()
}
