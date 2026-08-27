// scripts/tagLessonSkills.ts
//
// Массовое тегирование: помечает ВСЕ задачи одного урока course (lessons)
// одним или несколькими тэгами-скилами тренажёра (t_lessons) разом, а не
// по одной задаче вручную. Пропускает пары challenge/t_lesson, которые уже
// протегированы (безопасно перезапускать).
//
// Отредактируйте MAPPING ниже и запустите: npx tsx scripts/tagLessonSkills.ts

import 'dotenv/config';
import db from '../db/drizzle';
import { challenges, challengeSkillTags } from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';

const MAPPING: { courseLessonId: number; tLessonIds: number[] }[] = [
	{ courseLessonId: 345, tLessonIds: [2103] }, // Unit 8 lesson 1 "Первое начало термодинамики" → Газ и нагрев
];

async function main() {
	for (const { courseLessonId, tLessonIds } of MAPPING) {
		const lessonChallenges = await db.query.challenges.findMany({
			where: eq(challenges.lessonId, courseLessonId),
		});

		if (lessonChallenges.length === 0) {
			console.log(`⚠️  Урок ${courseLessonId}: задач не найдено, пропуск`);
			continue;
		}

		for (const tLessonId of tLessonIds) {
			const existing = await db.query.challengeSkillTags.findMany({
				where: and(
					inArray(challengeSkillTags.challengeId, lessonChallenges.map((c) => c.id)),
					eq(challengeSkillTags.tLessonId, tLessonId),
				),
			});
			const alreadyTaggedIds = new Set(existing.map((e) => e.challengeId));
			const toInsert = lessonChallenges
				.filter((c) => !alreadyTaggedIds.has(c.id))
				.map((c) => ({ challengeId: c.id, tLessonId }));

			if (toInsert.length === 0) {
				console.log(`✅ Урок ${courseLessonId} → t_lesson ${tLessonId}: уже всё протегировано (${lessonChallenges.length} задач)`);
				continue;
			}

			await db.insert(challengeSkillTags).values(toInsert);
			console.log(`✅ Урок ${courseLessonId} → t_lesson ${tLessonId}: добавлено ${toInsert.length} тэгов (было уже ${alreadyTaggedIds.size}, всего задач ${lessonChallenges.length})`);
		}
	}

	process.exit(0);
}

main().catch((e) => {
	console.error('ERROR:', e);
	process.exit(1);
});
