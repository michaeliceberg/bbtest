// lib/egeSections.ts — часть ЕГЭ по номеру задания в названии юнита задачника («14. Уравнения»).
// Только для курсов «ЕГЭ Математика…». Вторая часть (14–20) — по подписке PRO (lib/pro.ts).
export type EgeSection = 'part1' | 'part2' | 'extra'

export function egeSectionOf(courseTitle: string, unitTitle: string): EgeSection | null {
  if (!courseTitle.startsWith('ЕГЭ Математика')) return null
  const m = unitTitle.match(/^(\d+)\./)
  if (!m) return 'extra'
  return Number(m[1]) >= 14 ? 'part2' : 'part1'
}

export const isLearnUnitPro = (courseTitle: string, unitTitle: string) => egeSectionOf(courseTitle, unitTitle) === 'part2'
