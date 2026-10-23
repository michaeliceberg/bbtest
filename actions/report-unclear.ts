'use server'

// «Непонятно» из пошагового разбора: ученик нажал кнопку на этапе, дописал (или нет) и отправил.
// Сообщение уходит админу в Telegram только по кнопке «Отправить» — случайное нажатие ничего не шлёт.
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import db from '@/db/drizzle'
import { lessons, t_lessons, userProgress } from '@/db/schema'
import { sql } from 'drizzle-orm'
import { sendMessageToTelegram } from '@/utils/telegram'
import { syncAchievements } from '@/lib/achievements'

// prefix — готовое начало из модалки: «со своими словами» = после него дописано хотя бы 5 букв
export async function reportUnclear(input: { path: string; text: string; prefix?: string }): Promise<{ ok: boolean }> {
    const text = typeof input?.text === 'string' ? input.text.trim().slice(0, 1500) : ''
    if (!text) return { ok: false }
    const path = typeof input?.path === 'string' ? input.path.slice(0, 200) : ''
    const session = await auth()
    const userId = session?.user?.id ?? null

    let lessonLine = path
    let lessonTitle: string | null = null
    const t = path.match(/^\/t-lesson\/(\d+)/)
    const c = path.match(/^\/lesson\/(\d+)/)
    try {
        if (t) {
            const l = await db.query.t_lessons.findFirst({ where: eq(t_lessons.id, Number(t[1])) })
            if (l) { lessonLine = `Тренажёр: «${l.title}» (id ${l.id})`; lessonTitle = l.title }
        } else if (c) {
            const l = await db.query.lessons.findFirst({ where: eq(lessons.id, Number(c[1])) })
            if (l) { lessonLine = `Задачник: «${l.title}» (id ${l.id})`; lessonTitle = l.title }
        }
    } catch { /* название урока — не главное, шлём и без него */ }

    let who = 'гость'
    if (userId) {
        const up = await db.query.userProgress.findFirst({ where: eq(userProgress.userId, userId) })
        who = `${up?.nickname || up?.userName || 'ученик'} (${userId})`
    }
    const prefix = typeof input?.prefix === 'string' ? input.prefix.trim() : ''
    const own = prefix && text.startsWith(prefix) ? text.slice(prefix.length) : text
    const hasComment = (own.match(/[A-Za-zА-Яа-яЁё0-9]/g) ?? []).length >= 5
    await db.execute(sql`INSERT INTO unclear_reports (user_id, path, lesson_title, text, has_comment)
        VALUES (${userId}, ${path}, ${lessonTitle}, ${text}, ${hasComment})`)
    await sendMessageToTelegram(`🤔 Непонятно\nУченик: ${who}\n${lessonLine}\n\n${text}`)
    if (userId) await syncAchievements(userId).catch(() => {})
    return { ok: true }
}
