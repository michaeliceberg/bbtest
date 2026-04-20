// 'use client'

import { getAllTLessonProgress, getAllUsersProgress, getTLesson, getTLessonProgress, getUserProgress } from "@/db/queries"
import { redirect } from "next/navigation"
import { Shuffle2, ShuffleTS } from "@/usefulFunctions"
import TQuiz from "@/app/t-lesson/[t_lessonId]/TQUIZ"
import { allTypesCT } from "@/db/schema";
// import { useEffect, useState } from "react";
// import { allTypesCT } from "@/db/schema";


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




export type QuestionType = {
       
    // questionType: "SELECT" | "ASSIST" | "CONNECT" | "SLIDER" | "CONSTRUCT" | "WORKBOOK" | "R ASSIST" | "R CONNECT" | "R SLIDER" | "GEOSIN";

    // questionType: typeof allTypesCasualTrainer;

    questionType: allTypesCT;
    

    question: string;
    imageSrc: string;
    options: string[];
    numRans: string;
    optionsQ: {
        optQ: string;
        pairId: number;
        id: number;
    }[],
    optionsA: {
        optA: string;
        pairId: number;
        id: number;
    }[],
    optionsConstructRight: string[],
    correctAnswer: string,
    timeLimit: number,
    difficulty: string,

}


   


type Props = {
    params: {
        t_lessonId: number
    }
}

// TODO: Грузим ТОЛЬКО 1 LESSON в котором много challenge

