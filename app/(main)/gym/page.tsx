// app/(main)/gym/page.tsx — «Собери абонемент»: песочница паззла DDX (components/ddx-sandbox.tsx).
import { auth } from '@/lib/server-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getDdxState } from '@/lib/ddx'
import { DdxSandbox } from '@/components/ddx-sandbox'

export const dynamic = 'force-dynamic'

const GymPage = async () => {
    const session = await auth()
    if (!session?.user?.id) redirect('/')
    const { pieces, promoCode } = await getDdxState(session.user.id)
    return (
        <div className="w-full max-w-[560px] mx-auto px-4 py-3 flex flex-col gap-3">
            <div>
                <Link href="/account" className="text-xs font-bold text-[#9AA7B0] hover:text-[#F2F7FB]">‹ Аккаунт</Link>
                <h1 className="text-xl font-black text-[#F2F7FB]">Собери абонемент в DDX 🏋️</h1>
                <p className="text-xs text-[#9AA7B0]">
                    Кусочки выпадают из мифических и МЕГА кейсов. Перетащи их на места, 2 повторки сливаются в новый кусочек.
                    Соберёшь все 9 — промокод на месяц в DDX Fitness.{' '}
                    <Link href="/ddx-practice" className="font-bold text-[#F47B20] underline">Потренироваться</Link>
                </p>
            </div>
            <DdxSandbox pieces={pieces} promoCode={promoCode} />
        </div>
    )
}
export default GymPage
