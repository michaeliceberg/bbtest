'use server'

// «Непонятно» из пошагового разбора: ученик нажал кнопку на этапе, дописал (или нет) и отправил.
// Сообщение уходит админу в Telegram только по кнопке «Отправить» — случайное нажатие ничего не шлёт.
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import db from '@/db/drizzle'
import { lessons, t_lessons, userProgress } from '@/db/schema'
import { sendMessageToTelegram } from '@/utils/telegram'

export async function reportUnclear(input: { path: string; text: string }) {
    const text = typeof input?.text === 'string' ? input.text.trim().slice(0, 1500) : ''
    if (!text) return { ok: false }
    const path = typeof input?.path === 'string' ? input.path.slice(0, 200) : ''
    const session = await auth()
    const userId = session?.user?.id ?? null

    let lessonLine = path
    const t = path.match(/^\/t-lesson\/(\d+)/)
    const c = path.match(/^\/lesson\/(\d+)/)
    try {
        if (t) {
            const l = await db.query.t_lessons.findFirst({ where: eq(t_lessons.id, Number(t[1])) })
            if (l) lessonLine = `Тренажёр: «${l.title}» (id ${l.id})`
        } else if (c) {
            const l = await db.query.lessons.findFirst({ where: eq(lessons.id, Number(c[1])) })
            if (l) lessonLine = `Задачник: «${l.title}» (id ${l.id})`
        }
    } catch { /* название урока — не главное, шлём и без него */ }

    let who = 'гость'
    if (userId) {
        const up = await db.query.userProgress.findFirst({ where: eq(userProgress.userId, userId) })
        who = `${up?.nickname || up?.userName || 'ученик'} (${userId})`
    }
    await sendMessageToTelegram(`🤔 Непонятно\nУченик: ${who}\n${lessonLine}\n\n${text}`)
    return { ok: true }
}
