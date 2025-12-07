// import { getChallengeProgress, getLesson, getUserProgress } from "@/db/queries"
// import { redirect } from "next/navigation"
// import { Quiz } from "./quiz"
// import { SuperType } from "@/db/schema"
// import { getUserPointsHearts } from "@/usefulFunctions"



// const LessonPage =  async () => {
//     const lessonData = getLesson()
//     const userProgressData = getUserProgress()
//     const challengeProgressData = getChallengeProgress()

//     const [
//         lesson,
//         userProgress,
//         challengeProgress,
//     ] = await Promise.all([
//         lessonData,
//         userProgressData,
//         challengeProgressData,
//     ])

//     if (!lesson || !userProgress || !challengeProgress){
//         redirect('/learn')
//     }


//     const initialPercentage = lesson.challenges
//     .filter((challenge)=>challenge.completed)
//     .length / lesson.challenges.length * 100


    
//     const activeCourseTitle = !!userProgress.activeCourse 
//     ? userProgress.activeCourse.title 
//     : ''



//     let oldCourseProgress : SuperType = userProgress.courseProgress 
    
//     // if (oldCourseProgress instanceof Array) {
//     //     oldCourseProgress.findIndex( el => el.course === activeCourseTitle )
//     // }

//     // let initialHearts = userProgress.courseProgress[0].progress[0].hearts

//     const [initialPoints, initialHearts, initialGems] = getUserPointsHearts(userProgress)




//     return(
       
//         <Quiz 
//             initialLessonId={lesson.id}
//             initialLessonChallenges={lesson.challenges}
//             // initialHearts={userProgress.hearts}
//             initialHearts={initialHearts}
//             initialPercentage = {initialPercentage}
//             userSubscription={null}
//             challengeProgress={challengeProgress}
//             lessonTitle={lesson.title}

//             oldCourseProgress={oldCourseProgress}
//             activeCourseTitle={activeCourseTitle}
//         />
//     )
// }

// export default LessonPage