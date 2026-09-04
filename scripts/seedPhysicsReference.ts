// scripts/seedPhysicsReference.ts
//
// Наполнение /reference (справочник формул) для физики. НЕ новый
// контент — строки извлекаются из уже существующих "Термины: ..."
// уроков тренажёра (t_challenges, t_unit "Термины: ..." лессоны, см.
// CLAUDE.md "Пилот content-generation"/"Словарный слой расширен...").
// Каждый такой урок устроен из троек вопросов с общим символом X:
//   "<Название> $ \huge X=? $"        -> формула (correct-опция)
//   "Что такое $X$?"                  -> имя величины
//   "В чём измеряется $X$?"           -> единица измерения
// Символ извлекается из LAST "$...$" сегмента каждого вопроса
// (устойчивее, чем парсить конкретный regex под \huge/\large — формат
// варьируется, но структура "$ ... X=? $" в конце — всегда одна).
//
// Безопасно перезапускать: перед вставкой стираются все reference_entries
// с тем же courseId.

import db from "@/db/drizzle";
import { t_lessons, t_challenges, referenceEntries } from "@/db/schema";
import { eq, like } from "drizzle-orm";

const PHYSICS_COURSE_ID = 12; // "ЕГЭ Физика"

type Meta = { name?: string; unit?: string };

const lastDollarSegment = (text: string): string | null => {
    const matches = Array.from(text.matchAll(/\$([^$]*)\$/g));
    if (matches.length === 0) return null;
    return matches[matches.length - 1][1];
};

const extractFormulaSymbol = (question: string): string | null => {
    const inner = lastDollarSegment(question);
    if (!inner) return null;
    return inner
        // \quad/\qquad — межсимвольные отступы, \uparrow/\downarrow —
        // те же стрелки, что уже учтены отдельно в extractLabel; все они
        // МОГУТ оказаться внутри того же единственного "$...$" сегмента,
        // что и сам символ (эти вопросы не разбиты на несколько $...$
        // пар, а один сплошной "$ \quad \huge X=? $") — первая версия
        // вырезала только \huge/\large и оставляла "\quad" прилипшим к
        // символу, из-за чего сопоставление с "Что такое $X$?" никогда
        // не совпадало (там символ уже чистый).
        .replace(/\\(huge|Huge|large|Large|quad|qquad|uparrow|downarrow)/g, '')
        .replace(/=\?/, '')
        .trim();
};

const extractLabel = (question: string): string => {
    let label = question.split('$')[0].trim();
    if (/\\uparrow/.test(question)) label += ' ↑';
    if (/\\downarrow/.test(question)) label += ' ↓';
    return label;
};

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Правильный ответ у одной задачи (theme "Оптика", D=1/F) в самой БД уже
// хранит "D = 1/F" целиком (не просто "1/F") — если добавить "D = "
// снаружи ещё раз, получится задвоенное "D = D = ...". Снимаем такой
// самоповторяющийся префикс "SYMBOL =", если он есть, вместо того чтобы
// чинить исходные данные трейнера (не наша ответственность).
const cleanFormula = (text: string, symbol: string): string => {
    let f = text
        .replace(/^\$|\$$/g, '')
        .replace(/\\(huge|Huge|large|Large)/g, '')
        .trim();
    const prefix = new RegExp(`^${escapeRegExp(symbol)}\\s*=\\s*`);
    f = f.replace(prefix, '').trim();
    return f;
};

async function main() {
    const lessons = await db.query.t_lessons.findMany({
        where: like(t_lessons.title, 'Термины:%'),
        with: { t_unit: true },
        orderBy: (l, { asc }) => asc(l.id),
    });

    const rows: (typeof referenceEntries.$inferInsert)[] = [];
    let globalOrder = 0;

    for (const lesson of lessons) {
        const topic = lesson.t_unit?.title ?? lesson.title;
        const challenges = await db.query.t_challenges.findMany({
            where: eq(t_challenges.t_lessonId, lesson.id),
            with: { t_challengeOptions: true },
            orderBy: (c, { asc }) => asc(c.order),
        });

        const meta = new Map<string, Meta>();
        for (const c of challenges) {
            const whatIs = c.question.match(/^Что такое \$(.+)\$\?$/);
            const unitQ = c.question.match(/^В чём измеряется \$(.+)\$\?$/);
            if (whatIs) {
                const symbol = whatIs[1].trim();
                const correct = c.t_challengeOptions.find((o) => o.correct)?.text;
                if (correct) meta.set(symbol, { ...meta.get(symbol), name: correct });
            } else if (unitQ) {
                const symbol = unitQ[1].trim();
                const correct = c.t_challengeOptions.find((o) => o.correct)?.text;
                if (correct) meta.set(symbol, { ...meta.get(symbol), unit: correct });
            }
        }

        for (const c of challenges) {
            const isWhatIs = /^Что такое/.test(c.question);
            const isUnit = /^В чём измеряется/.test(c.question);
            const isReverse = /^Что измеряется в/.test(c.question);
            if (isWhatIs || isUnit || isReverse) continue;

            const symbol = extractFormulaSymbol(c.question);
            const correctOption = c.t_challengeOptions.find((o) => o.correct)?.text;
            if (!symbol || !correctOption) continue;

            const label = extractLabel(c.question);
            const m = meta.get(symbol);
            rows.push({
                courseId: PHYSICS_COURSE_ID,
                topic,
                label,
                symbol,
                name: m?.name ?? label,
                unit: m?.unit ?? null,
                formula: cleanFormula(correctOption, symbol),
                order: globalOrder++,
            });
        }
    }

    await db.delete(referenceEntries).where(eq(referenceEntries.courseId, PHYSICS_COURSE_ID));
    if (rows.length > 0) {
        await db.insert(referenceEntries).values(rows);
    }

    console.log(`Inserted ${rows.length} reference entries across ${lessons.length} lessons.`);
    process.exit(0);
}

main();
