// scripts/seedMathReference.ts
//
// Справочник по математике (courseId=11, "ЕГЭ Математика Профиль") — по
// прямой просьбе пользователя, по аналогии с уже существующим физическим
// справочником (scripts/seedPhysicsReference.ts). topic здесь ОБЯЗАН
// дословно совпадать с title соответствующего t_unit тренажёра "Математика-11"
// — именно по этому текстовому совпадению работает round-trip "Справочник"
// (trainer-grade-tree.tsx → /reference?topic=...) и "Потренировать"
// (reference-browser.tsx → /trainer?topic=...), без отдельного mapping.
//
// Разные темы наполнены РАЗНЫМИ способами, в зависимости от природы
// контента:
// - "Тригонометрическая окружность"/"Таблица 30,45,60"/"Геометрия: sin,
//   cos, tg" — маленькие наборы КОНКРЕТНЫХ фактов, вручную собранные (но
//   сверенные с реальными данными БД, не выдуманные).
// - "Как писать ответ" — механически вытянуты ВСЕ 48 задач юнита (каждое
//   конкретное значение sin/cos/tg/ctg действительно даёт СВОЙ ответ, не
//   повтор одной и той же формулы — бессмысленно сокращать).
// - "Логарифмы"/"Теорема Виета" — наоборот, 60/24 задачи юнита это
//   ЧИСЛЕННЫЕ повторы одного и того же небольшого набора законов (см.
//   названия уроков — сгруппированы по 4-6 повторов на один закон).
//   Справочнику нужен сам ЗАКОН в общем виде, а не десяток числовых
//   примеров подряд — законы получены обобщением РЕАЛЬНЫХ ответов задач
//   (не придуманы с нуля).
//
// ВАЖНАЯ НАХОДКА при сверке: урок "Степень в основании и аргументе"
// (Логарифмы) во ВСЕХ проверенных примерах хранит коэффициент n/m
// (показатель при основании / показатель при аргументе), тогда как
// математически верная формула log_{a^n}(b^m) = (m/n)·log_a(b) — то есть
// коэффициент должен быть m/n, НЕ n/m. Это уже отмечалось как подозрение
// в одном примере раньше в этой же сессии (CLAUDE.md) — теперь
// подтверждено на ВСЕХ 3 проверенных примерах, значит это не опечатка в
// одной задаче, а системная ошибка во всём уроке. Справочник ниже
// использует МАТЕМАТИЧЕСКИ ВЕРНУЮ формулу (m/n) — задачи самого урока
// (с обратным m/n↔n/m) НЕ трогались, это решение пользователя, чинить
// ли реальные задачи тренажёра.

import db from "@/db/drizzle"
import { t_units, t_lessons, t_challenges, t_challengeOptions, referenceEntries } from "@/db/schema"
import { eq, inArray } from "drizzle-orm"

const MATH_COURSE_ID = 11

type Entry = {
  topic: string
  label: string
  symbol: string
  name?: string | null
  unit?: string | null
  formula: string
}

const entries: Entry[] = []

// ===== Тригонометрическая окружность — перевод радиан/градусов =====
const CIRCLE_TOPIC = "Тригонометрическая окружность"
;[
  ["\\pi", "180°"],
  ["2\\pi", "360°"],
  ["\\dfrac{\\pi}{2}", "90°"],
  ["\\dfrac{\\pi}{3}", "60°"],
  ["\\dfrac{\\pi}{4}", "45°"],
  ["\\dfrac{\\pi}{6}", "30°"],
].forEach(([rad, deg]) => {
  entries.push({ topic: CIRCLE_TOPIC, label: "Перевод радиан ↔ градусов", symbol: rad, formula: deg })
})

// ===== Таблица 30, 45, 60 — значения sin/cos/tg =====
const TABLE_TOPIC = "Таблица 30, 45, 60"
;[
  ["\\sin 30°", "\\dfrac{1}{2}"],
  ["\\cos 30°", "\\dfrac{\\sqrt{3}}{2}"],
  ["\\operatorname{tg} 30°", "\\dfrac{\\sqrt{3}}{3}"],
  ["\\sin 45°", "\\dfrac{\\sqrt{2}}{2}"],
  ["\\cos 45°", "\\dfrac{\\sqrt{2}}{2}"],
  ["\\operatorname{tg} 45°", "1"],
  ["\\sin 60°", "\\dfrac{\\sqrt{3}}{2}"],
  ["\\cos 60°", "\\dfrac{1}{2}"],
  ["\\operatorname{tg} 60°", "\\sqrt{3}"],
].forEach(([sym, val]) => {
  entries.push({ topic: TABLE_TOPIC, label: "Значения на 30°/45°/60°", symbol: sym, formula: val })
})

// ===== Геометрия: sin, cos, tg — прямоугольный треугольник =====
const GEOM_TOPIC = "Геометрия: sin, cos, tg"
;[
  ["Катет, прилежащий к углу — через гипотенузу", "a", "c\\cdot\\cos\\alpha"],
  ["Катет, противолежащий углу — через гипотенузу", "b", "c\\cdot\\sin\\alpha"],
  ["Гипотенуза — через прилежащий катет", "c", "\\dfrac{a}{\\cos\\alpha}"],
  ["Гипотенуза — через противолежащий катет", "c", "\\dfrac{b}{\\sin\\alpha}"],
  ["Противолежащий катет — через прилежащий", "b", "a\\cdot\\operatorname{tg}\\alpha"],
  ["Прилежащий катет — через противолежащий", "a", "\\dfrac{b}{\\operatorname{tg}\\alpha}"],
].forEach(([label, sym, formula]) => {
  entries.push({ topic: GEOM_TOPIC, label, symbol: sym, formula })
})

