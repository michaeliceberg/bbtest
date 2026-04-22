"use client"

import React, { useEffect, useMemo, useState, useTransition, useRef } from "react"
import Confetti from "react-confetti"
import { useWindowSize } from "react-use"
import TrainerQuestion from "../../../components/trainer-question"
import { t_challenges, t_lessonProgress } from "@/db/schema"
import { Button } from "../../../components/ui/button"
import Lottie from "lottie-react"
import { Avatar, AvatarImage } from "../../../components/ui/avatar";

import LottieTrainerSharkFailDNO from '@/public/Lottie/trainer/LottieTrainerSharkFailDNO.json'
import LottieTrainerSharkStart from '@/public/Lottie/trainer/LottieTrainerSharkStart.json'
import LottieTrainerSharkStartUdachi from '@/public/Lottie/trainer/LottieTrainerSharkStartUdachi.json'
import LottieStartMorning from '@/public/Lottie/trainer/LottieStartMorning.json'
import LottieStartPrivet from '@/public/Lottie/trainer/LottieStartPrivet.json'
import LottieStartYesCapitan from '@/public/Lottie/trainer/LottieStartYesCapitan.json'
import LottieTrainerSharkFinalWin from '@/public/Lottie/trainer/LottieTrainerSharkFinalWin.json'
import LottieTrainerSharkThinkin from '@/public/Lottie/trainer/LottieTrainerSharkThinkin.json'
import LottieTrainerSharkFailCry from '@/public/Lottie/trainer/LottieTrainerSharkFailCry.json'
import LottieStartDots from '@/public/Lottie/trainer/LottieStartDots.json'
import LottieTrainerSharkFinalNoo from '@/public/Lottie/trainer/LottieTrainerSharkFinalNoo.json'
import LottieTrainerSharkFasterPistol from '@/public/Lottie/trainer/LottieTrainerSharkFasterPistol.json'
import LottieTrainerSharkFinalWinClap from '@/public/Lottie/trainer/LottieTrainerSharkFinalWinClap.json'

import WinStreakModal from "../../../components/win-streak-modal"
import { toast } from "sonner"
import { upsertTrainerLessonProgress } from "@/actions/user-progress"
import { ArrowLeft, Badge, BadgeAlert, BadgeCheck, Check, TrendingDown, TrendingUp, X, Baby, Crown, Pizza, Zap, Trophy, Heart } from "lucide-react"
import { ShuffleTS } from "@/usefulFunctions"
import { ChartComponent } from "../../../components/chart-comp"
import { cn } from "@/lib/utils"
import { Separator } from "../../../components/ui/separator"
import { FinishTrainerStat } from "../../../components/finish-trainer-stat"
import { TgSendMsgCom } from "../../../components/tg-send-msg-com"
import { QuestionType } from "@/app/t-lesson/[t_lessonId]/page"
import Image from "next/image"
import { createEffect, StreakEffect } from "@/lib/streakEffects"
import { useRouter } from 'next/navigation'


// Выносим за компонент - в самое начало файла, после импортов
const FINISH_AUDIO_SRC_LIST = [
  '/MemesAudio/meme-right-chetko.WAV',
  '/MemesAudio/meme-right-chinazes.WAV',
  '/MemesAudio/meme-right-umeetemogete.WAV',
  '/MemesAudio/meme-right-clapping.WAV',
  '/MemesAudio/meme-right-gtapassed.WAV',
  '/MemesAudio/meme-right-nice.WAV',
  '/MemesAudio/meme-right-papichlegkaya.WAV',
] as const;


const LottieStartList = [
  LottieTrainerSharkStart, 
  LottieTrainerSharkStartUdachi,
  LottieStartMorning,
  LottieStartPrivet,
  LottieStartYesCapitan,
]

const LottieEmotionRightList = [
  LottieStartDots, 
  LottieTrainerSharkThinkin,
  LottieTrainerSharkFinalWinClap,
]

const LottieEmotionWrongList = [
  LottieTrainerSharkFailCry, 
  LottieTrainerSharkFinalNoo,
  LottieTrainerSharkFasterPistol,
]

const startButton = [
  'Погнали!',
  'Гоу!',
  'Старт!',
  'Поехали!',
  'Поплыли!',
]

type Props = {
  t_lessonId: number,
  t_lessonTitle: string,
  t_lesson: typeof t_challenges.$inferSelect[]
  t_lessonProgress: typeof t_lessonProgress.$inferSelect[],
  questions1: QuestionType[],
  usersStat: {
    DR_DRP: number;
    user_id: string | undefined;
    user_name: string | undefined;
    user_imgSrc: string | undefined;
  }[],
  finishAudioSrc: string,
  userId: string,
  userName: string,
}

