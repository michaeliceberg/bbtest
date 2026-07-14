// // import { auth } from '@clerk/nextjs/server';
// import { eq } from 'drizzle-orm';
// import { cache, use } from 'react';
// import db from './drizzle';
// import { challengeProgress, challenges, courses, lessons, t_lessonProgress, t_lessons, units, userProgress, userSubscription } from './schema';
// import { tree } from 'next/dist/build/templates/app-page';
// import { auth } from '@/lib/auth';

// export const getUserProgress = cache(async () => {

// 	const session = await auth(); // 👈 Получаем сессию
// 	const userId = session?.user?.id; // 👈 Берем id из сессии

// 	// const userId = await getVKUserId();
// 	if (!userId) {
// 		return null;
// 	}

// 	const data = await db.query.userProgress.findFirst({
// 		where: eq(userProgress.userId, userId),
// 		with: {
// 			activeCourse: true,
			
// 		},
		
// 	});
// 	return data;
// });


// export const getChallengeProgress = cache(async () => {
// 	// const userId = await getVKUserId();
// 	const session = await auth(); // 👈 Получаем сессию
// 	const userId = session?.user?.id; // 👈 Берем id из сессии


// 	if (!userId) {
// 		return null;
// 	}

// 	const data = await db.query.challengeProgress.findMany({
// 		where: eq(challengeProgress.userId, userId),
// 		// with: {
// 		// 	challengeId: {

// 		// 	}
// 		// },
// 	});
// 	return data;
// });



// export const getChallengeProgressAllUsers = cache(async () => {
// 	// const userId = await getVKUserId();
// 	const session = await auth(); // 👈 Получаем сессию
// 	const userId = session?.user?.id; // 👈 Берем id из сессии

// 	if (!userId) {
// 		return null;
// 	}

// 	const data = await db.query.challengeProgress.findMany({
// 	});
// 	return data;
// });


// export const getUnits = cache(async()=>{
// 	// const userId = await getVKUserId()

// 	const session = await auth(); // 👈 Получаем сессию
// 	const userId = session?.user?.id; // 👈 Берем id из сессии

// 	const userProgress = await getUserProgress();
// 	if (!userId || !userProgress?.activeCourseId){
// 		return []
// 	}

// 	const data = await db.query.units.findMany({
// 		where: eq(units.courseId, userProgress.activeCourseId),
// 		with: {
// 			lessons: {
// 				with: {
// 					challenges: {
// 						with: {
// 							challengeProgress: {
// 							// challengeOptions: {
// 									where: eq (challengeProgress.userId,
// 									userId
// 								)
// 							}
// 						},
// 					},
// 				},
// 			},
// 		},
// 	})
// 	const normalizedData = data.map((unit)=>{
// 		const lessonsWithCompletedStatus = unit.lessons.map((lesson)=>{

// 			if (
// 				lesson.challenges.length === 0
// 			){
// 				return { ...lesson, completed: false}
// 			}

// 			const allCompletedChallenges = lesson.challenges.every((challenge)=>{
// 				return challenge.challengeProgress && challenge.challengeProgress.length > 0 && challenge.challengeProgress.every((progress)=> progress.completed)
// 			})
// 			return {...lesson, completed: allCompletedChallenges}
// 		})
// 		return {...unit, lessons: lessonsWithCompletedStatus}
// 	})
// 	return normalizedData
// })


// export const getCourses = cache(async () => {
// 	const data = await db.query.courses.findMany();

// 	return data;
// });

// export const getCourseById = cache(async (courseId: number) => {
// 	const data = await db.query.courses.findFirst({
// 		where: eq(courses.id, courseId),

// 		// TODO: Populate units and lessons
// 	});
// 	return data;
// });

// export const getCourseProgress = cache (async () => {
// 	// const userId = await getVKUserId()

// 	const session = await auth(); // 👈 Получаем сессию
// 	const userId = session?.user?.id; // 👈 Берем id из сессии

// 	const userProgress = await getUserProgress()

// 	if (!userId || !userProgress?.activeCourseId) {
// 		return null
// 	}

