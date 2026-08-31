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

// t_units тренажёра (t_course "Физика-11", id=21): 4=Динамика, 5=Кинематика,
// 6=Газ и нагрев, 7=Электростатика, 8=Электродинамика, 9=Оптика,
// 10=Квантовая (пусто, наполнения ещё нет — линковать некуда).
//
// Курс "ЕГЭ Физика" пока не доходит темами до электричества/оптики
// (units 102-110 = кинематика..."9. Газ. Графики") — поэтому тэги 7/8/9
// здесь не встречаются, появятся когда в курсе заведут соответствующие
// units. lesson 335 "Звуковые волны" (Unit 4) намеренно НЕ тегирован —
// ни одна из 6 тем тренажёра не покрывает звук, честный пробел, а не
// недосмотр. lessons 338/340/341 ("Механика 1/2") — качественные
// смешанные задачи на кинематику+динамику разом (проверено по реальным
// вопросам, не на глаз) → оба тэга.
const MAPPING: { courseLessonId: number; tUnitIds: number[] }[] = [
	// Unit 1. Кинематика → t_unit 5
	{ courseLessonId: 322, tUnitIds: [5] },
	{ courseLessonId: 323, tUnitIds: [5] },
	{ courseLessonId: 324, tUnitIds: [5] },
	// Unit 2. Динамика → t_unit 4
	{ courseLessonId: 325, tUnitIds: [4] },
	{ courseLessonId: 326, tUnitIds: [4] },
	{ courseLessonId: 327, tUnitIds: [4] },
	{ courseLessonId: 328, tUnitIds: [4] },
	{ courseLessonId: 329, tUnitIds: [4] },
	// Unit 3. Законы сохранения в механике (энергия/импульс — там же в Динамике)
	{ courseLessonId: 330, tUnitIds: [4] },
	{ courseLessonId: 331, tUnitIds: [4] },
	{ courseLessonId: 332, tUnitIds: [4] },
	{ courseLessonId: 333, tUnitIds: [4] },
	// Unit 4. Статика. Механические колебания и волны
	{ courseLessonId: 334, tUnitIds: [4] }, // давление жидкости/сила Архимеда — формулы в Динамике (см. "Термины: сила Архимеда и давление")
	// 335 "Звуковые волны" — пропущен намеренно, см. комментарий выше
	{ courseLessonId: 336, tUnitIds: [4] }, // механические колебания — период/частота, та же "Термины: период колебаний"
	// Unit 5-6. Механика 1/2 — смешанные качественные задачи, кинематика+динамика вперемешку
	{ courseLessonId: 338, tUnitIds: [4, 5] },
	{ courseLessonId: 340, tUnitIds: [4, 5] },
	{ courseLessonId: 341, tUnitIds: [4, 5] },
	// Unit 7. МКТ, Изопроцессы → t_unit 6
	{ courseLessonId: 342, tUnitIds: [6] },
	{ courseLessonId: 343, tUnitIds: [6] },
	{ courseLessonId: 344, tUnitIds: [6] },
	// Unit 8. ПНТ, Теплоемкость, КПД → t_unit 6
	{ courseLessonId: 345, tUnitIds: [6] }, // уже протегирован пилотом, скрипт безопасно пропустит
	{ courseLessonId: 346, tUnitIds: [6] },
	{ courseLessonId: 347, tUnitIds: [6] },
	// Unit 9. Газ. Графики → t_unit 6
	{ courseLessonId: 348, tUnitIds: [6] },
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
