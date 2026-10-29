'use client'

// Пробная страница: как показать над ячейками «Прогресса по разделам» (задачник) тренажёры к заданию —
// вместо мелких медалей. Данные выдуманные, компонент настоящий.
import { CourseProgressStrip, type KeyStyle } from '@/components/course-progress-strip'

const TITLES = ['Простейшие', 'Векторы', 'Стереометрия', 'Вероятность', 'Вероятность 2', 'Случ. величина', 'Уравнения', 'Вычисления', 'Производная', 'Прикладные', 'Текстовые', 'Графики', 'Финансы']
const PCT = [60, 20, 0, 35, 0, 40, 50, 30, 15, 25, 20, 5, 0]
const units = [
    ...TITLES.map((t, i) => ({ id: i + 1, title: `${i + 1}. ${t}`, order: i + 1, unitIndex: i, percent: PCT[i], isUnlocked: true, isCompleted: false, section: 'part1' as const })),
    ...[14, 15, 16, 17, 18, 19, 20].map((n, i) => ({ id: n, title: `${n}. Часть 2`, order: n, unitIndex: 13 + i, percent: i === 0 ? 10 : 0, isUnlocked: true, isCompleted: false, section: 'part2' as const })),
]
const k = (id: number, title: string, percent: number) => ({ tUnitId: id, title, percent })
const keys = {
    1: [k(1, 'Окружность', 60), k(2, 'Треугольник', 100), k(3, 'sin cos tg', 0)],
    3: [k(4, 'ТТП', 40)],
    7: [k(5, 'Степени', 30), k(6, 'Логарифмы', 20), k(7, 'Виета', 10), k(8, 'Тригонометрия', 0)],
    8: [k(5, 'Степени', 100), k(6, 'Логарифмы', 100), k(9, 'Окружность', 100)],
    9: [k(10, 'Прямая', 0)], 10: [k(11, 'Пропорция', 0)], 12: [k(10, 'Прямая', 0)],
    14: [k(9, 'Окружность', 60), k(12, 'Приведение', 0)], 15: [k(4, 'ТТП', 40), k(13, 'Сечение', 0)], 16: [k(6, 'Логарифмы', 20), k(14, 'Лог. неравенства', 0)],
    18: [k(1, 'Окружность', 60), k(2, 'Треугольник', 100)],
}
const VARIANTS: { id: KeyStyle; name: string; note: string }[] = [
    { id: 'count', name: 'Просто «1/3»', note: 'Сколько тренажёров к заданию пройдено из скольких. Все — золотом.' },
    { id: 'pill', name: '«1/3» в плашке', note: 'То же, но в маленькой таблетке. Все пройдены — золотая.' },
    { id: 'check', name: '«1/3», а потом галочка', note: 'Пока не все — счётчик, все пройдены — золотая ✓.' },
    { id: 'dots', name: 'Точки', note: 'Точка на каждый тренажёр: пустая — не начат, полная — есть медаль.' },
    { id: 'bar', name: 'Полоска из кусочков', note: 'Кусок на каждый тренажёр, загорается после медали.' },
    { id: 'medals', name: 'Как сейчас (медали)', note: 'Для сравнения.' },
]

export default function Page() {
    return (
        <div className="min-h-screen bg-[#0F171B] px-4 py-5 text-white">
            <div className="mx-auto max-w-xl">
                <h1 className="text-xl font-extrabold">Тренажёры над ячейками задачника</h1>
                <p className="mb-4 text-xs font-bold text-[#7E8F99]">Данные выдуманные. Нажатие на ячейку здесь ничего не открывает.</p>
                <div className="space-y-6">
                    {VARIANTS.map((v, i) => (
                        <section key={v.id}>
                            <div className="mb-1 flex items-baseline gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F2C35B] text-sm font-black text-[#0F171B]">{i + 1}</span>
                                <span className="font-black">{v.name}</span>
                            </div>
                            <p className="mb-2 text-xs font-bold text-[#7E8F99]">{v.note}</p>
                            <CourseProgressStrip units={units} trainerKeys={keys} keyStyle={v.id} />
                        </section>
                    ))}
                </div>
            </div>
        </div>
    )
}
