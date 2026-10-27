// lib/rank.ts
//
// «Звание» ученика (показывается в /account) — армия гусиков Команданте Мигеля
// (решение 2026-10-27: уходим от мафии — капо/дон/крёстный отец — к революционной теме).
// Пока ученик не в банде, звание растёт вместе с уровнем (lib/xp.ts): начинаем с
// «Новобранца». В банде звание берётся из роли: глава — «Команданте», капо — «Капитан»,
// обычный участник — «Компаньеро». В БД роли по-прежнему leader / kapo / member.
// Порог — минимальный уровень, с которого действует звание.

export const LEVEL_RANKS: { minLevel: number; title: string }[] = [
    { minLevel: 1, title: 'Новобранец' },
    { minLevel: 2, title: 'Гусёнок' },
    { minLevel: 3, title: 'Рядовой гусик' },
    { minLevel: 5, title: 'Связной' },
    { minLevel: 7, title: 'Разведчик' },
    { minLevel: 9, title: 'Сапёр формул' },
    { minLevel: 12, title: 'Ефрейтор' },
    { minLevel: 15, title: 'Сержант' },
    { minLevel: 18, title: 'Старшина' },
    { minLevel: 22, title: 'Партизан' },
    { minLevel: 26, title: 'Лейтенант' },
    { minLevel: 30, title: 'Старший лейтенант' },
    { minLevel: 35, title: 'Майор' },
    { minLevel: 41, title: 'Полковник' },
    { minLevel: 48, title: 'Генерал интегралов' },
    { minLevel: 55, title: 'Маршал пределов' },
    { minLevel: 62, title: 'Имба' },
    { minLevel: 70, title: 'Герой революции' },
    { minLevel: 80, title: 'Легенда физтеха' },
    { minLevel: 95, title: 'Команданте' },
]

export const GANG_ROLE_RANKS: Record<string, string> = {
    leader: 'Команданте',
    kapo: 'Капитан',
    member: 'Компаньеро',
}

export const getRank = (level: number, gangRole?: string | null): { title: string; next: { title: string; minLevel: number } | null } => {
    if (gangRole && GANG_ROLE_RANKS[gangRole]) return { title: GANG_ROLE_RANKS[gangRole], next: null }
    let idx = 0
    LEVEL_RANKS.forEach((r, i) => { if (level >= r.minLevel) idx = i })
    const next = LEVEL_RANKS[idx + 1]
    return { title: LEVEL_RANKS[idx].title, next: next ? { title: next.title, minLevel: next.minLevel } : null }
}
