// scripts/seedOpticsVocab.ts
//
// Словарный слой на теме "Оптика" (t_unit id=9). Паттерн тот же, см.
// seedKinematicsVocab.ts/seedElectrostaticsVocab.ts.
//
// У этой темы необычно много формул-РАВЕНСТВ (условия/законы без
// одной чётко выделенной величины слева) — они исключены из словаря по
// той же логике, что ЗСИ/ЗСЭ в Динамике/Закон Фарадея в Электродинамике,
// определяются по признаку "в исходном заголовке формулы нет `X=?`":
// - id=2103106001 "Закон преломления" (sinα1/sinα2 = n1/n2 = v1/v2)
// - id=2103106002 "Дифракция" (kλ = d sinα)
// - id=2103106003 "Угол полного отражения" (sinφ = 1/n)
// - id=2103106004 "Условие максимума" (2k·λ/2)
// - id=2103106005 "Условие минимума" ((2k+1)·λ/2)
// - id=2103106007 "Собирающая линза" (1/F = 1/f + 1/d)
// - id=2103106012/2103106013 "Фотоэффект Эйнштейна" (hν = A_вых + ...)
// Также пропущено id=2103106008 "Увеличение линзы" (Г = H/h = d/f) — в
// отличие от остальных формул темы, Г БЕЗРАЗМЕРНАЯ величина (отношение
// длин), а паттерн словаря везде подразумевает содержательный ответ на
// "В чём измеряется?" — прецедента для безразмерных величин в проекте
// ещё не было, решено не начинать с этой формулы.
//
// Новые уроки добавлены В КОНЕЦ (order 5-6), без переноса в начало темы.
//
// Безопасно запускать повторно НЕ гарантируется.

import db from "@/db/drizzle";
import { t_lessons, t_challenges, t_challengeOptions } from "@/db/schema";
import { eq } from "drizzle-orm";

const OPTICS_UNIT_ID = 9;
const AUTHOR = "Ф10 ФИЗИКА-10";

type Quantity = {
    symbol: string;
    name: string;
    unit: string;
};

async function createLesson(title: string, order: number): Promise<number> {
    const [lesson] = await db.insert(t_lessons).values({
        title,
        t_unitId: OPTICS_UNIT_ID,
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
    // --- Урок 5: свет в среде и линзы ---
    const lessonAId = await createLesson("Термины: свет в среде и линзы", 5);
    await duplicateFormulaChallenge(2103106006, lessonAId, 1); // v = c/n
    await duplicateFormulaChallenge(2103106009, lessonAId, 2); // D = 1/F
    await insertVocabSet(lessonAId, [
        { symbol: 'v', name: 'скорость света в среде', unit: 'м/с' },
        { symbol: 'D', name: 'оптическая сила линзы', unit: 'дптр' },
    ]);
    console.log(`Lesson A created: id=${lessonAId}`);

    // --- Урок 6: фотоны ---
    const lessonBId = await createLesson("Термины: фотоны", 6);
    await duplicateFormulaChallenge(2103106010, lessonBId, 1); // E = hν
    await duplicateFormulaChallenge(2103106011, lessonBId, 2); // E = hc/λ
    await duplicateFormulaChallenge(2103106014, lessonBId, 3); // A_вых = hc/λ_красн
    await duplicateFormulaChallenge(2103106015, lessonBId, 4); // p = E/c
    await duplicateFormulaChallenge(2103106016, lessonBId, 5); // p = h/λ
    await insertVocabSet(lessonBId, [
        { symbol: 'E', name: 'энергия фотона', unit: 'Дж' },
        { symbol: 'A_{вых}', name: 'работа выхода электронов', unit: 'Дж' },
        { symbol: 'p', name: 'импульс фотона', unit: 'кг·м/с' },
    ]);
    console.log(`Lesson B created: id=${lessonBId}`);

    // --- Урок 7: Контрольная 1 (мини-босс) ---
    const lessonCId = await createLesson("Контрольная 1", 7);
    const reviewFormulas = [
        2103106006, 2103106009,
        2103106010, 2103106011, 2103106014, 2103106015, 2103106016,
    ];
    for (let i = 0; i < reviewFormulas.length; i++) {
        await duplicateFormulaChallenge(reviewFormulas[i], lessonCId, i + 1);
    }
    console.log(`Lesson C (Контрольная 1) created: id=${lessonCId}`);

    console.log("\nDone.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
