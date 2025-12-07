// import { getAllTLessonProgress, getAllUsersProgress, getTLesson, getTLessonProgress, getUserProgress } from "@/db/queries"
// import { redirect } from "next/navigation"
// import { Shuffle2, ShuffleTS } from "@/usefulFunctions"
// import { allTypesCT } from "@/db/schema";
// import TQuizRandom from "./TQUIZrandom";


// function randomBetween(min: number, max: number) { // min and max included 
//     return Math.floor(Math.random() * (max - min + 1) + min);
//   }
  

// function randomOdd(min: number, max: number) { 
//     return 2*(Math.floor(Math.random() * (Math.round(max/2) - Math.round(min/2) + 1) + Math.round(min/2)));
// }

// function randomEven(min: number, max: number) { 
//     return 2*(Math.floor(Math.random() * (Math.round(max/2) - Math.round(min/2) + 1) + Math.round(min/2))) + 1;
// }



// function escapeRegExp(str:string) {
//     return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
// }

// function replaceAll(str:string, find:string, replace:string) {
//     return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
// }




// export type QuestionType = {
       
//     questionType: allTypesCT;

//     question: string;
//     imageSrc: string;
//     options: string[];
//     numRans: string;
//     optionsQ: {
//         optQ: string;
//         pairId: number;
//         id: number;
//     }[],
//     optionsA: {
//         optA: string;
//         pairId: number;
//         id: number;
//     }[],
//     optionsConstructRight: string[],
//     correctAnswer: string,
//     timeLimit: number,
//     difficulty: string,

// }


//     const oneZeroToFive = [[0, 1, 2, 3, 4, 5],
//                           [-1, 0, 1, 2, 3, 4],
//                           [-2, -1, 0, 1, 2, 3],
//                           [-3, -2, -1, 0, 1, 2],
//                           [-4, -3, -2, -1, 0, 1],
//                           [-5, -4, -3, -2 , -1, 0]]
    

   


// type Props = {
//     params: {
//         t_lessonId: number
//     }
// }

// // TODO: Грузим ТОЛЬКО 1 LESSON в котором много challenge

// const RandomFirePage =  async ({
//     params,
// }: Props) => {
//     const lessonData = getTLesson(params.t_lessonId)
//     const userProgressData = getUserProgress()
//     const userTLessonProgressData = getTLessonProgress()



// 	const userAllTLessonProgressData = getAllTLessonProgress()
// 	const allUsersProgressData = getAllUsersProgress()


    

//     const [
//         t_lesson,
//         userProgress,
//         t_lessonProgress,

//         all_t_lessonProgress,
// 		allUsersProgress,

        
//     ] = await Promise.all([
//         lessonData,
//         userProgressData,
//         userTLessonProgressData,

//         userAllTLessonProgressData,
// 		allUsersProgressData,
//     ])

//     if (!t_lesson || !userProgress){
//         redirect('/trainer')
//     }



    




    


//     const randomGeneratedTypes = ["R ASSIST", "R SLIDER", "R CONNECT"]
//     const isRandomGeneratedType = randomGeneratedTypes.some(type => t_lesson.t_challenges[0].type.includes(type))
    

//     const GEOSIN_Type = ["GEOSIN"]
//     const isGEOSIN_Type = GEOSIN_Type.some(type => t_lesson.t_challenges[0].type.includes(type))


//     let resultGeneratedChallengeQuestion = ""
//     // const ListGeneratesQnA: GeneratedType = []
//     const ListGeneratesQnA: QuestionType[] = []
    

    
    

//     let questions: QuestionType[]




    

//         questions = t_lesson.t_challenges.map(t_challenge => (
//             {
//             questionType: t_challenge.type,
//             question: t_challenge.question,
//             imageSrc: t_challenge.imageSrc, 
//             options: Shuffle2(t_challenge.t_challengeOptions.map(el => el.text)),
//             numRans: t_challenge.numRans,
//             optionsQ : ShuffleTS([
//                 {
//                     optQ: t_challenge.t_challengeOptions[0].text,
//                     pairId: 0,
//                     id: t_challenge.t_challengeOptions[0].id,
//                 }, 
//                 {
//                     optQ: t_challenge.t_challengeOptions[1].text,
//                     pairId: 1,
//                     id: t_challenge.t_challengeOptions[1].id,
//                 }, 
//                 {
//                     optQ: t_challenge.t_challengeOptions[2].text,
//                     pairId: 2,
//                     id: t_challenge.t_challengeOptions[2].id,
//                 }, 

