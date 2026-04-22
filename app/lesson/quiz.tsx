'use client';

import { SuperType, challengeOptions, challengeProgress, challenges } from "@/db/schema";
import { useEffect, useState, useTransition, useRef } from "react";
import { Header } from "./header";
import { QuestionBubble } from "./question-bubble";
import { Challenge } from "./challenge";
import { Footer } from "./footer";
import { upsertChallengeProgress } from "@/actions/challenge-progress";
import { toast } from "sonner";
import { reduceHearts } from "@/actions/user-progress";
import { useWindowSize, useMount } from "react-use";

import Image from "next/image";
import { ResultCard } from "./result-card";
import { useRouter } from "next/navigation";
import Confetti from 'react-confetti'
import { useHeartsModal } from "@/store/use-hearts-modal";
import { usePracticeModal } from "@/store/use-practice-modal";
import { Button } from "@/components/ui/button";

import LottieSelectRainbow from '@/public/LottieSelectRainbow.json'
import LottieSelectCrown from '@/public/LottieSelectCrown.json'
import LottieSelectDiamond from '@/public/LottieSelectDiamond.json'
import LottieSelectSparks from '@/public/LottieSelectSparks.json'
import LottieSelectStars from '@/public/LottieSelectStars.json'
import LottieSelectButterfly from '@/public/LottieSelectButterfly.json'

import Lottie from "lottie-react";
import { useWrongAnswerModal } from "@/store/use-wronganswer-modal";
import 'katex/dist/katex.min.css';
import { useRightAnswerModal } from "@/store/use-rightanswer-modal";

type Props = {
    initialPercentage: number
    initialHearts: number
    initialLessonId: number
    initialLessonChallenges: (typeof challenges.$inferSelect & {
        completed: boolean
        challengeOptions: typeof challengeOptions.$inferSelect[]
    })[]
    userSubscription: any
    challengeProgress: typeof challengeProgress.$inferSelect[] 
    lessonTitle: string
    oldCourseProgress: SuperType
    activeCourseTitle: string
    missedCIds: number[]
}

const LottieData = [
    LottieSelectRainbow,
    LottieSelectCrown,
    LottieSelectDiamond,
    LottieSelectSparks,
    LottieSelectStars,
    LottieSelectButterfly,
]

const randomLottieSelect = LottieData[Math.floor(Math.random() * LottieData.length)];

