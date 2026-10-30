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
export type Place = { x: number; y: number; w: number; h: number; z: number; rot: number }
export type HangarState = 'b' | 'a'
export type LayoutOverrides = Partial<Record<HangarState, Record<string, Partial<Place>>>>

export const L = layout as unknown as Record<string, { b: Slot; a: Slot }> & { rocket: Slot[]; junk: Slot[] }

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

// Слой по умолчанию — как было: хлам, потом ракета, потом предметы по номерам.
const defaultZ = (key: string) => {
    if (key.startsWith('junk-')) return key === 'junk-tools' ? 7.5 : Number(key.slice(5)) - 1
    if (key === 'rocket') return 20
    if (key === 'portrait') return 4
    if (key === 'lamp') return 4.5
    return 30 + Number(key)
}

export function place(o: LayoutOverrides | null | undefined, state: HangarState, key: string, base: Slot): Place {
    const p = o?.[state]?.[key] ?? {}
    return { x: p.x ?? base.x, y: p.y ?? base.y, w: p.w ?? base.w, h: p.h ?? base.h, z: p.z ?? defaultZ(key), rot: p.rot ?? base.rot ?? 0 }
}

export type EditorObj = Slot & Place & { key: string; label: string }

/** Все предметы, которые видны в редакторе в состоянии state (хлам — только у «Сломано»). */
export function editorObjects(o: LayoutOverrides | null | undefined, state: HangarState): EditorObj[] {
    const rocket = L.rocket[state === 'b' ? 0 : 7]
    const list: EditorObj[] = [
        { ...rocket, ...place(o, state, 'rocket', rocket), key: 'rocket', label: 'Ракета' },
        ...(state === 'b' ? JUNK.map((j) => ({ ...j, ...place(o, state, j.key, j) })) : []),
        ...DECOR.map((d) => ({ ...d[state], ...place(o, state, d.key, d[state]), key: d.key, label: d.label })),
        ...ROOM_IDS.map((id) => { const s = L[id][state]; return { ...s, ...place(o, state, `${id}`, s), key: `${id}`, label: `№${id}` } }),
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
