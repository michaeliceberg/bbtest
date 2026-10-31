// lib/hangarModel.ts
//
// Общая модель расстановки ангара для сцены «Моего пути» и редактора /test-hangar-layout.
// Базовые координаты — lib/hangarLayout.json (docs/hangar/tools/build.py). Поверх — правки из редактора
// (таблица hangar_layout, кнопка «Сохранить»): положение, размер, слой (z) и поворот каждого предмета
// отдельно для «Сломано» (b) и «Починено» (a).
// Задание №11 теперь — потолочный вентилятор (components/hangar-fan.tsx). Бывшие «Инструменты» лежат на полу
// как хлам и исчезают вместе с остальным хламом.

import type { CSSProperties } from 'react'
import layout from '@/lib/hangarLayout.json'

export type Slot = { src: string; x: number; y: number; w: number; h: number; rot?: number }
export type Place = { x: number; y: number; w: number; h: number; z: number; rot: number; dz: number }
export type HangarState = 'b' | 'a'
export type LayoutOverrides = Partial<Record<HangarState, Record<string, Partial<Place>>>>

export const L = layout as unknown as Record<string, { b: Slot; a: Slot }> & { rocket: Slot[]; junk: Slot[] }

/**
 * Какой предмет (картинка L[id], ключ в редакторе) чинит какое задание ЕГЭ — по смыслу задания (2026-10-30):
 * стремянка у стены — прямоугольный треугольник (№1), флаг по ветру — вектор (№2), ящик — параллелепипед (№3),
 * автомат — случай (№4), спутанные провода — дерево исходов (№5), ключи разного размера — случайная величина (№6),
 * компьютер Мигеля — уравнения (№7), Фейнман считал в уме (№8), обороты шуруповёрта — производная (№9),
 * генератор — физика в формуле (№10), вентилятор — текстовые задачи (№11), струя огнетушителя — парабола (№12),
 * бочка топлива дорожает на r% (№13). Вентилятор и портрет с лампой стоят на своих номерах (11 и 8).
 */
export const ITEM_OF_TASK: Record<number, number> = { 1: 3, 2: 6, 3: 12, 4: 13, 5: 1, 6: 2, 7: 7, 8: 8, 9: 4, 10: 10, 11: 11, 12: 9, 13: 5 }
export const itemOf = (task: number) => ITEM_OF_TASK[task] ?? task
/** Название предмета по id картинки — для редактора расстановки. */
export const ITEM_NAME: Record<number, string> = { 1: 'Провода', 2: 'Стенд с ключами', 3: 'Стремянка', 4: 'Шуруповёрт', 5: 'Бочка', 6: 'Флаг', 7: 'Компьютер', 8: 'Лампа', 9: 'Огнетушитель', 10: 'Генератор', 11: 'Вентилятор', 12: 'Ящик', 13: 'Автомат' }
const taskOfItem = (id: number) => Number(Object.keys(ITEM_OF_TASK).find((t) => ITEM_OF_TASK[Number(t)] === id) ?? id)

/** Задание ЕГЭ, которое чинит вентилятор (бывшие «Инструменты»). */
export const FAN_NUM = 11
/** Предметы комнаты, которые рисуются картинками (без вентилятора). */
export const ROOM_IDS = Object.keys(L).filter((k) => k !== 'rocket' && k !== 'junk').map(Number).filter((n) => n !== FAN_NUM).sort((a, b) => a - b)

export type JunkPiece = Slot & { key: string; label: string }
/** Хлам по порядку исчезновения с конца: последний в списке исчезает первым. Инструменты — в середине. */
export const JUNK: JunkPiece[] = (() => {
    const base = L.junk.map((j, i) => ({ ...j, key: `junk-${i + 1}`, label: `хлам ${i + 1}` }))
    const tools: JunkPiece = { ...L[String(FAN_NUM)].b, key: 'junk-tools', label: 'хлам: инструменты' }
    return [...base.slice(0, 7), tools, ...base.slice(7)]
})()

// Декор: портрет Фейнмана в рамке и лампа над ним на левой стене (docs/hangar/tools/build_portrait.py).
// «До» — рамка в паутине, лампа выключена; «после» — аккуратно, лампа горит. Чинятся заданием PORTRAIT_NUM
// вместе с лампой ангара. Наклон «до» — поворотом в редакторе.
export const PORTRAIT_NUM: number | null = 8 // чинится вместе с лампой (№8)
export type Decor = { key: string; label: string; b: Slot; a: Slot }
export const DECOR: Decor[] = [
    { key: 'portrait', label: 'Портрет',
        a: { src: '/hangar/portrait-after.webp', x: 110, y: 560, w: 80, h: 180 },
        b: { src: '/hangar/portrait-before.webp', x: 99, y: 560, w: 144, h: 233, rot: -9 } }, // «до» висит криво
    { key: 'lamp', label: 'Лампа над портретом',
        a: { src: '/hangar/lamp-on.webp', x: 129, y: 370, w: 46, h: 40 },
        b: { src: '/hangar/lamp-off.webp', x: 129, y: 370, w: 46, h: 40 } },
]

