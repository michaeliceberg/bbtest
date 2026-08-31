// scripts/seedKinematicsVocab.ts
//
// Словарный слой (см. seedDynamicsVocabPilot.ts/seedDynamicsVocabPilot2.ts
// на теме "Динамика") — первое применение к ДРУГОЙ теме, "Кинематика"
// (t_unit id=5). Тот же паттерн: несколько уроков "Термины: ..." с
// дублями формул + словарными вопросами (Что такое / В чём измеряется /
// Что измеряется в) + финальная "Контрольная" (мини-босс, isReviewStage
// триггерится по слову "контрольная" в title) с чистым повтором всех
// формул темы без словаря.
//
// В отличие от первого пилота по Динамике — новые уроки НЕ переставлены
// в начало темы (order 1-3 у "Термины..."/"Контрольная"), а ДОБАВЛЕНЫ В
// КОНЕЦ (order 5-8, после уже существующих Этап1-4). Именно так, без
// переноса в начало, была без проблем принята ВТОРАЯ волна вокаб-уроков
// по Динамике (id 42-45, добавленные позже пилота) — специальная
// перестановка в начало была разовой правкой по прямой жалобе
// пользователя именно на ПЕРВую партию, не общим правилом.
//
// Безопасно запускать повторно НЕ гарантируется (как и предыдущие
// вокаб-скрипты) — создаёт новые строки при каждом запуске без проверки
// на дубли.

import db from "@/db/drizzle";
import { t_lessons, t_challenges, t_challengeOptions } from "@/db/schema";
import { eq } from "drizzle-orm";

const KINEMATICS_UNIT_ID = 5;
const AUTHOR = "Ф10 ФИЗИКА-10";

type Quantity = {
    symbol: string; // LaTeX без $
    name: string;   // именительный падеж
    unit: string;
};

async function createLesson(title: string, order: number): Promise<number> {
    const [lesson] = await db.insert(t_lessons).values({
        title,
        t_unitId: KINEMATICS_UNIT_ID,
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
    // --- Урок 5: координата, путь, ускорение (дубли из Этап 1) ---
    const lessonAId = await createLesson("Термины: координата, путь и ускорение", 5);
    await duplicateFormulaChallenge(2103102001, lessonAId, 1); // x
    await duplicateFormulaChallenge(2103102003, lessonAId, 2); // S
    await duplicateFormulaChallenge(2103102002, lessonAId, 3); // a
    await insertVocabSet(lessonAId, [
        { symbol: 'x', name: 'координата', unit: 'м' },
        { symbol: 'S', name: 'путь', unit: 'м' },
        { symbol: 'a', name: 'ускорение', unit: 'м/с²' },
    ]);
    console.log(`Lesson A created: id=${lessonAId}`);

    // --- Урок 6: движение по окружности (дубли из Этап 2 + Этап 3/4) ---
    const lessonBId = await createLesson("Термины: движение по окружности", 6);
    await duplicateFormulaChallenge(2103102004, lessonBId, 1); // ν
    await duplicateFormulaChallenge(2103102005, lessonBId, 2); // a_цс (вариант 1)
    await duplicateFormulaChallenge(2103102006, lessonBId, 3); // a_цс (вариант 2)
    await duplicateFormulaChallenge(2103102007, lessonBId, 4); // ω (вариант 1)
    await duplicateFormulaChallenge(2103102010, lessonBId, 5); // ω (вариант 2)
    await insertVocabSet(lessonBId, [
        { symbol: '\\nu', name: 'частота', unit: 'Гц' },
        { symbol: 'a_{цс}', name: 'центростремительное ускорение', unit: 'м/с²' },
        { symbol: '\\omega', name: 'угловая скорость', unit: 'рад/с' },
    ]);
    console.log(`Lesson B created: id=${lessonBId}`);

    // --- Урок 7: бросок под углом (дубли из Этап 3/4) ---
    const lessonCId = await createLesson("Термины: бросок под углом", 7);
    await duplicateFormulaChallenge(2103102008, lessonCId, 1); // L_max
    await duplicateFormulaChallenge(2103102009, lessonCId, 2); // H_max
    await insertVocabSet(lessonCId, [
        { symbol: 'L_{max}', name: 'дальность броска', unit: 'м' },
        { symbol: 'H_{max}', name: 'высота броска', unit: 'м' },
    ]);
    console.log(`Lesson C created: id=${lessonCId}`);

    // --- Урок 8: Контрольная 1 (мини-босс, микс всех 10 формул темы) ---
    const lessonDId = await createLesson("Контрольная 1", 8);
    const reviewFormulas = [
        2103102001, 2103102002, 2103102003,
        2103102004, 2103102005, 2103102006, 2103102007, 2103102010,
        2103102008, 2103102009,
    ];
    for (let i = 0; i < reviewFormulas.length; i++) {
        await duplicateFormulaChallenge(reviewFormulas[i], lessonDId, i + 1);
    }
    console.log(`Lesson D (Контрольная 1) created: id=${lessonDId}`);

    console.log("\nDone.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
