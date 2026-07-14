import { FeedWrapper } from "@/components/feed-wrapper"
import { StickyWrapper } from "@/components/sticky-wrapper"
import { Separator } from "@/components/ui/separator"
import { getAllClassHW, getAllClasses, getAllTLessonProgress, getAllUsers, getChallengeProgress, getChallengeProgressAllUsers, getCourseProgress, getCourses, getTCourses, getTUnits, getUnits, getUserProgress } from "@/db/queries"
import Image from "next/image"
import { redirect } from "next/navigation"
import { TabUsers } from "./tab-users"
import { ProgressHeatmap } from "@/components/progress-heatmap"

const ClassroomPage = async () => {

    const allUsersData = getAllUsers()
    const allClassesData = getAllClasses()


    const t_coursesData = getTCourses();
	const userProgressData = getUserProgress()
	const courseProgressData = getCourseProgress()
	// challengeProgress ALL USERS
	const challengeProgressData = getChallengeProgressAllUsers()

    

	const t_unitsData = getTUnits()

    const userAllTLessonProgressData = getAllTLessonProgress()
    const allClassHWData = getAllClassHW()


    const coursesData = getCourses();
	const unitsData = getUnits()



    
	// const allUsersProgressData = getAllUsersProgress()

    const [
        allUsers,
        allClasses,


        t_courses,
		userProgress,
		t_units,
		courseProgress,
		challengeProgress,

		all_t_lessonProgress,
        allClassHW,

        courses,
        units,

    ] = await Promise.all([
        allUsersData,
        allClassesData,


        t_coursesData,
		userProgressData,
		t_unitsData,
		courseProgressData,
		challengeProgressData,

		userAllTLessonProgressData,
        allClassHWData,


        coursesData,
        unitsData,
    ])

 





    if (!allUsers || !allClasses) {
		redirect('/');
	}

    
    if (!userProgress?.isAdmin) {
		redirect('/');
	}



    if (!userProgress || !userProgress.activeCourse) {
		redirect('/courses');
	}

	if (!courseProgress) {
		redirect('/courses')
	}

	if (!challengeProgress){
        redirect('/learn')
    }

	if (!t_units || !units) {
		redirect('/learn')
	}





    const challengesData = units.flatMap(unit => 
    unit.lessons.flatMap(lesson =>
        lesson.challenges.map(challenge => {
            // Находим, было ли задание в ДЗ
            const isFromHomework = allClassHW?.some(hw => 
                hw.task?.split(',').includes(String(challenge.id))
            ) || false;
            
            // Находим прогресс ученика или статистику
            const progress = challengeProgress.find(p => p.challengeId === challenge.id);
            
            return {
                id: challenge.id,
                lessonId: lesson.id,
                lessonTitle: lesson.title,
                unitId: unit.id,
                unitTitle: unit.title,
                courseId: unit.courseId,
                courseTitle: courses.find(c => c.id === unit.courseId)?.title || '',
                isCompleted: progress?.completed || false,
                isDoneRight: progress?.doneRight || false,
                isFromHomework,
                };
            })
        )
    );


    return (
        <div className="flex flex-row-reverse gap-[48px] px-6">
            <StickyWrapper>
                <div>
                    sidebar
                </div>
            </StickyWrapper>
            <FeedWrapper>
                <div className="w-full flex flex-col items-center">
                    
                    <Image
                        src='/class.svg'
                        alt='Leaderboard'
                        height={90}
                        width={90}
                    />   
                    <h1 className="text-center font-bold text-neural-800 text-2xl my-6">
                        Классы
                    </h1>
                    <p className="text-muted-foreground text-center text-lg mb-6">
                        Организация уроков
                    </p>

                    <Separator className="mb-4 h-0.5 rounded-full" />










                    <TabUsers 
                        // для Tab users
                        allUsers={allUsers}
                        allClasses={allClasses}    

                        // для Tab hw trainer
                        t_courses={t_courses} 
                        t_units={t_units} 

                        // для Tab hw
                        courses={courses} 
                        units={units} 

                        // для статистики учеников (просмотр сделали или нет ДЗ)
                        all_t_lessonProgress={all_t_lessonProgress}
                        allClassHW={allClassHW}
                        challengeProgress={challengeProgress}


                    />





                    



                </div>

                <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-4">📊 Карта прогресса задачника</h2>
                    <ProgressHeatmap
                        challengesData={challengesData}
                        isAdminView={true}
                    />
                </div>



            </FeedWrapper>
            
        </div>

)}

export default ClassroomPage


