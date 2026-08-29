// scripts/seedDynamicsVocabPilot2.ts
//
// Расширение словарного слоя (см. seedDynamicsVocabPilot.ts, пилот на
// 5 формул темы "Динамика") на ОСТАЛЬНЫЕ формулы той же темы: Этап1
// (энергия/импульс), Этап3 (2-й закон Ньютона), Этап4 (вес в лифте +
// периоды колебаний маятников). ЗСИ/ЗСЭ (тоже Этап3) сознательно
// ПРОПУЩЕНЫ — это законы (текст равенства двух состояний), а не
// "величина = формула", модель Quantity{symbol,name,unit} для них не
// подходит естественно (см. CLAUDE.md, "подумать про гранулярность
// тэгов" — решение по ним отложено, не начато в этой сессии).
//
// Тот же паттерн, что и в исходном пилоте: несколько новых уроков-тем +
// финальная "Контрольная" (мини-босс, isReviewStage триггерится по
// слову "контрольная" в title) с чистым повтором формул без словаря.
// Формулы ДУБЛИРУЮТСЯ из уже существующих Этап1/3/4 (те не трогаются).
//
// P (вес тела в лифте вверх/вниз) и T (период колебаний мат./пруж.
// маятника) — ОДНА и та же величина на ДВЕ формулы каждая, поэтому в
// списках quantities ниже перечислены ПО ОДНОМУ разу — тот же приём,
// что уже был у "давления" (P = F/S и P = ρgh) в исходном пилоте.
//
// Безопасно запускать повторно НЕ гарантируется (как и оригинал) —
// создаёт новые строки при каждом запуске без проверки на дубли.

import db from "@/db/drizzle";
import { t_lessons, t_challenges, t_challengeOptions } from "@/db/schema";
import { eq } from "drizzle-orm";

const DYNAMICS_UNIT_ID = 4;
const AUTHOR = "Ф10 ФИЗИКА-10";

type Quantity = {
    symbol: string; // LaTeX без $
    name: string;   // именительный падеж
    unit: string;
};

async function createLesson(title: string, order: number): Promise<number> {
    const [lesson] = await db.insert(t_lessons).values({
        title,
        t_unitId: DYNAMICS_UNIT_ID,
        order,
    }).returning({ id: t_lessons.id });
    return lesson.id;
}

async function duplicateFormulaChallenge(sourceId: number, targetLessonId: number, order: number) {
    const source = await db.query.t_challenges.findFirst({
        where: eq(t_challenges.id, sourceId),
        with: { t_challengeOptions: true },
    });
    if (!source) throw new Error(`Source challenge ${sourceId} not found`);

    const [newChallenge] = await db.insert(t_challenges).values({
        t_lessonId: targetLessonId,
        type: source.type,
        question: source.question,
        order,
        points: source.points,
        author: source.author,
        numRans: source.numRans,
        difficulty: source.difficulty,
        imageSrc: source.imageSrc,
    }).returning({ id: t_challenges.id });

    if (source.t_challengeOptions.length > 0) {
        await db.insert(t_challengeOptions).values(
            source.t_challengeOptions.map((o) => ({
                t_challengeId: newChallenge.id,
                text: o.text,
                correct: o.correct,
                imageSrc: o.imageSrc,
                audioSrc: o.audioSrc,
            }))
        );
    }
    return newChallenge.id;
}

async function insertVocabChallenge(lessonId: number, order: number, question: string, correctAnswers: string[]) {
    const [ch] = await db.insert(t_challenges).values({
        t_lessonId: lessonId,
        type: 'M_ASC',
        question,
        order,
        points: 10,
        author: AUTHOR,
        numRans: '1',
        difficulty: '1',
        imageSrc: '0',
    }).returning({ id: t_challenges.id });

    await db.insert(t_challengeOptions).values(
        correctAnswers.map((text) => ({
            t_challengeId: ch.id,
            text,
            correct: true,
        }))
    );
}

