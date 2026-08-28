// scripts/seedDynamicsVocabPilot.ts
//
// Пилот content-generation архитектуры (обсуждение с пользователем,
// 2026-08-28): вместо того чтобы формулы существовали в тренажёре только
// как "узнай формулу" M_ASC-задачи, к каждой формуле добавляется
// СЛОВАРНЫЙ слой — "Что такое X?" (название величины) и "В чём измеряется
// X?" (единица), плюс обратный вопрос "Что измеряется в <единице>?"
// (склеен через "|", если у единицы несколько названий-величин в уроке —
// см. usefulFunctions.isCorrectAnswer). Всё это — обычные M_ASC-задачи,
// переиспользующие существующий рендер/дистракторный пайплайн, никаких
// новых типов данных не потребовалось.
//
// Урок 1 и 2 — НОВЫЕ уроки (не трогают существующие "Этап 1-4" со всеми
// 16 формулами темы — те остаются как есть). Формулы в них ДУБЛИРУЮТСЯ
// (не переносятся) из уже существующих challenges тем же способом, что
// использует POST /api/admin/t-challenges/[id]/duplicate — оригиналы в
// "Этап 2"/"Этап 3" не трогаются.
//
// Урок 3 "Контрольная 1" — мини-повтор всех 5 формул уроков 1+2 (без
// словарных вопросов, чисто "узнай формулу"), с мини-боссом (isReviewStage
// в trainer-grade-tree.tsx триггерится по слову "контрольная" в title).
//
// Безопасно запускать повторно НЕ гарантируется — скрипт создаёт новые
// строки при каждом запуске без проверки на дубли (одноразовый пилот).

import db from "@/db/drizzle";
import { eq, inArray } from "drizzle-orm";
import { t_lessons, t_challenges, t_challengeOptions } from "@/db/schema";

const DYNAMICS_UNIT_ID = 4;
const AUTHOR = "Ф10 ФИЗИКА-10";

type Quantity = {
    symbol: string; // LaTeX без $, напр. 'F_{тяж}'
    name: string;   // именительный падеж, напр. 'сила тяжести'
    unit: string;   // напр. 'Н'
};

async function createLesson(title: string, order: number): Promise<number> {
    const [lesson] = await db.insert(t_lessons).values({
        title,
        t_unitId: DYNAMICS_UNIT_ID,
        order,
    }).returning({ id: t_lessons.id });
    return lesson.id;
}

// Копия формулы-challenge (вопрос + все опции) в новый урок — тот же
// паттерн, что POST /api/admin/t-challenges/[id]/duplicate.
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

// correctAnswers — обычно одна строка; для неоднозначных обратных
// вопросов ("Что измеряется в Н?") — НЕСКОЛЬКО, каждая своей строкой
// t_challengeOptions с correct=true. getCorrectAnswerText() в page.tsx
// сама склеит их через "|" при чтении для сравнения ответа — здесь
// склеивать НЕЛЬЗЯ: t_challengeOptions[0].text используется и как
// отображаемый текст кнопки-варианта (и как обманка в СОСЕДНИХ вопросах
// урока), поэтому там должно быть ровно ОДНО каноничное значение, не
// сырая строка "a|b".
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

// "Что такое X?" + "В чём измеряется X?" на каждую величину, плюс один
// обратный вопрос "Что измеряется в <единице>?" на каждую РАЗЛИЧНУЮ
// единицу измерения в наборе (склейка через "|", если величин с этой
// единицей несколько — см. usefulFunctions.isCorrectAnswer).
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
    // Убираем тестовый мусор ("3+3"/"1+1"), оставшийся от прошлой сессии
    // (отладка бага змейки карты скиллов) — не настоящий контент.
    await db.delete(t_lessons).where(inArray(t_lessons.id, [30, 31]));
    console.log("Deleted stale test lessons 30, 31");

    // --- Урок 1: F тяжести + F упругости ---
    const lesson1Id = await createLesson("Термины: сила тяжести и упругости", 5);
    await duplicateFormulaChallenge(2103101007, lesson1Id, 1); // F_тяж = mg
    await duplicateFormulaChallenge(2103101009, lesson1Id, 2); // F_упр = kΔx
    await insertVocabSet(lesson1Id, [
        { symbol: 'F_{тяж}', name: 'сила тяжести', unit: 'Н' },
        { symbol: 'F_{упр}', name: 'сила упругости', unit: 'Н' },
    ]);
    console.log(`Lesson 1 created: id=${lesson1Id}`);

    // --- Урок 2: сила Архимеда + давление тела/жидкости ---
    const lesson2Id = await createLesson("Термины: сила Архимеда и давление", 6);
    await duplicateFormulaChallenge(2103101008, lesson2Id, 1); // F_Арх = ρgV_пч
    await duplicateFormulaChallenge(2103101005, lesson2Id, 2); // P = F/S (давление тела)
    await duplicateFormulaChallenge(2103101006, lesson2Id, 3); // P = ρgh (давление жидкости)
    await insertVocabSet(lesson2Id, [
        { symbol: 'F_{Арх}', name: 'сила Архимеда', unit: 'Н' },
        // P — одна и та же величина (давление) для ОБЕИХ формул выше
        // (тело на опоре / столб жидкости) — не дублируем вопрос дважды.
        { symbol: 'P', name: 'давление', unit: 'Па' },
    ]);
    console.log(`Lesson 2 created: id=${lesson2Id}`);

    // --- Урок 3: Контрольная (мини-босс, микс всех 5 формул выше) ---
    const lesson3Id = await createLesson("Контрольная 1", 7);
    const reviewFormulas = [2103101007, 2103101009, 2103101008, 2103101005, 2103101006];
    for (let i = 0; i < reviewFormulas.length; i++) {
        await duplicateFormulaChallenge(reviewFormulas[i], lesson3Id, i + 1);
    }
    console.log(`Lesson 3 (Контрольная) created: id=${lesson3Id}`);

    console.log("\nDone.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
