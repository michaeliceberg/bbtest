// lib/gangRating.ts
//
// Рейтинг банды (Фаза 3, MVP, 2026-09-29) — простая сумма по всем
// участникам (идея пользователя, по образцу Brawl Stars): gg-стикеры +
// число выполненных квестов дня за всю жизнь. Считается на лету по
// ростеру (см. db/queries.ts, getGangRoster/getAllGangsWithRoster) —
// ожидаемый размер банд мал для MVP, полный пересчёт не проблема.

export type GangRatingMember = {
	ggStickers: number
	questsTotal: number
}

export const computeGangRating = (members: GangRatingMember[]): number =>
	members.reduce((sum, m) => sum + m.ggStickers + m.questsTotal, 0)
