'use server';

import db from '@/db/drizzle';
import { getCourseById, getUserProgress, getGangMembership } from '@/db/queries';
import { challengeProgress, challenges, t_lessonProgress, t_lessons, userProgress, gangMembers } from '@/db/schema';
import { auth } from '@/lib/auth';
// import { auth, currentUser } from '@clerk/nextjs/server';
import { and, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { xpForAmount, getLevelUpInfo } from '@/lib/xp';
import { recalculateAchievements } from './check-achievements';
import { bumpCourseStreak } from '@/lib/streak';
import { getDailyQuestStatus } from './generate-trainer-quest';
import { REFERRAL_COOKIE } from '@/lib/referral';
import { grantReferralChainRewards, type ReferralWelcomeGift } from '@/lib/referralRewards';
import { LEARN_UNLOCK_T_LESSONS } from '@/lib/learn-unlock';

const POINTS_TO_REFILL = 10

export const upsertUserProgress = async (courseId: number) => {
	
	const session = await auth();  
	// Проверяем авторизацию
	if (!session?.user?.id) {
	  throw new Error('Вы не авторизованы!');
	}	
	const userId = session.user.id;


	


	if (!userId) {
		throw new Error('Вы не авторизированны!');
	}

	const course = await getCourseById(courseId);

	if (!course) {
		throw new Error('Курс не найден!');
	}

	// TODO: once units and lessons are added
	// if (!course.units.length || !course.units[0].lessons.length) throw new Error('Курс пуст!');

	const existingUserProgress = await getUserProgress();

	if (existingUserProgress) {
		// Имя и аватар — то, что пользователь сам задал в /account, при
		// смене курса их трогать нельзя (иначе слетает кастомизация).
		await db.update(userProgress).set({
			activeCourseId: courseId,
		}). where(eq(userProgress.userId, userId))

		revalidatePath('/courses');
		revalidatePath('/learn');
		redirect('/learn');
	}

	// Реферальная атрибуция (Фаза 2, 2026-09-29) — cookie ставится
	// components/referral-catcher.tsx при заходе по ?ref=<userId>
	// (lib/referral.ts). Читаем ДО инсерта, т.к. это гарантированно первая
	// когда-либо запись userProgress для userId (existingUserProgress
	// проверен выше) — единственный правильный момент атрибуции.
	const cookieStore = cookies();
	const referredBy = cookieStore.get(REFERRAL_COOKIE)?.value || null;
	// Антифрод — сам себя не реферишь (тот же userId по какой-то причине).
	const invitedByUserId = referredBy && referredBy !== userId ? referredBy : null;

	await db.insert(userProgress).values({
		userId,
		activeCourseId: courseId,
		userName: session.user.name || 'Ученик',
		userImageSrc: '/mascot.svg',
		invitedByUserId,

	});

	if (invitedByUserId) {
		cookieStore.delete(REFERRAL_COOKIE);

		// Пицца по приглашению теперь НЕ при регистрации, а когда новичок пройдёт
		// 3 разбора электродинамики (lib/referralRewards.ts, вызывается из
		// upsertTrainerLessonProgress ниже) — и ему, и вверх по ветке.

		// Банды (Фаза 3, MVP, 2026-09-29) — та же ссылка/cookie удваивается
		// как приглашение в банду, ЕСЛИ у реферера роль leader/kapo. Обычный
		// участник (role='member') или человек без банды по той же ссылке
		// даёт только персональный бонус выше — вступления не происходит
		// вовсе, никакой отдельной проверки прав не нужно.
		const referrerMembership = await getGangMembership(invitedByUserId);
		if (referrerMembership && (referrerMembership.role === 'leader' || referrerMembership.role === 'kapo')) {
			await db.insert(gangMembers).values({
				gangId: referrerMembership.gangId,
				userId,
				role: 'member',
			}).onConflictDoNothing();
		}
	}

	revalidatePath('/courses');
	revalidatePath('/learn');
	redirect('/learn');
};




export const upsertUserName = async (nickName: string) => {
	const session = await auth();  
	// Проверяем авторизацию
	if (!session?.user?.id) {
	  throw new Error('Вы не авторизованы!');
	}	
	const userId = session.user.id;


	const existingUserProgress = await getUserProgress();

	if (existingUserProgress) {
		await db.update(userProgress).set({
			userName: nickName || session.user.name || 'Ученик',
		}). where(eq(userProgress.userId, userId))

		revalidatePath('/courses');
		revalidatePath('/learn');
		redirect('/leaderboard');
	}

	revalidatePath('/courses');
	revalidatePath('/learn');
	redirect('/leaderboard');
};



export const upsertIsOnMeme = async (isOnMeme: number) => {
	const session = await auth();  
	// Проверяем авторизацию
	if (!session?.user?.id) {
	  throw new Error('Вы не авторизованы!');
	}	
	const userId = session.user.id;

	const existingUserProgress = await getUserProgress();

	if (existingUserProgress) {
		await db.update(userProgress).set({
			isOnMeme: isOnMeme,
		}). where(eq(userProgress.userId, userId))
		
		revalidatePath('/courses');
		revalidatePath('/learn');
		redirect('/leaderboard');
	}

	revalidatePath('/courses');
	revalidatePath('/learn');
	redirect('/leaderboard');
};







export const upsertUserAvatar = async (userImgSrc: string) => {
	const session = await auth();  
	// Проверяем авторизацию
	if (!session?.user?.id) {
	  throw new Error('Вы не авторизованы!');
	}	
	const userId = session.user.id;

	const existingUserProgress = await getUserProgress();

	if (existingUserProgress) {
		await db.update(userProgress).set({
			userImageSrc: userImgSrc || 'cats/cat1.jpg',
		}). where(eq(userProgress.userId, userId))
		
		revalidatePath('/courses');
		revalidatePath('/learn');
		redirect('/leaderboard');
	}

	revalidatePath('/courses');
	revalidatePath('/learn');
	redirect('/leaderboard');
};








export const reduceHearts = async (challengeId: number)=>{
	const session = await auth();  
	// Проверяем авторизацию
	if (!session?.user?.id) {
	  throw new Error('Вы не авторизованы!');
	}	
	const userId = session.user.id;

	const currentUserProgress = await getUserProgress()
	// TODO:

	const challenge = await db.query.challenges.findFirst({
		where: eq(challenges.id, challengeId)
	})

	if (!challenge) {
		throw new Error("Задание не найдено!")
	}

	const lessonId = challenge.lessonId

	const existingChallengeProgress = await db.query.challengeProgress.findFirst({
		where: and(
			eq(challengeProgress.userId, userId),
			eq(challengeProgress.challengeId, challengeId),
		),
	})

	const isPractice = !!existingChallengeProgress

	if (isPractice) {
		return {error: 'practice'}
	}

	if (!currentUserProgress){
		throw new Error("Прогресс не найден! Хау дид ю ивен гет ту зис поинт?")
	}

	// TODO:

	if (currentUserProgress.hearts === 0) {
		return { error: "hearts"}
	}

	await db.update(userProgress).set({
		hearts: Math.max(currentUserProgress.hearts - 1, 0),
	}). where(eq(userProgress.userId, userId))

	revalidatePath("/shop")
	revalidatePath("/learn")
	revalidatePath("/progress")
	revalidatePath("/leaderboard")
	revalidatePath(`/lesson.${lessonId}`)
}

export const refillHearts = async () => {
	const currentUserProgress = await getUserProgress()

	if (!currentUserProgress) {
		throw new Error("Прогресс не найден!")
	}

	if (currentUserProgress.hearts === 5) {
		throw new Error('У вас уже максимальное количество жизней')
	}

	if (currentUserProgress.points < POINTS_TO_REFILL) {
		throw new Error("Не хватает очков!")
	}

	await db.update(userProgress).set({
		hearts: 5,
		// hearts: 500,
		points: currentUserProgress.points - POINTS_TO_REFILL
	}).where(eq(userProgress.userId, currentUserProgress.userId))
	revalidatePath('/shop')
	revalidatePath('/learn')
	revalidatePath('/progress')
	revalidatePath('/leaderboard')
}




export const upsertTrainerLessonProgress = async (
	t_lessonId: number,
	doneRightPercent: number,
	trainingPts: number,
	doneRight: number,
	doneWrong: number,
	stage?: number | null,
) => {

	const session = await auth();
	// Проверяем авторизацию
	if (!session?.user?.id) {
	  throw new Error('Вы не авторизованы!');
	}
	const userId = session.user.id;


	await db.insert(t_lessonProgress).values({
		userId: userId,
		t_lessonId: t_lessonId,
		doneRightPercent: doneRightPercent,
		trainingPts: trainingPts,
		doneRight: doneRight,
		doneWrong: doneWrong,
		stage: stage ?? null,
	});

	// trainingPts>0 — только настоящее завершение основного прохода (см.
	// вызовы в TQUIZ.tsx: сбросы/ранние выходы шлют 0, чтобы не давать
	// опыт за незавершённую попытку). userProgress здесь раньше вообще не
	// трогалась — очки/гемы за тренажёр не начислялись никогда, только
	// XP теперь делает это первым.
	let leveledUp = false;
	let newLevel: number | undefined;
	let levelUpGems = 0;
	let levelsGained = 0;
	let streakExtended = false;
	let newStreak: number | undefined;
	let questJustCompleted = false;
	let questStreak: number | undefined;
	let questPointsReward: number | undefined;
	let referralGift: ReferralWelcomeGift | null = null;

	if (trainingPts > 0) {
		const earnedXp = xpForAmount(trainingPts);
		const currentUserProgress = await db.query.userProgress.findFirst({
			where: eq(userProgress.userId, userId),
		});
		const xpBefore = currentUserProgress?.xp ?? 0;
		const levelUpInfo = getLevelUpInfo(xpBefore, xpBefore + earnedXp);
		leveledUp = levelUpInfo.leveledUp;
		newLevel = levelUpInfo.newLevel;
		levelUpGems = levelUpInfo.gemsAwarded;
		levelsGained = levelUpInfo.levelsGained;

		await db.update(userProgress)
			.set({
				xp: sql`${userProgress.xp} + ${earnedXp}`,
				gems: sql`${userProgress.gems} + ${levelUpGems}`,
			})
			.where(eq(userProgress.userId, userId));

		// "Ударный режим" — по решению пользователя урок тренажёра
		// продлевает ТОТ ЖЕ курсовый стрик, что и задачи в задачнике
		// (см. lib/streak.ts, actions/challenge-progress.ts) — не
		// отдельный тренажёрный стрик. Привязанного курса может не быть
		// (t_courses.courseId nullable, см. db/schema.ts) — тогда просто
		// нечего продлевать, тихо пропускаем.
		const lesson = await db.query.t_lessons.findFirst({
			where: eq(t_lessons.id, t_lessonId),
			with: { t_unit: { with: { t_course: true } } },
		});
		const linkedCourseId = lesson?.t_unit?.t_course?.courseId;
		if (linkedCourseId) {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const streakResult = await bumpCourseStreak(userId, linkedCourseId, today);
			streakExtended = streakResult.extended;
			newStreak = streakResult.streak;
		}

		// Квест дня — "пройди урок тренажёра" мог только что закрыться
		// именно этой попыткой (t_lessonProgress уже вставлена строкой
		// выше, до входа в этот if — getDailyQuestStatus обязан увидеть её
		// свежей). tCourseId для квеста — t_unit.t_courseId (тема
		// тренажёра), НЕ linkedCourseId выше (тот — основной курс
		// задачника, другое понятие).
		const tCourseId = lesson?.t_unit?.t_courseId;
		if (tCourseId) {
			const questStatus = await getDailyQuestStatus(tCourseId);
			questJustCompleted = questStatus?.justCompleted ?? false;
			questStreak = questStatus?.streak;
			questPointsReward = questStatus?.pointsReward;
		}

		// Приглашённый прошёл все 3 разбора электродинамики — раздаём пиццу ему
		// и вверх по ветке (один раз).
		if (LEARN_UNLOCK_T_LESSONS.includes(t_lessonId)) {
			referralGift = await grantReferralChainRewards(userId).catch(() => null);
		}
	}

	revalidatePath('/trainer');
	revalidatePath('/achievements');
	// revalidatePath('/learn');
	// redirect('/trainer');

	const newAchievements = await recalculateAchievements(userId);

	// Сколько раз пройден урок (завершённых основных проходов) — для
	// бесконечного босс-экзамена: счётчик побед и редкий сундук за каждые 3.
	const winsRows = await db.select({ n: sql<number>`count(*)::int` }).from(t_lessonProgress)
		.where(and(eq(t_lessonProgress.userId, userId), eq(t_lessonProgress.t_lessonId, t_lessonId), sql`${t_lessonProgress.trainingPts} > 0`));
	const bossWins = winsRows[0]?.n ?? 0;

	return { leveledUp, newLevel, levelUpGems, levelsGained, newAchievements, streakExtended, newStreak, questJustCompleted, questStreak, questPointsReward, bossWins, referralGift };
};



































// 'use server';

// import db from '@/db/drizzle';
// import { getCourseById, getUserProgress } from '@/db/queries';
// import { challengeProgress, challenges, t_lessonProgress, userProgress } from '@/db/schema';
// import { auth, currentUser } from '@clerk/nextjs/server';
// import { and, eq } from 'drizzle-orm';
// import { revalidatePath } from 'next/cache';
// import { redirect } from 'next/navigation';

// const POINTS_TO_REFILL = 10

// export const upsertUserProgress = async (courseId: number) => {
// 	const { userId } = await auth();
// 	const user = await currentUser();

	

// 	if (!userId || !user) {
// 		throw new Error('Вы не авторизированны!');
// 	}

// 	const course = await getCourseById(courseId);

// 	if (!course) {
// 		throw new Error('Курс не найден!');
// 	}

// 	// TODO: once units and lessons are added
// 	// if (!course.units.length || !course.units[0].lessons.length) throw new Error('Курс пуст!');

// 	const existingUserProgress = await getUserProgress();

// 	if (existingUserProgress) {
// 		await db.update(userProgress).set({
// 			activeCourseId: courseId,
// 			userName: user.firstName || 'User',
// 			userImageSrc: user.imageUrl || '/mascot.svg',
// 		}). where(eq(userProgress.userId, userId))
		
// 		revalidatePath('/courses');
// 		revalidatePath('/learn');
// 		redirect('/learn');
// 	}

// 	await db.insert(userProgress).values({
// 		userId,
// 		activeCourseId: courseId,
// 		userName: user.firstName || 'User',
// 		userImageSrc: user.imageUrl || '/mascot.svg',
// 	});

// 	revalidatePath('/courses');
// 	revalidatePath('/learn');
// 	redirect('/learn');
// };




// export const upsertUserName = async (nickName: string) => {
// 	const { userId } = await auth();
// 	const user = await currentUser();

// 	if (!userId || !user) {
// 		throw new Error('Вы не авторизированны!');
// 	}

// 	const existingUserProgress = await getUserProgress();

// 	if (existingUserProgress) {
// 		await db.update(userProgress).set({
// 			userName: nickName || user.firstName || 'User',
// 		}). where(eq(userProgress.userId, userId))
		
// 		revalidatePath('/courses');
// 		revalidatePath('/learn');
// 		redirect('/leaderboard');
// 	}

// 	revalidatePath('/courses');
// 	revalidatePath('/learn');
// 	redirect('/leaderboard');
// };



// export const upsertIsOnMeme = async (isOnMeme: number) => {
// 	const { userId } = await auth();
// 	const user = await currentUser();

// 	if (!userId || !user) {
// 		throw new Error('Вы не авторизированны!');
// 	}

// 	const existingUserProgress = await getUserProgress();

// 	if (existingUserProgress) {
// 		await db.update(userProgress).set({
// 			isOnMeme: isOnMeme,
// 		}). where(eq(userProgress.userId, userId))
		
// 		revalidatePath('/courses');
// 		revalidatePath('/learn');
// 		redirect('/leaderboard');
// 	}

// 	revalidatePath('/courses');
// 	revalidatePath('/learn');
// 	redirect('/leaderboard');
// };







// export const upsertUserAvatar = async (userImgSrc: string) => {
// 	const { userId } = await auth();
// 	const user = await currentUser();

// 	if (!userId || !user) {
// 		throw new Error('Вы не авторизированны!');
// 	}

// 	const existingUserProgress = await getUserProgress();

// 	if (existingUserProgress) {
// 		await db.update(userProgress).set({
// 			userImageSrc: userImgSrc || 'cats/cat1.jpg',
// 		}). where(eq(userProgress.userId, userId))
		
// 		revalidatePath('/courses');
// 		revalidatePath('/learn');
// 		redirect('/leaderboard');
// 	}

// 	revalidatePath('/courses');
// 	revalidatePath('/learn');
// 	redirect('/leaderboard');
// };








// export const reduceHearts = async (challengeId: number)=>{
// 	const {userId} = await auth()
// 	if (!userId){
// 		throw new Error("Вы не авторизованы!")
// 	}

// 	const currentUserProgress = await getUserProgress()
// 	// TODO:

// 	const challenge = await db.query.challenges.findFirst({
// 		where: eq(challenges.id, challengeId)
// 	})

// 	if (!challenge) {
// 		throw new Error("Задание не найдено!")
// 	}

// 	const lessonId = challenge.lessonId

// 	const existingChallengeProgress = await db.query.challengeProgress.findFirst({
// 		where: and(
// 			eq(challengeProgress.userId, userId),
// 			eq(challengeProgress.challengeId, challengeId),
// 		),
// 	})

// 	const isPractice = !!existingChallengeProgress

// 	if (isPractice) {
// 		return {error: 'practice'}
// 	}

// 	if (!currentUserProgress){
// 		throw new Error("Прогресс не найден! Хау дид ю ивен гет ту зис поинт?")
// 	}

// 	// TODO:

// 	if (currentUserProgress.hearts === 0) {
// 		return { error: "hearts"}
// 	}

// 	await db.update(userProgress).set({
// 		hearts: Math.max(currentUserProgress.hearts - 1, 0),
// 	}). where(eq(userProgress.userId, userId))

// 	revalidatePath("/shop")
// 	revalidatePath("/learn")
// 	revalidatePath("/progress")
// 	revalidatePath("/leaderboard")
// 	revalidatePath(`/lesson.${lessonId}`)
// }

// export const refillHearts = async () => {
// 	const currentUserProgress = await getUserProgress()

// 	if (!currentUserProgress) {
// 		throw new Error("Прогресс не найден!")
// 	}

// 	if (currentUserProgress.hearts === 5) {
// 		throw new Error('У вас уже максимальное количество жизней')
// 	}

// 	if (currentUserProgress.points < POINTS_TO_REFILL) {
// 		throw new Error("Не хватает очков!")
// 	}

// 	await db.update(userProgress).set({
// 		hearts: 5,
// 		// hearts: 500,
// 		points: currentUserProgress.points - POINTS_TO_REFILL
// 	}).where(eq(userProgress.userId, currentUserProgress.userId))
// 	revalidatePath('/shop')
// 	revalidatePath('/learn')
// 	revalidatePath('/progress')
// 	revalidatePath('/leaderboard')
// }




// export const upsertTrainerLessonProgress = async (
// 	t_lessonId: number, 
// 	doneRightPercent: number, 
// 	trainingPts: number,
// 	doneRight: number,
// 	doneWrong: number,
// ) => {

// 	const { userId } = await auth();
// 	const user = await currentUser();

// 	if (!userId || !user) {
// 		throw new Error('Вы не авторизированны!');
// 	}


// 	await db.insert(t_lessonProgress).values({
// 		userId: userId,
// 		t_lessonId: t_lessonId,
// 		doneRightPercent: doneRightPercent,
// 		trainingPts: trainingPts,
// 		doneRight: doneRight,
// 		doneWrong: doneWrong,
// 	});


// 	revalidatePath('/trainer');
// 	// revalidatePath('/learn');
// 	// redirect('/trainer');
	
// };