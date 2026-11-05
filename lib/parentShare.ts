import 'server-only'
import { ZN_JOKES, znSource } from '@/lib/zaNauku'
import { getOrCreateInvite } from '@/lib/invite'
import { getLessonInviteLink } from '@/lib/referral'

// Второе сообщение родителю — то, что удобно переслать другим родителям: смешная задача физтехов
// из газеты «За науку» («Задачи без ответов») + ссылка на пошаговый урок без регистрации.
// Ссылка через инвайт-код самого ученика: если по ней придёт новый ученик, приглашение засчитается ребёнку.
// Урок по умолчанию — «Кубик: 3 правила» (сечения куба, t_lesson 510).

export const PARENT_SHARE_LESSON = { id: 510, title: 'Сечения куба', subject: 'math' as const }

const RIDDLES = ZN_JOKES.filter((j) => j.rubric === 'task' && j.text.length <= 240)
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

export async function parentShareText(studentId: string): Promise<string | null> {
    const riddle = RIDDLES.length ? pick(RIDDLES) : null
    if (!riddle) return null
    const invite = await getOrCreateInvite(studentId).catch(() => null)
    const link = getLessonInviteLink(invite?.code, PARENT_SHARE_LESSON.id, PARENT_SHARE_LESSON.subject)
    return [
        '🧩 *Задача для родителей от физтехов* (ответа нет даже у них):',
        riddle.text,
        `_${znSource(riddle)}_`,
        '',
        `🧊 А детям — урок «${PARENT_SHARE_LESSON.title}» из стереометрии ЕГЭ: разберутся по шагам, без регистрации:`,
        link,
        '',
        '📨 Перешлите другим родителям — пусть тоже поломают голову 😄',
    ].join('\n')
}
