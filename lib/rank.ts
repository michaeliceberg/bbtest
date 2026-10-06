// lib/rank.ts
//
// «Звание» ученика (показывается в /account) — лестница в духе банд/мафии.
// Пока ученик не в банде, звание растёт вместе с уровнем (lib/xp.ts):
// начинаем с «Дворника». Если он в банде — звание берётся из роли: глава —
// «Дон», капо — «Капо», обычный участник — «Солдат». Порог — минимальный
// уровень, с которого действует звание.

export const LEVEL_RANKS: { minLevel: number; title: string }[] = [
    { minLevel: 1, title: 'Дворник' },
    { minLevel: 3, title: 'Шестёрка' },
    { minLevel: 5, title: 'Курьер' },
    { minLevel: 8, title: 'Подручный' },
    { minLevel: 12, title: 'Наводчик' },
    { minLevel: 17, title: 'Громила' },
    { minLevel: 23, title: 'Боец' },
    { minLevel: 30, title: 'Бригадир' },
    { minLevel: 40, title: 'Авторитет' },
    { minLevel: 55, title: 'Смотрящий' },
    { minLevel: 75, title: 'Правая рука' },
]

export const GANG_ROLE_RANKS: Record<string, string> = {
    leader: 'Дон',
    kapo: 'Капо',
    member: 'Солдат',
}

export const getRank = (level: number, gangRole?: string | null): { title: string; next: { title: string; minLevel: number } | null } => {
    if (gangRole && GANG_ROLE_RANKS[gangRole]) return { title: GANG_ROLE_RANKS[gangRole], next: null }
    let idx = 0
    LEVEL_RANKS.forEach((r, i) => { if (level >= r.minLevel) idx = i })
    const next = LEVEL_RANKS[idx + 1]
    return { title: LEVEL_RANKS[idx].title, next: next ? { title: next.title, minLevel: next.minLevel } : null }
}
