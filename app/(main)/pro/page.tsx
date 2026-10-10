// app/(main)/pro/page.tsx — экран подписки PRO. Пока «фейковая дверь»: показываем цену,
// по кнопке записываем заявку (pro_interest) и шлём админу в Telegram. Денег не берём.

import { redirect } from 'next/navigation'
import { sql } from 'drizzle-orm'
import { Crown } from 'lucide-react'
import db from '@/db/drizzle'
import { auth } from '@/lib/server-auth'
import { PRO_EARLY_DISCOUNT, PRO_ENABLED, PRO_PRICE_RUB } from '@/lib/pro'
import { ProWantButton } from './want-button'

export const dynamic = 'force-dynamic'

const FEATURES = [
    { icon: '🧠', title: 'Все тренажёры и разборы', text: 'Математика и физика ЕГЭ: каждая тема по шагам, от базы до второй части.' },
    { icon: '⚔️', title: 'Задачник ЕГЭ целиком', text: 'Все типовые задания с проверкой и подсказками.' },
    { icon: '🗺️', title: 'Мой путь к ЕГЭ', text: 'Прогноз балла и ходы: что решать сегодня, чтобы баллы росли.' },
    { icon: '🎁', title: 'Больше кейсов и пиццы', text: 'Мифические кейсы чаще, кусочки пиццы и абонемент в DDX быстрее.' },
]

const ProPage = async ({ searchParams }: { searchParams: { from?: string } }) => {
    if (!PRO_ENABLED) redirect('/trainer')
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) redirect('/')

    const source = searchParams.from?.slice(0, 40) ?? null
    await db.execute(sql`INSERT INTO pro_interest (user_id, event, source) VALUES (${userId}, 'view', ${source})`)
    const wanted = ((await db.execute(sql`SELECT 1 FROM pro_interest WHERE user_id = ${userId} AND event = 'want' LIMIT 1`)) as unknown as unknown[]).length > 0
    const earlyPrice = Math.round((PRO_PRICE_RUB * (100 - PRO_EARLY_DISCOUNT)) / 100)

    return (
        <div className="max-w-lg mx-auto px-4 py-8 text-[#F2F7FB]">
            <div className="relative overflow-hidden rounded-3xl border-2 border-[#F2C35B]/60 bg-[#151F23] p-6 shadow-[0_0_40px_-12px_rgba(242,195,91,0.45)]">
                <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(242,195,91,0.28),transparent_70%)]" />
                <div className="relative flex flex-col items-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F2C35B] to-[#C9971C] shadow-[0_6px_0_#8A6A1E]">
                        <Crown className="h-9 w-9 text-[#3A2A08]" strokeWidth={2.5} />
                    </div>
                    <h1 className="mt-4 text-3xl font-black">ggege <span className="text-[#F2C35B]">PRO</span></h1>
                    <p className="mt-1 text-sm text-[#9AA7B0]">Готовься к ЕГЭ как в игре — без ограничений</p>
                    <div className="mt-5 flex items-end gap-1">
                        <span className="text-5xl font-black">{PRO_PRICE_RUB}</span>
                        <span className="pb-1.5 text-lg font-bold text-[#9AA7B0]">₽ / месяц</span>
                    </div>
                </div>

                <ul className="relative mt-6 space-y-3">
                    {FEATURES.map((f) => (
                        <li key={f.title} className="flex gap-3 rounded-xl bg-[#1B252B] p-3">
                            <span className="text-2xl">{f.icon}</span>
                            <span>
                                <span className="block font-bold">{f.title}</span>
                                <span className="block text-xs text-[#9AA7B0]">{f.text}</span>
                            </span>
                        </li>
                    ))}
                </ul>

                <div className="relative mt-6">
                    <ProWantButton initiallyWanted={wanted} source={source ?? undefined} earlyPrice={earlyPrice} discount={PRO_EARLY_DISCOUNT} />
                </div>
            </div>
        </div>
    )
}

export default ProPage