const LessonIdPage =  async ({
    params,
}: Props) => {




    // const [mounted, setMounted] = useState(false)
    
    // useEffect(() => {
    //     setMounted(true)
    // }, [])
    
    // if (!mounted) {
    //     return <div>Loading...</div> // Показываем скелетон
    // }
    




    const [
        t_lesson,
        userProgress,
        t_lessonProgress,
        all_t_lessonProgress,
        allUsersProgress,
      ] = await Promise.all([
        getTLesson(params.t_lessonId),
        getUserProgress(),
        getTLessonProgress(),
        getAllTLessonProgress(),
        getAllUsersProgress(),
      ])

    
      

    if (!t_lesson || !userProgress){
        redirect('/trainer')
    }



    




    




    // const GEOSIN_Type = ["GEOSIN"]
    // const isGEOSIN_Type = GEOSIN_Type.some(type => t_lesson.t_challenges[0].type.includes(type))

    let questions: QuestionType[]

    // выбирает N штук рандомных из списка
    function getRandomElements<T>(arr: T[], count: number): T[] {
        if (count > arr.length) {
        throw new Error('Количество элементов для выборки превышает длину массива');
        }
        
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        return shuffled.slice(0, count);
    }

  
    // Вставить 0
    // ЕСЛИ ЭТО РАНДОМ ГЕНЕРАЦИЯ ВОПРОС:



//     // Если тут тип АССИСТ,  то генерим еще SWIPE, CONNECT
//     if (t_lesson.t_challenges[0].type == 'ASSIST') {

    
    










//     // TODO:
//     // делаем так:
//     // Если тип ASSIST то из него ДЕЛАЕМ еще 2 типа : SWIPE, CONNECT (тогда не придется вручную их придумывать в базе данных в XL )

    // Генерируем из слуайных типо ASSIST, CONNECT, SWIPE список ДЛИНОЙ количества T-Challeng'ей этого T-Lesson'a
    const ACStype = ['ASSIST', 'CONNECT', 'SWIPE'] as const;
    type ACStype = typeof ACStype[number]; // "ASSIST" | "CONNECT" | "SWIPE"

    const randomTypeASC: ACStype[] = Array.from(
        // { length: t_lesson.t_challenges.length }, 
        { length: t_lesson.t_challenges.filter(t_ch => t_ch.type == "M_ASC").length }, 

        
        () => ACStype[Math.floor(Math.random() * ACStype.length)]
    );






    questions = t_lesson.t_challenges.map((t_challenge, index) => 
        { if (t_challenge.type === 'M_ASC') {

            const randomASCtype = ACStype[Math.floor(Math.random() * ACStype.length)];            

            if (randomASCtype == 'ASSIST') {


                // фильтруем 5 вопросов с ДРУГИМИ правильными ответами
                const other5Questions = t_lesson.t_challenges.filter((el, i) =>  el.type == "M_ASC" && t_challenge.t_challengeOptions[0].text != el.t_challengeOptions[0].text)
                // берем Рандомные 5
                const fiveQuestions = getRandomElements(other5Questions, 5)  

                const fiveWrongOptions = fiveQuestions.map(el => el.t_challengeOptions[0].text)
                // .push(t_challenge.t_challengeOptions[0].text)
                
                const fiveWrongOptionsPlusRight = [...fiveWrongOptions, t_challenge.t_challengeOptions[0].text];
                // const fiveWrongOptions = fiveQuestions.map(el => el.t_challengeOptions[0].text)
                // .push(t_challenge.t_challengeOptions[0].text)

                return {
                    questionType: randomASCtype,
                    // questionType: t_challenge.type,
                    
                    question: t_challenge.question,
                    imageSrc: t_challenge.imageSrc, 

                    // options: Shuffle2(t_challenge.t_challengeOptions.map(el => el.text)),
                    options: Shuffle2(fiveWrongOptionsPlusRight),
                    
                    numRans: '1',
                    optionsQ: ShuffleTS([
                        {
                            optQ: 'null',
                            pairId: 0,
                            id: 0,
                        }, 
                        {
                            optQ: 'null',
                            pairId: 0,
                            id: 0,
                        }, 
                        {
                            optQ: 'null',
                            pairId: 0,
                            id: 0,
                        }, 
                    ]),
                    optionsA: ShuffleTS([
                        {
                            optA: 'null',
                            pairId: 0,
                            id: 0,
                        },
                        {
                            optA: 'null',
                            pairId: 0,
                            id: 0,            },
                        {
                            optA: 'null',
                            pairId: 0,
                            id: 0,            }
                    ]),
                    optionsConstructRight: ['null', 'null', 'null'],
                    difficulty: t_challenge.difficulty,
                    correctAnswer: t_challenge.t_challengeOptions[0].text,
                    timeLimit: 12,
                    }

            } else if (randomASCtype == 'CONNECT') {

                const otherQuestions = t_lesson.t_challenges.filter((el, i) =>  el.type == "M_ASC" && t_challenge.t_challengeOptions[0].text != el.t_challengeOptions[0].text)

                // const otherQuestions = t_lesson.t_challenges.filter((el, i) =>  el.type == "M_ASC")
                // берем Рандомные 2 вопроса
                // TODO: ДОБАВИТЬ ЧТОБЫ ЭТИ ДВА НЕ СОВПАДАЛ С ТекущиМ ВопросОМ
                //
                const twoQuestions = getRandomElements(otherQuestions, 2)    
    
                return {
    
    
                questionType: randomASCtype,
                // questionType: t_challenge.type,
                
                // question: t_challenge.question,
                question: "Соедините",
                imageSrc: t_challenge.imageSrc, 
                options: Shuffle2(t_challenge.t_challengeOptions.map(el => el.text)),
                numRans: t_challenge.numRans,
                optionsQ: ShuffleTS([
                    {
                        optQ: t_challenge.question,
                        pairId: 0,
                        id: t_challenge.t_challengeOptions[0].id,
                    }, 
                    {
                        optQ: twoQuestions[0].question,
                        pairId: 1,
                        id: t_challenge.t_challengeOptions[1].id,
                    }, 
                    {
                        optQ: twoQuestions[1].question,
                        pairId: 2,
                        id: t_challenge.t_challengeOptions[2].id,
                    }, 
                ]),
                optionsA: ShuffleTS([
                    {
                        optA: t_challenge.t_challengeOptions[0].text,
                        pairId: 0,
                        id: t_challenge.t_challengeOptions[3].id,
                    },
                    {
                        optA: twoQuestions[0].t_challengeOptions[0].text,
                        pairId: 1,
                        id: t_challenge.t_challengeOptions[4].id,
                    },
                    {
                        optA: twoQuestions[1].t_challengeOptions[0].text,
                        pairId: 2,
                        id: t_challenge.t_challengeOptions[5].id,
                    }
                ]),
                optionsConstructRight: [t_challenge.t_challengeOptions[0].text, t_challenge.t_challengeOptions[1].text, t_challenge.t_challengeOptions[2].text],          
                difficulty: t_challenge.difficulty,
                correctAnswer: t_challenge.t_challengeOptions[0].text,
                timeLimit: 15,
    
                
                }
            }


            
            else // if (randomTypeASC[index] === 'SWIPE') {
            { 


                const otherQuestions = t_lesson.t_challenges.filter((el, i) =>  el.type == "M_ASC" && t_challenge.t_challengeOptions[0].text != el.t_challengeOptions[0].text)
                //
                const threeQuestions = getRandomElements(otherQuestions, 3)  

                const threeWrongOptions = threeQuestions.map(el => el.t_challengeOptions[0].text)
                // .push(t_challenge.t_challengeOptions[0].text)
                
                // создаем список с ТРЕМЯ правильными и ТРЕМЯ неправильными
                // чтобы Свайп 50 / 50 шансы 
                const threeWrongOptionsPlusThreeRight = [...threeWrongOptions, t_challenge.t_challengeOptions[0].text, t_challenge.t_challengeOptions[0].text, t_challenge.t_challengeOptions[0].text];


                return {

                questionType: randomASCtype,
                
                question: t_challenge.question,
                imageSrc: t_challenge.imageSrc, 
                // options: Shuffle2(t_challenge.t_challengeOptions.map(el => el.text)),
                options: Shuffle2(threeWrongOptionsPlusThreeRight),

                
                numRans: t_challenge.numRans,
                optionsQ: ShuffleTS([
                    {
                        optQ: 'null',
                        pairId: 0,
                        id: 0,
                    }, 
                    {
                        optQ: 'null',
                        pairId: 0,
                        id: 0,
                    }, 
                    {
                        optQ: 'null',
                        pairId: 0,
                        id: 0,
                    }, 
                ]),
                optionsA: ShuffleTS([
                    {
                        optA: 'null',
                        pairId: 0,
                        id: 0,
                    },
                    {
                        optA: 'null',
                        pairId: 0,
                        id: 0,            },
                    {
                        optA: 'null',
                        pairId: 0,
                        id: 0,            }
                ]),
                optionsConstructRight: ['null', 'null', 'null'],
                difficulty: t_challenge.difficulty,
                correctAnswer: t_challenge.t_challengeOptions[0].text,
                timeLimit: 1000,
                }
            }


        } else // НЕ M_ASC  тогда ставим исходный тип, который в XL
            {
    
    
                return {
        
        
                    // questionType: randomTypeASC[index],
                    questionType: t_challenge.type,
                    
                    question: t_challenge.question,
                    imageSrc: t_challenge.imageSrc, 
                    options: Shuffle2(t_challenge.t_challengeOptions.map(el => el.text)),
                    numRans: t_challenge.numRans,
                    optionsQ: ShuffleTS([
                        {
                            optQ: t_challenge.t_challengeOptions[0].text,
                            pairId: 0,
                            id: t_challenge.t_challengeOptions[0].id,
                        }, 
                        {
                            optQ: t_challenge.t_challengeOptions[1].text,
                            pairId: 1,
                            id: t_challenge.t_challengeOptions[1].id,
                        }, 
                        {
                            optQ: t_challenge.t_challengeOptions[2].text,
                            pairId: 2,
                            id: t_challenge.t_challengeOptions[2].id,
                        }, 
                    ]),
                    optionsA: ShuffleTS([
                        {
                            optA: t_challenge.t_challengeOptions[3].text,
                            pairId: 0,
                            id: t_challenge.t_challengeOptions[3].id,
                        },
                        {
                            optA: t_challenge.t_challengeOptions[4].text,
                            pairId: 1,
                            id: t_challenge.t_challengeOptions[4].id,
                        },
                        {
                            optA: t_challenge.t_challengeOptions[5].text,
                            pairId: 2,
                            id: t_challenge.t_challengeOptions[5].id,
                        }
                    ]),
                    optionsConstructRight: [t_challenge.t_challengeOptions[0].text, t_challenge.t_challengeOptions[1].text, t_challenge.t_challengeOptions[2].text],          
                    difficulty: t_challenge.difficulty,
                    correctAnswer: t_challenge.t_challengeOptions[0].text,
                    timeLimit: 15,
        
                    
                }
            
            
            }
    })
         



















// вставить 99
    
// Вставить 3

// let questions: QuestionType[] = t_lesson.t_challenges.map(t_challenge => (
   



    // ЕСЛИ ТИП GEOSIN , то НЕ шафлим, а идем в порядке 

    if (questions[0].questionType != 'GEOSIN') {
        questions = ShuffleTS(questions)
    }

    // questions = ShuffleTS(questions)
  
    
    
  


    // СЧИТАЕМ Статистику правильно решенных задач
    //
    const currentLessonProgress = all_t_lessonProgress.filter(el => el.t_lessonId == params.t_lessonId)

    const UniqueUserIds = currentLessonProgress.map(el => el.userId)
    .filter(
        (value, index, current_value) => current_value.indexOf(value) === index
    );

    // const UniqueUserIds = [
    //     ...new Set(
    //       currentLessonProgress.map(p => p.userId)
    //     )
    //   ]


    const usersStat = UniqueUserIds.map(user_id => {
        const CLCUProgress = currentLessonProgress.filter(progress => progress.userId == user_id)

        let DRP = 0

        const doneRight = CLCUProgress.reduce((total, elem) => {
            return (
                total + elem.doneRight
            )
        }, 0)

        const doneWrong = CLCUProgress.reduce((total, elem) => {
            return (
                total + elem.doneRight
            )
        }, 0)

        if (doneRight + doneWrong > 0) {
            DRP = doneRight/(doneRight + doneWrong)
        }

        const DR_DRP = doneRight * DRP

        return  {
            DR_DRP: DR_DRP,
            user_id: allUsersProgress?.filter(pr => pr.userId==user_id)[0].userId,
            user_name: allUsersProgress?.filter(pr => pr.userId==user_id)[0].userName,
            user_imgSrc: allUsersProgress?.filter(pr => pr.userId==user_id)[0].userImageSrc,
        }
    
    })

    usersStat.sort((a, b) => b.DR_DRP - a.DR_DRP)







    let finishAudioSrcList = [
                        '/MemesAudio/meme-right-chetko.WAV',
                        '/MemesAudio/meme-right-chinazes.WAV',
                        '/MemesAudio/meme-right-umeetemogete.WAV',
                        ]
    let finishAudioSrc = ShuffleTS(finishAudioSrcList)[0]

    // useEffect(()=>{
    //     finishAudioSrc = ShuffleTS(finishAudioSrcList)[0]
    // },)
    





    return(

        <TQuiz 
            t_lessonId={t_lesson.id} 
            t_lessonTitle = {t_lesson.title} 
            t_lesson={t_lesson.t_challenges} 
            t_lessonProgress={t_lessonProgress}

            questions1={questions}
            usersStat={usersStat}
            finishAudioSrc={finishAudioSrc}
            userId={userProgress.userId}
            userName={userProgress.userName}
            
        />     
                   
    )
}

