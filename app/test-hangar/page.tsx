'use client'

// Пробная страница «Ангар» — та же сцена, что в «Моём пути» (components/hangar-scene.tsx), с сохранённой расстановкой
// из редактора /test-hangar-layout. Каждое задание переключается «сломано → можно чинить → починено», ключики
// с номером, подсветка предмета и окошко «Перейти к разделу задачника» — как в приложении. Починка тут без сервера.
import { useEffect, useState } from 'react'
import { HangarScene, type HangarTime, type SceneItem } from '@/components/hangar-scene'
import { getHangarLayout } from '@/actions/hangar-layout'
import type { LayoutOverrides } from '@/lib/hangarModel'

const TITLES: Record<number, string> = {
    1: 'Планиметрия', 2: 'Векторы', 3: 'Стереометрия', 4: 'Вероятность', 5: 'Сложная вероятность',
    6: 'Мат. ожидание', 7: 'Уравнения', 8: 'Выражения', 9: 'Производная', 10: 'Прикладные задачи',
    11: 'Текстовые задачи', 12: 'Графики', 13: 'Финансовая задача', 14: 'Уравнения', 15: 'Стереометрия',
    16: 'Неравенства', 17: 'Моделирование', 18: 'Планиметрия', 19: 'Параметр', 20: 'Числа и их свойства',
}
type St = SceneItem['state']
const NEXT: Record<St, St> = { broken: 'ready', ready: 'fixed', fixed: 'broken' }
const ST_STYLE: Record<St, { bg: string; fg: string; label: string }> = {
    broken: { bg: '#26333B', fg: '#C9D4DA', label: 'сломано' },
    ready: { bg: '#F2C35B', fg: '#3A2A08', label: 'чинить' },
    fixed: { bg: '#78C93C', fg: '#0F171B', label: 'готово' },
}
const NUMS = Array.from({ length: 20 }, (_, i) => i + 1)

const Btn = ({ on, onClick, children }: { on?: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick} className="rounded-lg px-3 py-1.5 text-sm font-bold" style={{ background: on ? '#53ADEF' : '#26333B', color: on ? '#0F171B' : '#C9D4DA' }}>{children}</button>
)

export default function Page() {
    const [layout, setLayout] = useState<LayoutOverrides | null | undefined>(undefined)
    const [st, setSt] = useState<Record<number, St>>(() => Object.fromEntries(NUMS.map((n) => [n, 'broken'])))
    const [time, setTime] = useState<HangarTime>('day')
    const [portrait, setPortrait] = useState(false)
    useEffect(() => { getHangarLayout().then(setLayout).catch(() => setLayout(null)) }, [])

    const items: SceneItem[] = NUMS.map((n) => ({ num: n, title: TITLES[n], state: st[n], progress: st[n] === 'broken' ? 0 : 1, href: null }))
    const all = (s: St) => setSt(Object.fromEntries(NUMS.map((n) => [n, s])))
    // ракета чинится по порядку — как в приложении «следующая деталь» одна
    const setNum = (n: number, s: St) => setSt((o) => ({ ...o, [n]: s }))

    return (
        <div className="min-h-screen bg-[#0F171B] px-4 py-5 text-white">
            <div className="mx-auto max-w-xl">
                <h1 className="text-xl font-extrabold">Ангар — как в приложении</h1>
                <p className="mb-3 text-xs font-bold text-[#7E8F99]">Расстановка — сохранённая в редакторе. Жми номер задания внизу: сломано → можно чинить → починено. На картинке жми ключик — подсветится предмет и откроется окошко.</p>
                <div className="mb-2 flex flex-wrap gap-2">
                    <Btn onClick={() => all('broken')}>Всё сломано</Btn>
                    <Btn onClick={() => all('ready')}>Всё можно чинить</Btn>
                    <Btn onClick={() => all('fixed')}>Всё починено</Btn>
                </div>
                <div className="mb-3 flex flex-wrap gap-2">
                    <Btn on={time === 'day'} onClick={() => setTime('day')}>День</Btn>
                    <Btn on={time === 'evening'} onClick={() => setTime('evening')}>Вечер</Btn>
                    <Btn on={time === 'night'} onClick={() => setTime('night')}>Ночь</Btn>
                    <Btn on={portrait} onClick={() => setPortrait((v) => !v)}>Портрет: {portrait ? 'починен' : 'сломан'}</Btn>
                </div>
                {layout === undefined
                    ? <div className="aspect-square w-full animate-pulse rounded-2xl bg-[#1C262B]" />
                    : <HangarScene items={items} layout={layout} time={time} decorFixed={portrait} onFix={(n) => setNum(n, 'fixed')} />}
                <div className="mt-4 grid grid-cols-5 gap-1.5">
                    {NUMS.map((n) => {
                        const s = ST_STYLE[st[n]]
                        return (
                            <button key={n} onClick={() => setNum(n, NEXT[st[n]])} className="rounded-lg px-1 py-1.5 text-center" style={{ background: s.bg, color: s.fg }}>
                                <div className="text-sm font-black">№{n}</div>
                                <div className="text-[10px] font-bold opacity-80">{s.label}</div>
                            </button>
                        )
                    })}
                </div>
                <p className="mt-2 text-[11px] font-bold text-[#7E8F99]">№1–13 — предметы (№11 — вентилятор), №14–20 — детали ракеты по порядку.</p>
            </div>
        </div>
    )
}
