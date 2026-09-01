// scripts/seedEGEPhysics-unit11-lesson1.ts
//
// Курс "ЕГЭ Физика" — новый Unit 11, урок 1 "Закон Кулона, закон
// сохранения заряда" (33 задачи с
// https://phys-ege.sdamgia.ru/test?theme=386): формат — числовой ответ
// (тип ASSIST), в отличие от Unit 10 (CONSTRUCT/matching). Задачи на
// кратное изменение силы Кулона при изменении зарядов/расстояния и на
// прямой расчёт F=kq1q2/r² — у sdamgia почти нет официальных вариантов
// (только 2 из 33: id=1335,1331), поэтому дистракторы подобраны вручную
// под каждую задачу отдельно (разные типы физических ошибок школьника —
// забыл возвести расстояние в квадрат, забыл один из множителей заряда,
// перепутал рост/убыль, ошибка в степени 10 и т.п. — не одна формула на
// все задачи, см. общее правило проекта в CLAUDE.md). Ответы проверены
// пересчётом по формуле k=9·10^9·q1·q2/r² там, где это уместно — сам
// правильный ответ всегда берётся из поля "Ответ:" sdamgia как есть, не
// пересчитывается заново.
//
// 1 задача (42037) с диаграммой (два заряда +q/−2q на прямой с точкой A
// посередине) — перерисована в public/geometry/phys386_204955.svg.

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';
import { readFileSync } from 'fs';

const AUTHOR = 'ЕГЭ Физика';
const COURSE_ID = 12;

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type Problem = { id: string; question: string; correct: string; distractors: string[] };
const problems: Problem[] = JSON.parse(readFileSync('/tmp/phys386_work/manual.json', 'utf-8'));

const IMG: Record<string, string> = {
    '42037': 'phys386_204955',
};

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const main = async () => {
    try {
        console.log('Seeding: ЕГЭ Физика → Unit 11 → Урок 1 (Закон Кулона, закон сохранения заряда)');

        const [unit] = await db.insert(schema.units).values({
            title: '11. Закон Кулона, закон сохранения заряда',
            description: 'Электростатическое взаимодействие точечных зарядов, закон Кулона',
            imageSrc: 'LottieUnit4',
            courseId: COURSE_ID,
            order: 11,
        }).returning();
        console.log(`unit: ${unit.id} "${unit.title}"`);

        const [lesson] = await db.insert(schema.lessons).values({
            title: 'Закон Кулона, закон сохранения заряда',
            unitId: unit.id,
            order: 1,
        }).returning();
        console.log(`lesson: ${lesson.id} "${lesson.title}"`);

        let order = 1;
        for (const p of problems) {
            const [challenge] = await db.insert(schema.challenges).values({
                lessonId: lesson.id,
                type: 'ASSIST',
                question: p.question,
                order: order++,
                imageSrc: IMG[p.id] ? `/geometry/${IMG[p.id]}.svg` : '',
                points: 10,
                author: AUTHOR,
                difficulty: '',
            }).returning();

            const opts = shuffle([
                { text: p.correct, correct: true },
                ...p.distractors.map((d) => ({ text: d, correct: false })),
            ]);
            for (const o of opts) {
                await db.insert(schema.challengeOptions).values({
                    challengeId: challenge.id,
                    text: o.text,
                    correct: o.correct,
                });
            }
            console.log(`  [${order - 1}/${problems.length}] challenge ${challenge.id} (sdamgia id=${p.id}) correct="${p.correct}"`);
        }

        console.log('\nГотово!');
    } catch (error) {
        console.error('Ошибка сидинга:', error);
    } finally {
        await queryClient.end();
    }
};

main();
