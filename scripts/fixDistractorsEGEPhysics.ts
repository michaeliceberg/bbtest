// scripts/fixDistractorsEGEPhysics.ts
//
// Разовая правка: 241 из 304 задач курса "ЕГЭ Физика" имели дистракторы,
// сгенерированные единой формулой [correct-1, correct+1, correct*0.5,
// correct*1.5, correct*2] — правильный ответ был статистически угадываем
// (всегда единственное число с соседями ±1) без решения задачи.
//
// Здесь дистракторы заменяются на индивидуально подобранные по физике
// каждой конкретной задачи (см. /tmp/phys217_work/flawed_merged.json).
// У каждой такой задачи было 6 опций (1 верная + 5 старых дистракторов),
// новых дистракторов — 4, поэтому одна лишняя строка-дистрактор удаляется,
// остальные 4 обновляются на месте (id не меняется).

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { readFileSync } from 'fs';

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });

type Fix = { challenge_id: number; correct: string; distractors: string[] };

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const fixes: Fix[] = JSON.parse(readFileSync('/tmp/phys217_work/flawed_merged.json', 'utf-8'));

const main = async () => {
    try {
        console.log(`Правим дистракторы для ${fixes.length} задач...`);
        let updated = 0;
        let deleted = 0;

        for (const fix of fixes) {
            const options = await db.query.challengeOptions.findMany({
                where: eq(schema.challengeOptions.challengeId, fix.challenge_id),
                orderBy: (co, { asc }) => [asc(co.id)],
            });

            const wrongOptions = options.filter((o) => !o.correct);
            if (wrongOptions.length !== 5) {
                console.warn(`challenge ${fix.challenge_id}: ожидалось 5 неверных опций, найдено ${wrongOptions.length} — пропуск`);
                continue;
            }

            const toKeep = wrongOptions.slice(0, 4);
            const toDelete = wrongOptions.slice(4);
            const newTexts = shuffle(fix.distractors);

            for (let i = 0; i < toKeep.length; i++) {
                await db.update(schema.challengeOptions)
                    .set({ text: newTexts[i] })
                    .where(eq(schema.challengeOptions.id, toKeep[i].id));
                updated++;
            }
            for (const del of toDelete) {
                await db.delete(schema.challengeOptions).where(eq(schema.challengeOptions.id, del.id));
                deleted++;
            }
        }

        console.log(`Готово: обновлено ${updated} опций, удалено ${deleted} лишних.`);
    } catch (error) {
        console.error(error);
        throw new Error('Не получилось обновить дистракторы');
    } finally {
        await queryClient.end();
    }
};

main();
