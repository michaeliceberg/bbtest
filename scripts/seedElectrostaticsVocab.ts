// scripts/seedElectrostaticsVocab.ts
//
// Словарный слой (см. seedDynamicsVocabPilot.ts/seedKinematicsVocab.ts)
// на теме "Электростатика" (t_unit id=7). Тот же паттерн: несколько
// уроков "Термины: ..." с дублями формул + словарными вопросами (Что
// такое / В чём измеряется / Что измеряется в) + финальная "Контрольная"
// (мини-босс) с чистым повтором всех вовлечённых формул без словаря.
// Новые уроки ДОБАВЛЕНЫ В КОНЕЦ (order 5-8), без переноса в начало темы
// (см. комментарий в seedKinematicsVocab.ts почему).
//
// Сознательно НЕ вовлечены в словарь (остаются только формулами для
// повтора в уже существующих Этап1-4, не дублируются и сюда):
// - id=2103104010 (T = 2π√(L/C), "Период колебаний" в контуре) —
//   формула про колебательный контур логичнее относится к теме
//   "Электродинамика" (см. seedElectrodynamicsVocab.ts, там она и
//   получает свой словарный урок); та же формула физически дублируется
//   в исходных данных под id=2103105001 в Электродинамике.
// - id=2103104016 ("Закон Ампера", i = ε/(R+r)) — при сверке с формулой
//   выяснилось, что это на самом деле закон Ома для полной цепи, а не
//   закон Ампера (предсуществующая неточность подписи в исходных данных,
//   не трогалась) — но физически это ТРЕТЬЯ формула для той же величины
//   "сила тока" (i), что и 017/018, поэтому дублируется как формула той
//   же величины "i", отдельного словарного вопроса не требует.
//
// Безопасно запускать повторно НЕ гарантируется — создаёт новые строки
// при каждом запуске без проверки на дубли.

import db from "@/db/drizzle";
import { t_lessons, t_challenges, t_challengeOptions } from "@/db/schema";
import { eq } from "drizzle-orm";

const ELECTROSTATICS_UNIT_ID = 7;
const AUTHOR = "Ф10 ФИЗИКА-10";

type Quantity = {
    symbol: string;
    name: string;
    unit: string;
};

async function createLesson(title: string, order: number): Promise<number> {
    const [lesson] = await db.insert(t_lessons).values({
        title,
        t_unitId: ELECTROSTATICS_UNIT_ID,
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
    // --- Урок 5: сила и напряжённость поля ---
    const lessonAId = await createLesson("Термины: сила и напряжённость поля", 5);
    await duplicateFormulaChallenge(2103104001, lessonAId, 1); // F_Кул = kq1q2/r²
    await duplicateFormulaChallenge(2103104019, lessonAId, 2); // F_Кул = Eq
    await duplicateFormulaChallenge(2103104002, lessonAId, 3); // E = kq/r²
    await duplicateFormulaChallenge(2103104006, lessonAId, 4); // E = U/d
    await duplicateFormulaChallenge(2103104003, lessonAId, 5); // φ = kq/r
    await insertVocabSet(lessonAId, [
        { symbol: 'F_{Кул}', name: 'сила Кулона', unit: 'Н' },
        { symbol: 'E', name: 'напряжённость электрического поля', unit: 'Н/Кл' },
        { symbol: '\\phi', name: 'потенциал электрического поля', unit: 'В' },
    ]);
    console.log(`Lesson A created: id=${lessonAId}`);

    // --- Урок 6: конденсатор ---
    const lessonBId = await createLesson("Термины: конденсатор", 6);
    await duplicateFormulaChallenge(2103104004, lessonBId, 1); // C = εε0S/d
    await duplicateFormulaChallenge(2103104005, lessonBId, 2); // C = q/U
    await duplicateFormulaChallenge(2103104007, lessonBId, 3); // W = CU²/2
    await duplicateFormulaChallenge(2103104008, lessonBId, 4); // W = q²/2C
    await duplicateFormulaChallenge(2103104009, lessonBId, 5); // W = qU/2
    await insertVocabSet(lessonBId, [
        { symbol: 'C', name: 'электроёмкость конденсатора', unit: 'Ф' },
        { symbol: 'W', name: 'энергия конденсатора', unit: 'Дж' },
    ]);
    console.log(`Lesson B created: id=${lessonBId}`);

    // --- Урок 7: ток в цепи ---
    const lessonCId = await createLesson("Термины: ток в цепи", 7);
    await duplicateFormulaChallenge(2103104011, lessonCId, 1);  // A = εΔq
    await duplicateFormulaChallenge(2103104012, lessonCId, 2);  // R = ρL/S
    await duplicateFormulaChallenge(2103104013, lessonCId, 3);  // N = Ui
    await duplicateFormulaChallenge(2103104014, lessonCId, 4);  // N = i²R
    await duplicateFormulaChallenge(2103104015, lessonCId, 5);  // N = U²/R
    await duplicateFormulaChallenge(2103104017, lessonCId, 6);  // i = q/t
    await duplicateFormulaChallenge(2103104018, lessonCId, 7);  // i = U/R
    await duplicateFormulaChallenge(2103104016, lessonCId, 8);  // i = ε/(R+r)
    await insertVocabSet(lessonCId, [
        { symbol: 'A', name: 'работа источника тока', unit: 'Дж' },
        { symbol: 'R', name: 'сопротивление проводника', unit: 'Ом' },
        { symbol: 'N', name: 'мощность тока', unit: 'Вт' },
        { symbol: 'i', name: 'сила тока', unit: 'А' },
    ]);
    console.log(`Lesson C created: id=${lessonCId}`);

    // --- Урок 8: Контрольная 1 (мини-босс, микс всех вовлечённых формул) ---
    const lessonDId = await createLesson("Контрольная 1", 8);
    const reviewFormulas = [
        2103104001, 2103104019, 2103104002, 2103104006, 2103104003,
        2103104004, 2103104005, 2103104007, 2103104008, 2103104009,
        2103104011, 2103104012, 2103104013, 2103104014, 2103104015,
        2103104017, 2103104018, 2103104016,
    ];
    for (let i = 0; i < reviewFormulas.length; i++) {
        await duplicateFormulaChallenge(reviewFormulas[i], lessonDId, i + 1);
    }
    console.log(`Lesson D (Контрольная 1) created: id=${lessonDId}`);

    console.log("\nDone.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