// Вещи котика (components/hangar-cat.tsx) — тоже двигаются в редакторе /test-hangar-layout, но рисуются только когда
// котик живёт в ангаре. «Сломано» (b) — сломанный холодильник, «Починено» (a) — целый. Коробка — место, где сидит котик.
// Сломанный холодильник шире целого (открыта дверца, шнур, лужа): его рамка по умолчанию совмещена с целым по корпусу.
export const CAT_DECOR: Decor[] = [
    { key: 'cat-fridge', label: 'Холодильник котика',
        a: { src: '/hangar/life/cat-fridge.webp', x: 655, y: 846, w: 108, h: 131 },
        b: { src: '/hangar/life/cat-fridge-broken.webp', x: 650, y: 866, w: 148, h: 151 } },
    { key: 'cat-box', label: 'Коробка котика',
        a: { src: '/hangar/life/cat-cardboard.webp', x: 554, y: 904, w: 150, h: 108 },
        b: { src: '/hangar/life/cat-cardboard.webp', x: 554, y: 904, w: 150, h: 108 } },
]

// Слой — АВТОМАТИЧЕСКИ по глубине: что стоит ниже на полу (больше y нижнего края), то ближе и рисуется сверху.
// Раньше слои задавались вручную номерами отдельно для «Сломано» и «Починено» — у ученика, у которого часть предметов
// починена, а часть нет, номера из двух разных шкал сравнивались между собой и порядок ломался. Теперь номер не нужен:
// в редакторе есть только поправка dz («Ближе/Дальше», в точках сцены) для исключений — она тоже по глубине,
// поэтому работает при любом порядке ремонта. zIndex = 30 + 0,8·(y + dz) → от ~30 до ~850 (вентилятор — 900).
export const depthZIndex = (y: number) => Math.round(30 + 0.8 * y)
const depthZ = (y: number) => (depthZIndex(y) - 10) / 10

export function place(o: LayoutOverrides | null | undefined, state: HangarState, key: string, base: Slot): Place {
    const p = o?.[state]?.[key] ?? {}
    const y = p.y ?? base.y
    const dz = p.dz ?? 0
    return { x: p.x ?? base.x, y, w: p.w ?? base.w, h: p.h ?? base.h, z: depthZ(y + dz), dz, rot: p.rot ?? base.rot ?? 0 }
}

export type EditorObj = Slot & Place & { key: string; label: string }

/** Все предметы, которые видны в редакторе в состоянии state (хлам — только у «Сломано»). */
export function editorObjects(o: LayoutOverrides | null | undefined, state: HangarState): EditorObj[] {
    const rocket = L.rocket[state === 'b' ? 0 : 7]
    const list: EditorObj[] = [
        { ...rocket, ...place(o, state, 'rocket', rocket), key: 'rocket', label: 'Ракета' },
        ...(state === 'b' ? JUNK.map((j) => ({ ...j, ...place(o, state, j.key, j) })) : []),
        ...[...DECOR, ...CAT_DECOR].map((d) => ({ ...d[state], ...place(o, state, d.key, d[state]), key: d.key, label: d.label })),
        ...ROOM_IDS.map((id) => { const s = L[id][state]; return { ...s, ...place(o, state, `${id}`, s), key: `${id}`, label: `${ITEM_NAME[id] ?? 'Предмет'} (№${taskOfItem(id)})` } }),
    ]
    return list.sort((a, b) => a.z - b.z)
}

/** CSS для картинки предмета: низ по центру в (x, y), поворот вокруг низа (свойство rotate не мешает анимациям transform). */
export const placeStyle = (p: Place): CSSProperties => ({
    left: `${((p.x - p.w / 2) / 1024) * 100}%`,
    top: `${((p.y - p.h) / 1024) * 100}%`,
    width: `${(p.w / 1024) * 100}%`,
    height: `${(p.h / 1024) * 100}%`,
    zIndex: Math.round(p.z * 10) + 10,
    rotate: p.rot ? `${p.rot}deg` : undefined,
    transformOrigin: '50% 100%',
})