export default LessonIdPage









  // const oneZeroToFive = [[0, 1, 2, 3, 4, 5],
    //                       [-1, 0, 1, 2, 3, 4],
    //                       [-2, -1, 0, 1, 2, 3],
    //                       [-3, -2, -1, 0, 1, 2],
    //                       [-4, -3, -2, -1, 0, 1],
    //                       [-5, -4, -3, -2 , -1, 0]]
    // //
    // // сколько генерировать номеров в типе
    // //
    // const NUM_GENERATE = 1;

        // вставить 1
        // type GeneratedType = {

        

    // let resultGeneratedChallengeQuestion = ""
    // const ListGeneratesQnA: GeneratedType = []
    
    // const randomGeneratedTypes = ["R ASSIST", "R SLIDER", "R CONNECT"]
    // const isRandomGeneratedType = randomGeneratedTypes.some(type => t_lesson.t_challenges[0].type.includes(type))
     
   
    // if (isRandomGeneratedType) { 
    //     questions = ListGeneratesQnA
    //     // Вставить 2
    //     // questions = ListGeneratesQnA.map(t_challenge => (
    // } else {



// вставить 0
    // // ЕСЛИ ЭТО РАНДОМ ГЕНЕРАЦИЯ ВОПРОС:
    // //
    // if (isRandomGeneratedType) {
    //     // console.log(' FOUND RANDOM !! ')

    //     // Идём по всем Challenge'ам этого Lesson'a и в соответствии с ТИПОМ генерируем новые questions
    //     //
    //     //
    //     t_lesson.t_challenges.map(challenge => 
    //     {
    //         if (challenge.type == 'R ASSIST' || challenge.type == 'R SLIDER' ) {


    //             for(let i = 0; i < NUM_GENERATE; i++){
    //                 resultGeneratedChallengeQuestion = challenge.question
    //                 .replace('random', '')
    //                 .replace('r1', `${randomBetween(1, 9)}`).replace('r1', `${randomBetween(1, 9)}`).replace('r1', `${randomBetween(1, 9)}`)
    //                 .replace('r2', `${randomBetween(10, 99)}`).replace('r2', `${randomBetween(10, 99)}`).replace('r2', `${randomBetween(10, 99)}`)
            
    //                 const rightAns = eval(resultGeneratedChallengeQuestion.replace('\huge', ' ')
    //                 .replace('\huge', ' ')
    //                 .replace('\\', ' ')
    //                 .replace('$', ' ')
    //                 .replace('$', ' ')
    //                 .replace('=', ' ')
    //                 .replace('?', ' '))

    //                 ShuffleTS(oneZeroToFive)
    //                 const options = oneZeroToFive[0].map(el => (el + rightAns).toString())


    //                 ListGeneratesQnA.push(
    //                     {
    //                         question: resultGeneratedChallengeQuestion,
    //                         // rightAns: rightAns,
    //                         options: options,
    //                         questionType: challenge.type == 'R ASSIST' ? 'ASSIST' 
    //                                     : challenge.type == 'R SLIDER' ? 'SLIDER' : 'CONNECT',
    //                         imageSrc: challenge.imageSrc,
    //                         numRans: challenge.numRans,

    //                         optionsQ: ShuffleTS([
    //                             {
    //                                 optQ: options[0],
    //                                 pairId: 0,
    //                                 id: options[0],
    //                             }, 
    //                             {
    //                                 optQ: options[1],
    //                                 pairId: 1,
    //                                 id: options[0],
    //                             }, 
    //                             {
    //                                 optQ: options[2],
    //                                 pairId: 2,
    //                                 id: options[0],
    //                             }, 
                
    //                         ]),
    //                         optionsA: ShuffleTS([
    //                             {
    //                                 optA: options[3],
    //                                 pairId: 0,
    //                                 id: options[0],
                
    //                             },
    //                             {
    //                                 optA: options[4],
    //                                 pairId: 1,
    //                                 id: options[0],
                
    //                             },
    //                             {
    //                                 optA: options[5],
    //                                 pairId: 2,
    //                                 id: options[0],
                
    //                             }
    //                         ]),
                
                            
    //                         optionsConstructRight: [options[0],options[1],options[2]],          
                          
    //                         difficulty: challenge.difficulty,

    //                         correctAnswer: rightAns.toString(),
    //                         // timeLimit: t_challenge.points,
    //                         timeLimit: 1000,
    //                         // timeLimit: 1234,


    //                     }
    //                 )
    //             }
    //         }
    //     })



    // } 
    
    // else {
        
    //     // Это НЕ RANDOM GENERATE Lesson
    //     // ничего не делаем
    // }








