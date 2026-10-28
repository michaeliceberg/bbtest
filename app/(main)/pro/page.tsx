// app/(main)/pro/page.tsx — экран подписки PRO. Если ключи ЮKassa заданы в .env — кнопка «Купить PRO»
// (actions/pro-payment.ts), иначе прежняя «фейковая дверь» «Хочу PRO» (pro_interest + сообщение админу).
// Пока PRO выключен (PRO_ENABLED/PRO_PAYWALL_ENABLED), страницу видят только админы — для проверки оплаты.

import { redirect } from 'next/navigation'
import { sql } from 'drizzle-orm'
import db from '@/db/drizzle'
import { auth } from '@/lib/server-auth'
import { FeatureIcon } from './pro-icons'
import { PRO_EARLY_DISCOUNT, PRO_ENABLED, PRO_FEATURES, PRO_PAYWALL_ENABLED, PRO_PRICE_RUB } from '@/lib/pro'
import Link from 'next/link'
import { ProWantButton } from './want-button'
import { ProBuyButton } from './buy-button'
import { getUserProgress } from '@/db/queries'
import { yookassaConfigured, yookassaIsTest } from '@/lib/yookassa'

export const dynamic = 'force-dynamic'


const ProPage = async ({ searchParams }: { searchParams: { from?: string; paid?: string } }) => {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) redirect('/')
    const up = await getUserProgress()
    const isAdmin = up?.isAdmin === 1
    if (!PRO_ENABLED && !PRO_PAYWALL_ENABLED && !isAdmin) redirect('/trainer')
    const canBuy = yookassaConfigured()
    const proUntil = up?.proUntil && new Date(up.proUntil).getTime() > Date.now() ? new Date(up.proUntil).toISOString() : null
    const paidId = Number(searchParams.paid) || null

    const source = searchParams.from?.slice(0, 40) ?? null
    await db.execute(sql`INSERT INTO pro_interest (user_id, event, source) VALUES (${userId}, 'view', ${source})`)
    const wanted = ((await db.execute(sql`SELECT 1 FROM pro_interest WHERE user_id = ${userId} AND event = 'want' LIMIT 1`)) as unknown as unknown[]).length > 0
    const earlyPrice = Math.round((PRO_PRICE_RUB * (100 - PRO_EARLY_DISCOUNT)) / 100)

    return (
        <div className="max-w-lg mx-auto px-4 py-8 text-[#F2F7FB]">
            <div className="relative overflow-hidden rounded-3xl border-2 border-[#F2C35B]/60 bg-[#151F23] p-6 shadow-[0_0_40px_-12px_rgba(242,195,91,0.45)]">
                <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(242,195,91,0.28),transparent_70%)]" />
                <div className="relative flex flex-col items-center text-center">
                    {/* Команданте Мигель крупно, по пояс: видны корона и VIP-карта (низ растворяется в карточке) */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/miguel/miguel-pro-bust.webp" alt="" className="-mt-2 w-full max-w-[300px] object-contain" draggable={false} />
                    <h1 className="mt-1 text-3xl font-black">ggege <span className="text-[#F2C35B]">PRO</span></h1>
                    <p className="mt-1 text-sm text-[#9AA7B0]">Готовься к ЕГЭ как в игре — без ограничений</p>
                    <div className="mt-5 flex items-end gap-1">
                        <span className="text-5xl font-black">{PRO_PRICE_RUB}</span>
                        <span className="pb-1.5 text-lg font-bold text-[#9AA7B0]">₽ / месяц</span>
                    </div>
                </div>

                <ul className="relative mt-6 space-y-3">
                    {PRO_FEATURES.map((f) => (
                        <li key={f.title} className="flex items-center gap-3 rounded-xl bg-[#1B252B] p-3">
                            <FeatureIcon name={f.icon} />
                            <span>
                                <span className="block font-bold">{f.title}</span>
                                <span className="block text-xs text-[#9AA7B0]">{f.text}</span>
                            </span>
                        </li>
                    ))}
                </ul>

                <p className="relative mt-4 text-center text-xs text-[#7F8C93]">
                    Оплачивая, вы принимаете <Link href="/offer" className="underline">оферту</Link>. Возврат — в течение 7 дней, если не пользовались.
                </p>

                <div className="relative mt-6">
                    {canBuy ? (
                        <ProBuyButton price={PRO_PRICE_RUB} proUntil={proUntil} paidId={paidId} test={yookassaIsTest()} />
                    ) : (
                        <ProWantButton initiallyWanted={wanted} source={source ?? undefined} earlyPrice={earlyPrice} discount={PRO_EARLY_DISCOUNT} />
                    )}
                </div>
            </div>
        </div>
    )
}

export default ProPage
