// scripts/seedDiagnosticTest.ts
//
// Наполняет diagnostic_questions "снимками" реальных заданий тренажёра
// (t_challenges) — берётся вопрос + правильный ответ + несколько
// обманок из соседних заданий той же темы, и всё это сохраняется как
// самодостаточная строка (без runtime-зависимости от сложного
// рендер-пайплайна тренажёра — см. общий комментарий в db/schema.ts).
//
// Использование: впишите id нужных t_challenges в MATH_CHALLENGE_IDS /
// PHYSICS_CHALLENGE_IDS ниже (по одному на каждую тему теста, в желаемом
// порядке — от лёгких к сложным) и запустите:
//   npx tsx scripts/seedDiagnosticTest.ts
// Скрипт идемпотентен — при повторном запуске полностью пересобирает
// вопросы для обоих предметов (старые строки того предмета удаляются).
//
// Поддерживаются только "простые" типы t_challenges (M_ASC и уже
// зафиксированные в БД ASSIST/CONNECT/INSERT/SWIPE/SCROLL/PICMATCH) —
// у них ответ это t_challengeOptions с текстом. Сложные JSON-типы
// (MULTISTEP/FRACTRICK/TRIGTABLE/UNITCIRCLE/VIETA) и матчинг-типы
// (CONSTRUCT/SELECT/CHECK) не подходят для диагностики "выбери один
// вариант из четырёх" — скрипт остановится с понятной ошибкой, если
// такой id попадётся, вместо того чтобы тихо сгенерировать нерабочий
// вопрос.

import db from "@/db/drizzle";
import { t_challenges, t_lessons, t_units, diagnosticQuestions } from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";

// ЗАПОЛНИТЕ ЭТИ ДВА СПИСКА РЕАЛЬНЫМИ id ЗАДАЧ ИЗ ТРЕНАЖЁРА (t_challenges.id)
const MATH_CHALLENGE_IDS: number[] = [];
const PHYSICS_CHALLENGE_IDS: number[] = [];

const SIMPLE_TYPES = new Set([
  "M_ASC", "ASSIST", "CONNECT", "INSERT", "SWIPE", "SCROLL", "PICMATCH",
]);

const OPTIONS_PER_QUESTION = 4;

function getRandomElements<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

const looksLikeFormula = (text: string): boolean => text.includes("$");
const sameAnswerGenre = (a: string, b: string): boolean => looksLikeFormula(a) === looksLikeFormula(b);

async function buildQuestion(challengeId: number, order: number, subject: "math" | "physics") {
  const challenge = await db.query.t_challenges.findFirst({
    where: eq(t_challenges.id, challengeId),
    with: { t_challengeOptions: true },
  });
  if (!challenge) throw new Error(`t_challenge id=${challengeId} не найден`);
  if (!SIMPLE_TYPES.has(challenge.type)) {
    throw new Error(
      `t_challenge id=${challengeId} имеет тип "${challenge.type}" — не подходит для диагностики ` +
      `(поддерживаются только: ${[...SIMPLE_TYPES].join(", ")}). Выберите другую задачу.`
    );
  }

  const correctOption = challenge.t_challengeOptions.find((o) => o.correct);
  if (!correctOption) throw new Error(`t_challenge id=${challengeId} — нет правильного варианта ответа`);
  // Каноничный ответ — первая часть до "|" (см. конвенцию OR-синонимов в проекте)
  const correctText = correctOption.text.split("|")[0].trim();

  const lesson = await db.query.t_lessons.findFirst({ where: eq(t_lessons.id, challenge.t_lessonId) });
  if (!lesson) throw new Error(`t_lesson для t_challenge id=${challengeId} не найден`);
  const unit = await db.query.t_units.findFirst({ where: eq(t_units.id, lesson.t_unitId) });
  if (!unit) throw new Error(`t_unit для t_challenge id=${challengeId} не найден`);

  const firstLesson = await db.query.t_lessons.findFirst({
    where: eq(t_lessons.t_unitId, unit.id),
    orderBy: (l, { asc }) => [asc(l.order)],
  });

  // Обманки — из соседних задач той же темы (t_unit), того же жанра
  // (формула vs обычный текст), с текстом, отличным от правильного.
  const siblingLessons = await db.query.t_lessons.findMany({ where: eq(t_lessons.t_unitId, unit.id) });
  const siblingLessonIds = siblingLessons.map((l) => l.id);
  const siblingChallenges = await db.query.t_challenges.findMany({
    where: inArray(t_challenges.t_lessonId, siblingLessonIds),
    with: { t_challengeOptions: true },
  });

  const distractorPool = siblingChallenges
    .filter((c) => c.id !== challenge.id && SIMPLE_TYPES.has(c.type))
    .map((c) => c.t_challengeOptions.find((o) => o.correct)?.text.split("|")[0].trim())
    .filter((text): text is string => !!text && text !== correctText)
    .filter((text, idx, arr) => arr.indexOf(text) === idx) // dedupe
    .filter((text) => sameAnswerGenre(text, correctText));

  const distractors = getRandomElements(distractorPool, OPTIONS_PER_QUESTION - 1);
  if (distractors.length < OPTIONS_PER_QUESTION - 1) {
    console.warn(
      `  ⚠ id=${challengeId}: только ${distractors.length} обманок из ${OPTIONS_PER_QUESTION - 1} ` +
      `(в теме "${unit.title}" не хватает похожих соседей) — вопрос выйдет с ${distractors.length + 1} вариантами`
    );
  }

  const options = [{ text: correctText, correct: true }, ...distractors.map((text) => ({ text, correct: false }))];

  return {
    subject,
    order,
    t_unitId: unit.id,
    t_unitTitle: unit.title,
    firstTLessonId: firstLesson?.id ?? null,
    t_challengeId: challenge.id,
    question: challenge.question,
    optionsJson: JSON.stringify(options),
  };
}

async function seedSubject(subject: "math" | "physics", ids: number[]) {
  if (ids.length === 0) {
    console.log(`[${subject}] список id пуст — пропускаю (старые строки не трогаю)`);
    return;
  }
  const rows = [];
  for (let i = 0; i < ids.length; i++) {
    rows.push(await buildQuestion(ids[i], i + 1, subject));
  }
  await db.delete(diagnosticQuestions).where(eq(diagnosticQuestions.subject, subject));
  await db.insert(diagnosticQuestions).values(rows);
  console.log(`[${subject}] засеяно ${rows.length} вопросов`);
}

async function main() {
  await seedSubject("math", MATH_CHALLENGE_IDS);
  await seedSubject("physics", PHYSICS_CHALLENGE_IDS);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