// вставить 1
    // type GeneratedType = {
    //     questionType: string,
    //     rightAns: string,
    //     options: number[],
    //     type: string,
    //     imageSrc: string,
    //     numRans: string,
    //     optionsQ: {
    //         optQ: any;
    //         pairId: number;
    //         id: any;
    //     }[],
    //     optionsA: {
    //         optA: any;
    //         pairId: number;
    //         id: any;
    //     }[],
    //     optionsConstructRight: string[],
    //     correctAnswer: string,
    //     timeLimit: number
    // }[]




 // ВСТАВИТЬ 
 // questions = ListGeneratesQnA.map(t_challenge => (


        //     {
        //         questionType: t_challenge.type,
        //         question: t_challenge.question,
        //         imageSrc: t_challenge.imageSrc, 
        //         options: t_challenge.options,
        //         numRans: t_challenge.numRans,
        //         optionsQ: ShuffleTS([
        //             {
        //                 optQ: t_challenge.t_challengeOptions[0].text,
        //                 pairId: 0,
        //                 id: t_challenge.t_challengeOptions[0].id,
        //             }, 
        //             {
        //                 optQ: t_challenge.t_challengeOptions[1].text,
        //                 pairId: 1,
        //                 id: t_challenge.t_challengeOptions[1].id,
        //             }, 
        //             {
        //                 optQ: t_challenge.t_challengeOptions[2].text,
        //                 pairId: 2,
        //                 id: t_challenge.t_challengeOptions[2].id,
        //             }, 
    
        //         ]),
        //         optionsA: ShuffleTS([
        //             {
        //                 optA: t_challenge.t_challengeOptions[3].text,
        //                 pairId: 0,
        //                 id: t_challenge.t_challengeOptions[3].id,
    
        //             },
        //             {
        //                 optA: t_challenge.t_challengeOptions[4].text,
        //                 pairId: 1,
        //                 id: t_challenge.t_challengeOptions[4].id,
    
        //             },
        //             {
        //                 optA: t_challenge.t_challengeOptions[5].text,
        //                 pairId: 2,
        //                 id: t_challenge.t_challengeOptions[5].id,
    
        //             }
        //         ]),
    
                
        //         optionsConstructRight: [t_challenge.t_challengeOptions[0].text, t_challenge.t_challengeOptions[1].text, t_challenge.t_challengeOptions[2].text],          
              
                
        //         correctAnswer: t_challenge.t_challengeOptions[0].text,
        //         // timeLimit: t_challenge.points,
        //         timeLimit: 1000,
        //         // timeLimit: 1234,
        //     }


        // ))







        // ВСТАВИТЬ  3

        // let questions: QuestionType[] = t_lesson.t_challenges.map(t_challenge => (
    // questions = t_lesson.t_challenges.map(t_challenge => (
    //         {
    //         questionType: t_challenge.type,
    //         question: t_challenge.question,
    //         imageSrc: t_challenge.imageSrc, 
    //         options: Shuffle2(t_challenge.t_challengeOptions.map(el => el.text)),
    //         numRans: t_challenge.numRans,
    //         optionsQ : ShuffleTS([
    //             {
    //                 optQ: t_challenge.t_challengeOptions[0].text,
    //                 pairId: 0,
    //                 id: t_challenge.t_challengeOptions[0].id,
    //             }, 
    //             {
    //                 optQ: t_challenge.t_challengeOptions[1].text,
    //                 pairId: 1,
    //                 id: t_challenge.t_challengeOptions[1].id,
    //             }, 
    //             {
    //                 optQ: t_challenge.t_challengeOptions[2].text,
    //                 pairId: 2,
    //                 id: t_challenge.t_challengeOptions[2].id,
    //             }, 

    //         ]),
    //         optionsA: ShuffleTS([
    //             {
    //                 optA: t_challenge.t_challengeOptions[3].text,
    //                 pairId: 0,
    //                 id: t_challenge.t_challengeOptions[3].id,

    //             },
    //             {
    //                 optA: t_challenge.t_challengeOptions[4].text,
    //                 pairId: 1,
    //                 id: t_challenge.t_challengeOptions[4].id,

    //             },
    //             {
    //                 optA: t_challenge.t_challengeOptions[5].text,
    //                 pairId: 2,
    //                 id: t_challenge.t_challengeOptions[5].id,

    //             }
    //         ]),

            
    //         optionsConstructRight: [t_challenge.t_challengeOptions[0].text, t_challenge.t_challengeOptions[1].text, t_challenge.t_challengeOptions[2].text],          
          
            
    //         correctAnswer: t_challenge.t_challengeOptions[0].text,
    //         // timeLimit: t_challenge.points,
    //         timeLimit: 1000,
    //         // timeLimit: 1234,
    //     }
    
    // ))







    // вставить 99