export default function TQuiz({
  t_lessonId,
  t_lessonTitle, 
  t_lesson,
  t_lessonProgress,
  questions1,
  usersStat,
  finishAudioSrc,
  userId,
  userName,
}: Props) {
  const router = useRouter()
  
  const [streak, setStreak] = useState(0)
  const [effect, setEffect] = useState<StreakEffect | null>(null)
  const [randomStartLottie, setRandomStartLottie] = useState(LottieStartList[0])
  const [randomStartButton, setRandomStartButton] = useState(startButton[0])
  const [randomEmotionLottie, setRandomEmotionLottie] = useState(LottieEmotionRightList[0])
  const [threeHearts, setThreeHearts] = useState(3)
  const [quizStarted, setQuizStarted] = useState(true)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [answeredQuestions, setAnsweredQuestions] = useState(0)
  const { width, height } = useWindowSize()
  
  const [allQuestions, setAllQuestions] = useState(questions1.slice(0, Math.round(questions1.length * 0.3)))
  const [numQuestionsButton, setNumQuestionsButton] = useState(0)
  
  const [isRightPrevious, setIsRightPrevious] = useState(true)
  const questions = allQuestions
  
  const initialState: number[] = questions.map((el, index) => index == 0 ? 3 : 0)
  const [isRightList, setIsRightList] = useState(initialState)
  const [finishList, setFinishList] = useState([{
    question: '',
    answer: '',
    rightAnswer: '',
    isRight: true,
  }])


  // let finishAudioSrcList = [
  //   '/MemesAudio/meme-right-chetko.WAV',
  //   '/MemesAudio/meme-right-chinazes.WAV',
  //   '/MemesAudio/meme-right-umeetemogete.WAV',
  //   '/MemesAudio/meme-right-clapping.WAV',
  //   '/MemesAudio/meme-right-gtapassed.WAV',
  //   '/MemesAudio/meme-right-nice.WAV',
  //   '/MemesAudio/meme-right-papichlegkaya.WAV',
  // ]
  const  finishAudio = FINISH_AUDIO_SRC_LIST[Math.floor(Math.random() * FINISH_AUDIO_SRC_LIST.length)];

  // const [finishA, setFinishA] = useState(finishAudioSrcList[0])

  const [finishA, setFinishA] = useState(finishAudio)

  // ✅ Используем useRef для аудио
  const correctAudioRef = useRef<HTMLAudioElement | null>(null)
  const incorrectAudioRef = useRef<HTMLAudioElement | null>(null)
  const finishAudioRef = useRef<HTMLAudioElement | null>(null)

  // useEffect(() => {
  //   setFinishA(ShuffleTS(finishAudioSrcList)[0])
  // }, [finishAudioSrcList])





  // Инициализация аудио
  useEffect(() => {
    correctAudioRef.current = new Audio('/correct.wav')
    incorrectAudioRef.current = new Audio('/incorrect.wav')
    finishAudioRef.current = new Audio(finishA)

    return () => {
      if (correctAudioRef.current) {
        correctAudioRef.current.pause()
        correctAudioRef.current = null
      }
      if (incorrectAudioRef.current) {
        incorrectAudioRef.current.pause()
        incorrectAudioRef.current = null
      }
      if (finishAudioRef.current) {
        finishAudioRef.current.pause()
        finishAudioRef.current = null
      }
    }
  }, [finishA])

  // Функции для воспроизведения аудио
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

  const playFinishSound = () => {
    if (finishAudioRef.current) {
      finishAudioRef.current.currentTime = 0
      finishAudioRef.current.play().catch(error => {
        console.error('Ошибка воспроизведения finish аудио:', error)
      })
    }
  }

  // ✅ Воспроизведение финишного аудио при завершении квиза
  useEffect(() => {
    if (quizCompleted) {
      playFinishSound()
    }
  }, [quizCompleted])

  useEffect(() => {
    setRandomStartLottie([...LottieStartList].sort(() => 0.5 - Math.random())[0])
    setRandomStartButton([...startButton].sort(() => 0.5 - Math.random())[0])
  }, [])

  useEffect(() => {
    if (threeHearts == 0) {
      setQuizCompleted(true)
      setThreeHearts(3)
      upsertTrainerLessonProgress(t_lessonId, 0, 0, 0, questions.length)
        .catch(() => toast.error('Что-то пошло не так! Результат не добавлен в базу данных.'))
    }
  }, [threeHearts, t_lessonId, questions.length])

  const handleNumQuestions = (n: number) => {
    if (n == 0) {
      setAllQuestions(questions1.slice(0, Math.round(questions1.length * 0.3)))
    }
    if (n == 1) {
      setAllQuestions(questions1.slice(0, Math.round(questions1.length * 0.6)))
    }
    if (n == 2) {
      setAllQuestions(questions1)
    }
    setNumQuestionsButton(n)
  }

  const t_lessonProgressThisLesson = t_lessonProgress.filter(lessonProgress => lessonProgress.t_lessonId == t_lessonId)
  
  const PTLByMonth = t_lessonProgressThisLesson.map(el => ({
    doneRight: el.doneRight,
    doneWrong: el.doneWrong,
    month: el.dateDone.getMonth(),
    trainingPts: el.trainingPts,
    doneRightPercent: el.doneRightPercent,
  }))

  const uniqueMonths = PTLByMonth.map(item => item.month)
    .filter((value, index, self) => self.indexOf(value) === index)

  const doneRightSumList = uniqueMonths.map(month => (
    PTLByMonth.filter(el => el.month == month).reduce((total, elem) => {
      return total + elem.doneRight
    }, 0)
  ))

  const doneWrongSumList = uniqueMonths.map(month => (
    PTLByMonth.filter(el => el.month == month).reduce((total, elem) => {
      return total + elem.doneWrong
    }, 0)
  ))

  const monthTable = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
  const TrainingProgressMonth = uniqueMonths.map((m, index) => ({
    month: monthTable[m],
    doneRight: doneRightSumList[index],
    doneWrong: doneWrongSumList[index],
  }))

  const totalDR = TrainingProgressMonth.reduce((total, elem) => {
    return total + elem.doneRight
  }, 0)
  const totalDW = TrainingProgressMonth.reduce((total, elem) => {
    return total + elem.doneWrong
  }, 0)
  
  let totalPercentDR = 0
  const totalD = totalDR + totalDW
  if (totalDR > 0) {
    totalPercentDR = totalDR / totalD
  }

  const startQuiz = () => {
    setQuizStarted(true)
    setCurrentQuestionIndex(0)
    setScore(0)
    setQuizCompleted(false)
    setAnsweredQuestions(0)
    setIsRightList(initialState)
    setFinishList([])
  }

  function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  const handleAnswer = async (answer: string) => {
    setAnsweredQuestions(answeredQuestions + 1)

    let answerIsRight = false
    questions[currentQuestionIndex].questionType == 'ASSIST'
      ? answerIsRight = answer === questions[currentQuestionIndex].correctAnswer
      : answerIsRight = answer === "right"

    if (answerIsRight) {
      setIsRightPrevious(true)
      setRandomEmotionLottie([...LottieEmotionRightList].sort(() => 0.5 - Math.random())[0])

      setStreak(prev => {
        const newStreak = prev + 1
        if (newStreak === 3) {
          setEffect(createEffect(newStreak))
        }
        return newStreak
      })

      const body = document.querySelector("body")
      body?.classList.add("trainer-slide-up-transition")
      await sleep(200)

      if (questions[currentQuestionIndex].questionType == 'ASSIST') {
        // ✅ Воспроизводим правильное аудио
        playCorrectSound()
      }

      setFinishList(oldArray => [...oldArray, {
        question: questions[currentQuestionIndex].question,
        answer: answer,
        rightAnswer: questions[currentQuestionIndex].correctAnswer,
        isRight: true,
      }])

      setScore(score + 1)

      let newArr = [...isRightList]
      newArr[currentQuestionIndex] = 1

      if (currentQuestionIndex < questions.length - 1) {
        newArr[currentQuestionIndex + 1] = 3
      }
      
      setIsRightList(newArr)
      
      await sleep(200)
      body?.classList.remove("trainer-slide-up-transition")
    } else {
      // ✅ Воспроизводим неправильное аудио
      playIncorrectSound()
      setStreak(0)
      setThreeHearts(threeHearts - 1)
      setIsRightPrevious(false)
      setRandomEmotionLottie([...LottieEmotionRightList].sort(() => 0.5 - Math.random())[0])

      const body = document.querySelector("body")
      body?.classList.add("trainer-slide-down-transition")
      await sleep(200)

      if (questions[currentQuestionIndex].questionType == 'ASSIST') {
        // AUDIO уже воспроизведен выше
      }

      setFinishList(oldArray => [...oldArray, {
        question: questions[currentQuestionIndex].question,
        answer: answer,
        rightAnswer: questions[currentQuestionIndex].correctAnswer,
        isRight: false,
      }])

      let newArr = [...isRightList]
      newArr[currentQuestionIndex] = 2

      if (currentQuestionIndex < questions.length - 1) {
        newArr[currentQuestionIndex + 1] = 3
      }

      setIsRightList(newArr)

      await sleep(200)
      body?.classList.remove("trainer-slide-down-transition")
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      setQuizCompleted(true)
      let doneRightPercent = Math.round((score + 1) / (questions.length) * 100)
      const trainingPts = 200
      upsertTrainerLessonProgress(t_lessonId, doneRightPercent, trainingPts, score + 1, questions.length - score - 1)
        .catch(() => toast.error('Что-то пошло не так! Результат не добавлен в базу данных.'))
    }
  }

  const handleTimeout = () => {
    setAnsweredQuestions(answeredQuestions + 1)

    let newArr = [...isRightList]
    newArr[currentQuestionIndex] = 2
    if (currentQuestionIndex < questions.length - 1) {
      newArr[currentQuestionIndex + 1] = 3
    }
    setIsRightList(newArr)

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      setQuizCompleted(true)
    }
  }

  const trainingPts = 200

  const handleFinishLesson = () => {
    setQuizCompleted(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        router.push('/trainer')
      })
    })
  }

  if (quizCompleted) {
    const isPerfectScore = score === questions.length
    const numQuestions = finishList.length
    const numQuestionsRight = finishList.filter(el => el.isRight).length
    const message = `✅ ${userName}  ${t_lessonTitle} ${numQuestionsRight - 1} / ${numQuestions - 1}`

    return (
      <>
        <div className="text-center content-center mx-auto">
          <h1 className="text-3xl font-bold mb-6">
            {t_lessonTitle}
          </h1>

          <TgSendMsgCom message={message} />

          <h2 className="text-2xl font-bold mb-4">
            Завершено!
          </h2>
          
          {isPerfectScore && 
            <Confetti width={width} height={height} />
          }
          
          <p className={`text-xl ${isPerfectScore ? "text-green-600 font-bold" : ""}`}>
            Правильно {score} из {questions.length}
          </p>

          <Lottie 
            animationData={score / questions.length < 0.8 ? LottieTrainerSharkFailDNO : LottieTrainerSharkFinalWin} 
            className="h-80 w-80 mx-auto"
          />

          <Button
            onClick={startQuiz}
            className="mt-4"
            variant='primary'
          >
            Давай по новой
          </Button>

          <div>
            <Button 
              className='mt-4'
              variant='primaryOutline'
              onClick={handleFinishLesson}
            >
              Завершить
            </Button>
          </div>

          <div className="pt-8">
            <Separator />
          </div>

          <FinishTrainerStat 
            finishList={finishList}   
          />
        </div>
      </>
    )
  }

  return (
    <>
      <WinStreakModal
        effect={effect}
        onClose={() => setEffect(null)}
      />

      <div className="w-full max-w-xl mx-auto text-center">
        <TrainerQuestion
          questions={questions}
          question={questions[currentQuestionIndex]} 
          onAnswer={handleAnswer} 
          onTimeout={handleTimeout} 
          isRightList={isRightList}
          isRightPrevious={isRightPrevious}
          randomEmotionLottie={randomEmotionLottie}
          setThreeHearts={setThreeHearts}
          threeHearts={threeHearts}
        />

        <div className="mt-5 mx-auto w-[200px]">
          {threeHearts == 3 ? (
            <div className="justify-center gap-x-1 flex">
              <Image src='/heartYes.svg' height={22} width={22} alt='Hearts' />
              <Image src='/heartYes.svg' height={22} width={22} alt='Hearts' />
              <Image src='/heartYes.svg' height={22} width={22} alt='Hearts' />
            </div>
          ) : threeHearts == 2 ? (
            <div className="justify-center gap-x-1 flex">
              <Image src='/heartYes.svg' height={22} width={22} alt='Hearts' />
              <Image src='/heartYes.svg' height={22} width={22} alt='Hearts' />
              <Image src='/heartNo.svg' height={22} width={22} alt='Hearts' />
            </div>
          ) : (
            <div className="justify-center gap-x-1 flex">
              <Image src='/heartYes.svg' height={22} width={22} alt='Hearts' />
              <Image src='/heartNo.svg' height={22} width={22} alt='Hearts' />
              <Image src='/heartNo.svg' height={22} width={22} alt='Hearts' />
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <Button 
            variant='dangerOutline'
            className="gap-2"
            onClick={() => window.location.href = `/t-lesson/${t_lessonId}`}
          >
            <X size='18' />
            завершить
          </Button>
        </div>
      </div>
    </>
  )
}









// "use client"

// import React, { useEffect, useMemo, useState, useTransition } from "react"
// import Confetti from "react-confetti"
// import { useAudio, useWindowSize } from "react-use"
// import TrainerQuestion from "../../../components/trainer-question"
// import { t_challenges, t_lessonProgress } from "@/db/schema"
// import { Button } from "../../../components/ui/button"
// import Lottie from "lottie-react"
// import { Avatar, AvatarImage } from "../../../components/ui/avatar";

// import LottieTrainerSharkFailDNO from '@/public/Lottie/trainer/LottieTrainerSharkFailDNO.json'
// import LottieTrainerSharkStart from '@/public/Lottie/trainer/LottieTrainerSharkStart.json'
// import LottieTrainerSharkStartUdachi from '@/public/Lottie/trainer/LottieTrainerSharkStartUdachi.json'
// import LottieStartMorning from '@/public/Lottie/trainer/LottieStartMorning.json'
// import LottieStartPrivet from '@/public/Lottie/trainer/LottieStartPrivet.json'
// import LottieStartYesCapitan from '@/public/Lottie/trainer/LottieStartYesCapitan.json'
// import LottieTrainerSharkFinalWin from '@/public/Lottie/trainer/LottieTrainerSharkFinalWin.json'
// import LottieTrainerSharkThinkin from '@/public/Lottie/trainer/LottieTrainerSharkThinkin.json'
// import LottieTrainerSharkFailCry from '@/public/Lottie/trainer/LottieTrainerSharkFailCry.json'
// import LottieStartDots from '@/public/Lottie/trainer/LottieStartDots.json'
// import LottieTrainerSharkFinalNoo from '@/public/Lottie/trainer/LottieTrainerSharkFinalNoo.json'
// import LottieTrainerSharkFasterPistol from '@/public/Lottie/trainer/LottieTrainerSharkFasterPistol.json'
// import LottieTrainerSharkFinalWinClap from '@/public/Lottie/trainer/LottieTrainerSharkFinalWinClap.json'

// import WinStreakModal from "../../../components/win-streak-modal"
// import { toast } from "sonner"
// import { upsertTrainerLessonProgress } from "@/actions/user-progress"
// import { ArrowLeft, Badge, BadgeAlert, BadgeCheck, Check, TrendingDown, TrendingUp, X, Baby, Crown, Pizza, Zap, Trophy, Heart } from "lucide-react"
// import { ShuffleTS } from "@/usefulFunctions"
// import { ChartComponent } from "../../../components/chart-comp"
// import { cn } from "@/lib/utils"
// import { Separator } from "../../../components/ui/separator"
// import { FinishTrainerStat } from "../../../components/finish-trainer-stat"
// import { TgSendMsgCom } from "../../../components/tg-send-msg-com"
// import { QuestionType } from "@/app/t-lesson/[t_lessonId]/page"
// import Image from "next/image"
// import { createEffect, StreakEffect } from "@/lib/streakEffects"
// import { useRouter } from 'next/navigation'

// const LottieStartList = [
//   LottieTrainerSharkStart, 
//   LottieTrainerSharkStartUdachi,
//   LottieStartMorning,
//   LottieStartPrivet,
//   LottieStartYesCapitan,
// ]

// const LottieEmotionRightList = [
//   LottieStartDots, 
//   LottieTrainerSharkThinkin,
//   LottieTrainerSharkFinalWinClap,
// ]

// const LottieEmotionWrongList = [
//   LottieTrainerSharkFailCry, 
//   LottieTrainerSharkFinalNoo,
//   LottieTrainerSharkFasterPistol,
// ]

// const startButton = [
//   'Погнали!',
//   'Гоу!',
//   'Старт!',
//   'Поехали!',
//   'Поплыли!',
// ]

// type Props = {
//   t_lessonId: number,
//   t_lessonTitle: string,
//   t_lesson: typeof t_challenges.$inferSelect[]
//   t_lessonProgress: typeof t_lessonProgress.$inferSelect[],
//   questions1: QuestionType[],
//   usersStat: {
//     DR_DRP: number;
//     user_id: string | undefined;
//     user_name: string | undefined;
//     user_imgSrc: string | undefined;
//   }[],
//   finishAudioSrc: string,
//   userId: string,
//   userName: string,
// }

// export default function TQuiz({
//   t_lessonId,
//   t_lessonTitle, 
//   t_lesson,
//   t_lessonProgress,
//   questions1,
//   usersStat,
//   finishAudioSrc,
//   userId,
//   userName,
// }: Props) {
//   const router = useRouter()
  
//   const [streak, setStreak] = useState(0)
//   const [effect, setEffect] = useState<StreakEffect | null>(null)
//   const [randomStartLottie, setRandomStartLottie] = useState(LottieStartList[0])
//   const [randomStartButton, setRandomStartButton] = useState(startButton[0])
//   const [randomEmotionLottie, setRandomEmotionLottie] = useState(LottieEmotionRightList[0])
//   const [threeHearts, setThreeHearts] = useState(3)
//   const [quizStarted, setQuizStarted] = useState(true)
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
//   const [score, setScore] = useState(0)
//   const [quizCompleted, setQuizCompleted] = useState(false)
//   const [answeredQuestions, setAnsweredQuestions] = useState(0)
//   const { width, height } = useWindowSize()
  
//   const [allQuestions, setAllQuestions] = useState(questions1.slice(0, Math.round(questions1.length * 0.3)))
//   const [numQuestionsButton, setNumQuestionsButton] = useState(0)
  
//   const [isRightPrevious, setIsRightPrevious] = useState(true)
//   const questions = allQuestions
  
//   const initialState: number[] = questions.map((el, index) => index == 0 ? 3 : 0)
//   const [isRightList, setIsRightList] = useState(initialState)
//   const [finishList, setFinishList] = useState([{
//     question: '',
//     answer: '',
//     rightAnswer: '',
//     isRight: true,
//   }])

//   let finishAudioSrcList = [
//     '/MemesAudio/meme-right-chetko.WAV',
//     '/MemesAudio/meme-right-chinazes.WAV',
//     '/MemesAudio/meme-right-umeetemogete.WAV',
//     '/MemesAudio/meme-right-clapping.WAV',
//     '/MemesAudio/meme-right-gtapassed.WAV',
//     '/MemesAudio/meme-right-nice.WAV',
//     '/MemesAudio/meme-right-papichlegkaya.WAV',
//   ]

//   const [finishA, setFinishA] = useState(finishAudioSrcList[0])

//   useEffect(() => {
//     setFinishA(ShuffleTS(finishAudioSrcList)[0])
//   }, [])

//   // ✅ ИСПРАВЛЕНО: Правильное использование useAudio
//   const [audioCorrect, , controlsCorrect] = useAudio({ src: '/correct.wav', autoPlay: false })
//   const [audioInCorrect, , controlsInCorrect] = useAudio({ src: '/incorrect.wav', autoPlay: false })
//   const [finishAudioElement, , finishAudioControls] = useAudio({ src: finishA, autoPlay: false })

//   // ✅ Воспроизведение финишного аудио при завершении квиза
//   useEffect(() => {
//     if (quizCompleted) {
//       finishAudioControls.play()
//     }
//   }, [quizCompleted, finishAudioControls])

//   useEffect(() => {
//     setRandomStartLottie([...LottieStartList].sort(() => 0.5 - Math.random())[0])
//     setRandomStartButton([...startButton].sort(() => 0.5 - Math.random())[0])
//   }, [])

//   useEffect(() => {
//     if (threeHearts == 0) {
//       setQuizCompleted(true)
//       setThreeHearts(3)
//       upsertTrainerLessonProgress(t_lessonId, 0, 0, 0, questions.length)
//         .catch(() => toast.error('Что-то пошло не так! Результат не добавлен в базу данных.'))
//     }
//   }, [threeHearts, t_lessonId, questions.length])

//   const handleNumQuestions = (n: number) => {
//     if (n == 0) {
//       setAllQuestions(questions1.slice(0, Math.round(questions1.length * 0.3)))
//     }
//     if (n == 1) {
//       setAllQuestions(questions1.slice(0, Math.round(questions1.length * 0.6)))
//     }
//     if (n == 2) {
//       setAllQuestions(questions1)
//     }
//     setNumQuestionsButton(n)
//   }

//   const t_lessonProgressThisLesson = t_lessonProgress.filter(lessonProgress => lessonProgress.t_lessonId == t_lessonId)
  
//   const PTLByMonth = t_lessonProgressThisLesson.map(el => ({
//     doneRight: el.doneRight,
//     doneWrong: el.doneWrong,
//     month: el.dateDone.getMonth(),
//     trainingPts: el.trainingPts,
//     doneRightPercent: el.doneRightPercent,
//   }))

//   const uniqueMonths = PTLByMonth.map(item => item.month)
//     .filter((value, index, self) => self.indexOf(value) === index)

//   const doneRightSumList = uniqueMonths.map(month => (
//     PTLByMonth.filter(el => el.month == month).reduce((total, elem) => {
//       return total + elem.doneRight
//     }, 0)
//   ))

//   const doneWrongSumList = uniqueMonths.map(month => (
//     PTLByMonth.filter(el => el.month == month).reduce((total, elem) => {
//       return total + elem.doneWrong
//     }, 0)
//   ))

//   const monthTable = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
//   const TrainingProgressMonth = uniqueMonths.map((m, index) => ({
//     month: monthTable[m],
//     doneRight: doneRightSumList[index],
//     doneWrong: doneWrongSumList[index],
//   }))

//   const totalDR = TrainingProgressMonth.reduce((total, elem) => {
//     return total + elem.doneRight
//   }, 0)
//   const totalDW = TrainingProgressMonth.reduce((total, elem) => {
//     return total + elem.doneWrong
//   }, 0)
  
//   let totalPercentDR = 0
//   const totalD = totalDR + totalDW
//   if (totalDR > 0) {
//     totalPercentDR = totalDR / totalD
//   }

//   const startQuiz = () => {
//     setQuizStarted(true)
//     setCurrentQuestionIndex(0)
//     setScore(0)
//     setQuizCompleted(false)
//     setAnsweredQuestions(0)
//     setIsRightList(initialState)
//     setFinishList([])
//   }

//   function sleep(ms: number): Promise<void> {
//     return new Promise((resolve) => setTimeout(resolve, ms))
//   }

//   const handleAnswer = async (answer: string) => {
//     setAnsweredQuestions(answeredQuestions + 1)

//     let answerIsRight = false
//     questions[currentQuestionIndex].questionType == 'ASSIST'
//       ? answerIsRight = answer === questions[currentQuestionIndex].correctAnswer
//       : answerIsRight = answer === "right"

//     if (answerIsRight) {
//       setIsRightPrevious(true)
//       setRandomEmotionLottie([...LottieEmotionRightList].sort(() => 0.5 - Math.random())[0])

//       setStreak(prev => {
//         const newStreak = prev + 1
//         if (newStreak === 3) {
//           setEffect(createEffect(newStreak))
//         }
//         return newStreak
//       })

//       const body = document.querySelector("body")
//       body?.classList.add("trainer-slide-up-transition")
//       await sleep(200)

//       if (questions[currentQuestionIndex].questionType == 'ASSIST') {
//         // ✅ Воспроизводим правильное аудио
//         controlsCorrect.play()
//       }

//       setFinishList(oldArray => [...oldArray, {
//         question: questions[currentQuestionIndex].question,
//         answer: answer,
//         rightAnswer: questions[currentQuestionIndex].correctAnswer,
//         isRight: true,
//       }])

//       setScore(score + 1)

//       let newArr = [...isRightList]
//       newArr[currentQuestionIndex] = 1

//       if (currentQuestionIndex < questions.length - 1) {
//         newArr[currentQuestionIndex + 1] = 3
//       }
      
//       setIsRightList(newArr)
      
//       await sleep(200)
//       body?.classList.remove("trainer-slide-up-transition")
//     } else {
//       // ✅ Воспроизводим неправильное аудио
//       controlsInCorrect.play()
//       setStreak(0)
//       setThreeHearts(threeHearts - 1)
//       setIsRightPrevious(false)
//       setRandomEmotionLottie([...LottieEmotionRightList].sort(() => 0.5 - Math.random())[0])

//       const body = document.querySelector("body")
//       body?.classList.add("trainer-slide-down-transition")
//       await sleep(200)

//       if (questions[currentQuestionIndex].questionType == 'ASSIST') {
//         // AUDIO уже воспроизведен выше
//       }

//       setFinishList(oldArray => [...oldArray, {
//         question: questions[currentQuestionIndex].question,
//         answer: answer,
//         rightAnswer: questions[currentQuestionIndex].correctAnswer,
//         isRight: false,
//       }])

//       let newArr = [...isRightList]
//       newArr[currentQuestionIndex] = 2

//       if (currentQuestionIndex < questions.length - 1) {
//         newArr[currentQuestionIndex + 1] = 3
//       }

//       setIsRightList(newArr)

//       await sleep(200)
//       body?.classList.remove("trainer-slide-down-transition")
//     }

//     if (currentQuestionIndex < questions.length - 1) {
//       setCurrentQuestionIndex(currentQuestionIndex + 1)
//     } else {
//       setQuizCompleted(true)
//       let doneRightPercent = Math.round((score + 1) / (questions.length) * 100)
//       const trainingPts = 200
//       upsertTrainerLessonProgress(t_lessonId, doneRightPercent, trainingPts, score + 1, questions.length - score - 1)
//         .catch(() => toast.error('Что-то пошло не так! Результат не добавлен в базу данных.'))
//     }
//   }

//   const handleTimeout = () => {
//     setAnsweredQuestions(answeredQuestions + 1)

//     let newArr = [...isRightList]
//     newArr[currentQuestionIndex] = 2
//     if (currentQuestionIndex < questions.length - 1) {
//       newArr[currentQuestionIndex + 1] = 3
//     }
//     setIsRightList(newArr)

//     if (currentQuestionIndex < questions.length - 1) {
//       setCurrentQuestionIndex(currentQuestionIndex + 1)
//     } else {
//       setQuizCompleted(true)
//     }
//   }

//   const trainingPts = 200

//   const handleFinishLesson = () => {
//     setQuizCompleted(true)
//     requestAnimationFrame(() => {
//       requestAnimationFrame(() => {
//         router.push('/trainer')
//       })
//     })
//   }

//   if (quizCompleted) {
//     const isPerfectScore = score === questions.length
//     const numQuestions = finishList.length
//     const numQuestionsRight = finishList.filter(el => el.isRight).length
//     const message = `✅ ${userName}  ${t_lessonTitle} ${numQuestionsRight - 1} / ${numQuestions - 1}`

//     return (
//       <>
//         {finishAudioElement}
//         <div className="text-center content-center mx-auto">
//           <h1 className="text-3xl font-bold mb-6">
//             {t_lessonTitle}
//           </h1>

//           <TgSendMsgCom message={message} />

//           <h2 className="text-2xl font-bold mb-4">
//             Завершено!
//           </h2>
          
//           {isPerfectScore && 
//             <Confetti width={width} height={height} />
//           }
          
//           <p className={`text-xl ${isPerfectScore ? "text-green-600 font-bold" : ""}`}>
//             Правильно {score} из {questions.length}
//           </p>

//           <Lottie 
//             animationData={score / questions.length < 0.8 ? LottieTrainerSharkFailDNO : LottieTrainerSharkFinalWin} 
//             className="h-80 w-80 mx-auto"
//           />

//           <Button
//             onClick={startQuiz}
//             className="mt-4"
//             variant='primary'
//           >
//             Давай по новой
//           </Button>

//           <div>
//             <Button 
//               className='mt-4'
//               variant='primaryOutline'
//               onClick={handleFinishLesson}
//             >
//               Завершить
//             </Button>
//           </div>

//           <div className="pt-8">
//             <Separator />
//           </div>

//           <FinishTrainerStat 
//             finishList={finishList}   
//           />
//         </div>
//       </>
//     )
//   }

//   return (
//     <>
//       {audioCorrect}
//       {audioInCorrect}

//       <WinStreakModal
//         effect={effect}
//         onClose={() => setEffect(null)}
//       />

//       <div className="w-full max-w-xl mx-auto text-center">
//         <TrainerQuestion
//           questions={questions}
//           question={questions[currentQuestionIndex]} 
//           onAnswer={handleAnswer} 
//           onTimeout={handleTimeout} 
//           isRightList={isRightList}
//           isRightPrevious={isRightPrevious}
//           randomEmotionLottie={randomEmotionLottie}
//           setThreeHearts={setThreeHearts}
//           threeHearts={threeHearts}
//         />

//         <div className="mt-5 mx-auto w-[200px]">
//           {threeHearts == 3 ? (
//             <div className="justify-center gap-x-1 flex">
//               <Image src='/heartYes.svg' height={22} width={22} alt='Hearts' />
//               <Image src='/heartYes.svg' height={22} width={22} alt='Hearts' />
//               <Image src='/heartYes.svg' height={22} width={22} alt='Hearts' />
//             </div>
//           ) : threeHearts == 2 ? (
//             <div className="justify-center gap-x-1 flex">
//               <Image src='/heartYes.svg' height={22} width={22} alt='Hearts' />
//               <Image src='/heartYes.svg' height={22} width={22} alt='Hearts' />
//               <Image src='/heartNo.svg' height={22} width={22} alt='Hearts' />
//             </div>
//           ) : (
//             <div className="justify-center gap-x-1 flex">
//               <Image src='/heartYes.svg' height={22} width={22} alt='Hearts' />
//               <Image src='/heartNo.svg' height={22} width={22} alt='Hearts' />
//               <Image src='/heartNo.svg' height={22} width={22} alt='Hearts' />
//             </div>
//           )}
//         </div>

//         <div className="mt-4 text-center">
//           <Button 
//             variant='dangerOutline'
//             className="gap-2"
//             onClick={() => window.location.href = `/t-lesson/${t_lessonId}`}
//           >
//             <X size='18' />
//             завершить
//           </Button>
//         </div>
//       </div>
//     </>
//   )
// }



// "use client"

// import React, { useEffect, useMemo, useState, useTransition } from "react"
// import Confetti from "react-confetti"
// import { useAudio, useWindowSize } from "react-use"
// import TrainerQuestion from "../../../components/trainer-question"
// import { t_challenges, t_lessonProgress } from "@/db/schema"
// import { Button } from "../../../components/ui/button"
// import Lottie from "lottie-react"
// import { Avatar, AvatarImage } from "../../../components/ui/avatar";

// // import WinStreakModal from 


// import LottieTrainerSharkFailDNO from '@/public/Lottie/trainer/LottieTrainerSharkFailDNO.json'

// import LottieTrainerSharkStart from '@/public/Lottie/trainer/LottieTrainerSharkStart.json'
// import LottieTrainerSharkStartUdachi from '@/public/Lottie/trainer/LottieTrainerSharkStartUdachi.json'
// // import LottieStartDots from '@/public/Lottie/trainer/LottieStartDots.json'
// import LottieStartMorning from '@/public/Lottie/trainer/LottieStartMorning.json'
// import LottieStartPrivet from '@/public/Lottie/trainer/LottieStartPrivet.json'
// import LottieStartYesCapitan from '@/public/Lottie/trainer/LottieStartYesCapitan.json'
// import LottieTrainerSharkFinalWin from '@/public/Lottie/trainer/LottieTrainerSharkFinalWin.json'


// import LottieTrainerSharkThinkin from '@/public/Lottie/trainer/LottieTrainerSharkThinkin.json'
// import LottieTrainerSharkFailCry from '@/public/Lottie/trainer/LottieTrainerSharkFailCry.json'
// import LottieStartDots from '@/public/Lottie/trainer/LottieStartDots.json'
// import LottieTrainerSharkFinalNoo from '@/public/Lottie/trainer/LottieTrainerSharkFinalNoo.json'
// import LottieTrainerSharkFasterPistol from '@/public/Lottie/trainer/LottieTrainerSharkFasterPistol.json'
// import LottieTrainerSharkFinalWinClap from '@/public/Lottie/trainer/LottieTrainerSharkFinalWinClap.json'




// import WinStreakModal from "../../../components/win-streak-modal"

// // "../../../components/win-streak-modal"' has no exported member 'WinStreakModal'. Did you mean to use 
// // 'import WinStreakModal from "../../../components/win-streak-modal"' instead?


// import { toast } from "sonner"
// import { upsertTrainerLessonProgress } from "@/actions/user-progress"
// import { ArrowLeft, Badge, BadgeAlert, BadgeCheck, Check, TrendingDown, TrendingUp, X, Baby, Crown, Pizza, Zap, Trophy, Heart } from "lucide-react"
// import { ShuffleTS } from "@/usefulFunctions"
// import { ChartComponent } from "../../../components/chart-comp"
// import { cn } from "@/lib/utils"
// import { Separator } from "../../../components/ui/separator"
// import { FinishTrainerStat } from "../../../components/finish-trainer-stat"
// import { TgSendMsgCom } from "../../../components/tg-send-msg-com"
// import { QuestionType } from "@/app/t-lesson/[t_lessonId]/page"
// import Image from "next/image"



// import { createEffect, StreakEffect } from "@/lib/streakEffects"
// // import { StreakEffect } from "@/lib/streakEffects"



// import { useRouter } from 'next/navigation'














// // Акулка ПРИВЕТСТВУЕТ на втором экране

// const LottieStartList = [
//   LottieTrainerSharkStart, 
//   LottieTrainerSharkStartUdachi,
//   // LottieStartDots,
//   LottieStartMorning,
//   LottieStartPrivet,
//   LottieStartYesCapitan,
// ]



// const LottieEmotionRightList = [
//   LottieStartDots, 
//   LottieTrainerSharkThinkin,
//   LottieTrainerSharkFinalWinClap,

// ]

// const LottieEmotionWrongList = [
//   LottieTrainerSharkFailCry, 
//   LottieTrainerSharkFinalNoo,
//   LottieTrainerSharkFasterPistol,

// ]

// const startButton = [
//   'Погнали!',
//   'Гоу!',
//   'Старт!',
//   'Поехали!',
//   'Поплыли!',
// ]


// type Props = {
//   t_lessonId: number,
//   t_lessonTitle: string,
  
//   t_lesson: typeof t_challenges.$inferSelect[]
//   t_lessonProgress: typeof t_lessonProgress.$inferSelect[],

//   questions1: QuestionType[],

//   usersStat: {
//     DR_DRP: number;
//     user_id: string | undefined;
//     user_name: string | undefined;
//     user_imgSrc: string | undefined;
//   }[],
//   finishAudioSrc: string,
//   userId: string,
//   userName: string,
// }


// export default function TQuiz(
//   {
//     t_lessonId,
//     t_lessonTitle, 
//     t_lesson,
//     t_lessonProgress,

//     questions1,
//     usersStat,
//     finishAudioSrc,
//     userId,
//     userName,

//   } : Props) {




//     const router = useRouter()
    
    


//   const [streak, setStreak] = useState(0)
//   const [effect, setEffect] = useState<StreakEffect | null>(null)



//   const [randomStartLottie, setRandomStartLottie] = useState(LottieStartList[0])
//   const [randomStartButton, setRandomStartButton] = useState(startButton[0])
  
//   const [randomEmotionLottie, setRandomEmotionLottie] = useState(LottieEmotionRightList[0])

//   useEffect(()=>{
//     setRandomStartLottie([...LottieStartList].sort(() => 0.5 - Math.random())[0])
//     setRandomStartButton([...startButton].sort(() => 0.5 - Math.random())[0])
//   }, [])





  

//   // Проверяем СЕРДЕЧИ
//   // ЕСЛИ < 3 то заканчиваем КВИЗ, отправляем в БАЗУ
//   //
//   const [threeHearts, setThreeHearts] = useState(3)

//   useEffect(() => {
//     if (threeHearts == 0)
//       {
//         setQuizCompleted(true)
//         setThreeHearts(3)
//         upsertTrainerLessonProgress(t_lessonId, 0, 0, 0, questions.length)
//         .catch(()=>toast.error('Что-то пошло не так! Результат не добавлен в базу данных.'))
    
//       }
    
//   },[threeHearts])
  

//   // const [pending, startTransition] = useTransition()

//   // ЧТОБЫ УБРАТЬ НУЛЕвоЙ ЭКРан const [quizStarted, setQuizStarted] = useState(false)
//   const [quizStarted, setQuizStarted] = useState(true)

//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
//   const [score, setScore] = useState(0)
//   const [quizCompleted, setQuizCompleted] = useState(false)
//   const [answeredQuestions, setAnsweredQuestions] = useState(0)
//   const { width, height } = useWindowSize()


  
//   // Берем ТОЛЬКО первые 30% ВОПРОСОВ
//   //
//   const [allQuestions, setAllQuestions] = useState(questions1.slice(0, Math.round(questions1.length*0.3)))
//   const [numQuestionsButton, setNumQuestionsButton] = useState(0)
  
//   //
//   // Выбор сколько задач выдать в Lesson'e
//   //
//   const handleNumQuestions = (n: number) => {

//     if (n == 0) {
//       setAllQuestions(questions1.slice(0, Math.round(questions1.length*0.3)))
//     }
//     if (n == 1) {
//       setAllQuestions(questions1.slice(0, Math.round(questions1.length*0.6)))
//     }
//     if (n == 2) {
//       setAllQuestions(questions1)
//     }


//     setNumQuestionsButton(n) 

//   }






//   let finishAudioSrcList = [

//     '/MemesAudio/meme-right-chetko.WAV',
//     '/MemesAudio/meme-right-chinazes.WAV',
//     '/MemesAudio/meme-right-umeetemogete.WAV',

//     '/MemesAudio/meme-right-clapping.WAV',
//     '/MemesAudio/meme-right-gtapassed.WAV',
//     '/MemesAudio/meme-right-nice.WAV',
//     '/MemesAudio/meme-right-papichlegkaya.WAV',
    
//     // '/MemesAudio/meme-right-estestvenno.WAV',
    
//     // '/MemesAudio/meme-wrong-etofiaskobratan.WAV',
//     // '/MemesAudio/meme-wrong-kid.WAV',
//     // '/MemesAudio/meme-wrong-pacankuspehy.WAV',
//     // '/MemesAudio/meme-wrong-polnomochia.WAV',
//     // '/MemesAudio/meme-wrong-ponovoy.WAV',
//     // '/MemesAudio/meme-wrong-sharish.WAV',
//     // '/MemesAudio/meme-wrong-shirokuiu.WAV',
//     // '/MemesAudio/meme-wrong-shokoladnevinovat.WAV',
//     // '/MemesAudio/meme-wrong-skolko.WAV',
//     // '/MemesAudio/meme-wrong-tipereputal.WAV',
//     // '/MemesAudio/meme-wrong-tivtiraesh.WA',

//   ]



//   // финальный АУДИО
//   const [finishA, setFinishA] = useState(finishAudioSrcList[0])

  
//   useEffect(()=>{
//     setFinishA(ShuffleTS(finishAudioSrcList)[0])
//   },[])



 



//   // AUDIO
//   const [audioCorrect, _, controlsCorrect] = useAudio({src: '/correct.wav'})
//   const [audioInCorrect, _c, controlsInCorrect] = useAudio({src: '/incorrect.wav'})


//   const [finishAudio] = useAudio({src: finishA, autoPlay: true})







//   // смотрим ПРОГРЕСС ЭТОГО Т-лессона
//   //
//   const t_lessonProgressThisLesson =  t_lessonProgress.filter(lessonProgress => lessonProgress.t_lessonId == t_lessonId)
  

//   const PTLByMonth = t_lessonProgressThisLesson.map(el => (
//     {
//       doneRight: el.doneRight,
//       doneWrong: el.doneWrong,
//       month: el.dateDone.getMonth(),
//       trainingPts: el.trainingPts,
//       doneRightPercent: el.doneRightPercent,
//     }
//   ))


//   const uniqueMonths = PTLByMonth.map(item => item.month)
//   .filter((value, index, self) => self.indexOf(value) === index)


//   const doneRightSumList = uniqueMonths.map(month => (
//     PTLByMonth.filter(el => el.month == month).reduce((total, elem) => {
//       return (
//         total + elem.doneRight
//       )
//     }, 0)
//   ))

//   const doneWrongSumList = uniqueMonths.map(month => (
//     PTLByMonth.filter(el => el.month == month).reduce((total, elem) => {
//       return (
//         total + elem.doneWrong
//       )
//     }, 0)
//   ))

//   const monthTable = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрб', 'Ноябрь', 'Декарбрь']
//   const TrainingProgressMonth = uniqueMonths.map((m, index) => ({
//     month: monthTable[m],
//     doneRight: doneRightSumList[index],
//     doneWrong: doneWrongSumList[index],
//   }))

//   const totalDR = TrainingProgressMonth.reduce((total, elem) => {
//   return (
//     total + elem.doneRight
//   )}, 0)
//   const totalDW = TrainingProgressMonth.reduce((total, elem) => {
//     return (
//       total + elem.doneWrong
//     )}, 0)
  
//   let totalPercentDR = 0
//   const totalD = totalDR+totalDW
//   if (totalDR > 0) {
//     totalPercentDR = totalDR/(totalD)
//   }
  









//   const [isRightPrevious, setIsRightPrevious] = useState(true)





//   const questions = allQuestions
  

//   const initialState:number[] = questions.map((el, index) => index == 0 ? 3 : 0)
  
//   const [isRightList, setIsRightList] = useState(initialState)
  
//   const [finishList, setFinishList] = useState([{
//     question: '',
//     answer: '',
//     rightAnswer: '',
//     isRight: true,
//   }])




  




//   const startQuiz = () => {
//     setQuizStarted(true)
//     setCurrentQuestionIndex(0)
//     setScore(0)
//     setQuizCompleted(false)
//     setAnsweredQuestions(0)
//     setIsRightList(initialState)

//     setFinishList([])

//   }



//   function sleep(ms: number): Promise<void> {
//     return new Promise((resolve) => setTimeout(resolve, ms))
//   }














//   // TODO:    HANDLE ANSWER HANDLE ANSWER HANDLE ANSWER HANDLE ANSWER HANDLE ANSWER HANDLE ANSWER 

//   const handleAnswer = async (answer: string) => {
    
//     setAnsweredQuestions(answeredQuestions + 1)
//     // сдвигаем вопрос на + 1



//     let answerIsRight = false
//     questions[currentQuestionIndex].questionType == 'ASSIST'
//     ?
//     answerIsRight = answer === questions[currentQuestionIndex].correctAnswer
//     :
//     answerIsRight = answer === "right"




    
//     if (answerIsRight) {

//       setIsRightPrevious(true)
//       setRandomEmotionLottie([...LottieEmotionRightList].sort(() => 0.5 - Math.random())[0])



//       setStreak(prev => {

//         const newStreak = prev + 1
        
//         if(newStreak === 3){
//           setEffect(createEffect(newStreak))
//         }

   
//         return newStreak
//       })











//       // TODO: ANIMATION GREEN    Анимация Зеленым фоном вверх при правильном ответе
//       //
//       const body = document.querySelector("body")
//       body?.classList.add("trainer-slide-up-transition")

//       await sleep(200)
    
    










//       // РЕШЕНО ПРАВИЛЬНО  1
//       //
//       if (questions[currentQuestionIndex].questionType == 'ASSIST') {
//         // AUDIO
//         controlsCorrect.play()
//       }
//       // controlsCorrect.play()

//       setFinishList(oldArray => [...oldArray, {
//         question: questions[currentQuestionIndex].question,
//         answer: answer,
//         rightAnswer: questions[currentQuestionIndex].correctAnswer,
//         isRight: true,
//       }])


//       // TODO:  scorescore возможно тут добавляется лишний праивльный ответ
//       // TODO: 

//       setScore(score + 1)

//       let newArr = [...isRightList]
//       newArr[currentQuestionIndex] = 1


//       if (currentQuestionIndex < questions.length - 1){
//         newArr[currentQuestionIndex+1] = 3
//       }
      
      
//       setIsRightList(newArr)



      
      
//       // EXIT ANIMATION
      
//       await sleep(200)
//       body?.classList.remove ("trainer-slide-up-transition")




//     } else 
    
//     {
//       // РЕШЕНО НЕПРАВИЛЬНО  2

//       controlsInCorrect.play()
//       // обнуляем СТРИК
//       //
//       setStreak(0)


//       // Отнимаем сердечко
//       //
//       setThreeHearts(threeHearts - 1)



//       setIsRightPrevious(false)
//       // setRandomEmotionLottie([...LottieEmotionWrongList].sort(() => 0.5 - Math.random())[0])
//       setRandomEmotionLottie([...LottieEmotionRightList].sort(() => 0.5 - Math.random())[0])









//       // TODO: ANIMATION RED Анимация Красным фоном вниз при НЕправильном ответе
//       //
//       const body = document.querySelector("body")
//       body?.classList.add("trainer-slide-down-transition")
//       await sleep(200)








//       if (questions[currentQuestionIndex].questionType == 'ASSIST') {
//         // AUDIO
//         // controlsInCorrect.play()
//       }
//       // controlsInCorrect.play()

//       setFinishList(oldArray => [...oldArray, {
//         question: questions[currentQuestionIndex].question,
//         answer: answer,
//         rightAnswer: questions[currentQuestionIndex].correctAnswer,
//         isRight: false,
//       }])

//       let newArr = [...isRightList]
//       newArr[currentQuestionIndex] = 2


//       if (currentQuestionIndex < questions.length - 1){
//         newArr[currentQuestionIndex+1] = 3
//       }

//       setIsRightList(newArr)



//       // EXIT ANIMATION

//       await sleep(200)
//       body?.classList.remove ("trainer-slide-down-transition")
    
//     }



    











//     if (currentQuestionIndex < questions.length - 1) {

//       // Переходим к СЛЕДУЩЕМУ вопросу
//       //
//       setCurrentQuestionIndex(currentQuestionIndex + 1)
      

//     } else {


//       // вопросы ЗАКОНЧИЛИСЬ.   обновляем БД
      
//       setQuizCompleted(true)

//       let doneRightPercent =  Math.round( (score + 1) / ( questions.length ) * 100 )

//       upsertTrainerLessonProgress(t_lessonId, doneRightPercent, trainingPts, score + 1, questions.length - score - 1)
//       .catch(()=>toast.error('Что-то пошло не так! Результат не добавлен в базу данных.'))
  
//     }
//   }

//   const handleTimeout = () => {
//     // AUDIO
//     // controlsInCorrect.play()
//     setAnsweredQuestions(answeredQuestions + 1)


//     let newArr = [...isRightList]
//     newArr[currentQuestionIndex] = 2
//     if (currentQuestionIndex < questions.length - 1){
//       newArr[currentQuestionIndex+1] = 3
//     }
//     setIsRightList(newArr)


//     if (currentQuestionIndex < questions.length - 1) {
//       setCurrentQuestionIndex(currentQuestionIndex + 1)
//     } else {
//       setQuizCompleted(true)


//       // TODO: (если на последний вопрос не дал ответа) 
//       // upsert БД но ОДИН раз (почему-то делает 2 раза)


//     }
//   }











// // TODO: тут был ПЕРВЫЙ экран










//   // let doneRightPercent = 100
//   const trainingPts = 200




//   const handleFinishLesson = () => {
//     // setCompleted(true);
//     setQuizCompleted(true)


//     // сам добавил чтобы убрать нулевой экран (может и не надо)
//     // setQuizStarted(false)

//     requestAnimationFrame(() => {
//       requestAnimationFrame(() => {
//         // window.location.href = `/t-lesson/${t_lessonId}`;
//         // window.location.href = `/trainer`;
//         router.push('/trainer')
//       });
//     });
//     // window.location.href = `/t-lesson/${t_lessonId}`
//   };

  



//   // TODO:  Завершили 

//   if (quizCompleted) {

//     const isPerfectScore = score === questions.length

    
  
//     const numQuestions = finishList.length
//     const numQuestionsRight = finishList.filter(el => el.isRight).length
//     const message = `✅ ${userName}  ${t_lessonTitle} ${numQuestionsRight-1} / ${numQuestions-1}`

   


//     return (
//       <>
//       {/* // AUDIO */}
//       {finishAudio}


//       <div className="text-center content-center mx-auto">

//         <h1 className="text-3xl font-bold mb-6">
//           {t_lessonTitle}
//         </h1>


//         <TgSendMsgCom message={message} />




//         <h2 className="text-2xl font-bold mb-4">
//           Завершено!
//         </h2>
        
//         {isPerfectScore && 
//           <Confetti width={width} height={height} />
//         }
        
//         <p className={`text-xl ${isPerfectScore ? "text-green-600 font-bold" : ""}`}>
//           Правильно {score} из {questions.length}
//         </p>



//         <Lottie 
//           animationData={ score / questions.length < 0.8 ? LottieTrainerSharkFailDNO : LottieTrainerSharkFinalWin } 
//           className="h-80 w-80 mx-auto"
//         />





//         <Button
//           onClick={startQuiz}
//           className="mt-4"
//           variant='primary'
//         >
//           Давай по новой
//         </Button>

//         <div>
//           <Button 
//                   className='mt-4'
//                   // size='sm' 
//                   variant='primaryOutline'
//                   // onClick={()=>window.location.href = `/t-lesson/${t_lessonId}`}
//                   onClick={handleFinishLesson}

                  

                  
//                   >
//                       Завершить
//                   {/* {t_lesson.title} */}
//           </Button>
//         </div>

//         <div className="pt-8">
//           <Separator />
//         </div>

//          <FinishTrainerStat 
//           //
//           // СТАТИСТИКА ПРАВИЛЬНЫХ / НЕПРАВИЛЬНЫХ ОТВЕТОВ
//           //
//           finishList = {finishList}   
//         />
       


        






//       </div>
//       </>
//     )
//   }











//   // TODO:    НАЧАЛИ КВИЗ КВИЗ КВИЗ КВИЗ КВИЗ КВИЗ КВИЗ
//   return (
    
//     <>
//     {audioCorrect}
//     {audioInCorrect}



    





//     <WinStreakModal
//       // onClose={() => setShowWinModal(false)}
//       effect={effect}
//       onClose={() => setEffect(null)}
//       />



//     <div className="w-full max-w-xl mx-auto text-center">

//       {/* <h1 className="text-xl font-bold mt-6">
//         {t_lessonTitle}
//       </h1> */}
      
      
      
//       <TrainerQuestion
//         questions={questions}
//         question={questions[currentQuestionIndex]} 
//         onAnswer={handleAnswer} 
//         onTimeout={handleTimeout} 
//         isRightList={isRightList}

//         isRightPrevious={isRightPrevious}
//         randomEmotionLottie={randomEmotionLottie}

//         setThreeHearts={setThreeHearts}
//         threeHearts={threeHearts}
//       />
      


//       {/* <Image src='/heart.svg' height={22} width={22} alt='Hearts' className='mr-2' /> */}

     

//       <div className="mt-5 mx-auto w-[200px] ">
//         {threeHearts == 3
//         //
//         // РИСУЕМ СЕРДЕЧКИ ВНИЗУ ПОД ЗАДАНИЕМ
//         //
//         ? <div className="justify-center gap-x-1 flex">
            
//             <Image src='/heartYes.svg' height={22} width={22} alt='Hearts' className='' />
//             <Image src='/heartYes.svg' height={22} width={22} alt='Hearts' className='' />
//             <Image src='/heartYes.svg' height={22} width={22} alt='Hearts' className='' />

//           </div>
//         : threeHearts == 2
//         ?
//         <div className="justify-center gap-x-1 flex">
            
//           <Image src='/heartYes.svg' height={22} width={22} alt='Hearts' className='' />
//           <Image src='/heartYes.svg' height={22} width={22} alt='Hearts' className='' />
//           <Image src='/heartNo.svg' height={22} width={22} alt='Hearts' className='' />

//         </div>
//         :
//         <div className="justify-center gap-x-1 flex">
            
//             <Image src='/heartYes.svg' height={22} width={22} alt='Hearts' className='' />
//             <Image src='/heartNo.svg' height={22} width={22} alt='Hearts' className='' />
//             <Image src='/heartNo.svg' height={22} width={22} alt='Hearts' className='' />

//         </div>
//         } 
        
        
//         {/* <div className="justify-center gap-x-1 flex">
//           {[...Array(3)].map((_, index) => (
//             <Image 
//               key={index}
//               src={index < threeHearts ? '/heartYes.svg' : '/heartNo.svg'}
//               height={22}
//               width={22}
//               alt='Hearts'
//             />
//           ))}
//         </div> */}

//       </div>



//       <div className="mt-4 text-center">
//         <Button 
//           variant='dangerOutline'
//           className="gap-2"
//           onClick={()=>window.location.href = `/t-lesson/${t_lessonId}`}
//         >
//           <X size='18'/>
//           завершить
//         </Button>
//       </div>


//     </div>
//     </>
//   )
// }










//     {/* НАЧАЛИ КВИЗ ВСТАВИТЬ АУДИО 
    
//         {/* // AUDIO */}
//     {/* {audioInCorrect} */}
    


//     {/* {showWinModal && (
//     <WinStreakModal
//       // onClose={() => setShowWinModal(false)}
//       effect={effect}
//       onClose={() => setEffect(null)}
//       />
//     )} */}












//   // //TODO:   Первый экран.  ЕЩЕ НЕ СТАРТАНУЛИ . Начальный экран с выбором Сколько заданий (Этот экран НЕ нужен)
//   // //
//   // if (!quizStarted) {
//   //   return (
//   //     <div className="text-center content-center mx-auto">
        
//   //       <h1 className="text-3xl font-bold mb-6 mt-6">
//   //         {t_lessonTitle}
//   //       </h1>
        


//   //       <ChartComponent TrainingProgressMonth = {TrainingProgressMonth}/>


//   //       <div className="mt-4 flex justify-center gap-8">
//   //         <div className="flex">
//   //           <Check
//   //             className={cn("h-8 w-8 stroke-gray-600")}
//   //           />
//   //           <p className="pt-1 pl-2">{totalD}</p>
//   //         </div>
        

//   //         <div className="flex">

//   //           {Math.round(totalPercentDR*100) > 80 
            
//   //           ? 
            
//   //           <TrendingUp
//   //             className={cn("h-8 w-8  stroke-green-600")}
//   //           />

//   //           :

//   //           <TrendingDown
//   //             className={cn("h-8 w-8  stroke-red-600")}
//   //           /> 
//   //           }
            

    


//   //           <p className="pt-1 pl-2">{Math.round(totalPercentDR*100)} %</p>
//   //         </div>
//   //       </div>


//   //       <Lottie                
//   //         animationData={ randomStartLottie } 
//   //       className="h-40 w-40 mt-4 mx-auto"
//   //       />


        
        
//   //       <p className="text-sm mt-5">
//   //         количество заданий
//   //       </p>

//   //       <div className="flex gap-3 justify-center mt-2">

//   //         <Button className="gap-2" variant={numQuestionsButton == 0 ? 'super' : 'default'} onClick={()=>{handleNumQuestions(0)}}>
//   //           <Baby />
//   //           {Math.round(questions1.length*0.3)}
//   //         </Button>

//   //         <Button className="gap-2" variant={numQuestionsButton == 1 ? 'super' : 'default'} onClick={()=>{handleNumQuestions(1)}}>
//   //           <Pizza />
//   //           {Math.round(questions1.length*0.6)}
//   //         </Button>

//   //         <Button className="gap-2" variant={numQuestionsButton == 2 ? 'super' : 'default'} onClick={()=>{handleNumQuestions(2)}}>
            
//   //           {questions1.length}
//   //           <Crown />
//   //         </Button>

//   //       </div>



//   //       <div className="flex gap-3 justify-center mt-6">

//   //         <Button onClick={()=>window.location.href = `/trainer`} >
//   //           <div className="gap-2 flex">
//   //             <ArrowLeft />
//   //           </div>
//   //         </Button>

//   //         <Button variant='primary' onClick={startQuiz} >
//   //           {randomStartButton}
//   //         </Button>

//   //       </div>

//   //       <Separator className="mt-12 h-0.5 rounded-full w-full" />


//   //       <div className="mt-6 mb-20 w-full">
            
            
            

//   //         <ul className="grid grid-cols-5 gap-y-4 ">

//   //           <li key={3313} className="col-span-2 flex justify-center ">
//   //             <Trophy
//   //               className= {cn("h-7 w-7 pt-1  fill-yellow-300 stroke-yellow-400")}
//   //             />
//   //           </li>

              

//   //           <li key={33132} className="col-span-2 flex justify-center">
//   //             <Heart
//   //               className= {cn("h-7 w-7 pt-1  fill-yellow-300 stroke-yellow-400")}
//   //             />  
//   //           </li>


              
//   //           <li key={33131} className="flex justify-center">
//   //             <Zap
//   //               className={cn("h-7 w-7 pt-1  fill-yellow-300 stroke-yellow-400")}
//   //             />
//   //           </li>

            

//   //         {usersStat.map((el, index)=> (
//   //           <React.Fragment key={el.user_id}>
              
//   //             <li className="pt-5 col-span-2 flex justify-center">
//   //               {index + 1}
//   //             </li>

//   //             <li className="col-span-2 flex justify-center">
//   //               <div
//   //                 className={el.user_id == userId 
//   //                   ? "flex flex-1 gap-2 items-center border-dashed border-2 border-gray-300 rounded-lg p-2"
//   //                   : "flex flex-1 gap-2 items-center rounded-lg p-3"
//   //                 }
//   //               >
//   //                 <Avatar>
//   //                   <AvatarImage
//   //                     className="object-cover"
//   //                     src={el.user_imgSrc}
//   //                   />
//   //                 </Avatar>
//   //                 {el.user_name}
//   //               </div>
//   //             </li>

//   //             <li className="pt-5 flex justify-center">
//   //               {el.DR_DRP}
//   //             </li>

//   //           </React.Fragment>
//   //         ))}

//   //         </ul>

//   //       </div>


        


//   //     </div>
//   //   )}















// // // Вместо трех отдельных вызовов:
// // const [audioCorrect, _, controlsCorrect] = useAudio({src: '/correct.wav'})
// // const [audioInCorrect, _c, controlsInCorrect] = useAudio({src: '/incorrect.wav'})
// // const [finishAudio] = useAudio({src: finishA, autoPlay: true})

// // // Создайте один hook для управления аудио:
// // const [playCorrect] = useAudioPlayer('/correct.wav')
// // const [playIncorrect] = useAudioPlayer('/incorrect.wav')
// // const [playFinish] = useAudioPlayer(finishA, { autoPlay: true })

// // // Кастомный hook:
// // function useAudioPlayer(src: string, options = {}) {
// //   const [audio] = useAudio({ src, ...options })
// //   const play = () => {
// //     const audioEl = document.querySelector(`audio[src="${src}"]`) as HTMLAudioElement
// //     audioEl?.play()
// //   }
// //   return [audio, play]
// // }

// // // Компонент для сердечек
// // const HeartsDisplay = ({ count }: { count: number }) => (
// //   <div className="justify-center gap-x-1 flex">
// //     {[1, 2, 3].map(i => (
// //       <Image 
// //         key={i}
// //         src={i <= count ? '/heartYes.svg' : '/heartNo.svg'} 
// //         height={22} 
// //         width={22} 
// //         alt='Heart' 
// //       />
// //     ))}
// //   </div>
// // )

// // // Компонент статистики пользователя
// // const UserStats = ({ usersStat, userId }: { usersStat: any[], userId: string }) => (
// //   <ul className="grid grid-cols-5 gap-y-4">
// //     {usersStat.map((el, index) => (
// //       <React.Fragment key={el.user_id}>
// //         <li className="pt-5 col-span-2 flex justify-center">{index + 1}</li>
// //         <li className="col-span-2 flex justify-center">
// //           <div className={cn(
// //             "flex flex-1 gap-2 items-center rounded-lg p-3",
// //             el.user_id == userId && "border-dashed border-2 border-gray-300"
// //           )}>
// //             <Avatar>
// //               <AvatarImage className="object-cover" src={el.user_imgSrc} />
// //             </Avatar>
// //             {el.user_name}
// //           </div>
// //         </li>
// //         <li className="pt-5 flex justify-center">{el.DR_DRP}</li>
// //       </React.Fragment>
// //     ))}
// //   </ul>
// // )


// // // Хук для управления игровым состоянием
// // const useGameState = (questions: QuestionType[]) => {
// //   const [state, setState] = useState({
// //     currentIndex: 0,
// //     score: 0,
// //     hearts: 3,
// //     streak: 0,
// //     isRightList: questions.map((_, i) => i === 0 ? 3 : 0)
// //   })

// //   const updateState = (updates: Partial<typeof state>) => 
// //     setState(prev => ({ ...prev, ...updates }))

// //   return [state, updateState] as const
// // }

// // // Хук для случайного выбора
// // const useRandomSelector = <T,>(items: T[], defaultValue: T) => {
// //   const [selected, setSelected] = useState(defaultValue)
  
// //   useEffect(() => {
// //     setSelected(items[Math.floor(Math.random() * items.length)])
// //   }, [])
  
// //   return selected
// // }




// // const TrainingProgressMonth = useMemo(() => {
// //   const PTLByMonth = t_lessonProgressThisLesson.map(el => ({
// //     doneRight: el.doneRight,
// //     doneWrong: el.doneWrong,
// //     month: el.dateDone.getMonth(),
// //   }))

// //   const uniqueMonths = [...new Set(PTLByMonth.map(item => item.month))]

// //   return uniqueMonths.map(month => ({
// //     month: monthTable[month],
// //     doneRight: PTLByMonth
// //       .filter(el => el.month === month)
// //       .reduce((sum, el) => sum + el.doneRight, 0),
// //     doneWrong: PTLByMonth
// //       .filter(el => el.month === month)
// //       .reduce((sum, el) => sum + el.doneWrong, 0)
// //   }))
// // }, [t_lessonProgressThisLesson])




// // const useSlideAnimation = () => {
// //   const triggerAnimation = async (className: string) => {
// //     const body = document.querySelector("body")
// //     body?.classList.add(className)
// //     await sleep(200)
// //     body?.classList.remove(className)
// //   }

// //   return {
// //     slideUp: () => triggerAnimation("trainer-slide-up-transition"),
// //     slideDown: () => triggerAnimation("trainer-slide-down-transition")
// //   }
// // }
