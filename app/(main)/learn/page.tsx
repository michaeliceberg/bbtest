import { FeedWrapper } from '@/components/feed-wrapper';
import { StickyWrapper } from '@/components/sticky-wrapper';
import { UserProgress } from '@/components/user-progress';
import { getAllClassHW, getAllClasses, getAllUsers, getAllUsersProgress, getChallengeProgress, getCourseProgress, getUnits, getUserProgress } from '@/db/queries';
import { redirect } from 'next/navigation';
import { Header } from './header';
import { Unit } from './unit';
import { userProgress as userProgressSchema, lessons, progressType, units as unitsSchema, SuperType } from '@/db/schema';

import { format } from 'date-fns';
import { Promo } from '@/components/promo';
import { Quests } from '@/components/quests';
import db from '@/db/drizzle';
import { eq } from 'drizzle-orm';
// import { auth, currentUser } from "@clerk/nextjs/server"
// import { FlameKindling } from 'lucide-react';
// import Image from 'next/image';
import { HwTopBanner } from './hw-top-banner';
// import { auth, getVKUser, getVKUserId, requireAuth } from '@/lib/auth';
// import { auth } from '@/lib/auth';
import { auth } from '@/lib/server-auth';

const bgList = [
	'/bg-svg/anchors-away.svg',
	'/bg-svg/Usersaztec.svg',
	'/bg-svg/bubbles.svg',
	'/bg-svg/circles-and-squares.svg',
	'/bg-svg/cutout.svg',
	'/bg-svg/floating-cogs.svg',
	'/bg-svg/glamorous.svg',
	'/bg-svg/i-like-food.svg',
	'/bg-svg/jigsaw.svg',
	'/bg-svg/leaf.svg',
	'/bg-svg/random-shapes.svg',
	'/bg-svg/skulls.svg',
	'/bg-svg/tic-tac-toe.svg',
	'/bg-svg/topography.svg',
	'/bg-svg/yyy.svg',
]


	const randomizeArray = [...bgList].sort(() => 0.5 - Math.random());
	// setRandomRightImage(randomizeArray[0]);






