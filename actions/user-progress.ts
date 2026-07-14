'use server';

import db from '@/db/drizzle';
import { getCourseById, getUserProgress } from '@/db/queries';
import { challengeProgress, challenges, t_lessonProgress, userProgress } from '@/db/schema';
import { auth } from '@/lib/auth';
// import { auth, currentUser } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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
		await db.update(userProgress).set({
			activeCourseId: courseId,
			userName: session.user.name || 'VK User',
			userImageSrc: '/mascot.svg',

		}). where(eq(userProgress.userId, userId))
		
		revalidatePath('/courses');
		revalidatePath('/learn');
		redirect('/learn');
	}

	await db.insert(userProgress).values({
		userId,
		activeCourseId: courseId,
		userName: session.user.name || 'VK User',
		userImageSrc: '/mascot.svg',

	});

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
			// userName: nickName || vkUser.firstName || 'User',
			userName: session.user.name || 'VK User',
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
	});


	revalidatePath('/trainer');
	// revalidatePath('/learn');
	// redirect('/trainer');
	
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