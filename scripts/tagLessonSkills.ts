// scripts/tagLessonSkills.ts
//
// Массовое тегирование: помечает ВСЕ задачи одного урока course (lessons)
// одним или несколькими тэгами-скилами тренажёра (t_units — темами) разом,
// а не по одной задаче вручную. Тэг ведёт на ТЕМУ целиком (не на конкретный
// этап внутри неё — с моделью "юнит = тема, урок = этап" привязка задачи
// course к одному произвольному этапу не имела бы смысла). Пропускает пары
// challenge/t_unit, которые уже протегированы (безопасно перезапускать).
//
// Отредактируйте MAPPING ниже и запустите: npx tsx scripts/tagLessonSkills.ts

import 'dotenv/config';
import db from '../db/drizzle';
import { challenges, challengeSkillTags } from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';

const MAPPING: { courseLessonId: number; tUnitIds: number[] }[] = [
	{ courseLessonId: 345, tUnitIds: [6] }, // Unit 8 lesson 1 "Первое начало термодинамики" → тема "Газ и нагрев"
];

async function main() {
	for (const { courseLessonId, tUnitIds } of MAPPING) {
		const lessonChallenges = await db.query.challenges.findMany({
			where: eq(challenges.lessonId, courseLessonId),
		});

		if (lessonChallenges.length === 0) {
			console.log(`⚠️  Урок ${courseLessonId}: задач не найдено, пропуск`);
			continue;
		}

		for (const tUnitId of tUnitIds) {
			const existing = await db.query.challengeSkillTags.findMany({
				where: and(
					inArray(challengeSkillTags.challengeId, lessonChallenges.map((c) => c.id)),
					eq(challengeSkillTags.tUnitId, tUnitId),
				),
			});
			const alreadyTaggedIds = new Set(existing.map((e) => e.challengeId));
			const toInsert = lessonChallenges
				.filter((c) => !alreadyTaggedIds.has(c.id))
				.map((c) => ({ challengeId: c.id, tUnitId }));

			if (toInsert.length === 0) {
				console.log(`✅ Урок ${courseLessonId} → t_unit ${tUnitId}: уже всё протегировано (${lessonChallenges.length} задач)`);
				continue;
			}

			await db.insert(challengeSkillTags).values(toInsert);
			console.log(`✅ Урок ${courseLessonId} → t_unit ${tUnitId}: добавлено ${toInsert.length} тэгов (было уже ${alreadyTaggedIds.size}, всего задач ${lessonChallenges.length})`);
		}
	}

	process.exit(0);
}

main().catch((e) => {
	console.error('ERROR:', e);
	process.exit(1);
});