// questions = t_lesson.t_challenges.map((t_challenge, index) => 
//     randomTypeASC[index] === 'ASSIST' ?  {
        
//         questionType: randomTypeASC[index],
//         // questionType: t_challenge.type,
        
//         question: t_challenge.question,
//         imageSrc: t_challenge.imageSrc, 
//         options: Shuffle2(t_challenge.t_challengeOptions.map(el => el.text)),
//         numRans: '1',
//         optionsQ: ShuffleTS([
//             {
//                 optQ: 'null',
//                 pairId: 0,
//                 id: 0,
//             }, 
//             {
//                 optQ: 'null',
//                 pairId: 0,
//                 id: 0,
//             }, 
//             {
//                 optQ: 'null',
//                 pairId: 0,
//                 id: 0,
//             }, 
//         ]),
//         optionsA: ShuffleTS([
//             {
//                 optA: 'null',
//                 pairId: 0,
//                 id: 0,
//             },
//             {
//                 optA: 'null',
//                 pairId: 0,
//                 id: 0,            },
//             {
//                 optA: 'null',
//                 pairId: 0,
//                 id: 0,            }
//         ]),
//         optionsConstructRight: ['null', 'null', 'null'],
//         difficulty: t_challenge.difficulty,
//         correctAnswer: t_challenge.t_challengeOptions[0].text,
//         timeLimit: 1000,

//     } : 
//         randomTypeASC[index] === 'CONNECT' ? 
        
//     {

//         // const someVariable = t_challenge.t_challengeOptions.length

//         questionType: randomTypeASC[index],
//         // questionType: t_challenge.type,
        
//         question: t_challenge.question,
//         imageSrc: t_challenge.imageSrc, 
//         options: Shuffle2(t_challenge.t_challengeOptions.map(el => el.text)),
//         numRans: t_challenge.numRans,
//         optionsQ: ShuffleTS([
//             {
//                 optQ: t_challenge.t_challengeOptions[0].text,
//                 pairId: 0,
//                 id: t_challenge.t_challengeOptions[0].id,
//             }, 
//             {
//                 optQ: t_challenge.t_challengeOptions[1].text,
//                 pairId: 1,
//                 id: t_challenge.t_challengeOptions[1].id,
//             }, 
//             {
//                 optQ: t_challenge.t_challengeOptions[2].text,
//                 pairId: 2,
//                 id: t_challenge.t_challengeOptions[2].id,
//             }, 
//         ]),
//         optionsA: ShuffleTS([
//             {
//                 optA: t_challenge.t_challengeOptions[3].text,
//                 pairId: 0,
//                 id: t_challenge.t_challengeOptions[3].id,
//             },
//             {
//                 optA: t_challenge.t_challengeOptions[4].text,
//                 pairId: 1,
//                 id: t_challenge.t_challengeOptions[4].id,
//             },
//             {
//                 optA: t_challenge.t_challengeOptions[5].text,
//                 pairId: 2,
//                 id: t_challenge.t_challengeOptions[5].id,
//             }
//         ]),
//         optionsConstructRight: [t_challenge.t_challengeOptions[0].text, t_challenge.t_challengeOptions[1].text, t_challenge.t_challengeOptions[2].text],          
//         difficulty: t_challenge.difficulty,
//         correctAnswer: t_challenge.t_challengeOptions[0].text,
//         timeLimit: 1000,

        
//     } 

//     : 
//     //SWIPE
//     {
//         questionType: randomTypeASC[index],
//         // questionType: t_challenge.type,
        