async function insertVocabSet(lessonId: number, quantities: Quantity[]) {
    let order = 1;
    for (const q of quantities) {
        await insertVocabChallenge(lessonId, order++, `Что такое $${q.symbol}$?`, [q.name]);
        await insertVocabChallenge(lessonId, order++, `В чём измеряется $${q.symbol}$?`, [q.unit]);
    }

    const byUnit = new Map<string, string[]>();
    for (const q of quantities) {
        const names = byUnit.get(q.unit) ?? [];
        if (!names.includes(q.name)) names.push(q.name);
        byUnit.set(q.unit, names);
    }
    for (const [unit, names] of byUnit) {
        await insertVocabChallenge(lessonId, order++, `Что измеряется в $${unit}$?`, names);
    }
}

async function main() {
    // --- Урок 4: энергия и импульс (дубли из Этап 1) ---
    const lesson4Id = await createLesson("Термины: энергия и импульс", 8);
    await duplicateFormulaChallenge(2103101001, lesson4Id, 1); // E_кин = mv²/2
    await duplicateFormulaChallenge(2103101002, lesson4Id, 2); // E_пот = mgh
    await duplicateFormulaChallenge(2103101003, lesson4Id, 3); // E_пруж = kΔx²/2
    await duplicateFormulaChallenge(2103101004, lesson4Id, 4); // p = m·v
    await insertVocabSet(lesson4Id, [
        { symbol: 'E_{кин}', name: 'кинетическая энергия', unit: 'Дж' },
        { symbol: 'E_{пот}', name: 'потенциальная энергия', unit: 'Дж' },
        { symbol: 'E_{пруж}', name: 'энергия пружины', unit: 'Дж' },
        { symbol: 'p', name: 'импульс тела', unit: 'кг·м/с' },
    ]);
    console.log(`Lesson 4 created: id=${lesson4Id}`);

    // --- Урок 5: сила Ньютона и вес в лифте (дубли из Этап 3 + Этап 4) ---
    const lesson5Id = await createLesson("Термины: сила и вес", 9);
    await duplicateFormulaChallenge(2103101012, lesson5Id, 1); // F = ma
    await duplicateFormulaChallenge(2103101013, lesson5Id, 2); // P = m(g+a)
    await duplicateFormulaChallenge(2103101014, lesson5Id, 3); // P = m(g-a)
    await insertVocabSet(lesson5Id, [
        { symbol: 'F', name: 'равнодействующая сила', unit: 'Н' },
        { symbol: 'P', name: 'вес тела', unit: 'Н' },
    ]);
    console.log(`Lesson 5 created: id=${lesson5Id}`);

    // --- Урок 6: период колебаний (дубли из Этап 4) ---
    const lesson6Id = await createLesson("Термины: период колебаний", 10);
    await duplicateFormulaChallenge(2103101015, lesson6Id, 1); // T = 2π√(L/g)
    await duplicateFormulaChallenge(2103101016, lesson6Id, 2); // T = 2π√(m/k)
    await insertVocabSet(lesson6Id, [
        { symbol: 'T', name: 'период колебаний', unit: 'с' },
    ]);
    console.log(`Lesson 6 created: id=${lesson6Id}`);

    // --- Урок 7: Контрольная 2 (мини-босс, микс всех 9 формул выше) ---
    const lesson7Id = await createLesson("Контрольная 2", 11);
    const reviewFormulas = [
        2103101001, 2103101002, 2103101003, 2103101004,
        2103101012, 2103101013, 2103101014,
        2103101015, 2103101016,
    ];
    for (let i = 0; i < reviewFormulas.length; i++) {
        await duplicateFormulaChallenge(reviewFormulas[i], lesson7Id, i + 1);
    }
    console.log(`Lesson 7 (Контрольная 2) created: id=${lesson7Id}`);

    console.log("\nDone.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
