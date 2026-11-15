// Варианты «Линейки ЕГЭ» с задачником и тренажёром на одном табе (components/ege-ruler-variants.tsx).
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getUserProgress } from '@/db/queries'
import { hasProFor } from '@/lib/pro'
import { getEgeRulerData } from '@/lib/egeRuler'
import { getSetBarData } from '@/lib/setBar'
import { EgeRuler } from '@/components/ege-ruler'
import { RulerAccordion, RulerGrid, RulerTiles } from '@/components/ege-ruler-variants'

export const dynamic = 'force-dynamic'

export default async function TestRulerVariantsPage() {
    const session = await auth()
    if (!session?.user?.id) redirect('/')
    const up = await getUserProgress()
    const set = await getSetBarData(session.user.id, 'ЕГЭ Математика').catch(() => null)
    const data = await getEgeRulerData(session.user.id, { hasPro: hasProFor(up), setTaskNum: set?.taskNum ?? null })
    const V = ({ title, text, children }: { title: string; text: string; children: React.ReactNode }) => (
        <section className="mb-10">
            <h2 className="text-lg font-black">{title}</h2>
            <p className="mb-3 max-w-md text-sm text-[#9AA7B0]">{text}</p>
            {children}
        </section>
    )
    return (
        <main className="min-h-screen bg-[#161F23] px-4 py-6 text-[#F2F7FB]">
            <h1 className="mb-4 text-xl font-black">Линейка ЕГЭ: задачник + тренажёр на одном экране</h1>
            <V title="А. Две строки" text="Как в настоящей линейке сейчас: у задания две строки квадратиков — книга (задачник) и гантеля (тренажёр). В свёрнутой полоске у каждого задания две риски.">
                <div className="flex justify-start"><EgeRuler data={data} inline /></div>
            </V>
            <V title="Б. Сетка" text="Два столбца как в таблице: слева задачник, справа тренажёр. Темы тренажёра — медали: бронза, серебро (от 50%), золото (100%), пустая серая — ещё не начата. Все задания видны разом, прогресс сравнивается по строке.">
                <RulerGrid data={data} />
            </V>
            <V title="В. Раскрывашка" text="В строке две полоски прогресса (лайм — задачник, золото — тренажёр). Нажал на задание — раскрылись крупные квадратики обоих.">
                <RulerAccordion data={data} />
            </V>
            <V title="Г. Плитки" text="У каждого задания плитка с двумя кнопками и процентом на каждой: один клик — сразу в задачник или в ближайшую тему тренажёра.">
                <RulerTiles data={data} />
            </V>
            <EgeRuler data={data} />
        </main>
    )
}
