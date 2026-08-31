// scripts/seedElectrodynamicsVocab.ts
//
// Словарный слой на теме "Электродинамика" (t_unit id=8). Паттерн тот
// же, см. seedKinematicsVocab.ts/seedElectrostaticsVocab.ts.
//
// Сознательно НЕ вовлечены в словарь (и не дублируются в Контрольную):
// - id=2103105002 ("Закон Фарадея", ΔΦ/Δt = -ε_i) — равенство двух
//   связанных величин (закон), а не "величина = формула", тот же класс,
//   что ЗСИ/ЗСЭ в Динамике (см. CLAUDE.md) — исключено по той же логике.
// - id=2103105003 (W = CU²/2, "Энергия конденсатора") и id=2103105004
//   (W = Li²/2, "Энергия катушки") — ОБЕ формулы в исходных данных
//   используют один и тот же "голый" символ W без индекса, хотя это
//   физически РАЗНЫЕ величины (энергия эл. поля конденсатора vs энергия
//   магн. поля катушки) — если завести словарный вопрос "Что такое $W$?"
//   для обеих, получится один и тот же текст вопроса с двумя разными
//   "верными" ответами, что ломает словарный слой. Энергия конденсатора
//   (CU²/2) уже словарно покрыта в Электростатике (см.
//   seedElectrostaticsVocab.ts, урок "Термины: конденсатор") — здесь обе
//   формулы просто пропущены, без словаря и без дублирования в
//   Контрольную (сами формулы остаются доступны для повтора в
//   исходных Этап1/2, не трогались).
//
// Новые уроки добавлены В КОНЕЦ (order 5-8), без переноса в начало темы.
//
// Безопасно запускать повторно НЕ гарантируется.

import db from "@/db/drizzle";
import { t_lessons, t_challenges, t_challengeOptions } from "@/db/schema";
import { eq } from "drizzle-orm";

const ELECTRODYNAMICS_UNIT_ID = 8;
const AUTHOR = "Ф10 ФИЗИКА-10";

type Quantity = {
    symbol: string;
    name: string;
    unit: string;
};

async function createLesson(title: string, order: number): Promise<number> {
    const [lesson] = await db.insert(t_lessons).values({
        title,
        t_unitId: ELECTRODYNAMICS_UNIT_ID,
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
    // --- Урок 5: сила Ампера и Лоренца ---
    const lessonAId = await createLesson("Термины: сила Ампера и Лоренца", 5);
    await duplicateFormulaChallenge(2103105006, lessonAId, 1); // F_Лор = qvBsinα
    await duplicateFormulaChallenge(2103105007, lessonAId, 2); // F_А = BiLsinα
    await insertVocabSet(lessonAId, [
        { symbol: 'F_{Лор}', name: 'сила Лоренца', unit: 'Н' },
        { symbol: 'F_{А}', name: 'сила Ампера', unit: 'Н' },
    ]);
    console.log(`Lesson A created: id=${lessonAId}`);

    // --- Урок 6: ЭДС индукции и магнитный поток ---
    const lessonBId = await createLesson("Термины: ЭДС индукции и магнитный поток", 6);
    await duplicateFormulaChallenge(2103105005, lessonBId, 1); // ε_i = -LΔi/Δt
    await duplicateFormulaChallenge(2103105010, lessonBId, 2); // ε_i = vBLsinα
    await duplicateFormulaChallenge(2103105008, lessonBId, 3); // Φ = BScosα
    await duplicateFormulaChallenge(2103105009, lessonBId, 4); // Φ = Li
    await insertVocabSet(lessonBId, [
        { symbol: 'ε_{i}', name: 'ЭДС индукции', unit: 'В' },
        { symbol: 'Φ', name: 'магнитный поток', unit: 'Вб' },
    ]);
    console.log(`Lesson B created: id=${lessonBId}`);

    // --- Урок 7: период колебаний в контуре ---
    const lessonCId = await createLesson("Термины: период колебаний в контуре", 7);
    await duplicateFormulaChallenge(2103105001, lessonCId, 1); // T = 2π√(L/C)
    await insertVocabSet(lessonCId, [
        { symbol: 'T', name: 'период колебаний', unit: 'с' },
    ]);
    console.log(`Lesson C created: id=${lessonCId}`);

    // --- Урок 8: Контрольная 1 (мини-босс) ---
    const lessonDId = await createLesson("Контрольная 1", 8);
    const reviewFormulas = [
        2103105006, 2103105007,
        2103105005, 2103105010, 2103105008, 2103105009,
        2103105001,
    ];
    for (let i = 0; i < reviewFormulas.length; i++) {
        await duplicateFormulaChallenge(reviewFormulas[i], lessonDId, i + 1);
    }
    console.log(`Lesson D (Контрольная 1) created: id=${lessonDId}`);

    console.log("\nDone.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