export const Quiz = ({
    initialPercentage,
    initialHearts,
    initialLessonId,
    initialLessonChallenges,
    userSubscription,
    challengeProgress,
    lessonTitle,
    oldCourseProgress,
    activeCourseTitle,
    missedCIds,
}: Props) => {
    const { open: openHeartsModal } = useHeartsModal()
    const { open: openPracticeModal } = usePracticeModal()
    const { open: openWrongModal } = useWrongAnswerModal()
    const { openR: openRightModal } = useRightAnswerModal()

    useMount(() => {
        if (initialPercentage === 100) {
            openPracticeModal()
        }
    })

    const { width, height } = useWindowSize()
    const router = useRouter()

    // ✅ Используем useRef для аудио
    const finishAudioRef = useRef<HTMLAudioElement | null>(null)
    const correctAudioRef = useRef<HTMLAudioElement | null>(null)
    const incorrectAudioRef = useRef<HTMLAudioElement | null>(null)

    const [pending, startTransition] = useTransition()
    const [lessonId, setLessonId] = useState(initialLessonId)
    const [hearts, setHearts] = useState(initialHearts)
    const [percentage, setPercentage] = useState(() => {
        return initialPercentage === 100 ? 0 : initialPercentage
    })
    const [challenges] = useState(initialLessonChallenges)

    const challengesDoneWrong = challengeProgress.filter((el) => el.doneRight === false)
    const challengesIds = challenges.map(el => el.id)
    const challengesDone = challengeProgress.filter((el) => challengesIds.includes(el.challengeId))
    const wrongChallengesId = challengesDoneWrong.map(a => a.challengeId)
    const doneChallengesId = challengesDone.map(a => a.challengeId)
    const challengesInLessonThatIsNOTDone = challenges.filter((el) => !doneChallengesId.includes(el.id))

    const [activeIndex, setActiveIndex] = useState(
        undefined === challengesInLessonThatIsNOTDone[0]
            ? challenges[0].id
            : challengesInLessonThatIsNOTDone[0].id
    )

    const [isDoneWrongChallenge, setIsDoneWrongChallenge] = useState(false)
    const [isDoneChallenge, setIsDoneChallenge] = useState(false)
    const [timesDoneWrong, setTimesDoneWrong] = useState(0)
    const [timesDone, setTimesDone] = useState(0)
    const [dateLastDone, setDateLastDone] = useState(new Date(2025, 4, 1))
    const [selectedOption, setSelectedOption] = useState<number>()
    const [status, setStatus] = useState<"correct" | "wrong" | "none">('none')
    const [options, setOptions] = useState<typeof challengeOptions.$inferSelect[]>([])

    let [challenge] = challenges.filter(el => el.id == activeIndex)

    // Инициализация аудио
    useEffect(() => {
        finishAudioRef.current = new Audio('/finish.mp3')
        correctAudioRef.current = new Audio('/correct.mp3')
        incorrectAudioRef.current = new Audio('/incorrect.mp3')

        return () => {
            if (finishAudioRef.current) {
                finishAudioRef.current.pause()
                finishAudioRef.current = null
            }
            if (correctAudioRef.current) {
                correctAudioRef.current.pause()
                correctAudioRef.current = null
            }
            if (incorrectAudioRef.current) {
                incorrectAudioRef.current.pause()
                incorrectAudioRef.current = null
            }
        }
    }, [])

    // Функции для воспроизведения аудио
    const playFinishSound = () => {
        if (finishAudioRef.current) {
            finishAudioRef.current.currentTime = 0
            finishAudioRef.current.play().catch(error => {
                console.error('Ошибка воспроизведения finish аудио:', error)
            })
        }
    }

    const playCorrectSound = () => {
        if (correctAudioRef.current) {
            correctAudioRef.current.currentTime = 0
            correctAudioRef.current.play().catch(error => {
                console.error('Ошибка воспроизведения correct аудио:', error)
            })
        }
    }

    const playIncorrectSound = () => {
        if (incorrectAudioRef.current) {
            incorrectAudioRef.current.currentTime = 0
            incorrectAudioRef.current.play().catch(error => {
                console.error('Ошибка воспроизведения incorrect аудио:', error)
            })
        }
    }

    // Воспроизведение финишного аудио при завершении
    useEffect(() => {
        if (challenges.length === challengesDone.length) {
            playFinishSound()
        }
    }, [challenges.length, challengesDone.length])

    const onClickNumber = (num: number) => {
        setActiveIndex(num - 1)
        setSelectedOption(undefined)
        setStatus('none')
        setIsDoneWrongChallenge(wrongChallengesId.includes(num - 1))
        setIsDoneChallenge(doneChallengesId.includes(num - 1))
        setDateLastDone(challengesDone.filter(el => el.challengeId === num - 1)
            [(challengesDone.filter(el => el.challengeId === num - 1)).length - 1]
            ?.dateDone)
        setTimesDone(doneChallengesId.filter(x => x == num - 1).length)
        setTimesDoneWrong(wrongChallengesId.filter(x => x == num - 1).length)

        let toShuffle = challenges.filter(el => el.id == num - 1)[0].challengeOptions
        Shuffle(toShuffle)
        setOptions(toShuffle)
    }

    const Shuffle = (array: any) => {
        let currentIndex = array.length;
        while (currentIndex != 0) {
            let randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
    }

    useEffect(() => {
        if (challenge?.challengeOptions) {
            const randomizeArray = [...challenge.challengeOptions].sort(() => 0.5 - Math.random());
            setOptions(randomizeArray);
        }
    }, [challenge?.challengeOptions]);

    const onNext = () => {
        setActiveIndex((current) => current + 1)
    }

    const onSelect = (id: number) => {
        if (status !== "none") return
        setSelectedOption(id)
    }

    const onContinue = () => {
        if (!selectedOption) return

        if (status === 'wrong') {
            onNext()
            setStatus('none')
            setSelectedOption(undefined)
            return
        }

        if (status === 'correct') {
            onNext()
            setStatus('none')
            setSelectedOption(undefined)
            return
        }

        const correctOption = options.find((option) => option.correct)

        if (!correctOption) {
            return
        }

        if (correctOption && correctOption.id === selectedOption) {
            startTransition(() => {
                const TrueValue = true
                openRightModal()

                upsertChallengeProgress(challenge.id, TrueValue, oldCourseProgress, activeCourseTitle, challenge.points, isDoneChallenge)
                    .then((response) => {
                        if (response?.error === 'hearts') {
                            openHeartsModal()
                            return
                        }

                        // ✅ Воспроизводим правильное аудио
                        playCorrectSound()
                        setStatus('correct')
                        setPercentage((prev) => prev + 100 / challenges.length)

                        if (initialPercentage === 100) {
                            setHearts((prev) => Math.min(prev + 1, 5))
                        }
                    })
                    .catch(() => toast.error('Что-то пошло не так! Попробуйте ещё раз'))
            })
        } else {
            startTransition(() => {
                openWrongModal()
                reduceHearts(challenge.id)

                upsertChallengeProgress(challenge.id, false, oldCourseProgress, activeCourseTitle, challenge.points, isDoneChallenge)
                    .then((response) => {
                        if (response?.error === 'hearts') {
                            openHeartsModal()
                            return
                        }

                        // ✅ Воспроизводим неправильное аудио
                        playIncorrectSound()
                        setStatus('wrong')
                        setPercentage((prev) => prev + 100 / challenges.length)

                        if (!response?.error) {
                            setHearts((prev) => Math.max(prev - 1, 0))
                        }
                    })
                    .catch(() => toast.error('Что-то пошло не так! Попробуйте ещё раз'))
            })
        }
    }

    if (!challenge) {
        challenge = challenges[0]
    }

    if (challenges.length === challengesDone.length) {
        return (
            <>
                <Confetti
                    width={width}
                    height={height}
                    recycle={false}
                    numberOfPieces={500}
                    tweenDuration={10000}
                />
                <div className="flex flex-col gap-y-4 lg:gap-y-8 max-w-lg mx-auto text-center items-center justify-center h-full">
                    <Image
                        src='/finish.svg'
                        alt="Finish"
                        className="hidden lg:block"
                        height={100}
                        width={100}
                    />
                    <Image
                        src='/finish.svg'
                        alt="Finish"
                        className="block lg:hidden"
                        height={50}
                        width={50}
                    />
                    <h1 className="text-xl lg:text-xl font-bold text-neutral-700">
                        Great job <br /> Вы завершили урок!
                    </h1>
                    <div className="flex items-center gap-x-4 w-full">
                        <ResultCard
                            variant='points'
                            value={challenges.length * 10}
                        />
                        <ResultCard
                            variant='hearts'
                            value={hearts}
                        />
                    </div>
                </div>
                <Footer
                    lessonId={lessonId}
                    status='completed'
                    onCheck={() => router.push('/learn')}
                />
            </>
        )
    }

    const title = challenge.type === "ASSIST"
        ? lessonTitle
        : challenge.question

    return (
        <>
            <Header
                hearts={hearts}
                percentage={percentage}
                hasActiveSubscription={!!userSubscription?.isActive}
            />

            <div className="flex justify-center mt-10">
                <Lottie className="h-20 w-20 pr-5"
                    animationData={randomLottieSelect}
                />

                <div className="flex justify-center">
                    <div className='pt-2 grid grid-cols-6 gap-2 justify-between'>
                        {challenges.map((challenge) => (
                            <div key={challenge.id * 12786} className="relative">
                                <Button
                                    className='relative'
                                    variant={
                                        wrongChallengesId.includes(challenge.id) ? 'danger'
                                            : doneChallengesId.includes(challenge.id) ? 'secondary'
                                                : 'default'
                                    }
                                    onClick={() => onClickNumber(challenge.id + 1)}>
                                    <h1 className={Number(activeIndex) === (challenge.id) ? "overline" : ""}>
                                        {challenge.id % 1000}
                                    </h1>
                                </Button>
                                {missedCIds.includes(challenge.id) &&
                                    <p className="text-4xl absolute top-0 pl-2 z-10">
                                        .
                                    </p>
                                }
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 mb-10">
                <div className="h-full flex items-center justify-center">
                    <div className="lg:min-h-[350px] lg:w-[600px] w-full px-6 lg:px-0 flex flex-col gap-y-2">
                        <h1 className="text-lg lg:text-3xl text-center lg:text-start font-bold text-neutral-700">
                            {title}
                        </h1>

                        <div>
                            {challenge.type === "ASSIST" && (
                                <QuestionBubble
                                    question={challenge.question}
                                    pts={challenge.points}
                                    author={challenge.author}
                                    timesDoneWrong={timesDoneWrong}
                                    timesDone={timesDone}
                                    isHWChallenge={missedCIds.includes(challenge.id)}
                                />
                            )}

                            <Challenge
                                options={options}
                                onSelect={onSelect}
                                status={status}
                                selectedOption={selectedOption}
                                disabled={pending}
                                type={challenge.type}
                                isDoneWrongChallenge={isDoneWrongChallenge}
                                isDoneChallenge={isDoneChallenge}
                                dateLastDone={dateLastDone}
                                challengeId={challenge.id}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Footer
                disabled={isDoneChallenge || pending || !selectedOption}
                status={status}
                onCheck={onContinue}
            />
        </>
    )
}






// 'use client';

// import { SuperType, challengeOptions, challengeProgress, challenges } from "@/db/schema";
// import { useEffect, useState, useTransition } from "react";
// import { Header } from "./header";
// import { QuestionBubble } from "./question-bubble";
// import { Challenge } from "./challenge";
// import { Footer } from "./footer";
// import { upsertChallengeProgress } from "@/actions/challenge-progress";
// import { toast } from "sonner";
// import { reduceHearts } from "@/actions/user-progress";
// import { useAudio, useWindowSize, useMount } from "react-use";

// import Image from "next/image";
// import { ResultCard } from "./result-card";
// import { useRouter } from "next/navigation";
// import Confetti from 'react-confetti'
// import { useHeartsModal } from "@/store/use-hearts-modal";
// import { usePracticeModal } from "@/store/use-practice-modal";
// import { Button } from "@/components/ui/button";

// import LottieSelectRainbow from '@/public/LottieSelectRainbow.json'
// import LottieSelectCrown from '@/public/LottieSelectCrown.json'
// import LottieSelectDiamond from '@/public/LottieSelectDiamond.json'
// import LottieSelectSparks from '@/public/LottieSelectSparks.json'
// import LottieSelectStars from '@/public/LottieSelectStars.json'
// import LottieSelectButterfly from '@/public/LottieSelectButterfly.json'


// import Lottie from "lottie-react";
// import { useWrongAnswerModal } from "@/store/use-wronganswer-modal";
// import 'katex/dist/katex.min.css';
// import { useRightAnswerModal } from "@/store/use-rightanswer-modal";

// type Props= {
//     initialPercentage: number
//     initialHearts: number
//     initialLessonId: number
//     initialLessonChallenges: (typeof challenges.$inferSelect & {
//         completed: boolean
//         challengeOptions: typeof challengeOptions.$inferSelect[]
//     })[]
//     userSubscription: any // TODO: REPLACE
//     challengeProgress: typeof challengeProgress.$inferSelect[] 
//     lessonTitle: string

//     oldCourseProgress: SuperType
//     activeCourseTitle: string

//     missedCIds: number[]
// }


// const LottieData = [
//     LottieSelectRainbow,
//     LottieSelectCrown,
//     LottieSelectDiamond,
//     LottieSelectSparks,
//     LottieSelectStars,
//     LottieSelectButterfly,
// ]

// var randomLottieSelect = LottieData[Math.floor(Math.random()*LottieData.length)];


// export const Quiz = ({
//     initialPercentage,
//     initialHearts,
//     initialLessonId,
//     initialLessonChallenges,
//     userSubscription,
//     challengeProgress,
//     lessonTitle,

//     oldCourseProgress,
//     activeCourseTitle,

//     missedCIds,

// }: Props) => {


//     const { open: openHeartsModal } = useHeartsModal()
//     const { open: openPracticeModal } = usePracticeModal()

//     useMount(() => {
//         if (initialPercentage === 100) {
//             openPracticeModal()
//         }
//     })

//     const { width, height } = useWindowSize()

//     const router = useRouter()

//     const [finishAudio] = useAudio({src:'/finish.mp3', autoPlay: true})


    






//     const [pending, startTransition] = useTransition()

//     const [lessonId, setLessonId] = useState(initialLessonId)

//     const [hearts, setHearts] = useState(initialHearts)

    
//     const [percentage, setPercentage] = useState(()=>{
//         return initialPercentage === 100 ? 0 : initialPercentage
//     })
//     const [challenges] = useState(initialLessonChallenges)

    

//     const challengesDoneWrong = challengeProgress.filter((el) => el.doneRight === false)



//     const challengesIds = challenges.map(el => el.id)
//     const challengesDone = challengeProgress.filter((el) => challengesIds.includes(el.challengeId))
   


//     const wrongChallengesId = challengesDoneWrong.map(a => a.challengeId);
//     const doneChallengesId = challengesDone.map(a => a.challengeId);

//     const challengesInLessonThatIsNOTDone = challenges.filter((el) => !doneChallengesId.includes(el.id))


//     const [activeIndex, setActiveIndex] = useState( 
//         undefined === challengesInLessonThatIsNOTDone[0] 
//         ? challenges[0].id 
//         : challengesInLessonThatIsNOTDone[0].id
//     )

//     const [isDoneWrongChallenge, setIsDoneWrongChallenge] = useState(false)
//     const [isDoneChallenge, setIsDoneChallenge] = useState(false)
//     const [timesDoneWrong, setTimesDoneWrong] = useState(0)
//     const [timesDone, setTimesDone] = useState(0)
//     const [dateLastDone, setDateLastDone] = useState(new Date(2025, 4, 1))



    
    




    


//     const onClickNumber = (num: number) => {   
      
//         setActiveIndex(num - 1)
         
//         setSelectedOption(undefined)
//         setStatus('none')

//         setIsDoneWrongChallenge(wrongChallengesId.includes(num-1))
//         setIsDoneChallenge(doneChallengesId.includes(num-1))

//         // Берем ПОСЛЕДНЮЮ дату решенного задания
//         //
//         setDateLastDone(challengesDone.filter(el => el.challengeId === num - 1)
//             [(challengesDone.filter(el => el.challengeId === num - 1)).length - 1]
//             ?.dateDone )

//         setTimesDone(doneChallengesId.filter(x => x == num-1).length)
//         setTimesDoneWrong(wrongChallengesId.filter(x => x == num-1).length)







//         let toShuffle = challenges.filter(el => el.id == num-1)[0].challengeOptions
//         Shuffle(toShuffle)
//         setOptions(toShuffle)          

//     }


//     const [selectedOption, setSelectedOption] = useState<number>()
//     const [status, setStatus] = useState<"correct" | "wrong" | "none">('none')

    
//     let [challenge] = challenges.filter(el => el.id == activeIndex)

//     // const [optionsList, setOptionsList] = useState(challenge?.challengeOptions ?? [])




//     const {open} = useWrongAnswerModal()

//     const {openR} = useRightAnswerModal()

   

    


    



//     // SHUFFLE FUNCTION
//     //
//     const Shuffle = (array: any) => {
//         let currentIndex = array.length;
    
//         while (currentIndex != 0) {
    
//         let randomIndex = Math.floor(Math.random() * currentIndex);
//         currentIndex--;
    
//         [array[currentIndex], array[randomIndex]] = [
//             array[randomIndex], array[currentIndex]];
//         }
//     }




//     //TODO: новое перемешивание вариантов ответа

//     const [options, setOptions] = useState<typeof challengeOptions.$inferSelect[]>([]);
    
//     useEffect(() => {
//         const randomizeArray  =  [...challenge?.challengeOptions].sort(() => 0.5 - Math.random());
//         setOptions(randomizeArray);
//     }, []);











//     const onNext = () => {
//         setActiveIndex((current) => current + 1)
//     }

//     const onSelect = (id:number) => {
//         if (status !== "none") return
//         // TODO:
//         setSelectedOption(id)
//     }

//     const onContinue = () => {


//         if (!selectedOption) return

//         if (status==='wrong') {
//             onNext()
//             setStatus('none')
//             setSelectedOption(undefined)
//             return
//         }

//         if (status==='correct') {
//             onNext()
//             setStatus('none')
//             setSelectedOption(undefined)
//             return
//         }

//         const correctOption = options.find((option)=>option.correct)

//         if (!correctOption) {
//             return
//         }

//         if(correctOption && correctOption.id === selectedOption) {
            
//             startTransition(()=> {

//                 //TODO: ADD DONE RIGHT
//                 const TrueValue = true
                
//                 // close()
                


//                 // setIsOpenDialog(true)


//                 openR()


//                 upsertChallengeProgress(challenge.id, TrueValue, oldCourseProgress, activeCourseTitle, challenge.points, isDoneChallenge)
//                 // .then(() => {close()})
//                 // const {openWrongAnswerModal} = useWrongAnswerModal()
//                 .then((response)=>{
//                     if (response?.error === 'hearts') {
//                         openHeartsModal()
//                         return
//                     }

//                     // correctControls.play()
//                     setStatus('correct')
//                     setPercentage((prev)=> prev + 100/challenges.length)

//                     // TODO: This is a practice
//                     //
//                     if (initialPercentage===100){
//                         setHearts((prev) => Math.min(prev + 1, 5))
//                     }
//                 })
//                 // .then(()=>{openR()})
//                 .catch(()=>toast.error('Что-то пошло не так! Попробуйте ещё раз'))
//             })

//         } else {

//             //TODO: ADD DONE WRONG
//             const FalseValue = false

//             // setIsOpenDialog(true)
//             // open()
            

//             startTransition(()=>{
//                 open()

//                 reduceHearts(challenge.id)


//                 upsertChallengeProgress(challenge.id, FalseValue, oldCourseProgress, activeCourseTitle, challenge.points, isDoneChallenge)
                
//                 .then((response)=>{
//                     if(response?.error === 'hearts') {
//                         openHeartsModal()
//                         return 
//                     }

//                     // incorrectControls.play()
//                     setStatus('wrong')

//                     setPercentage((prev)=> prev + 100/challenges.length)

//                     if (!response?.error) {
//                         setHearts((prev) => Math.max(prev - 1, 0))
//                     }
//                 })
//                 // .then(()=>{open()})
//                 .catch(()=>toast.error('Что-то пошло не так! Попробуйте ещё раз'))

//                 // open()

//             })

//             // open()

//         }
//     }
    
//     if(!challenge) {
//         challenge = challenges[0]
//     }
//     //TODO: РЕШИЛИ ВСЕ ЧЕЛЕНДЖИ В ЭТОМ ЛЕССОНЕ
//     //

//     if(challenges.length === challengesDone.length) {
//         //
//         // WE HERE FINISH LESSON
//         // 
//         return(
//             <>
//                 {finishAudio}
//                 <Confetti
//                     width={width}
//                     height={height}
//                     recycle={false}
//                     numberOfPieces={500}
//                     tweenDuration={10000}
//                 />
//                 <div className="flex flex-col gap-y-4 lg:gap-y-8 max-w-lg mx-auto text-center items-center justify-center h-full">
//                     <Image
//                         src='/finish.svg'
//                         alt="Finish"
//                         className="hidden lg:block"
//                         height={100}
//                         width={100}
//                     />
//                     <Image
//                         src='/finish.svg'
//                         alt="Finish"
//                         className="block lg:hidden"
//                         height={50}
//                         width={50}
//                     />
//                     <h1 className="text-xl lg:text-xl font-bold text-neutral-700">
//                         Great job <br /> Вы завершили урок!
//                     </h1>
//                     <div className="flex items-center gap-x-4 w-full">
//                         <ResultCard 
//                             variant='points'
//                             value={challenges.length * 10}
//                         />
//                         <ResultCard 
//                             variant='hearts'
//                             value={hearts}
//                         />
//                     </div>
//                 </div>
//                 <Footer 
//                     lessonId={lessonId}
//                     status='completed'
//                     onCheck={()=>router.push('/learn')}
//                 />
//             </>
//             )
//         }







//     const title = challenge.type === "ASSIST" 
//     // ? "Select the correct meaning"
//     ?  lessonTitle
//     : challenge.question










//     return(
//     <>

//         {/* {incorrectAudio}
//         {correctAudio} */}



//         {/* {isOpenDialog && <DialogRightAnswer />} */}
//         {/* <DialogRightAnswer /> */}
//         <Header 
//             hearts={hearts}
//             percentage={percentage}
//             hasActiveSubscription={!!userSubscription?.isActive}
//         />

//          {/* TODO: SELECT numbers */}
         
        
//         <div className="flex justify-center mt-10">
            
//             <Lottie className="h-20 w-20 pr-5"
//                     animationData={ randomLottieSelect } 
//             />
        
//             <div className="flex justify-center">
                
//                 <div className='pt-2 grid grid-cols-6 gap-2 justify-between'>
//                 {challenges.map((challenge)=>(
//                     <div key={challenge.id * 12786} className="relative">
//                         <Button 
//                             className='relative'
//                             variant={
                                
//                                 wrongChallengesId.includes(challenge.id) ? 'danger' 
//                                 : doneChallengesId.includes(challenge.id) ? 'secondary' 
//                                 : 'default'
//                                 }

//                             onClick={()=>onClickNumber(challenge.id + 1)}>
                            
//                             <h1 className=
//                                 {Number(activeIndex) === (challenge.id) ? "overline" : ""}
//                                 >
//                                 {challenge.id % 1000}
//                             </h1>
//                         </Button>


//                         {missedCIds.includes(challenge.id) && 
//                             //
//                             // Если HW то рисуем ТОЧКУ в углу кнопки номера
//                             //
//                             <p className="text-4xl absolute top-0 pl-2 z-10 ">
//                                 .
//                             </p>
                                   
//                         }







//                     </div>
//                     ))}
//                 </div>
//             </div>
//         </div>



        

//         <div className="flex-1 mb-10">
            
//             <div className="h-full flex items-center justify-center">
//                 <div className="lg:min-h-[350px] lg:w-[600px] w-full px-6 lg:px-0 flex flex-col gap-y-2">
                        


//                     <h1 className="text-lg lg:text-3xl text-center lg:text-start font-bold text-neutral-700">
                        
//                             {title}
                    
//                     </h1>


//                     <div>
//                         {challenge.type === "ASSIST" && (
//                             <QuestionBubble 
//                                 question={challenge.question} 
//                                 pts={challenge.points}
//                                 author={challenge.author}
//                                 timesDoneWrong={timesDoneWrong}
//                                 timesDone={timesDone}
                                
//                                 isHWChallenge={missedCIds.includes(challenge.id)}
//                             />
//                         )}

                        
//                         <Challenge 
//                             options={options}
//                             onSelect={onSelect}
//                             status={status}
//                             selectedOption={selectedOption}
//                             disabled={pending}
//                             type={challenge.type}
//                             isDoneWrongChallenge={isDoneWrongChallenge}
//                             isDoneChallenge={isDoneChallenge}
//                             dateLastDone={dateLastDone}
//                             challengeId={challenge.id}

                            
//                         />
//                     </div>
//                 </div>
//             </div>


            
//         </div>

//         <Footer 
//             disabled={isDoneChallenge || pending || !selectedOption}
//             status={status}
//             onCheck={onContinue}
//         />
//     </>
//     )
// }






// 'use client';

// import { SuperType, challengeOptions, challengeProgress, challenges } from "@/db/schema";
// import { useEffect, useState, useTransition } from "react";
// import { Header } from "./header";
// import { QuestionBubble } from "./question-bubble";
// import { Challenge } from "./challenge";
// import { Footer } from "./footer";
// import { upsertChallengeProgress } from "@/actions/challenge-progress";
// import { toast } from "sonner";
// import { reduceHearts } from "@/actions/user-progress";
// import { useAudio, useWindowSize, useMount } from "react-use";

// import Image from "next/image";
// import { ResultCard } from "./result-card";
// import { useRouter } from "next/navigation";
// import Confetti from 'react-confetti'
// import { useHeartsModal } from "@/store/use-hearts-modal";
// import { usePracticeModal } from "@/store/use-practice-modal";
// import { Button } from "@/components/ui/button";

// import LottieSelectRainbow from '@/public/LottieSelectRainbow.json'
// import LottieSelectCrown from '@/public/LottieSelectCrown.json'
// import LottieSelectDiamond from '@/public/LottieSelectDiamond.json'
// import LottieSelectSparks from '@/public/LottieSelectSparks.json'
// import LottieSelectStars from '@/public/LottieSelectStars.json'
// import LottieSelectButterfly from '@/public/LottieSelectButterfly.json'

// import Lottie from "lottie-react";
// import { useWrongAnswerModal } from "@/store/use-wronganswer-modal";
// import 'katex/dist/katex.min.css';
// import { useRightAnswerModal } from "@/store/use-rightanswer-modal";

// type Props = {
//     initialPercentage: number
//     initialHearts: number
//     initialLessonId: number
//     initialLessonChallenges: (typeof challenges.$inferSelect & {
//         completed: boolean
//         challengeOptions: typeof challengeOptions.$inferSelect[]
//     })[]
//     userSubscription: any
//     challengeProgress: typeof challengeProgress.$inferSelect[] 
//     lessonTitle: string
//     oldCourseProgress: SuperType
//     activeCourseTitle: string
//     missedCIds: number[]
// }

// const LottieData = [
//     LottieSelectRainbow,
//     LottieSelectCrown,
//     LottieSelectDiamond,
//     LottieSelectSparks,
//     LottieSelectStars,
//     LottieSelectButterfly,
// ]

// const randomLottieSelect = LottieData[Math.floor(Math.random() * LottieData.length)];

// export const Quiz = ({
//     initialPercentage,
//     initialHearts,
//     initialLessonId,
//     initialLessonChallenges,
//     userSubscription,
//     challengeProgress,
//     lessonTitle,
//     oldCourseProgress,
//     activeCourseTitle,
//     missedCIds,
// }: Props) => {
//     const { open: openHeartsModal } = useHeartsModal()
//     const { open: openPracticeModal } = usePracticeModal()
//     const { open: openWrongModal } = useWrongAnswerModal()
//     const { openR: openRightModal } = useRightAnswerModal()

//     useMount(() => {
//         if (initialPercentage === 100) {
//             openPracticeModal()
//         }
//     })

//     const { width, height } = useWindowSize()
//     const router = useRouter()

//     // ✅ Правильное использование useAudio
//     const [finishAudio, , finishAudioControls] = useAudio({
//         src: '/finish.mp3',
//         autoPlay: false // Не автозапускаем сразу
//     })

//     const [correctAudio, , correctAudioControls] = useAudio({
//         src: '/correct.mp3', // Добавьте путь к правильному аудио
//         autoPlay: false
//     })

//     const [incorrectAudio, , incorrectAudioControls] = useAudio({
//         src: '/incorrect.mp3', // Добавьте путь к неправильному аудио
//         autoPlay: false
//     })

//     const [pending, startTransition] = useTransition()
//     const [lessonId, setLessonId] = useState(initialLessonId)
//     const [hearts, setHearts] = useState(initialHearts)
//     const [percentage, setPercentage] = useState(() => {
//         return initialPercentage === 100 ? 0 : initialPercentage
//     })
//     const [challenges] = useState(initialLessonChallenges)

//     const challengesDoneWrong = challengeProgress.filter((el) => el.doneRight === false)
//     const challengesIds = challenges.map(el => el.id)
//     const challengesDone = challengeProgress.filter((el) => challengesIds.includes(el.challengeId))
//     const wrongChallengesId = challengesDoneWrong.map(a => a.challengeId)
//     const doneChallengesId = challengesDone.map(a => a.challengeId)
//     const challengesInLessonThatIsNOTDone = challenges.filter((el) => !doneChallengesId.includes(el.id))

//     const [activeIndex, setActiveIndex] = useState(
//         undefined === challengesInLessonThatIsNOTDone[0]
//             ? challenges[0].id
//             : challengesInLessonThatIsNOTDone[0].id
//     )

//     const [isDoneWrongChallenge, setIsDoneWrongChallenge] = useState(false)
//     const [isDoneChallenge, setIsDoneChallenge] = useState(false)
//     const [timesDoneWrong, setTimesDoneWrong] = useState(0)
//     const [timesDone, setTimesDone] = useState(0)
//     const [dateLastDone, setDateLastDone] = useState(new Date(2025, 4, 1))
//     const [selectedOption, setSelectedOption] = useState<number>()
//     const [status, setStatus] = useState<"correct" | "wrong" | "none">('none')
//     const [options, setOptions] = useState<typeof challengeOptions.$inferSelect[]>([])

//     let [challenge] = challenges.filter(el => el.id == activeIndex)

//     // Воспроизведение финишного аудио при завершении
//     useEffect(() => {
//         if (challenges.length === challengesDone.length) {
//             finishAudioControls.play()
//         }
//     }, [challenges.length, challengesDone.length, finishAudioControls])

//     const onClickNumber = (num: number) => {
//         setActiveIndex(num - 1)
//         setSelectedOption(undefined)
//         setStatus('none')
//         setIsDoneWrongChallenge(wrongChallengesId.includes(num - 1))
//         setIsDoneChallenge(doneChallengesId.includes(num - 1))
//         setDateLastDone(challengesDone.filter(el => el.challengeId === num - 1)
//             [(challengesDone.filter(el => el.challengeId === num - 1)).length - 1]
//             ?.dateDone)
//         setTimesDone(doneChallengesId.filter(x => x == num - 1).length)
//         setTimesDoneWrong(wrongChallengesId.filter(x => x == num - 1).length)

//         let toShuffle = challenges.filter(el => el.id == num - 1)[0].challengeOptions
//         Shuffle(toShuffle)
//         setOptions(toShuffle)
//     }

//     const Shuffle = (array: any) => {
//         let currentIndex = array.length;
//         while (currentIndex != 0) {
//             let randomIndex = Math.floor(Math.random() * currentIndex);
//             currentIndex--;
//             [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
//         }
//     }

//     useEffect(() => {
//         if (challenge?.challengeOptions) {
//             const randomizeArray = [...challenge.challengeOptions].sort(() => 0.5 - Math.random());
//             setOptions(randomizeArray);
//         }
//     }, [challenge?.challengeOptions]);

//     const onNext = () => {
//         setActiveIndex((current) => current + 1)
//     }

//     const onSelect = (id: number) => {
//         if (status !== "none") return
//         setSelectedOption(id)
//     }

//     const onContinue = () => {
//         if (!selectedOption) return

//         if (status === 'wrong') {
//             onNext()
//             setStatus('none')
//             setSelectedOption(undefined)
//             return
//         }

//         if (status === 'correct') {
//             onNext()
//             setStatus('none')
//             setSelectedOption(undefined)
//             return
//         }

//         const correctOption = options.find((option) => option.correct)

//         if (!correctOption) {
//             return
//         }

//         if (correctOption && correctOption.id === selectedOption) {
//             startTransition(() => {
//                 const TrueValue = true
//                 openRightModal()

//                 upsertChallengeProgress(challenge.id, TrueValue, oldCourseProgress, activeCourseTitle, challenge.points, isDoneChallenge)
//                     .then((response) => {
//                         if (response?.error === 'hearts') {
//                             openHeartsModal()
//                             return
//                         }

//                         // ✅ Воспроизводим правильное аудио
//                         correctAudioControls.play()
//                         setStatus('correct')
//                         setPercentage((prev) => prev + 100 / challenges.length)

//                         if (initialPercentage === 100) {
//                             setHearts((prev) => Math.min(prev + 1, 5))
//                         }
//                     })
//                     .catch(() => toast.error('Что-то пошло не так! Попробуйте ещё раз'))
//             })
//         } else {
//             startTransition(() => {
//                 openWrongModal()
//                 reduceHearts(challenge.id)

//                 upsertChallengeProgress(challenge.id, false, oldCourseProgress, activeCourseTitle, challenge.points, isDoneChallenge)
//                     .then((response) => {
//                         if (response?.error === 'hearts') {
//                             openHeartsModal()
//                             return
//                         }

//                         // ✅ Воспроизводим неправильное аудио
//                         incorrectAudioControls.play()
//                         setStatus('wrong')
//                         setPercentage((prev) => prev + 100 / challenges.length)

//                         if (!response?.error) {
//                             setHearts((prev) => Math.max(prev - 1, 0))
//                         }
//                     })
//                     .catch(() => toast.error('Что-то пошло не так! Попробуйте ещё раз'))
//             })
//         }
//     }

//     if (!challenge) {
//         challenge = challenges[0]
//     }

//     if (challenges.length === challengesDone.length) {
//         return (
//             <>
//                 {finishAudio}
//                 <Confetti
//                     width={width}
//                     height={height}
//                     recycle={false}
//                     numberOfPieces={500}
//                     tweenDuration={10000}
//                 />
//                 <div className="flex flex-col gap-y-4 lg:gap-y-8 max-w-lg mx-auto text-center items-center justify-center h-full">
//                     <Image
//                         src='/finish.svg'
//                         alt="Finish"
//                         className="hidden lg:block"
//                         height={100}
//                         width={100}
//                     />
//                     <Image
//                         src='/finish.svg'
//                         alt="Finish"
//                         className="block lg:hidden"
//                         height={50}
//                         width={50}
//                     />
//                     <h1 className="text-xl lg:text-xl font-bold text-neutral-700">
//                         Great job <br /> Вы завершили урок!
//                     </h1>
//                     <div className="flex items-center gap-x-4 w-full">
//                         <ResultCard
//                             variant='points'
//                             value={challenges.length * 10}
//                         />
//                         <ResultCard
//                             variant='hearts'
//                             value={hearts}
//                         />
//                     </div>
//                 </div>
//                 <Footer
//                     lessonId={lessonId}
//                     status='completed'
//                     onCheck={() => router.push('/learn')}
//                 />
//             </>
//         )
//     }

//     const title = challenge.type === "ASSIST"
//         ? lessonTitle
//         : challenge.question

//     return (
//         <>
//             {correctAudio}
//             {incorrectAudio}
            
//             <Header
//                 hearts={hearts}
//                 percentage={percentage}
//                 hasActiveSubscription={!!userSubscription?.isActive}
//             />

//             <div className="flex justify-center mt-10">
//                 <Lottie className="h-20 w-20 pr-5"
//                     animationData={randomLottieSelect}
//                 />

//                 <div className="flex justify-center">
//                     <div className='pt-2 grid grid-cols-6 gap-2 justify-between'>
//                         {challenges.map((challenge) => (
//                             <div key={challenge.id * 12786} className="relative">
//                                 <Button
//                                     className='relative'
//                                     variant={
//                                         wrongChallengesId.includes(challenge.id) ? 'danger'
//                                             : doneChallengesId.includes(challenge.id) ? 'secondary'
//                                                 : 'default'
//                                     }
//                                     onClick={() => onClickNumber(challenge.id + 1)}>
//                                     <h1 className={Number(activeIndex) === (challenge.id) ? "overline" : ""}>
//                                         {challenge.id % 1000}
//                                     </h1>
//                                 </Button>
//                                 {missedCIds.includes(challenge.id) &&
//                                     <p className="text-4xl absolute top-0 pl-2 z-10">
//                                         .
//                                     </p>
//                                 }
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </div>

//             <div className="flex-1 mb-10">
//                 <div className="h-full flex items-center justify-center">
//                     <div className="lg:min-h-[350px] lg:w-[600px] w-full px-6 lg:px-0 flex flex-col gap-y-2">
//                         <h1 className="text-lg lg:text-3xl text-center lg:text-start font-bold text-neutral-700">
//                             {title}
//                         </h1>

//                         <div>
//                             {challenge.type === "ASSIST" && (
//                                 <QuestionBubble
//                                     question={challenge.question}
//                                     pts={challenge.points}
//                                     author={challenge.author}
//                                     timesDoneWrong={timesDoneWrong}
//                                     timesDone={timesDone}
//                                     isHWChallenge={missedCIds.includes(challenge.id)}
//                                 />
//                             )}

//                             <Challenge
//                                 options={options}
//                                 onSelect={onSelect}
//                                 status={status}
//                                 selectedOption={selectedOption}
//                                 disabled={pending}
//                                 type={challenge.type}
//                                 isDoneWrongChallenge={isDoneWrongChallenge}
//                                 isDoneChallenge={isDoneChallenge}
//                                 dateLastDone={dateLastDone}
//                                 challengeId={challenge.id}
//                             />
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             <Footer
//                 disabled={isDoneChallenge || pending || !selectedOption}
//                 status={status}
//                 onCheck={onContinue}
//             />
//         </>
//     )
// }
