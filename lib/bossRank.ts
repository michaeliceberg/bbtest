// Ранги босс-экзамена по числу побед.
export const BOSS_RANKS = [
    { min: 20, title: 'Шаолинь', color: '#F5C542', hue: 200 },
    { min: 10, title: 'Мастер', color: '#C385F7', hue: 250 },
    { min: 6, title: 'Воин', color: '#53ADEF', hue: 160 },
    { min: 3, title: 'Ученик', color: '#5CC99F', hue: 90 },
    { min: 1, title: 'Новичок', color: '#F09B38', hue: 0 },
] as const

export const getBossRank = (wins: number) => BOSS_RANKS.find((r) => wins >= r.min) ?? null