// 	const unitsInActiveCourse = await db.query.units.findMany({
// 		orderBy: (units, { asc })=> [asc(units.order)],
// 		where: eq(units.courseId, userProgress.activeCourseId),
// 		with:{
// 			lessons: {
// 				orderBy: (lessons, {asc})=> [asc(lessons.order)],
// 				with: {
// 					unit: true,
// 					challenges: {
// 						with:{
// 							challengeProgress:{
// 								where: eq(challengeProgress.userId, userId),
// 							},
// 						},
// 					},
// 				},
// 			},
// 		},
// 	})

	
// 	const firstUncompletedLesson = unitsInActiveCourse
// 		.flatMap((unit)=>unit.lessons)
// 		.find((lesson)=>{
// 			return lesson.challenges.some((challenge)=>{
// 				return !challenge.challengeProgress 
// 				|| challenge.challengeProgress.length === 0 
// 				|| challenge.challengeProgress.some((progress)=>progress.completed===false)
// 			})
// 		})

// 	return {
// 		activeLesson: firstUncompletedLesson,
// 		activeLessonId: firstUncompletedLesson?.id,
// 	}
// })

// export const getLesson = cache(async(id?: number)=>{

// 	const session = await auth(); // 👈 Получаем сессию
// 	const userId = session?.user?.id; // 👈 Берем id из сессии

// 	// const userId = await getVKUserId()

// 	if (!userId){
// 		return null
// 	}

// 	const courseProgress = await getCourseProgress()

// 	const lessonId = id || courseProgress?.activeLessonId

// 	if (!lessonId) {
// 		return null
// 	}

// 	const data = await db.query.lessons.findFirst({
// 		where: eq(lessons.id, lessonId),
// 		with: {
// 			challenges: {
// 				orderBy: (challenges, {asc})=>[asc(challenges.order)],
// 				with: {
// 					challengeOptions: true,
// 					challengeProgress: {
// 						where: eq(challengeProgress.userId, userId)
// 					},
// 				},
// 			},
// 		},
// 	})
// 	if(!data || !data.challenges){
// 		return null
// 	}

// 	const normalizedChallenges = data.challenges.map((challenge)=>{
// 		const completed = challenge.challengeProgress && challenge.challengeProgress.length > 0 && challenge.challengeProgress.every((progress)=>progress.completed)

// 		return {...challenge, completed}
// 	})

// 	return {... data, challenges: normalizedChallenges}
// })

// export const getLessonPercentage = cache(async()=>{
// 	const courseProgress = await getCourseProgress()

// 	if (!courseProgress?.activeLessonId){
// 		return 0
// 	}

// 	const lesson = await getLesson(courseProgress.activeLessonId)

// 	if (!lesson){
// 		return 0
// 	}

// 	const completedChallenges = lesson.challenges
// 	.filter((challenge) => challenge.completed)
	
// 	const percentage = Math.round(
// 		(completedChallenges.length / lesson.challenges.length) * 100
// 	)
// 	return percentage
// })

// const DAY_IN_MS = 86_400_000
// export const getUserSubscription = cache(async() => {
	
// 	const session = await auth(); // 👈 Получаем сессию
// 	const userId = session?.user?.id; // 👈 Берем id из сессии


// 	// const userId = await getVKUserId()
// 	if (!userId) {
// 		return null
// 	}
// 	const data = await db.query.userSubscription.findFirst({
// 		where: eq(userSubscription.userId, userId),
// 	})

// 	if (!data) {
// 		return null
// 	}

// 	const isActive = 
// 		data.stripePriceId &&
// 		data.stripeCurrentPeriodEnd?.getTime()! + DAY_IN_MS > Date.now()

// 		return {
// 			...data,
// 			isActive: !!isActive,
// 		}
// })

// export const getTopTenUsers = cache (async () => {
// 	const session = await auth(); // 👈 Получаем сессию
// 	const userId = session?.user?.id; // 👈 Берем id из сессии

// 	// const userId = await getVKUserId()

// 	if (!userId) {
// 		return []
// 	}
// 	const data = await db.query.userProgress.findMany({
// 		orderBy: (userProgress, { desc }) => [desc(userProgress.points)],
// 		limit: 10,
// 		columns: {
// 			userId: true,
// 			userName: true,
// 			userImageSrc: true,
// 			points: true,
// 		}
// 	})

// 	return data
// })



// export const getAllUsers = cache (async () => {