const LearnPage = async () => {



	// const session = await requireAuth(); // Автоматически редиректит если не авторизован

	// const vkUserId = session.user?.id;
  	// const userName = session.user?.name;
  	// const userEmail = session.user?.email;
  
  	// console.log('VK User ID:', vkUserId);









	//   const session = await auth();

	//   // Если сессии нет, перенаправляем на страницу входа
	//   if (!session?.user) {
	// 	  redirect('/'); // или на вашу страницу с кнопкой входа
	//   }
  
	//   // Данные пользователя доступны в session.user
	//   const userId = session.user.id;
	//   const userName = session.user.name;
	//   const userEmail = session.user.email;
  
	//   console.log('Authorized user ID:', userId);




	const session = await auth();
  
	if (!session?.user) {
	  redirect('/'); // Редирект на главную
	}
	
	const userId = session.user.id;
	console.log('User ID:', userId);









	//   const { userId } = await requireAuth();
	//   const { user } = await requireAuth();


	// const userId = await getVKUserId();
	// const user = await getVKUser();

	// const { userId } = await auth();
	// const user = await currentUser();

	// console.log(userId)
	// console.log(user)


	if (!userId ) {
		throw new Error('Вы не авторизированны!');
	}
	// if (!userId || !user) {
	// 	throw new Error('Вы не авторизированны!');
	// }

	const userProgressData = getUserProgress()
	const unitsData = getUnits()
	const courseProgressData = getCourseProgress()
	const challengeProgressData = getChallengeProgress()


	const allUsersProgressData = getAllUsersProgress()


	const allClassesData = getAllClasses()
	const allClassHWData = getAllClassHW()
    const allUsersData = getAllUsers()



	// allClasses={allClasses}
	// allClassHW={allClassHW}
	// allUsers={allUsers}

	// all_t_lessonProgress={all_t_lessonProgress}
	// this_class_id={userProgress.classId}

	
	const [
		userProgress,
		units,
		courseProgress,
		challengeProgress,


		allUsersProgress,

		allClasses,
		allClassHW,
		allUsers,

	] = await Promise.all([
		userProgressData,
		unitsData,
		courseProgressData,
		challengeProgressData,


		allUsersProgressData,


		allClassesData,
		allClassHWData,
		allUsersData,
	]);

	if (!userProgress || !userProgress.activeCourse) {
		redirect('/courses');
	}

	if (!courseProgress) {
		redirect('/courses')
	}

	if (!challengeProgress){
        redirect('/learn')
    }

	const bgSvgSrc = randomizeArray.slice(0, units.length)
	

	// TODO:   NEW NEW NEW NEW
	
	const challengesDoneWrong = challengeProgress.filter(function(v, i) {
        return (v.doneRight == false);
      })
    
	const challengesDone = challengeProgress.filter(function(v, i) {
	return (v.completed == true);
	})


	// ------------------------------------------------------------------------
	
	const allChallengesInCourse:number[] = []

	const infoUnitsStat = units.map((unit, index) => {
				
		const doneRightInLesson = unit.lessons.map((lesson, lessonIndex) => {
			
			let doneRight = 0
			let doneWrong = 0
			let numChallengesInLesson = 0

			const doneRightChallenges = lesson.challenges.map((challenge) => {
				//
				allChallengesInCourse.push(challenge.id)
				//
				if (lesson.id === challenge.lessonId) {

					numChallengesInLesson += 1

					if (challenge.challengeProgress) {
						
						if (challenge.challengeProgress[0]?.completed) {
							if (challenge.challengeProgress[0].doneRight) {
								doneRight += 1
							} else {
								doneWrong += 1
							}
						}
					}
				}
			})

			return {
				lesson: lesson.id,
				unitId: unit.id,
				unitTitle: unit.title,
				done: [ numChallengesInLesson,  doneRight, doneWrong ],
				percentageDoneLesson: Math.round((doneRight+doneWrong)/numChallengesInLesson * 100) / 100 
			}
		})
		

		return {
			doneRightInLesson,
		}})


	interface lessonDone {
		lesson: number;
		done: number[];
		unitId: number;
		unitTitle: string;
		percentageDoneLesson: number;
	}


	let lessonStat: Array<lessonDone> = [];

	const newList = infoUnitsStat.map(unit => {
		unit.doneRightInLesson.map(lesson => {
			lessonStat.push(lesson)
			return lesson
		})
	})


	const UniqueUnitIds = lessonStat.map(el => el.unitId)
	.filter(
		(value, index, current_value) => current_value.indexOf(value) === index
	);
	

	let UnitsLessonsPercentage = []


	const unitStat = UniqueUnitIds.map(unitId => {
		
		let toDone = 0
		let doneRight = 0
		let doneWrong = 0
		let percentageDoneLesson = 0
		let unitTitle = ''

		lessonStat.map(el => {
			if (el.unitId === unitId) {
				toDone = toDone + el.done[0]
				doneRight = doneRight + el.done[1]
				doneWrong = doneWrong + el.done[2]
				unitTitle = el.unitTitle
				percentageDoneLesson =  Math.round((doneRight + doneWrong) / toDone * 100) / 100 
			}
		})


		return (
			{
				unitId: unitId,
				unitTitle: unitTitle,
				toDone: toDone,
				doneRight: doneRight,
				doneWrong: doneWrong,
				percentageDone: (doneRight+doneWrong)/toDone,
			}
		)
	})

	// Сортируем по убыванию Процента Решенных Лессонов
	//
	lessonStat.sort((a, b) => (a.percentageDoneLesson > b.percentageDoneLesson ? -1 : 1));

	// Убираем Lesson'ы , которые решены на 100%
	// Чтобы не давать Оттуда ДЗ
	//
	let lessonStat_NO_finished: Array<lessonDone> = lessonStat.filter(el => el.percentageDoneLesson != 1)


	let numWholeChallenge:number = lessonStat.reduce((total, lesson)=> total + lesson.done[0], 0 )
	let numDoneChallenge:number = lessonStat.reduce((total, lesson)=> total + lesson.done[1] + lesson.done[2], 0 )
	let numLeftChallenge:number = numWholeChallenge - numDoneChallenge

	var dateExam = new Date(2025, 4, 21);
	var dateNow = new Date()
	var diff = Math.abs(dateExam.getTime() - dateNow.getTime());
	var daysTillExam = Math.ceil(diff / (1000 * 3600 * 24)); 
	
	const Recom_ChalPerDay = Math.round(numLeftChallenge / daysTillExam * 100) / 100
	const lastWeekChallenges = challengeProgress.filter(challenge => {
	
	var diff = Math.abs(challenge.dateDone.getTime() - dateNow.getTime());
	
	var diffDays = Math.ceil(diff / (1000 * 3600 * 24)); 

	if (allChallengesInCourse.includes(challenge.challengeId) && diffDays < 8)
			return true
	})

	
	const challengesInWeek:number = lastWeekChallenges.length
	let current_ChalPerDay = challengesInWeek > 0 
		? Math.round(challengesInWeek / 7 * 100) / 100 
		: 1
	
	let daysToFinishWYS = Math.round(numLeftChallenge / current_ChalPerDay)


	const dateDone = new Date(dateNow.getTime() + daysToFinishWYS*(1000 * 60 * 60 * 24));
	const formattedDate: string = format(dateDone, 'dd.MM.yyyy');
	const YourDaysLate:number = daysToFinishWYS - daysTillExam





	const RecomNumChallengesToday:number = Math.round(Recom_ChalPerDay*4)


	// HW HW HW HW HW HW HW HW 

	let Points:number = 0
	let Hearts:number = 0
	let Gems:number = 0

	let hwList:number[] = [RecomNumChallengesToday, 0, 0]

	var today = new Date();
    var dd:number = today.getDate();
    var mm:number = today.getMonth()+1; 
    var yyyy:number = today.getFullYear();
    var TodayStr = dd + "."  + mm + "." + yyyy
    

	let oldCourseProgress = userProgress.courseProgress



	// ОТКРЫЛИ ГЛАВНУЮ СТРАНИЦУ И ХОТИМ УВИДЕТЬ "СТАТУС" ДОМАШНЕГО ЗАДАНИЯ СПРАВА

	if (oldCourseProgress instanceof Array) {
        //
        // Ищем Индекс название книги:
        //        
        let indexCourse = oldCourseProgress.findIndex( el => el.course === userProgress.activeCourse?.title );
		//
        if (indexCourse > -1){
            //
            // Эта книга УЖЕ есть в прогрессе,
            // ищем индекс Сегодняшней ДАТЫ
            //
            let currentProgress:progressType = oldCourseProgress[indexCourse].progress
			//
            if (currentProgress instanceof Array) {
                let indexDate = currentProgress.findIndex( el => el.date === TodayStr );
                if (indexDate > -1){
					//
                    //
                    // Нашли ДАТУ
                    // Обновляем данные в найденной КНИГЕ найденной ДАТЕ
                    //
					hwList  = oldCourseProgress[indexCourse].progress[indexDate].hw
					Points = oldCourseProgress[indexCourse].progress[indexDate].pts
					Hearts = oldCourseProgress[indexCourse].progress[indexDate].hearts

                } else {
                    
					let lastProgress = oldCourseProgress[indexCourse].progress[oldCourseProgress[indexCourse].progress.length - 1]
                    //
                    // ДАТУ НЕ нашли. Создаем НОВОЕ ДЗ . Добавляем новое ДЗ с ДАТОЙ
                    //
					hwList = [RecomNumChallengesToday, 0, 
						lastProgress.hw[1] === lastProgress.hw[0]
                            ? lastProgress.hw[2] += 1
                            : 0
					]
					
					oldCourseProgress[indexCourse].progress.push({
                        date: TodayStr,
                        hw: hwList,
                        selfDoneRight: 0,
                        selfDoneWrong: 0,
                        dateReady: '01.01.2125',
                        hearts: 20,
                        pts: lastProgress.pts,
						gems: lastProgress.gems
                    })

					Points = lastProgress.pts
					Gems = lastProgress.gems
					Hearts = 20

                    await db.update(userProgressSchema).set({
						points: 0,
						courseProgress: oldCourseProgress
                    }).where(eq(userProgressSchema.userId, userId))
					
                }
            }

               
            } 
            
			//
            // Книги еще нет, ПЕРВЫЙ РАЗ пользователь открыл САЙТ еще БЕЗ ПРОГРЕССА
            // 
            //
            else {
                
				hwList = [RecomNumChallengesToday, 0, 0]

				let newCourseProgress:SuperType = [{
					course: userProgress.activeCourse.title,
				progress:[{
					date: TodayStr,
					hw: hwList,
					selfDoneRight: 0,
					selfDoneWrong: 0,
					dateReady: '01.01.2125',
					hearts: 20,
					pts: 0,
					gems: 0,
					}]
				}]

				oldCourseProgress.push(newCourseProgress[0])

                await db.update(userProgressSchema).set({
                    points: 0,
                    courseProgress: oldCourseProgress
            
                }).where(eq(userProgressSchema.userId, userId))
            }
        } 



	



	const ThisClassId = userProgress.classId
	// const CoursesIdsThisClass = allClasses.filter(el => el.id == ThisClassId)[0].courseListIds
	// const TCoursesIdsThisClass = allClasses.filter(el => el.id == ThisClassId)[0].tCourseListIds
	
	 






	const usersThisClass = allUsers.filter(user=>user.classId == ThisClassId)

    const thisClassHW = allClassHW?.filter(el => el.classId == ThisClassId)


    // console.log('lessonStat', lessonStat)

    const big = usersThisClass.map(user => {
        
        // смотрим во ВСЕМ списке выполненых Challenge те, которые выполнены ЭТИМ user
        //
        const ChallengesDoneByThisUser = challengeProgress.filter(chal_prog => chal_prog.userId == user.userId)

        
        // идем по HW, 
        // смотрим в КАЖДОМ HW, выполнены ЛИ Challeng's после ДАТЫ ВЫДАЧИ задания
        if (thisClassHW) {
            const thisUserListHWStat = thisClassHW.map(cur_hw => {
                // смотрим конкретное ОДНО HW
                //
                // Контрольное ПРОИЗВЕДЕНИЕ (если будет 1 то все Lesson'ы этого HW выполнены)
                let controlMultiply = 1
                let ListOfMissedChallengesIds: number[] = []
                //
                const hw_casual_string = cur_hw.task
                if (hw_casual_string != null && hw_casual_string != "") {
                    const hw_casual_list_of_str = hw_casual_string.split(',')
                    
                    // hw_trainer - список номеров задач этого HW
                    const hw_casual = hw_casual_list_of_str.map((str) => Number(str));
                    

                    // TODO:
                    // считаем, сколько user'ов НЕ сделало каждый unit
                    // const hw_trainer_missed = 

                    
   
                    hw_casual.map(cur_chal_in_hw => {
                        // смотрим первый (нулевой) результат по этому challenge'у тк УЖЕ был отсортирован в query по дате
                        const isDoneChallenge = ChallengesDoneByThisUser.filter(challengeDone => challengeDone.challengeId == cur_chal_in_hw)[0]?.completed
                        const isDoneRightChallenge = ChallengesDoneByThisUser.filter(challengeDone => challengeDone.challengeId == cur_chal_in_hw)[0]?.doneRight
                        // console.log(user.userId)
                        // console.log(doneRightPercent)
                        // console.log('----')
                        

                        // смотрим, сколько раз был решен Lesson ПОСЛЕ даты выдачи HW
                        //
                        const timesDoneCurChallengeAfterHWDate = ChallengesDoneByThisUser.filter(challengeDone => 

                            (challengeDone.challengeId == cur_chal_in_hw) && (challengeDone.dateDone > cur_hw.dateHw))?.length



                        if (isDoneRightChallenge && timesDoneCurChallengeAfterHWDate > 0) {
                            //
                            // ничего не делаем
                            //
                        } else {
                            controlMultiply = controlMultiply * 0
                            ListOfMissedChallengesIds.push(cur_chal_in_hw)
                        }
                    })
                }

                return (
                    {
                        dateHW: cur_hw.dateHw,
                        isDone: controlMultiply,
                        ListOfMissedChallengesIds: ListOfMissedChallengesIds,
                    }
                )
                

            })
            return (
                {
                    thisUserListHWStat: thisUserListHWStat,
                    userName: user.userName,
                    userId: user.userId,                    
                }
            )
        }
    })


    const thisUserStatHW = big.filter(user => user?.userId == userProgress.userId)[0]

    const numOfHwDone = thisUserStatHW?.thisUserListHWStat.filter(el => el.isDone).length
    const numOfHwNotDone = thisUserStatHW?.thisUserListHWStat.filter(el => !el.isDone).length


    let missedCIds: number[] = []
    thisUserStatHW?.thisUserListHWStat.map( cur_hw => {
        cur_hw.ListOfMissedChallengesIds.map(challenge_id => {
            missedCIds.push(challenge_id)
        })
    })



		

	
	return (
		<div className='flex flex-row-reverse gap-[48px] px-6'>
			<StickyWrapper>
				<UserProgress 
					activeCourse={userProgress.activeCourse} 
					hearts={Hearts} 
					points={Points} 
					gems={Gems}
					
					hasActiveSubscription={false} 
				/>

				<Promo YourDaysLate={YourDaysLate} formattedDate={formattedDate}/>
				<Quests points={Points} hwList={hwList} />
				
			</StickyWrapper>

			



			{/* const CenterImage = () => {

return (
  <motion.div
	className="sticky top-0 h-screen w-full"
	style={{
	  clipPath,
	  backgroundSize,
	  opacity,
	  backgroundImage:
		"url(https://images.unsplash.com/photo-1460186136353-977e9d6085a1?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
	  backgroundPosition: "center",
	  backgroundRepeat: "no-repeat",
	}}
  />
);
}; */}



		<FeedWrapper>
			
		<Header title={userProgress.activeCourse.title} />

		<div className='content-center mx-auto justify-center text-center align-middle'>
			<HwTopBanner missedCIds={missedCIds}  variant='casual'/>
		</div>					


		<div className='mt-5'>

					{units.map((unit, index)=>(
					
						<div key={unit.id} className='mb-10'>
							<Unit 
								id={unit.id}
								order={unit.order}
								description={unit.description}
								title={unit.title}
								
								
								// lessons={unit.lessons}
								lessons={unit.lessons}


								activeLesson={courseProgress.activeLesson as typeof lessons.$inferSelect & {
									unit: typeof unitsSchema.$inferSelect
								} | undefined}
								lessonStat={lessonStat}
								percentageDone={unitStat.filter(el=>el.unitId===unit.id)[0].percentageDone}
								imgSrc={unit.imageSrc}
								RecomNumChallengesToday={RecomNumChallengesToday}
								bgSvgSrc = {bgSvgSrc[index]}


								// user_id={userProgress.userId}
								// allClasses={allClasses}
								// allClassHW={allClassHW}
								// allUsers={allUsers}						
								// this_class_id={userProgress.classId}
								// challengeProgress={challengeProgress}

								missedCIds = {missedCIds}
							/>
						</div>
					))}


		</div>
			
			</FeedWrapper>
		</div>
	);
};

export default LearnPage;