// ===== Логарифмы — 7 законов в общем виде (обобщены из реальных задач) =====
const LOG_TOPIC = "Логарифмы"
;[
  ["Сложение логарифмов", "\\log_a M + \\log_a N", "\\log_a (MN)"],
  ["Вычитание логарифмов", "\\log_a M - \\log_a N", "\\log_a \\left(\\dfrac{M}{N}\\right)"],
  ["Переставленные основание и аргумент", "\\log_a b", "\\dfrac{1}{\\log_b a}"],
  // ВНИМАНИЕ: реальные задачи урока "Степень в основании и аргументе"
  // хранят обратный коэффициент n/m — см. комментарий в шапке файла.
  ["Степень в основании и аргументе", "\\log_{a^n} b^m", "\\dfrac{m}{n}\\log_a b"],
  ["Показатель степени — логарифм", "a^{\\log_b c}", "c^{\\log_b a}"],
  ["Частное логарифмов с общим основанием", "\\dfrac{\\log_a M}{\\log_a N}", "\\log_N M"],
  ["Произведение логарифмов (цепочка оснований)", "\\log_a b \\cdot \\log_b c", "\\log_a c"],
].forEach(([label, sym, formula]) => {
  entries.push({ topic: LOG_TOPIC, label, symbol: sym, formula })
})

// ===== Теорема Виета — сумма/произведение корней =====
const VIETA_TOPIC = "Теорема Виета"
;[
  ["Приведённое уравнение x²+px+q=0 — сумма корней", "x_1 + x_2", "-p"],
  ["Приведённое уравнение x²+px+q=0 — произведение корней", "x_1 \\cdot x_2", "q"],
  ["Общее уравнение ax²+bx+c=0 — сумма корней", "x_1 + x_2", "-\\dfrac{b}{a}"],
  ["Общее уравнение ax²+bx+c=0 — произведение корней", "x_1 \\cdot x_2", "\\dfrac{c}{a}"],
].forEach(([label, sym, formula]) => {
  entries.push({ topic: VIETA_TOPIC, label, symbol: sym, formula })
})

// Снять внешние "$...$"/"\large"/"\huge" и хвостовой "=?"/"= ?" — общий
// парсер вопросов юнита "Как писать ответ" (все 48 задач имеют формат
// "$ \large FORMULA = ? $"/"$ \large EXPR(x) = ? $").
function stripLatexWrap(raw: string): string {
  let s = raw.trim()
  if (s.startsWith("$") && s.endsWith("$")) s = s.slice(1, -1).trim()
  s = s.replace(/^\\(large|huge)\s*/, "").trim()
  s = s.replace(/=\s*\?\s*$/, "").trim()
  return s
}
function stripAnswerWrap(raw: string): string {
  let s = raw.trim()
  if (s.startsWith("$") && s.endsWith("$")) s = s.slice(1, -1).trim()
  return s
}

async function seedHowToAnswer() {
  const HOW_TOPIC = "Как писать ответ"
  const HOW_UNIT_ID = 15
  const lessons = await db.query.t_lessons.findMany({ where: eq(t_lessons.t_unitId, HOW_UNIT_ID) })
  const sortedLessons = [...lessons].sort((a, b) => a.order - b.order)
  for (const lesson of sortedLessons) {
    // "sin(x) = a — 1" → "sin(x) = a" (для соседней "— 2" даёт ТОТ же
    // label — это ожидаемо: обе половины одного и того же семейства
    // задач, просто разбитые на 2 урока по вместимости).
    const cleanLabel = lesson.title.replace(/\s*—\s*\d+$/, "").trim()
    const challenges = await db.query.t_challenges.findMany({ where: eq(t_challenges.t_lessonId, lesson.id) })
    for (const c of challenges) {
      const opts = await db.query.t_challengeOptions.findMany({ where: eq(t_challengeOptions.t_challengeId, c.id) })
      const correct = opts.find((o) => o.correct)
      if (!correct) continue
      entries.push({
        topic: HOW_TOPIC,
        label: cleanLabel,
        symbol: stripLatexWrap(c.question),
        formula: stripAnswerWrap(correct.text),
      })
    }
  }
}

async function main() {
  await seedHowToAnswer()

  const existing = await db.query.referenceEntries.findMany({ where: eq(referenceEntries.courseId, MATH_COURSE_ID) })
  if (existing.length > 0) {
    throw new Error(`У курса ${MATH_COURSE_ID} уже есть ${existing.length} строк справочника — скрипт не рассчитан на повторный запуск. Удалите вручную, если нужно пересоздать.`)
  }

  const values = entries.map((e, i) => ({
    courseId: MATH_COURSE_ID,
    topic: e.topic,
    label: e.label,
    symbol: e.symbol,
    name: e.name ?? null,
    unit: e.unit ?? null,
    formula: e.formula,
    imageSrc: null,
    order: i,
  }))

  await db.insert(referenceEntries).values(values)
  console.log(`Вставлено ${values.length} строк справочника по математике.`)
  const byTopic = new Map<string, number>()
  for (const e of entries) byTopic.set(e.topic, (byTopic.get(e.topic) ?? 0) + 1)
  for (const [topic, count] of byTopic) console.log(`  ${topic}: ${count}`)
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