//         question: t_challenge.question,
//         imageSrc: t_challenge.imageSrc, 
//         options: Shuffle2(t_challenge.t_challengeOptions.map(el => el.text)),
//         numRans: t_challenge.numRans,
//         optionsQ: ShuffleTS([
//             {
//                 optQ: t_challenge.t_challengeOptions[0].text,
//                 pairId: 0,
//                 id: t_challenge.t_challengeOptions[0].id,
//             }, 
//             {
//                 optQ: t_challenge.t_challengeOptions[1].text,
//                 pairId: 1,
//                 id: t_challenge.t_challengeOptions[1].id,
//             }, 
//             {
//                 optQ: t_challenge.t_challengeOptions[2].text,
//                 pairId: 2,
//                 id: t_challenge.t_challengeOptions[2].id,
//             }, 
//         ]),
//         optionsA: ShuffleTS([
//             {
//                 optA: t_challenge.t_challengeOptions[3].text,
//                 pairId: 0,
//                 id: t_challenge.t_challengeOptions[3].id,
//             },
//             {
//                 optA: t_challenge.t_challengeOptions[4].text,
//                 pairId: 1,
//                 id: t_challenge.t_challengeOptions[4].id,
//             },
//             {
//                 optA: t_challenge.t_challengeOptions[5].text,
//                 pairId: 2,
//                 id: t_challenge.t_challengeOptions[5].id,
//             }
//         ]),
//         optionsConstructRight: [t_challenge.t_challengeOptions[0].text, t_challenge.t_challengeOptions[1].text, t_challenge.t_challengeOptions[2].text],          
//         difficulty: t_challenge.difficulty,
//         correctAnswer: t_challenge.t_challengeOptions[0].text,
//         timeLimit: 1000,
//     }
// )






//     questions = t_lesson.t_challenges.map((t_challenge, index)=> (

//         randomTypeASC[index] === 'ASSIST' ?  {
        
//         {
//             questionType: randomTypeASC[index],
//             // questionType: t_challenge.type,
            
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
//             // 
//         }

//     } ? {}

//     )

    

