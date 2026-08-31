// scripts/seedGasHeatVocab.ts
//
// Словарный слой на теме "Газ и нагрев" (t_unit id=6). Паттерн тот же,
// см. seedKinematicsVocab.ts/seedElectrostaticsVocab.ts.
//
// Сознательно НЕ вовлечены в словарь (и не дублируются в Контрольную):
// - id=2103103001 "МДК" (PV=νRT) — уравнение Менделеева-Клапейрона,
//   равенство нескольких величин, не "величина=формула" (тот же класс,
//   что ЗСИ/ЗСЭ в Динамике).
// - id=2103103006 "Первый законТД" (Q=A+ΔU) — явно назван "законом" в
//   исходной подписи (в отличие от остальных формул темы, у которых в
//   заголовке `X=?`) — по этому признаку исключён, как и все law-formulas
//   в других темах.
// - id=2103103012/013/014 "КПД"/"КПД Карно" (η=...) и id=2103103020
//   "Влажность" (φ=...) — КПД и относительная влажность БЕЗРАЗМЕРНЫЕ
//   величины (доли/проценты) — тот же класс исключения, что "Увеличение
//   линзы" в Оптике (см. seedOpticsVocab.ts) — прецедента для
//   безразмерных величин в словарном слое ещё нет.
//
// "Q" (количество теплоты) — редкий случай ОДНОГО символа на ЧЕТЫРЕ
// формулы разных процессов (нагрев/плавление/испарение/сгорание) без
// индекса, отличающего их в исходных данных. В отличие от "W" в
// Электродинамике (энергия конденсатора vs катушки — это РАЗНЫЕ
// физические величины под одним символом, поэтому там формулы
// СОЗНАТЕЛЬНО пропущены) — здесь все 4 формулы физически вычисляют
// ОДНО и то же ("количество теплоты, переданное/выделившееся"), просто
// для разных процессов, поэтому валидно объединить их как ОДНУ величину
// с 4 формулами-дублями (аналогично P = m(g±a) для лифта в Динамике).
//
// Новые уроки добавлены В КОНЕЦ (order 5-8), без переноса в начало темы.
//
// Безопасно запускать повторно НЕ гарантируется.

import db from "@/db/drizzle";
import { t_lessons, t_challenges, t_challengeOptions } from "@/db/schema";
import { eq } from "drizzle-orm";

const GAS_HEAT_UNIT_ID = 6;
const AUTHOR = "Ф10 ФИЗИКА-10";

type Quantity = {
    symbol: string;
    name: string;
    unit: string;
};

async function createLesson(title: string, order: number): Promise<number> {
    const [lesson] = await db.insert(t_lessons).values({
        title,
        t_unitId: GAS_HEAT_UNIT_ID,
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
    // --- Урок 5: давление и плотность газа ---
    const lessonAId = await createLesson("Термины: давление и плотность газа", 5);
    await duplicateFormulaChallenge(2103103002, lessonAId, 1); // p = (2/3)nE_кин
    await duplicateFormulaChallenge(2103103009, lessonAId, 2); // p = nk_БT
    await duplicateFormulaChallenge(2103103005, lessonAId, 3); // ρ = m/V
    await duplicateFormulaChallenge(2103103016, lessonAId, 4); // n = N/V
    await insertVocabSet(lessonAId, [
        { symbol: 'p', name: 'давление идеального газа', unit: 'Па' },
        { symbol: '\\rho', name: 'плотность', unit: 'кг/м³' },
        { symbol: 'n', name: 'концентрация молекул', unit: 'м⁻³' },
    ]);
    console.log(`Lesson A created: id=${lessonAId}`);

    // --- Урок 6: энергия молекул ---
    const lessonBId = await createLesson("Термины: энергия молекул", 6);
    await duplicateFormulaChallenge(2103103003, lessonBId, 1); // E = (3/2)k_Б T
    await duplicateFormulaChallenge(2103103010, lessonBId, 2); // E_кин = m<v²>/2
    await duplicateFormulaChallenge(2103103011, lessonBId, 3); // <v> = √(3RT/μ)
    await insertVocabSet(lessonBId, [
        { symbol: 'E', name: 'средняя энергия теплового движения молекулы', unit: 'Дж' },
        { symbol: 'E_{кин}', name: 'кинетическая энергия молекулы', unit: 'Дж' },
        { symbol: '<v>', name: 'средняя квадратичная скорость молекул', unit: 'м/с' },
    ]);
    console.log(`Lesson B created: id=${lessonBId}`);

    // --- Урок 7: количество вещества и внутренняя энергия ---
    const lessonCId = await createLesson("Термины: количество вещества и внутренняя энергия", 7);
    await duplicateFormulaChallenge(2103103004, lessonCId, 1); // ν = N/N_A
    await duplicateFormulaChallenge(2103103021, lessonCId, 2); // ν = m/μ
    await duplicateFormulaChallenge(2103103007, lessonCId, 3); // ΔU = (3/2)νRΔT
    await duplicateFormulaChallenge(2103103008, lessonCId, 4); // A = pΔV
    await insertVocabSet(lessonCId, [
        { symbol: '\\nu', name: 'количество вещества', unit: 'моль' },
        { symbol: '\\triangle U', name: 'изменение внутренней энергии', unit: 'Дж' },
        { symbol: 'A', name: 'работа газа', unit: 'Дж' },
    ]);
    console.log(`Lesson C created: id=${lessonCId}`);

    // --- Урок 8: количество теплоты ---
    const lessonDId = await createLesson("Термины: количество теплоты", 8);
    await duplicateFormulaChallenge(2103103017, lessonDId, 1); // Q = cmΔT (нагрев)
    await duplicateFormulaChallenge(2103103018, lessonDId, 2); // Q = λm (плавление)
    await duplicateFormulaChallenge(2103103019, lessonDId, 3); // Q = Lm (испарение)
    await duplicateFormulaChallenge(2103103022, lessonDId, 4); // Q = qm (сгорание)
    await duplicateFormulaChallenge(2103103015, lessonDId, 5); // A_пол = Qн-Qх
    await insertVocabSet(lessonDId, [
        { symbol: 'Q', name: 'количество теплоты', unit: 'Дж' },
        { symbol: 'A_{пол}', name: 'полезная работа', unit: 'Дж' },
    ]);
    console.log(`Lesson D created: id=${lessonDId}`);

    // --- Урок 9: Контрольная 1 (мини-босс) ---
    const lessonEId = await createLesson("Контрольная 1", 9);
    const reviewFormulas = [
        2103103002, 2103103009, 2103103005, 2103103016,
        2103103003, 2103103010, 2103103011,
        2103103004, 2103103021, 2103103007, 2103103008,
        2103103017, 2103103018, 2103103019, 2103103022, 2103103015,
    ];
    for (let i = 0; i < reviewFormulas.length; i++) {
        await duplicateFormulaChallenge(reviewFormulas[i], lessonEId, i + 1);
    }
    console.log(`Lesson E (Контрольная 1) created: id=${lessonEId}`);

    console.log("\nDone.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
