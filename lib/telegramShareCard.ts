// lib/telegramShareCard.ts — бот присылает карточку-приглашение по диплинку /start share_<код>_<m|p>[_урок_сек_серия].
import 'server-only'
import { eq } from 'drizzle-orm'
import db from '@/db/drizzle'
import { t_lessons } from '@/db/schema'
import { resolveInviteCode } from '@/lib/invite'
import { getInviteLink } from '@/lib/referral'
import { buildBattleMessage, buildInviteMessage } from '@/lib/inviteMessage'
import { sendMessageToTelegram, sendTelegramPhoto } from '@/utils/telegram'
import { GET as renderInviteImage } from '@/app/api/og/invite/route'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export async function sendShareCard(chatId: string, payload: string) {
    const [code, subj, l, t, s] = payload.split('_')
    const subject = subj === 'm' ? 'math' as const : 'physics' as const
    const inviter = await resolveInviteCode(code).catch(() => null)
    if (!inviter) {
        await sendMessageToTelegram('Не нашёл приглашение 🤔 Открой ggege.ru → Аккаунт → «Пригласи друга» и нажми кнопку ещё раз.', chatId)
        return
    }
    const lessonId = Number(l) || 0, seconds = Number(t) || 0, streak = Number(s) || 0
    const lesson = lessonId ? await db.query.t_lessons.findFirst({ where: eq(t_lessons.id, lessonId), columns: { title: true } }).catch(() => null) : null
    const link = getInviteLink(code, lessonId ? { l: lessonId, t: seconds, s: streak } : undefined, subject)
    const text = lesson
        ? buildInviteMessage({ nickname: inviter.nickname, lessonTitle: lesson.title, seconds, streak, subject })
        : buildBattleMessage({ nickname: inviter.nickname, subject })
    // **жирный** → <b>, ссылка — последней строкой
    const caption = esc(text).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') + `\n${link}`

    const q = new URLSearchParams({ code, tg: '1' })
    if (lessonId) { q.set('l', String(lessonId)); q.set('t', String(seconds)); q.set('s', String(streak)) }
    const img = await renderInviteImage(new Request(`http://local/api/og/invite?${q}`))
    const png = await img.arrayBuffer()

    const ok = await sendTelegramPhoto(chatId, png, caption, [[{ text: '🚀 Пройти урок', url: link }]])
    if (ok) await sendMessageToTelegram('👆 Перешли эту карточку другу: зажми её → «Переслать» → выбери друга.', chatId)
    else await sendMessageToTelegram(`${text.replace(/\*\*/g, '*')}\n${link}`, chatId)
}