// )


    // questions = t_lesson.t_challenges.map(t_challenge => (
    //     {
    //         questionType: t_challenge.type,
    //         question: t_challenge.question,
    //         imageSrc: t_challenge.imageSrc, 
    //         options: Shuffle2(t_challenge.t_challengeOptions.map(el => el.text)),
    //         numRans: t_challenge.numRans,
    //         optionsQ : ShuffleTS([
    //             {
    //                 optQ: t_challenge.t_challengeOptions[0].text,
    //                 pairId: 0,
    //                 id: t_challenge.t_challengeOptions[0].id,
    //             }, 
    //             {
    //                 optQ: t_challenge.t_challengeOptions[1].text,
    //                 pairId: 1,
    //                 id: t_challenge.t_challengeOptions[1].id,
    //             }, 
    //             {
    //                 optQ: t_challenge.t_challengeOptions[2].text,
    //                 pairId: 2,
    //                 id: t_challenge.t_challengeOptions[2].id,
    //             }, 

    //         ]),
    //         optionsA: ShuffleTS([
    //             {
    //                 optA: t_challenge.t_challengeOptions[3].text,
    //                 pairId: 0,
    //                 id: t_challenge.t_challengeOptions[3].id,

    //             },
    //             {
    //                 optA: t_challenge.t_challengeOptions[4].text,
    //                 pairId: 1,
    //                 id: t_challenge.t_challengeOptions[4].id,

    //             },
    //             {
    //                 optA: t_challenge.t_challengeOptions[5].text,
    //                 pairId: 2,
    //                 id: t_challenge.t_challengeOptions[5].id,

    //             }
    //         ]),

        
    //         optionsConstructRight: [t_challenge.t_challengeOptions[0].text, t_challenge.t_challengeOptions[1].text, t_challenge.t_challengeOptions[2].text],          
            
    //         difficulty: t_challenge.difficulty,
    //         correctAnswer: t_challenge.t_challengeOptions[0].text,
    //         // timeLimit: t_challenge.points,
    //         timeLimit: 1000,
    //         // 
    //     }
    
    // ))


    // }











    //  // Если тут тип АССИСТ,  то генерим еще SWIPE, CONNECT
    //  if (t_lesson.t_challenges[0].type == 'ASSIST') {

    
    


    //     // TODO:
    //     // делаем так:
    //     // Если тип ASSIST то из него ДЕЛАЕМ еще 2 типа : SWIPE, CONNECT (тогда не придется вручную их придумывать в базе данных в XL )
    
    //     // Генерируем из слуайных типо ASSIST, CONNECT, SWIPE список ДЛИНОЙ количества T-Challeng'ей этого T-Lesson'a
    //     const ACStype = ['ASSIST', 'CONNECT', 'SWIPE'] as const;
    //     type ACStype = typeof ACStype[number]; // "ASSIST" | "CONNECT" | "SWIPE"
    
    //     const randomTypeASC: ACStype[] = Array.from(
    //         // { length: t_lesson.t_challenges.length }, 
    //         { length: t_lesson.t_challenges.filter(t_ch => t_ch.type == "M_ASC").length }, 
    
            
    //         () => ACStype[Math.floor(Math.random() * ACStype.length)]
    //     );
    
    
    
    //     questions = t_lesson.t_challenges.map((t_challenge, index) => 
    //         { if (randomTypeASC[index] === 'ASSIST') {
    //             return {
    //                 questionType: randomTypeASC[index],
    //                 // questionType: t_challenge.type,
                    
    //                 question: t_challenge.question,
    //                 imageSrc: t_challenge.imageSrc, 
    //                 options: Shuffle2(t_challenge.t_challengeOptions.map(el => el.text)),
    //                 numRans: '1',
    //                 optionsQ: ShuffleTS([
    //                     {
    //                         optQ: 'null',
    //                         pairId: 0,
    //                         id: 0,
    //                     }, 
    //                     {
    //                         optQ: 'null',
    //                         pairId: 0,
    //                         id: 0,
    //                     }, 
    //                     {
    //                         optQ: 'null',
    //                         pairId: 0,
    //                         id: 0,
    //                     }, 
    //                 ]),
    //                 optionsA: ShuffleTS([
    //                     {
    //                         optA: 'null',
    //                         pairId: 0,
    //                         id: 0,
    //                     },
    //                     {
    //                         optA: 'null',
    //                         pairId: 0,
    //                         id: 0,            },
    //                     {
    //                         optA: 'null',
    //                         pairId: 0,
    //                         id: 0,            }
    //                 ]),
    //                 optionsConstructRight: ['null', 'null', 'null'],
    //                 difficulty: t_challenge.difficulty,
    //                 correctAnswer: t_challenge.t_challengeOptions[0].text,
    //                 timeLimit: 12,
    
    //             }}
            
    //         else  if (randomTypeASC[index] === 'CONNECT') {
    
    //             const otherQuestions = t_lesson.t_challenges.filter((el, i) =>  i != index)
    //             // берем Рандомные 2 вопроса
    //             //
    //             const twoQuestions = getRandomElements(otherQuestions, 2)
    
            
    //             // const UniqueUserIds = currentLessonProgress.map(el => el.userId)
    //             // .filter(
    //             //     (value, index, current_value) => current_value.indexOf(value) === index
    //             // );
    
    
    
    //             return {
    
    
    //             questionType: randomTypeASC[index],
    //             // questionType: t_challenge.type,
                
    //             question: t_challenge.question,
    //             imageSrc: t_challenge.imageSrc, 
    //             options: Shuffle2(t_challenge.t_challengeOptions.map(el => el.text)),
    //             numRans: t_challenge.numRans,
    //             optionsQ: ShuffleTS([
    //                 {
    //                     // optQ: 'SADASDA',
    //                     optQ: t_challenge.question,
    //                     // optQ: t_challenge.t_challengeOptions[0].text,
    //                     pairId: 0,
    //                     id: t_challenge.t_challengeOptions[0].id,
    //                 }, 
    //                 {
    //                     optQ: twoQuestions[0].question,
    //                     // optQ: t_challenge.t_challengeOptions[1].text,
    //                     pairId: 1,
    //                     id: t_challenge.t_challengeOptions[1].id,
    //                 }, 
    //                 {
    //                     optQ: twoQuestions[1].question,
    //                     // optQ: t_challenge.t_challengeOptions[2].text,
    //                     pairId: 2,
    //                     id: t_challenge.t_challengeOptions[2].id,
    //                 }, 
    //             ]),
    //             optionsA: ShuffleTS([
    //                 {
    //                     optA: t_challenge.t_challengeOptions[0].text,
    //                     // optA: t_challenge.t_challengeOptions[3].text,
    //                     pairId: 0,
    //                     id: t_challenge.t_challengeOptions[3].id,
    //                 },
    //                 {
    //                     optA: twoQuestions[0].t_challengeOptions[0].text,
    //                     // optA: t_challenge.t_challengeOptions[4].text,
    //                     pairId: 1,
    //                     id: t_challenge.t_challengeOptions[4].id,
    //                 },
    //                 {
    //                     optA: twoQuestions[1].t_challengeOptions[0].text,
    //                     // optA: t_challenge.t_challengeOptions[5].text,
    //                     pairId: 2,
    //                     id: t_challenge.t_challengeOptions[5].id,
    //                 }
    //             ]),
    //             optionsConstructRight: [t_challenge.t_challengeOptions[0].text, t_challenge.t_challengeOptions[1].text, t_challenge.t_challengeOptions[2].text],          
    //             difficulty: t_challenge.difficulty,
    //             correctAnswer: t_challenge.t_challengeOptions[0].text,
    //             timeLimit: 15,
    
                
    //         }}
    //         // закончили CONNECT (ассистовый)
    
    
    //         else // if (randomTypeASC[index] === 'SWIPE') {
    //             { 
    //                 return {
    
    //                 questionType: randomTypeASC[index],
                    
    //                 question: t_challenge.question,
    //                 imageSrc: t_challenge.imageSrc, 
    //                 options: Shuffle2(t_challenge.t_challengeOptions.map(el => el.text)),
    //                 numRans: t_challenge.numRans,
    //                 optionsQ: ShuffleTS([
    //                     {
    //                         optQ: 'null',
    //                         pairId: 0,
    //                         id: 0,
    //                     }, 
    //                     {
    //                         optQ: 'null',
    //                         pairId: 0,
    //                         id: 0,
    //                     }, 
    //                     {
    //                         optQ: 'null',
    //                         pairId: 0,
    //                         id: 0,
    //                     }, 
    //                 ]),
    //                 optionsA: ShuffleTS([
    //                     {
    //                         optA: 'null',
    //                         pairId: 0,
    //                         id: 0,
    //                     },
    //                     {
    //                         optA: 'null',
    //                         pairId: 0,
    //                         id: 0,            },
    //                     {
    //                         optA: 'null',
    //                         pairId: 0,
    //                         id: 0,            }
    //                 ]),
    //                 optionsConstructRight: ['null', 'null', 'null'],
    //                 difficulty: t_challenge.difficulty,
    //                 correctAnswer: t_challenge.t_challengeOptions[0].text,
    //                 timeLimit: 10,
    //                 }
    //             }}
    //     )
    // } 
    
    
    
    //     // Если это был НЕ АССИСТ, то не генерируем, а ставим текущий тип
    //     else {
    
    
    //         questions = t_lesson.t_challenges.map((t_challenge, index) => {
    //         return {
    
    
    //             // questionType: randomTypeASC[index],
    //             questionType: t_challenge.type,
                
    //             question: t_challenge.question,
    //             imageSrc: t_challenge.imageSrc, 
    //             options: Shuffle2(t_challenge.t_challengeOptions.map(el => el.text)),
    //             numRans: t_challenge.numRans,
    //             optionsQ: ShuffleTS([
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
    //             timeLimit: 15,
    
                
    //         }})
    //     }







//     questions = t_lesson.t_challenges.map((t_challenge, index) => 
//         { if (randomTypeASC[index] === 'ASSIST') {
//             return {
//                 questionType: randomTypeASC[index],
//                 // questionType: t_challenge.type,
                
