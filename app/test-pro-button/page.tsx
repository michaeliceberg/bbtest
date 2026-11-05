import { redirect } from 'next/navigation'
import { getUserProgress } from '@/db/queries'
import { ProSidebarButton } from '@/components/pro-sidebar-button'

// Только для админа: два вида кнопки PRO справа от аккаунта в сайдбаре (components/pro-sidebar-button.tsx)
export default async function TestProButtonPage() {
    const up = await getUserProgress()
    if (up?.isAdmin !== 1) redirect('/trainer')
    const row = (title: string, note: string, bought: boolean) => (
        <div className="rounded-2xl border-2 border-[#2A363C] bg-[#151F23] p-4">
            <p className="text-base font-black text-[#F2F7FB]">{title}</p>
            <p className="mb-3 text-sm font-bold text-[#9AA7B0]">{note}</p>
            {/* как низ сайдбара: аватар, имя, справа кнопка */}
            <div className="flex w-[264px] items-center gap-2 rounded-lg bg-[#151F23] p-1">
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg p-2 hover:bg-[#232F34]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={up.userImageSrc || '/mascot.svg'} alt="" className="h-8 w-8 rounded-full bg-[#232F34] object-cover" />
                    <span className="truncate text-sm text-[#F2F7FB]">{up.userName || 'Ученик'}</span>
                </div>
                <ProSidebarButton bought={bought} />
            </div>
        </div>
    )
    return (
        <div className="min-h-screen bg-[#0F171B] px-4 py-8">
            <div className="mx-auto flex max-w-md flex-col gap-4">
                <h1 className="text-xl font-black text-[#F2F7FB]">Кнопка PRO в сайдбаре</h1>
                {row('Подписки нет', 'Золотая, переливается и искрит — зовёт нажать', false)}
                {row('Подписка куплена', 'Спокойная плашка с короной — не призывает кликать', true)}
            </div>
        </div>
    )
}