//             ]),
//             optionsA: ShuffleTS([
//                 {
//                     optA: t_challenge.t_challengeOptions[3].text,
//                     pairId: 0,
//                     id: t_challenge.t_challengeOptions[3].id,

//                 },
//                 {
//                     optA: t_challenge.t_challengeOptions[4].text,
//                     pairId: 1,
//                     id: t_challenge.t_challengeOptions[4].id,

//                 },
//                 {
//                     optA: t_challenge.t_challengeOptions[5].text,
//                     pairId: 2,
//                     id: t_challenge.t_challengeOptions[5].id,

//                 }
//             ]),

            
//             optionsConstructRight: [t_challenge.t_challengeOptions[0].text, t_challenge.t_challengeOptions[1].text, t_challenge.t_challengeOptions[2].text],          
          
//             difficulty: t_challenge.difficulty,
//             correctAnswer: t_challenge.t_challengeOptions[0].text,
//             // timeLimit: t_challenge.points,
//             timeLimit: 1000,
//             // timeLimit: 1234,
//         }
    
//     ))


    








//     // ЕСЛИ ТИП GEOSIN , то НЕ шафлим, а идем в порядке 

//     if (questions[0].questionType == 'GEOSIN') {

//     } else {
//         questions = ShuffleTS(questions)
//     }

//     // questions = ShuffleTS(questions)
  
    
    
  


//     const currentLessonProgress = all_t_lessonProgress.filter(el => el.t_lessonId == params.t_lessonId)


//     const UniqueUserIds = currentLessonProgress.map(el => el.userId)
//     .filter(
//         (value, index, current_value) => current_value.indexOf(value) === index
//     );



//     const usersStat = UniqueUserIds.map(user_id => {
//         const CLCUProgress = currentLessonProgress.filter(progress => progress.userId == user_id)

//         let DRP = 0

//         const doneRight = CLCUProgress.reduce((total, elem) => {
//             return (
//                 total + elem.doneRight
//             )
//         }, 0)

//         const doneWrong = CLCUProgress.reduce((total, elem) => {
//             return (
//                 total + elem.doneRight
//             )
//         }, 0)

//         if (doneRight + doneWrong > 0) {
//             DRP = doneRight/(doneRight + doneWrong)
//         }

//         const DR_DRP = doneRight * DRP

//         return  {
//             DR_DRP: DR_DRP,
//             user_id: allUsersProgress?.filter(pr => pr.userId==user_id)[0].userId,
//             user_name: allUsersProgress?.filter(pr => pr.userId==user_id)[0].userName,
//             user_imgSrc: allUsersProgress?.filter(pr => pr.userId==user_id)[0].userImageSrc,
//         }
    
//     })

//     usersStat.sort((a, b) => b.DR_DRP - a.DR_DRP)







//     let finishAudioSrcList = [
//                         '/MemesAudio/meme-right-chetko.WAV',
//                         '/MemesAudio/meme-right-chinazes.WAV',
//                         '/MemesAudio/meme-right-umeetemogete.WAV',
//                         ]
//     let finishAudioSrc = ShuffleTS(finishAudioSrcList)[0]

//     // useEffect(()=>{
//     //     finishAudioSrc = ShuffleTS(finishAudioSrcList)[0]
//     // },)
    





//     return(

//         <TQuizRandom 
//             t_lessonId={t_lesson.id} 
//             t_lessonTitle = {t_lesson.title} 
//             t_lesson={t_lesson.t_challenges} 
//             t_lessonProgress={t_lessonProgress}

//             questions1={questions}
//             usersStat={usersStat}
//             finishAudioSrc={finishAudioSrc}
//             userId={userProgress.userId}
//             userName={userProgress.userName}
            
//         />     
                   
//     )
// }

// export default RandomFirePage
