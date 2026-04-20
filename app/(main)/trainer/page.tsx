import { FeedWrapper } from '@/components/feed-wrapper';
import { StickyWrapper } from '@/components/sticky-wrapper';
import { UserProgress } from '@/components/user-progress';
import { getAllClassHW, getAllClasses, getAllTLessonProgress, getAllUsers, getAllUsersProgress, getChallengeProgress, getCourseProgress, getTCourses, getTLessonProgress, getTUnits, getUserProgress } from '@/db/queries';
import { redirect } from 'next/navigation';
import { Header } from './header';
// import { auth, currentUser } from "@clerk/nextjs/server"
import { TabTCourses } from '@/components/tab-t-courses';
import { HwTopBanner } from '../learn/hw-top-banner';
import { auth } from '@/lib/auth';



const LearnPage = async () => {
	// const { userId } = await auth();
	// const user = await currentUser();

	// if (!userId || !user) {
	// 	throw new Error('Вы не авторизированны!');
	// }

	const session = await auth(); // 👈 Получаем сессию
	const userId = session?.user?.id; // 👈 Берем id из сессии

	// const userId = await getVKUserId();
	if (!userId) {
		return null;
	}

	// const coursesData = getCourses();
	const t_coursesData = getTCourses();

	const userProgressData = getUserProgress()
	const courseProgressData = getCourseProgress()
	const challengeProgressData = getChallengeProgress()

	const t_unitsData = getTUnits()
	const userTLessonProgressData = getTLessonProgress()
	
	const userAllTLessonProgressData = getAllTLessonProgress()
	

	const allUsersProgressData = getAllUsersProgress()







    const allClassesData = getAllClasses()


    // const t_coursesData = getTCourses();
	// const userProgressData = getUserProgress()
	// const courseProgressData = getCourseProgress()
	// const challengeProgressData = getChallengeProgress()
	// const t_unitsData = getTUnits()

    // const userAllTLessonProgressData = getAllTLessonProgress()
    const allClassHWData = getAllClassHW()
    const allUsersData = getAllUsers()




	const [
		t_courses,
		userProgress,
		t_units,
		courseProgress,
		challengeProgress,
		t_lessonProgress,

		all_t_lessonProgress,
		allUsersProgress,

		allClasses,
		allClassHW,
		allUsers,


	] = await Promise.all([
		t_coursesData,
		userProgressData,
		t_unitsData,
		courseProgressData,
		challengeProgressData,
		userTLessonProgressData,

		userAllTLessonProgressData,
		allUsersProgressData,


		allClassesData,
		allClassHWData,
		allUsersData,
	]);

	if (!userProgress || !userProgress.activeCourse || !allClasses) {
		redirect('/courses');
	}

	if (!courseProgress) {
		redirect('/courses')
	}

	if (!challengeProgress){
        redirect('/learn')
    }

	if (!t_units) {
		redirect('/learn')
	}

	// для сравнения рейтинга в trainer-list
	//
	// const user_id = userProgress.userId

	const ThisClassId = userProgress.classId
	// const CoursesIdsThisClass = allClasses.filter(el => el.id == ThisClassId)[0].courseListIds
	// const TCoursesIdsThisClass = allClasses.filter(el => el.id == ThisClassId)[0].tCourseListIds

	// console.log('CoursesIdsThisClass', CoursesIdsThisClass)
	// console.log('TCoursesIdsThisClass', TCoursesIdsThisClass)

	// console.log('CoursesIdsThisClass', CoursesIdsThisClass)
	// отфильтровать последние по дате
	//
	// all_t_lessonProgress.map(lesson => (
	// 	console.log(lesson)
	// ))


	// const data = [
	// 	{ group: 'A', name: 'SD' }, 
	// 	{ group: 'B', name: 'FI' }, 
	// 	{ group: 'A', name: 'MM' },
	// 	{ group: 'B', name: 'CO'}
	//   ];
	//   const unique = [...new Set<typeof>(t_lessonProgress.map(item => item.userId))];


	// Смотрим КАКИЕ уникальные Lesson в таблице LessonProgress были хотябы раз решены
	//
	const UniqueLessonIds = all_t_lessonProgress.map(el => el.t_lessonId)
	  .filter(
		  (value, index, current_value) => current_value.indexOf(value) === index
	  );


	// Смотрим Рейтинг ВСЕХ учеников по этим Lesson'ам
	//
	const TRatingUsers = UniqueLessonIds.map(t_lesson_id => {

		const currentLessonProgress = all_t_lessonProgress.filter(progress => progress.t_lessonId == t_lesson_id)

		const UniqueUserIds = currentLessonProgress.map(el => el.userId)
		.filter(
			(value, index, current_value) => current_value.indexOf(value) === index
		);


		const usersStat = UniqueUserIds.map(user_id => {
			//
			// current lesson   current user
			//
			const CLCUProgress = currentLessonProgress.filter(progress => progress.userId == user_id)



			let DRP = 0

			const doneRight = CLCUProgress.reduce((total, elem) => {
				return (
					total + elem.doneRight
				)
			}, 0)

			const doneWrong = CLCUProgress.reduce((total, elem) => {
				return (
					total + elem.doneWrong
				)
			}, 0)

			if (doneRight + doneWrong > 0) {
				DRP = doneRight/(doneRight + doneWrong)
			}
			const DR_DRP = doneRight * DRP

			return  {
				DRP: Math.round(DRP * 100),
				DR_DRP: DR_DRP,
				user_id: allUsersProgress?.filter(pr => pr.userId==user_id)[0].userId,
				user_name: allUsersProgress?.filter(pr => pr.userId==user_id)[0].userName,
			}
		
		})

		usersStat.sort((a, b) => b.DR_DRP - a.DR_DRP)

		return {t_lesson_id: t_lesson_id, usersSortedStat: usersStat}

	}

		

	 )
	


	 







	 // для отображения сверху СКОЛЬКО ОСТАЛОСЬ сделать ДЗ Trainer LessonIds

	 const usersThisClass = allUsers.filter(user=>user.classId == ThisClassId)

	 const thisClassHW = allClassHW?.filter(el => el.classId == ThisClassId)
 
 
	 // console.log('lessonStat', lessonStat)
 
	 const big = usersThisClass.map(user => {
		 
		 // смотрим во ВСЕМ списке выполненых Challenge те, которые выполнены ЭТИМ user
		 //
		 const lessonsDoneByThisUser = all_t_lessonProgress.filter(t_less_propg => t_less_propg.userId == user.userId)
 
		 
		 // идем по HW, 
		 // смотрим в КАЖДОМ HW, выполнены ЛИ Challeng's после ДАТЫ ВЫДАЧИ задания
		 if (thisClassHW) {
			 const thisUserListHWStat = thisClassHW.map(cur_hw => {
				 // смотрим конкретное ОДНО HW
				 //
				 // Контрольное ПРОИЗВЕДЕНИЕ (если будет 1 то все Lesson'ы этого HW выполнены)
				 let controlMultiplyTrainer = 1
				 let ListOfMissedLessonsIds: number[] = []
				 //
				 const hw_trainer_string = cur_hw.taskTrainer
				 if (hw_trainer_string != null && hw_trainer_string != "") {
					 const hw_trainer_list_of_str = hw_trainer_string.split(',')
					 
					 // hw_trainer - список номеров задач этого HW
					 const hw_trainer = hw_trainer_list_of_str.map((str) => Number(str));
					 
 
					 // TODO:
                    // считаем, сколько user'ов НЕ сделали каждый lesson
                   
   
                    hw_trainer.map(cur_les_in_hw => {
                        // смотрим первый (нулевой) результат по этому Lesson'у тк УЖЕ был отсортирован в query по дате
                        const doneRightPercent = lessonsDoneByThisUser.filter(lessonDone => lessonDone.t_lessonId == cur_les_in_hw)[0]?.doneRightPercent
 
                        // смотрим, сколько раз был решен Lesson ПОСЛЕ даты выдачи HW
                        //
                        const timesDoneCurLessonAfterHWDate = lessonsDoneByThisUser.filter(lessonDone => 
                            (lessonDone.t_lessonId == cur_les_in_hw) && (lessonDone.dateDone > cur_hw.dateHw))?.length

                        if (doneRightPercent > 90 && timesDoneCurLessonAfterHWDate > 0) {
                            //
                            // ничего не делаем
                            //
                        } else {
                            controlMultiplyTrainer = controlMultiplyTrainer * 0
                            ListOfMissedLessonsIds.push(cur_les_in_hw)
                        }
                    })



				 }
 
				 return (
					 {
						 dateHW: cur_hw.dateHw,
						 isDone: controlMultiplyTrainer,
						 ListOfMissedLessonsIds: ListOfMissedLessonsIds,
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
 
 
	 let missedLIds: number[] = []
	 thisUserStatHW?.thisUserListHWStat.map( cur_hw => {
		 cur_hw.ListOfMissedLessonsIds.map(lesson_id => {
			missedLIds.push(lesson_id)
		 })
	 })












	return (
		<div className='flex flex-row-reverse gap-[48px] px-6'>
			<StickyWrapper>
				<UserProgress 
					activeCourse={userProgress.activeCourse} 
					hearts={10} 
					points={11} 
					gems={12}
					
					hasActiveSubscription={false} 
					
				/>
				
			</StickyWrapper>


			<FeedWrapper>
				<Header title="Тренажёр" />




				<div className='content-center mx-auto justify-center text-center align-middle'>
					<HwTopBanner missedCIds={missedLIds}  variant='trainer'/>
				</div>	





				<TabTCourses 
					t_courses={t_courses} 
					t_units={t_units} 
					t_lessonProgress={t_lessonProgress}
					TRatingUsers={TRatingUsers}
					user_id={userProgress.userId}

					allClasses={allClasses}
					allClassHW={allClassHW}
					allUsers={allUsers}

					all_t_lessonProgress={all_t_lessonProgress}
					this_class_id={userProgress.classId}
				/>

				

				{/* <ScrollTriggered /> */}

			</FeedWrapper>
		</div>
	);
};

export default LearnPage;