// 	const session = await auth(); // 👈 Получаем сессию
// 	const userId = session?.user?.id; // 👈 Берем id из сессии


// 	// const userId = await getVKUserId()

// 	if (!userId) {
// 		return []
// 	}
// 	const data = await db.query.userProgress.findMany({
// 		orderBy: (userProgress, { desc }) => [desc(userProgress.points)],
// 		columns: {
// 			userId: true,
// 			userName: true,
// 			userImageSrc: true,
// 			points: true,
// 			classId: true,
// 		}
// 	})

// 	return data
// })


// export const getAllProgresses = cache(async () => {
// 	const data = await db.query.userProgress.findMany();

// 	return data;
// });




// export const getAllClasses = cache(async () => {
// 	const data = await db.query.classes.findMany();

// 	return data;
// });









// export const getTCourses = cache(async () => {
//     const data = await db.query.t_courses.findMany();

//     return data;
// });



// export const getTUnits = cache(async()=>{

// 	const session = await auth(); // 👈 Получаем сессию
// 	const userId = session?.user?.id; // 👈 Берем id из сессии


//     // const userId = await getVKUserId()
//     // const userProgress = await getUserProgress();
//     if (!userId){
//         return []
//     }

//     const data = await db.query.t_units.findMany({
//         // where: eq(units.courseId, userProgress.activeCourseId),
//         with: {
//             t_lessons: {
//                 with: {
//                     t_challenges: {
// 						with: {
// 							t_challengeOptions: {	
// 							},
// 						}                        
//                     },
//                 },
//             },
//         },
//     })
//     return data
// }
    
// )








// export const getTLesson = cache(async(t_lessonId: number)=>{

// 	const session = await auth(); // 👈 Получаем сессию
// 	const userId = session?.user?.id; // 👈 Берем id из сессии

// 	// const userId = await getVKUserId()

// 	if (!userId){
// 		return null
// 	}

// 	const data = await db.query.t_lessons.findFirst({
// 		where: eq(t_lessons.id, t_lessonId),
// 		with: {
// 			t_challenges: {
// 				orderBy: (challenges, {asc})=>[asc(challenges.order)],
// 				with: {
// 					t_challengeOptions: true,
// 				},
// 			},
// 		},
// 	})
// 	if(!data || !data.t_challenges){
// 		return null
// 	}

// 	return {... data}
// })



	

// export const getTLessonProgress = cache (async () => {

// 	const session = await auth(); // 👈 Получаем сессию
// 	const userId = session?.user?.id; // 👈 Берем id из сессии

// 	// const userId = await getVKUserId()

// 	if (!userId) {
// 		return []
// 	}
// 	const data = await db.query.t_lessonProgress.findMany({
// 		where: eq(t_lessonProgress.userId, userId),
// 		orderBy: (t_lessonProgress, { desc }) => [desc(t_lessonProgress.dateDone)],
// 		// limit: 10,

// 	})

// 	return data
// })






// export const getAllTLessonProgress = cache (async () => {

// 	const session = await auth(); // 👈 Получаем сессию
// 	const userId = session?.user?.id; // 👈 Берем id из сессии

// 	// const userId = await getVKUserId()

// 	if (!userId) {
// 		return []
// 	}
// 	const data = await db.query.t_lessonProgress.findMany({
// 		orderBy: (t_lessonProgress, { desc }) => [desc(t_lessonProgress.dateDone)],
// 		// limit: 10,

// 	})

// 	return data
// })



// export const getAllUsersProgress = cache(async () => {

// 	const session = await auth(); // 👈 Получаем сессию
// 	const userId = session?.user?.id; // 👈 Берем id из сессии


// 	// const userId = await getVKUserId();
// 	if (!userId) {
// 		return null;
// 	}

// 	const data = await db.query.userProgress.findMany({
// 	});
// 	return data;
// });



// export const getAllClassHW = cache(async () => {

// 	const session = await auth(); // 👈 Получаем сессию
// 	const userId = session?.user?.id; // 👈 Берем id из сессии


// 	// const userId = await getVKUserId();
// 	if (!userId) {
// 		return null;
// 	}

// 	const data = await db.query.classesHw.findMany({
// 	});
// 	return data;
// });