//                 question: t_challenge.question,
//                 imageSrc: t_challenge.imageSrc, 
//                 options: Shuffle2(t_challenge.t_challengeOptions.map(el => el.text)),
//                 numRans: '1',
//                 optionsQ: ShuffleTS([
//                     {
//                         optQ: 'null',
//                         pairId: 0,
//                         id: 0,
//                     }, 
//                     {
//                         optQ: 'null',
//                         pairId: 0,
//                         id: 0,
//                     }, 
//                     {
//                         optQ: 'null',
//                         pairId: 0,
//                         id: 0,
//                     }, 
//                 ]),
//                 optionsA: ShuffleTS([
//                     {
//                         optA: 'null',
//                         pairId: 0,
//                         id: 0,
//                     },
//                     {
//                         optA: 'null',
//                         pairId: 0,
//                         id: 0,            },
//                     {
//                         optA: 'null',
//                         pairId: 0,
//                         id: 0,            }
//                 ]),
//                 optionsConstructRight: ['null', 'null', 'null'],
//                 difficulty: t_challenge.difficulty,
//                 correctAnswer: t_challenge.t_challengeOptions[0].text,
//                 timeLimit: 12,

//             }}
        
//         else  if (randomTypeASC[index] === 'CONNECT') {

//             const otherQuestions = t_lesson.t_challenges.filter((el, i) =>  i != index)
//             // берем Рандомные 2 вопроса
//             //
//             const twoQuestions = getRandomElements(otherQuestions, 2)

        
//             // const UniqueUserIds = currentLessonProgress.map(el => el.userId)
//             // .filter(
//             //     (value, index, current_value) => current_value.indexOf(value) === index
//             // );



//             return {


//             questionType: randomTypeASC[index],
//             // questionType: t_challenge.type,
            
//             question: t_challenge.question,
//             imageSrc: t_challenge.imageSrc, 
//             options: Shuffle2(t_challenge.t_challengeOptions.map(el => el.text)),
//             numRans: t_challenge.numRans,
//             optionsQ: ShuffleTS([
//                 {
//                     // optQ: 'SADASDA',
//                     optQ: t_challenge.question,
//                     // optQ: t_challenge.t_challengeOptions[0].text,
//                     pairId: 0,
//                     id: t_challenge.t_challengeOptions[0].id,
//                 }, 
//                 {
//                     optQ: twoQuestions[0].question,
//                     // optQ: t_challenge.t_challengeOptions[1].text,
//                     pairId: 1,
//                     id: t_challenge.t_challengeOptions[1].id,
//                 }, 
//                 {
//                     optQ: twoQuestions[1].question,
//                     // optQ: t_challenge.t_challengeOptions[2].text,
//                     pairId: 2,
//                     id: t_challenge.t_challengeOptions[2].id,
//                 }, 
//             ]),
//             optionsA: ShuffleTS([
//                 {
//                     optA: t_challenge.t_challengeOptions[0].text,
//                     // optA: t_challenge.t_challengeOptions[3].text,
//                     pairId: 0,
//                     id: t_challenge.t_challengeOptions[3].id,
//                 },
//                 {
//                     optA: twoQuestions[0].t_challengeOptions[0].text,
//                     // optA: t_challenge.t_challengeOptions[4].text,
//                     pairId: 1,
//                     id: t_challenge.t_challengeOptions[4].id,
//                 },
//                 {
//                     optA: twoQuestions[1].t_challengeOptions[0].text,
//                     // optA: t_challenge.t_challengeOptions[5].text,
//                     pairId: 2,
//                     id: t_challenge.t_challengeOptions[5].id,
//                 }
//             ]),
//             optionsConstructRight: [t_challenge.t_challengeOptions[0].text, t_challenge.t_challengeOptions[1].text, t_challenge.t_challengeOptions[2].text],          
//             difficulty: t_challenge.difficulty,
//             correctAnswer: t_challenge.t_challengeOptions[0].text,
//             timeLimit: 15,

            
//         }}
//         // закончили CONNECT (ассистовый)


//         else // if (randomTypeASC[index] === 'SWIPE') {
//             { 
//                 return {

//                 questionType: randomTypeASC[index],
                
//                 question: t_challenge.question,
//                 imageSrc: t_challenge.imageSrc, 
//                 options: Shuffle2(t_challenge.t_challengeOptions.map(el => el.text)),
//                 numRans: t_challenge.numRans,
//                 optionsQ: ShuffleTS([
//                     {
//                         optQ: 'null',
//                         pairId: 0,
//                         id: 0,
//                     }, 
//                     {
//                         optQ: 'null',
//                         pairId: 0,
//                         id: 0,
//                     }, 
//                     {
//                         optQ: 'null',
//                         pairId: 0,
//                         id: 0,
//                     }, 
//                 ]),
//                 optionsA: ShuffleTS([
//                     {
//                         optA: 'null',
//                         pairId: 0,
//                         id: 0,
//                     },
//                     {
//                         optA: 'null',
//                         pairId: 0,
//                         id: 0,            },
//                     {
//                         optA: 'null',
//                         pairId: 0,
//                         id: 0,            }
//                 ]),
//                 optionsConstructRight: ['null', 'null', 'null'],
//                 difficulty: t_challenge.difficulty,
//                 correctAnswer: t_challenge.t_challengeOptions[0].text,
//                 timeLimit: 10,
//                 }
//             }}
//     )
// } 



//     // Если это был НЕ АССИСТ, то не генерируем, а ставим текущий тип
//     else {


//         questions = t_lesson.t_challenges.map((t_challenge, index) => {
//         return {


//             // questionType: randomTypeASC[index],
//             questionType: t_challenge.type,
            
//             question: t_challenge.question,
//             imageSrc: t_challenge.imageSrc, 
//             options: Shuffle2(t_challenge.t_challengeOptions.map(el => el.text)),
//             numRans: t_challenge.numRans,
//             optionsQ: ShuffleTS([
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
//             timeLimit: 15,

            
//         }})
//     }




