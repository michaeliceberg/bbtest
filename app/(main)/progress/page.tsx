// app/(main)/progress/page.tsx

import { FeedWrapper } from "@/components/feed-wrapper"
import { StickyWrapper } from "@/components/sticky-wrapper"
import { UserProgress } from "@/components/user-progress"
import { getChallengeProgress, getUnits, getUserProgress, getUserSubscription } from "@/db/queries"
import Image from "next/image"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
// import { Achievement } from "@/components/achievements"
import { TrendingUp, Calendar, Target, Zap, Award, BookOpen, CheckCircle, Clock } from 'lucide-react'
import { Achievement } from "@/components/achievements"
// import { Achievement } from "@/components/achievements"

const ProgressPage = async () => {
    const userProgressData = getUserProgress()
    const userSubscriptionData = getUserSubscription()
    const unitsData = getUnits()
    const challengeProgressData = getChallengeProgress()

    const [userProgress, userSubscription, units, challengeProgress] = await Promise.all([
        userProgressData,
        userSubscriptionData,
        unitsData,
        challengeProgressData,
    ])

    if (!userProgress || !userProgress.activeCourse) {
        redirect('/courses')
    }

    if (!challengeProgress) {
        redirect('/learn')
    }

    const isPro = !!userSubscription?.isActive

    // Расчет статистики
    const allChallengesInCourse: number[] = []
    const unitStats: { unitId: number; unitTitle: string; total: number; completed: number; percent: number }[] = []

    for (const unit of units) {
        let unitTotal = 0
        let unitCompleted = 0

        for (const lesson of unit.lessons) {
            for (const challenge of lesson.challenges) {
                allChallengesInCourse.push(challenge.id)
                unitTotal++

                const progress = challenge.challengeProgress?.[0]
                if (progress?.completed) {
                    unitCompleted++
                }
            }
        }

        unitStats.push({
            unitId: unit.id,
            unitTitle: unit.title,
            total: unitTotal,
            completed: unitCompleted,
            percent: unitTotal > 0 ? Math.round((unitCompleted / unitTotal) * 100) : 0,
        })
    }

    const totalChallenges = unitStats.reduce((sum, u) => sum + u.total, 0)
    const totalCompleted = unitStats.reduce((sum, u) => sum + u.completed, 0)
    const totalPercent = totalChallenges > 0 ? Math.round((totalCompleted / totalChallenges) * 100) : 0

    // Активность за последнюю неделю
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const lastWeekChallenges = challengeProgress.filter(cp =>
        allChallengesInCourse.includes(cp.challengeId) && new Date(cp.dateDone) > weekAgo
    )
    const dailyAverage = Math.round((lastWeekChallenges.length / 7) * 10) / 10

    // Прогноз
    const remaining = totalChallenges - totalCompleted
    const daysToFinish = dailyAverage > 0 ? Math.round(remaining / dailyAverage) : 0
    const finishDate = new Date()
    finishDate.setDate(finishDate.getDate() + daysToFinish)
    const formattedFinishDate = finishDate.toLocaleDateString('ru-RU')

    const getPercentColor = (percent: number) => {
        if (percent >= 80) return 'bg-green-500'
        if (percent >= 50) return 'bg-yellow-500'
        if (percent >= 20) return 'bg-orange-500'
        return 'bg-gray-300'
    }

    return (
        <div className="flex flex-row-reverse gap-[48px] px-6">
            <StickyWrapper>
                <UserProgress
                    activeCourse={userProgress.activeCourse}
                    hearts={userProgress.hearts}
                    points={userProgress.points}
                    gems={userProgress.gems}
                    hasActiveSubscription={isPro}
                />
                <Achievement />
            </StickyWrapper>

            <FeedWrapper>
                {/* Шапка */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-3">
                            <TrendingUp className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Мой прогресс</h1>
                            <p className="text-gray-500">{userProgress.activeCourse.title}</p>
                        </div>
                    </div>
                </div>

                {/* Статистика в карточках */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl border p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-gray-500 mb-2">
                            <BookOpen className="h-4 w-4" />
                            <span className="text-sm">Всего заданий</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-800">{totalChallenges}</div>
                    </div>
                    <div className="bg-white rounded-xl border p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-gray-500 mb-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Выполнено</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-800">{totalCompleted}</div>
                        <div className="text-sm text-green-600">{totalPercent}%</div>
                    </div>
                    <div className="bg-white rounded-xl border p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-gray-500 mb-2">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm">В день</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-800">{dailyAverage}</div>
                        <div className="text-sm text-gray-400">задач/день</div>
                    </div>
                    <div className="bg-white rounded-xl border p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-gray-500 mb-2">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">Прогноз</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-800">{daysToFinish}</div>
                        <div className="text-sm text-gray-400">дней до завершения</div>
                    </div>
                </div>

                {/* Прогресс-бар общего курса */}
                <div className="bg-white rounded-xl border p-6 mb-8">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-lg">Общий прогресс курса</h3>
                        <span className="text-2xl font-bold text-green-600">{totalPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                            className="bg-green-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${totalPercent}%` }}
                        />
                    </div>
                    <p className="text-sm text-gray-500 mt-3">
                        {totalCompleted} из {totalChallenges} заданий выполнено
                    </p>
                </div>

                {/* Прогресс по разделам */}
                <div className="bg-white rounded-xl border p-6 mb-8">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Target className="h-5 w-5 text-purple-500" />
                        Прогресс по разделам
                    </h3>
                    <div className="space-y-4">
                        {unitStats.map((unit) => (
                            <div key={unit.unitId}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-gray-700">{unit.unitTitle}</span>
                                    <span className="text-gray-500">{unit.completed}/{unit.total}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`${getPercentColor(unit.percent)} h-2 rounded-full transition-all duration-500`}
                                        style={{ width: `${unit.percent}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Аналитика */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-500" />
                        Аналитика
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-white/50">
                            <span className="text-gray-600">Осталось решить</span>
                            <span className="font-bold text-orange-600">{remaining} задач</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/50">
                            <span className="text-gray-600">Средняя скорость</span>
                            <span className="font-bold text-blue-600">{dailyAverage} задач/день</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/50">
                            <span className="text-gray-600">Прогнозируемая дата завершения</span>
                            <span className="font-bold text-green-600">{formattedFinishDate}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-gray-600">Активность на этой неделе</span>
                            <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{lastWeekChallenges.length} задач</span>
                            </div>
                        </div>
                    </div>
                </div>
            </FeedWrapper>
        </div>
    )
}

export default ProgressPage


// import { FeedWrapper } from "@/components/feed-wrapper"
// import { StickyWrapper } from "@/components/sticky-wrapper"
// import { Progress } from "@/components/ui/progress"
// import { UserProgress } from "@/components/user-progress"
// import { getChallengeProgress, getUnits, getUserProgress, getUserSubscription } from "@/db/queries"
// import Image from "next/image"
// import { redirect } from "next/navigation"

// import { format } from 'date-fns';
// import { Button } from "@/components/ui/button"
// import { getUserPointsHearts } from "@/usefulFunctions"
// import { Achievement } from "@/components/achievments"
// import { LottieTester } from "@/components/LottieTester"
// // import { BuyMine } from "@/components/buy-mine"


// const ProgressPage = async () => {

//     const userProgressData = getUserProgress()
//     const userSubscriptionData = getUserSubscription()
    
//     const unitsData = getUnits()
//     const challengeProgressData = getChallengeProgress()

//     const [
//         userProgress,
//         userSubscription,

//         units,
//         challengeProgress,
//     ] = await Promise.all([
//         userProgressData,
//         userSubscriptionData,

//         unitsData,
//         challengeProgressData,
//     ])

//     if (!userProgress || !userProgress.activeCourse) {
//         redirect('/courses')
//     }


// 	if (!challengeProgress) {
//         redirect('/learn')
//     }

//     const isPro = !!userSubscription?.isActive











// 	const allChallengesInCourse:number[] = []

// 	const infoUnitsStat = units.map((unit, index) => {
				
// 		const doneRightInLesson = unit.lessons.map((lesson, lessonIndex) => {
			
// 			let doneRight = 0
// 			let doneWrong = 0
// 			let numChallengesInLesson = 0

// 			const doneRightChallenges = lesson.challenges.map((challenge) => {
// 				//
// 				allChallengesInCourse.push(challenge.id)
// 				//
// 				if (lesson.id === challenge.lessonId) {

// 					numChallengesInLesson += 1

// 					if (challenge.challengeProgress) {
						
// 						if (challenge.challengeProgress[0]?.completed) {
// 							if (challenge.challengeProgress[0].doneRight) {
// 								doneRight += 1
// 							} else {
// 								doneWrong += 1
// 							}
// 						}
// 					}
// 					}
// 				})

			

// 			return {
// 				lesson: lesson.id,
// 				unitId: unit.id,
// 				unitTitle: unit.title,
// 				done: [ numChallengesInLesson,  doneRight, doneWrong],
// 				// percentageDoneLesson: Math.round((doneRight+doneWrong)/numChallengesInLesson * 100) / 100 
// 				// percentageDoneLesson:(doneRight+doneWrong)/numChallengesInLesson 
// 				percentageDoneLesson: Math.round(100*(doneRight+doneWrong)/numChallengesInLesson)
// 			}
// 		})
		

// 		return {
// 			doneRightInLesson,
// 		}})


// 	interface lessonDone {
// 		lesson: number;
// 		done: number[];
// 		unitId: number;
// 		unitTitle: string;
// 		percentageDoneLesson: number;
// 	}




// 	let lessonStat: Array<lessonDone> = [];

// 	const newList = infoUnitsStat.map(unit => {
// 		unit.doneRightInLesson.map(lesson => {
// 			lessonStat.push(lesson)
// 			return lesson
// 		})
// 	})


// 	const UniqueUnitIds = lessonStat.map(el => el.unitId)
// 	.filter(
// 		(value, index, current_value) => current_value.indexOf(value) === index
// 	);

// 	let UnitsLessonsPercentage = []

	

// 	const unitStat = UniqueUnitIds.map(unitId => {
		
// 		let toDone = 0
// 		let doneRight = 0
// 		let doneWrong = 0
// 		let percentageDoneLesson = 0
// 		let unitTitle = ''

// 		lessonStat.map(el => {
// 			if (el.unitId === unitId) {
// 				toDone = toDone + el.done[0]
// 				doneRight = doneRight + el.done[1]
// 				doneWrong = doneWrong + el.done[2]
// 				unitTitle = el.unitTitle
// 				percentageDoneLesson =  Math.round((doneRight + doneWrong) / toDone * 100) / 100 
// 			}
// 		})


// 		return (
// 			{
// 				unitId: unitId,
// 				unitTitle: unitTitle,
// 				toDone: toDone,
// 				doneRight: doneRight,
// 				doneWrong: doneWrong,
// 				percentageDone: (doneRight+doneWrong)/toDone,
// 			}
// 		)
// 	})

// 	lessonStat.sort((a, b) => (a.percentageDoneLesson > b.percentageDoneLesson ? -1 : 1));


// 	let numWholeChallenge:number = lessonStat.reduce((total, lesson)=> total + lesson.done[0], 0 )
// 	let numDoneChallenge:number = lessonStat.reduce((total, lesson)=> total + lesson.done[1] + lesson.done[2], 0 )
// 	let numLeftChallenge:number = numWholeChallenge - numDoneChallenge

// 	var dateExam = new Date(2025, 4, 1);
// 	var dateNow = new Date()
// 	var diff = Math.abs(dateExam.getTime() - dateNow.getTime());
// 	var daysTillExam = Math.ceil(diff / (1000 * 3600 * 24)); 
	
// 	const Recom_ChalPerDay = Math.round(numLeftChallenge / daysTillExam * 100) / 100
// 	const lastWeekChallenges = challengeProgress.filter(challenge => {
	
// 	var diff = Math.abs(challenge.dateDone.getTime() - dateNow.getTime());
	
// 	var diffDays = Math.ceil(diff / (1000 * 3600 * 24)); 

// 	if (allChallengesInCourse.includes(challenge.challengeId) && diffDays < 8)
// 			return true
// 	})

	
// 	const challengesInWeek:number = lastWeekChallenges.length
// 	let current_ChalPerDay = challengesInWeek > 0 
// 		? Math.round(challengesInWeek / 7 * 100) / 100 
// 		: 1
	
// 	let daysToFinishWYS = Math.round(numLeftChallenge / current_ChalPerDay)


// 	const dateDone = new Date(dateNow.getTime() + daysToFinishWYS*(1000 * 60 * 60 * 24));
// 	const formattedDate: string = format(dateDone, 'dd.MM.yyyy');
// 	const YourDaysLate:number = daysToFinishWYS - daysTillExam





// 	const RecomNumChallengesToday:number = Math.round(Recom_ChalPerDay*4)





// 	let quests = [ 
// 		{
// 			title: 'Задание сегодня',
// 			value: [0, 0, 0]
// 		},
// 	]




// 	// ГРУЗИМ HW
// 	//
// 	let hwList = [0, 0, 0]
// 	//
// 	let oldCourseProgress = userProgress.courseProgress
// 	if (oldCourseProgress instanceof Array) {
//         let indexCourse = oldCourseProgress.findIndex( el => el.course === userProgress.activeCourse?.title );
//         //
// 		let lastProgress = oldCourseProgress[indexCourse].progress[oldCourseProgress[indexCourse].progress.length - 1]
//         if (indexCourse > -1){
//             //
//             // Эта книга УЖЕ есть в прогрессе,
//             // ищем индекс Сегодняшней ДАТЫ
//             //
// 			let lastProgress = oldCourseProgress[indexCourse].progress[oldCourseProgress[indexCourse].progress.length - 1]
// 			let hwList = lastProgress.hw
// 			quests[0].value = hwList
//         }
//     }












// 	const [Points, Hearts, Gems] = getUserPointsHearts(userProgress)


//     return (
//         <div className="flex flex-row-reverse gap-[48px] px-6">
//             <StickyWrapper>
//                 <UserProgress 
//                     activeCourse={userProgress.activeCourse}
//                     hearts={Hearts}
//                     points={Points}
// 					gems={Gems}
//                     hasActiveSubscription={isPro}
//                 />

// 			<Achievement />
//             </StickyWrapper>
            
//             <FeedWrapper>
                    
//                 <div className="w-full flex flex-col items-center mb-10">
//                     <Image
//                         src='/quests.svg'
//                         alt='Quests'
//                         height={90}
//                         width={90}
//                     />   
//                     <h1 className="text-center font-bold text-neural-800 text-2xl my-6">
//                         Прогресс
//                     </h1>
//                     <p className="text-muted-foreground text-center text-lg mb-6">
//                         Выполняйте квесты и зарабатывайте очки
//                     </p>



				
					



// 				<div className="flex items-center w-full p-4 gap-x-4 border-t-2">
				
				
				










//             </div>







//                     <ul className="w-full pt-5">
// 						{/* 
// 						//
// 						// Прогрес КВЕСТОВ
// 						//
// 						*/}
//                         {quests.map((quest)=>{
//                             const progress = (quest.value[1] / quest.value[0]) * 100

//                             return (

// 									<div key={quest.title}>

//                                     <Image 
//                                         src = '/points.svg'
//                                         alt = 'Points'
//                                         width={60}
//                                         height={60}
//                                     />
//                                     <div className="flex flex-col gap-y-2 w-full">




// 									<div className="flex flex-1 justify-between">
// 										<p className="text-text-neutral-700 text-m font-bold">
// 											{quest.title}
// 											: реши любые {quest.value[0]} номеров
// 										</p>

// 										<p className="text-text-neutral-700 text-sm font-bold">
// 											{ (quest.value[1] === quest.value[0]) 
// 											? "готово" 
// 											: quest.value[1] + "/" + quest.value[0]}
// 										</p>
// 									</div>




//                                         {/* <p className="text-text-neutral-700 text-xl font-bold">
//                                             {quest.title}
//                                         </p> */}
//                                         <Progress 
//                                             value={progress}
//                                             className="h-3"
//                                         />
//                                     </div>
//                                 </div>
//                             )
//                         })}
//                     </ul>
                    
//                 </div>

            

//                 <div className="border-2 rounded-xl p-4 space-y-2">

// 				<div className="mb-7 mt-5">
					

//                         <h3 className="font-bold text-lg text-center">
//                             Процент решения задачника {userProgress.activeCourse.title} по разделам:
//                         </h3>
						
// 						<div className="mt-5 flex flex-1 justify-center">
// 							<h3 className="mr-4">
// 								Всего задач: 
// 							</h3>
// 							<h3>
// 								{numWholeChallenge}
// 							</h3>
// 						</div>

// 						<div className="mt-1 flex flex-1 justify-center">
// 							<h3 className="mr-4">
// 								Вами решено: 
// 							</h3>
// 							<h3>
// 								{numDoneChallenge} ({Math.round(numDoneChallenge / numWholeChallenge * 100)}%) 
// 							</h3>
// 						</div>

// 						<div className="mt-1 flex flex-1 justify-center">
// 							<h3 className="mr-4">
// 								Ваша скорость: 
// 							</h3>
// 							<h3>
// 								{Math.round(current_ChalPerDay*10)/10} задач/день
// 							</h3>
// 						</div>

// 						<div className="mt-1 flex flex-1 justify-center">
// 							<h3 className="mr-4">
// 								С этой скоростью вы завершите задачник: 
// 							</h3>
// 							<h3>
// 								{formattedDate}
// 							</h3>
// 						</div>




//                     </div>
//                     <div className="grid grid-cols-9 auto-rows-auto gap-1">
//                             {infoUnitsStat.map((unit, index) => 
//                                 <div key={index} className="p-2 flex flex-col items-center">
//                                     {unit.doneRightInLesson[0].unitTitle.slice(0, 5)}
//                                 </div>
//                             )}
//                     </div>


//                     <div className="grid grid-cols-9 auto-rows-auto gap-1">
                        
//                         {infoUnitsStat.map((unit, index) => 
                            
//                             <div key={index*123} className="p-2 flex flex-col items-center">
                                
//                                 {unit.doneRightInLesson.map((lessonStat,index) => 
// 									// 
//                                     <Button key={index*203} className=
// 									{
// 										lessonStat.percentageDoneLesson === 0 
// 										? "w-full mb-3 bg-white border-slate-200 border-2 hover:bg-slate-100 text-slate-500"
//                                     	: lessonStat.percentageDoneLesson < 20
// 										? "w-full mb-3 bg-green-500/5 text-green-500 border-green-300 border-2 hover:bg-sky-500/20 transition-none"
//                                     	: lessonStat.percentageDoneLesson < 40
// 										? "w-full mb-3 bg-green-500/10 text-green-500 border-green-300 border-2 hover:bg-sky-500/20 transition-none"
//                                     	: lessonStat.percentageDoneLesson < 80
// 										? "w-full mb-3 bg-green-500/20 text-green-500 border-green-300 border-2 hover:bg-sky-500/20 transition-none"
// 										: "w-full mb-3 bg-green-500/30 text-green-500 border-green-300 border-2 hover:bg-sky-500/20 transition-none"
// 									}>
// 									    {/* {(lessonStat.percentageDoneLesson * 100)} */}
// 									    {(lessonStat.percentageDoneLesson)}

//                                     </Button>

//                                 )}                        

//                             </div>
//                         )}
//                     </div>
                
//                 </div>
     



// 			<LottieTester />
//             </FeedWrapper>


            
//         </div>
//     )
// }

// export default ProgressPage


