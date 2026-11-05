import 'server-only'
import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import { sendMessageToTelegram } from '@/utils/telegram'
import { parentShareText } from '@/lib/parentShare'
import type { EgeGain } from '@/lib/egeMap'

// Сообщение родителю (parent_links), когда у ребёнка вырос прогноз ЕГЭ в тестовых баллах:
// «+1 — и уже 83 балла» и шутка; вторым сообщением — задача физтехов и ссылка на урок (lib/parentShare.ts).
// Не чаще раза в 3 часа: если за это время балл вырос ещё, следующее сообщение покажет весь рост
// от прошлого отправленного значения (user_progress.parent_gain_last_test).

const MIN_GAP_HOURS = 3

const CHEERS = [
    'Ожидаем старания дальше — до 100 рукой подать (ну, ногой, но близко) 😄',
    'Темп отличный. Если так пойдёт, придётся покупать вторую полку для грамот 🏆',
    'Похвалите — это работает лучше любого будильника ⏰',
    'Говорят, баллы ЕГЭ растут от похвалы и пиццы. Пицца у нас уже есть 🍕',
    'Ещё пара таких вечеров — и можно присматривать общежитие поближе к центру 🎓',
    'Команданте Мигель доволен. А он, между прочим, гусь строгий 🪿',
    'Ни одна формула при этом не пострадала. Ну, почти 📐',
    'Это не магия, это тренажёр. Хотя похоже на магию ✨',
]

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
const plural = (n: number, a: string, b: string, c: string) => {
    const m10 = n % 10, m100 = n % 100
    return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c
}

export async function notifyParentsEgeGain(userId: string, gain: EgeGain | null) {
    if (!gain || gain.toTest <= gain.fromTest) return
    const links = (await db.execute(sql`
        SELECT parent_telegram_id FROM parent_links WHERE student_id = ${userId} AND is_active`)) as unknown as { parent_telegram_id: string }[]
    if (!links.length) return
    // Атомарно занимаем «окно отправки»: второй параллельный вызов не пройдёт.
    const claimed = (await db.execute(sql`
        UPDATE user_progress SET parent_gain_notified_at = now()
        WHERE user_id = ${userId}
          AND (parent_gain_notified_at IS NULL OR parent_gain_notified_at < now() - make_interval(hours => ${MIN_GAP_HOURS}))
        RETURNING user_name, parent_gain_last_test`)) as unknown as { user_name: string; parent_gain_last_test: number | null }[]
    if (!claimed.length) return
    const name = claimed[0].user_name || 'Ваш ребёнок'
    const from = Math.min(claimed[0].parent_gain_last_test ?? gain.fromTest, gain.fromTest)
    const d = gain.toTest - from
    await db.execute(sql`UPDATE user_progress SET parent_gain_last_test = ${gain.toTest} WHERE user_id = ${userId}`)

    const text = [
        `🎯 *${name}: +${d} ${plural(d, 'балл', 'балла', 'баллов')} к прогнозу ЕГЭ — уже ${gain.toTest}!*`,
        '',
        `Сейчас прокачивается задание №${gain.taskNum} «${gain.taskTitle}».`,
        pick(CHEERS),
    ].join('\n')
    // Вторым сообщением — задача физтехов и ссылка на урок (удобно переслать другим родителям).
    const share = await parentShareText(userId).catch(() => null)
    await Promise.all(links.map(async (l) => {
        await sendMessageToTelegram(text, l.parent_telegram_id).catch(() => null)
        if (share) await sendMessageToTelegram(share, l.parent_telegram_id).catch(() => null)
    }))
}
