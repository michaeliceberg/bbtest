// app/t-lesson/[t_lessonId]/TQUIZ.tsx

"use client"

import React, { useEffect, useState, useRef, useCallback } from "react"
import dynamic from "next/dynamic"
import Confetti from "react-confetti"
import { useWindowSize } from "react-use"
import TrainerQuestion from "../../../components/trainer-question"
import { Button } from "../../../components/ui/button"
import LottieTrainerSharkFailDNO from '@/public/Lottie/trainer/LottieTrainerSharkFailDNO.json'
import LottieTrainerSharkFinalWin from '@/public/Lottie/trainer/LottieTrainerSharkFinalWin.json'
import LottieThunderStrike from '@/public/Lottie/ggege/LottieThunderStrike.json'
import LottiePaperFly from '@/public/Lottie/ggege/LottiePaperFly.json'

const Lottie = dynamic(() => import("lottie-react"), { ssr: false })
const WinStreakModal = dynamic(() => import("../../../components/win-streak-modal"), { ssr: false })
const ComboBanner = dynamic(() => import("../../../components/combo-banner"), { ssr: false })
const StreakLightning = dynamic(() => import("../../../components/streak-lightning").then(mod => mod.StreakLightning), { ssr: false })
const StreakCelebrationScreen = dynamic(() => import("../../../components/streak-celebration-screen").then(mod => mod.StreakCelebrationScreen), { ssr: false })
import { toast } from "sonner"
import { upsertTrainerLessonProgress } from "@/actions/user-progress"
import { Separator } from "../../../components/ui/separator"
import { FinishTrainerStat } from "../../../components/finish-trainer-stat"
import { TgSendMsgCom } from "../../../components/tg-send-msg-com"
import { QuestionType } from "@/app/t-lesson/[t_lessonId]/page"
import { createEffect, StreakEffect } from "@/lib/streakEffects"
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatedHearts } from "@/components/AnimatedHearts"
import { FINISH_AUDIO_SRC_LIST } from "@/constants"
import { LOTTIE_START_LIST, LOTTIE_EMOTION_RIGHT_LIST, getRandomLottie } from '@/src/constants/lottieConstants'
import { X } from "lucide-react"
import { useQuizAudio } from "@/app/hooks/useQuizAudio"
import { completeTrainerQuestLesson } from "@/actions/generate-trainer-quest"

const startButton = ['Погнали!', 'Гоу!', 'Старт!', 'Поехали!', 'Поплыли!']

type Props = {
  t_lessonId: number,
  t_lessonTitle: string,
  questions1: QuestionType[],
  userName: string,
}

export default function TQuiz({
  t_lessonId,
  t_lessonTitle, 
  questions1,
  userName,
}: Props) {

  const router = useRouter()
  const searchParams = useSearchParams()
  const fromQuest = searchParams.get('fromQuest') === 'true'
  const tCourseId = searchParams.get('tCourseId') ? parseInt(searchParams.get('tCourseId')!) : null
  
  const [streak, setStreak] = useState(0)
  const [effect, setEffect] = useState<StreakEffect | null>(null)
  const [combo, setCombo] = useState<number | null>(null)
  const [showLightning, setShowLightning] = useState(false)
  const [showStreakCelebration, setShowStreakCelebration] = useState(false)
  const [randomStartLottie, setRandomStartLottie] = useState(LOTTIE_START_LIST[0])
  const [randomStartButton, setRandomStartButton] = useState(startButton[0])
  const [randomEmotionLottie, setRandomEmotionLottie] = useState(LOTTIE_EMOTION_RIGHT_LIST[0])
  const [threeHearts, setThreeHearts] = useState(3)
  const [quizStarted, setQuizStarted] = useState(true)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [answeredQuestions, setAnsweredQuestions] = useState(0)
  const { width, height } = useWindowSize()
  
  // Флаг для предотвращения двойной обработки
  const [isProcessing, setIsProcessing] = useState(false)
  // useRef для отслеживания обработанных вопросов (особенно важно для таймаутов)
  const processedQuestionsRef = useRef<Set<number>>(new Set())
  // Флаг для предотвращения двойного воспроизведения финального звука
  const hasPlayedFinishSoundRef = useRef(false)
  // Флаг для отслеживания, был ли уже обновлен квест
  const hasUpdatedQuestRef = useRef(false)
  // Ref для отслеживания текущего isRightList (избегаем closure issues)
  const isRightListRef = useRef<number[]>([])

  // Расширяем до 11 вопросов
  const [allQuestions, setAllQuestions] = useState(questions1.slice(0, 11))
  const [numQuestionsButton, setNumQuestionsButton] = useState(0)
  const [isRightPrevious, setIsRightPrevious] = useState<boolean | null>(null)
  const questions = allQuestions
  
  const initialState: number[] = questions.map((el, index) => index == 0 ? 3 : 0)
  const [isRightList, setIsRightList] = useState(initialState)
  const [finishList, setFinishList] = useState([{
    question: '',
    answer: '',
    rightAnswer: '',
    isRight: true,
  }])

  const finishAudio = FINISH_AUDIO_SRC_LIST[Math.floor(Math.random() * FINISH_AUDIO_SRC_LIST.length)];
  const { play: playAudio } = useQuizAudio(finishAudio)
  
  // Оборачиваем функции в useCallback
  const playCorrectSound = useCallback(() => playAudio('correct'), [playAudio])
  const playIncorrectSound = useCallback(() => playAudio('incorrect'), [playAudio])
  const playFinishSound = useCallback(() => playAudio('finish'), [playAudio])

  // Функция для обновления прогресса квеста
  const updateQuestProgress = useCallback(async () => {
    if (hasUpdatedQuestRef.current) return
    if (!fromQuest || !tCourseId) return
    
    hasUpdatedQuestRef.current = true
    
    try {
      const result = await completeTrainerQuestLesson(t_lessonId, tCourseId, '')
      if (result && result.success) {
        console.log('✅ Квест обновлен!', result.completedCount, '/', result.totalCount)
        if (result.isCompleted) {
          toast.success('🎉 Квест выполнен! +1 к стрику!')
        }
      }
    } catch (error) {
      console.error('Ошибка обновления квеста:', error)
    }
  }, [fromQuest, tCourseId, t_lessonId])

  // Воспроизведение финального звука только один раз
  // Синхронизируем isRightListRef с текущим isRightList
  useEffect(() => {
    isRightListRef.current = isRightList
  }, [isRightList])

  useEffect(() => {
    if (quizCompleted && !hasPlayedFinishSoundRef.current) {
      hasPlayedFinishSoundRef.current = true
      playFinishSound()
    }
  }, [quizCompleted, playFinishSound])

  useEffect(() => {
    setRandomStartLottie(getRandomLottie(LOTTIE_START_LIST))
    setRandomStartButton([...startButton].sort(() => 0.5 - Math.random())[0])
  }, [])

  useEffect(() => {
    if (threeHearts == 0 && !quizCompleted) {
      setQuizCompleted(true)
      upsertTrainerLessonProgress(t_lessonId, 0, 0, score, questions.length - score)
        .catch(() => toast.error('Что-то пошло не так! Результат не добавлен в базу данных.'))
        .finally(() => {
          updateQuestProgress()
        })
    }
  }, [threeHearts, t_lessonId, questions.length, score, quizCompleted, updateQuestProgress])

  const startQuiz = useCallback(() => {
    setQuizStarted(true)
    setCurrentQuestionIndex(0)
    setScore(0)
    setQuizCompleted(false)
    setAnsweredQuestions(0)
    setThreeHearts(3)
    setStreak(0)
    setIsRightList(initialState)
    setFinishList([])
    setIsProcessing(false)
    processedQuestionsRef.current.clear()
    hasPlayedFinishSoundRef.current = false
    hasUpdatedQuestRef.current = false
  }, [initialState])

  // Сбрасываем isRightPrevious при смене вопроса
  useEffect(() => {
    setIsRightPrevious(null)
  }, [currentQuestionIndex])

  const sleep = useCallback((ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }, [])

  const goToNextQuestion = useCallback(async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      setQuizCompleted(true)
      const doneRightPercent = Math.round(score / questions.length * 100)
      await upsertTrainerLessonProgress(t_lessonId, doneRightPercent, 200, score, questions.length - score)
        .catch(() => toast.error('Что-то пошло не так! Результат не добавлен в базу данных.'))
      await updateQuestProgress()
    }
  }, [currentQuestionIndex, questions.length, score, t_lessonId, updateQuestProgress])

  const handleAnswer = useCallback(async (answer: string) => {
    // Для ASSIST: если это "next", просто переходим к следующему вопросу
    if (answer === "next") {
      await goToNextQuestion()
      return
    }

    if (isProcessing || quizCompleted) return
    if (processedQuestionsRef.current.has(currentQuestionIndex)) return
    processedQuestionsRef.current.add(currentQuestionIndex)

    setIsProcessing(true)

    try {
      setAnsweredQuestions(prev => prev + 1)

      let answerIsRight = false
      questions[currentQuestionIndex].questionType == 'ASSIST'
        ? answerIsRight = answer === questions[currentQuestionIndex].correctAnswer
        : answerIsRight = answer === "right"

      if (answerIsRight) {
        playCorrectSound()
        setIsRightPrevious(true)
        setRandomEmotionLottie(getRandomLottie(LOTTIE_EMOTION_RIGHT_LIST))

        setStreak(prev => {
          const newStreak = prev + 1
          if (newStreak === 3) {
            setShowLightning(true)
            // Показываем экран поздравления после небольшой задержки
            setTimeout(() => {
              setShowStreakCelebration(true)
            }, 600)
          }
          if (newStreak >= 5 && newStreak % 5 === 0) {
            setCombo(newStreak)
          }
          return newStreak
        })

        setFinishList(oldArray => [...oldArray, {
          question: questions[currentQuestionIndex].question,
          answer: answer,
          rightAnswer: questions[currentQuestionIndex].correctAnswer,
          isRight: true,
        }])

        setScore(prev => prev + 1)

        let newArr = [...(isRightListRef.current || isRightList)]
        newArr[currentQuestionIndex] = 1
        if (currentQuestionIndex < questions.length - 1) {
          newArr[currentQuestionIndex + 1] = 3
        }
        setIsRightList(newArr)
        isRightListRef.current = newArr

        await sleep(400)

        // Для ASSIST типа не переходим автоматически - ждем клика на кнопку "далее"
        if (questions[currentQuestionIndex].questionType !== 'ASSIST') {
          await goToNextQuestion()
        }
      } else {
        playIncorrectSound()
        setStreak(0)

        setThreeHearts(prev => prev - 1)
        setIsRightPrevious(false)
        setRandomEmotionLottie(getRandomLottie(LOTTIE_EMOTION_RIGHT_LIST))

        setFinishList(oldArray => [...oldArray, {
          question: questions[currentQuestionIndex].question,
          answer: answer,
          rightAnswer: questions[currentQuestionIndex].correctAnswer,
          isRight: false,
        }])

        let newArr = [...(isRightListRef.current || isRightList)]
        newArr[currentQuestionIndex] = 2
        if (currentQuestionIndex < questions.length - 1) {
          newArr[currentQuestionIndex + 1] = 3
        }
        setIsRightList(newArr)
        isRightListRef.current = newArr

        await sleep(400)

        // Для ASSIST типа не переходим автоматически - ждем клика на кнопку "понятно"
        if (questions[currentQuestionIndex].questionType !== 'ASSIST') {
          if (threeHearts > 1) {
            await goToNextQuestion()
          } else {
            setQuizCompleted(true)
          }
        } else {
          // Для ASSIST - если жизней осталось 0, завершаем
          if (threeHearts <= 1) {
            setQuizCompleted(true)
            await upsertTrainerLessonProgress(t_lessonId, 0, 0, score, questions.length - score)
              .catch(() => toast.error('Что-то пошло не так! Результат не добавлен в базу данных.'))
            await updateQuestProgress()
          }
        }
      }
    } finally {
      setIsProcessing(false)
    }
  }, [
    isProcessing, quizCompleted, currentQuestionIndex, questions,
    playCorrectSound, playIncorrectSound, sleep, goToNextQuestion, threeHearts,
    score, t_lessonId, updateQuestProgress
  ])

  const handleTimeout = useCallback(async () => {
    if (isProcessing || quizCompleted) return
    if (processedQuestionsRef.current.has(currentQuestionIndex)) return
    processedQuestionsRef.current.add(currentQuestionIndex)
    
    setIsProcessing(true)

    try {
      playIncorrectSound()
      
      setAnsweredQuestions(prev => prev + 1)
      
      const newHearts = threeHearts - 1
      setThreeHearts(newHearts)
      
      setStreak(0)
      setIsRightPrevious(false)
      setRandomEmotionLottie(getRandomLottie(LOTTIE_EMOTION_RIGHT_LIST))

      setFinishList(prev => [...prev, {
        question: questions[currentQuestionIndex].question,
        answer: "Время вышло",
        rightAnswer: questions[currentQuestionIndex].correctAnswer,
        isRight: false,
      }])

      const newArr = [...isRightList]
      newArr[currentQuestionIndex] = 2
      if (currentQuestionIndex < questions.length - 1) {
        newArr[currentQuestionIndex + 1] = 3
      }
      setIsRightList(newArr)

      if (newHearts <= 0) {
        setQuizCompleted(true)
        await upsertTrainerLessonProgress(t_lessonId, 0, 0, score, questions.length - score)
          .catch(() => toast.error('Что-то пошло не так! Результат не добавлен в базу данных.'))
        await updateQuestProgress()
        return
      }

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1)
      } else {
        setQuizCompleted(true)
        const doneRightPercent = Math.round(score / questions.length * 100)
        await upsertTrainerLessonProgress(t_lessonId, doneRightPercent, 200, score, questions.length - score)
          .catch(() => toast.error('Что-то пошло не так! Результат не добавлен в базу данных.'))
        await updateQuestProgress()
      }
    } finally {
      setIsProcessing(false)
    }
  }, [
    isProcessing, quizCompleted, currentQuestionIndex, questions,
    playIncorrectSound, threeHearts, score, t_lessonId, updateQuestProgress
  ])

  const handleFinishLesson = useCallback(() => {
    setQuizCompleted(true)
    updateQuestProgress()
    requestAnimationFrame(() => {
      router.push('/trainer')
    })
  }, [updateQuestProgress, router])

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
          <h2 className="text-2xl font-bold mb-4">Завершено!</h2>
          {isPerfectScore && <Confetti width={width} height={height} />}
          <p className={`text-xl ${isPerfectScore ? "text-green-600 font-bold" : ""}`}>
            Правильно {score} из {questions.length}
          </p>
          <Lottie 
            animationData={score / questions.length < 0.8 ? LottieTrainerSharkFailDNO : LottieTrainerSharkFinalWin} 
            className="h-80 w-80 mx-auto"
          />
          <Button onClick={startQuiz} className="mt-4" variant='primary'>Давай по новой</Button>
          <div>
            <Button className='mt-4' variant='primaryOutline' onClick={handleFinishLesson}>Завершить</Button>
          </div>
          <div className="pt-8">
            <Separator />
          </div>
          <FinishTrainerStat finishList={finishList} />
        </div>
      </>
    )
  }

  return (
    <>
      <StreakLightning
        isVisible={showLightning}
        onComplete={() => setShowLightning(false)}
        animationData={LottieThunderStrike}
      />
      <ComboBanner combo={combo} onDone={() => setCombo(null)} />

      {showStreakCelebration ? (
        <StreakCelebrationScreen
          animationData={LottiePaperFly}
          onNext={async () => {
            setShowStreakCelebration(false)
            setStreak(0)
            await goToNextQuestion()
          }}
        />
      ) : (
        <div className="w-full max-w-xl mx-auto text-center">
          <TrainerQuestion
            questions={questions}
            question={questions[currentQuestionIndex]}
            onAnswer={handleAnswer}
            onTimeout={handleTimeout}
            isRightList={isRightList}
            isRightPrevious={isRightPrevious}
            randomEmotionLottie={randomEmotionLottie}
            playCorrectSound={playCorrectSound}
            setThreeHearts={setThreeHearts}
            threeHearts={threeHearts}
          />
          <div className="mt-8">
            <AnimatedHearts hearts={threeHearts} />
          </div>
          <div className="mt-4 text-center">
            <Button
              variant='dangerOutline'
              className="gap-2"
              onClick={() => window.location.href = `/trainer`}
            >
              <X size='18' />
              завершить
            </Button>
          </div>
        </div>
      )}
    </>
  )
}






// "use client"

// import React, { useEffect, useState, useRef } from "react"
// import Confetti from "react-confetti"
// import { useWindowSize } from "react-use"
// import TrainerQuestion from "../../../components/trainer-question"
// import { Button } from "../../../components/ui/button"
// import Lottie from "lottie-react"
// import LottieTrainerSharkFailDNO from '@/public/Lottie/trainer/LottieTrainerSharkFailDNO.json'
// import LottieTrainerSharkFinalWin from '@/public/Lottie/trainer/LottieTrainerSharkFinalWin.json'
// import WinStreakModal from "../../../components/win-streak-modal"
// import { toast } from "sonner"
// import { upsertTrainerLessonProgress } from "@/actions/user-progress"
// import { Separator } from "../../../components/ui/separator"
// import { FinishTrainerStat } from "../../../components/finish-trainer-stat"
// import { TgSendMsgCom } from "../../../components/tg-send-msg-com"
// import { QuestionType } from "@/app/t-lesson/[t_lessonId]/page"
// import { createEffect, StreakEffect } from "@/lib/streakEffects"
// import { useRouter, useSearchParams } from 'next/navigation'
// import { AnimatedHearts } from "@/components/AnimatedHearts"
// import { FINISH_AUDIO_SRC_LIST } from "@/constants"
// import { LOTTIE_START_LIST, LOTTIE_EMOTION_RIGHT_LIST, getRandomLottie } from '@/src/constants/lottieConstants'
// import { X } from "lucide-react"
// import { useQuizAudio } from "@/app/hooks/useQuizAudio"
// import { completeTrainerQuestLesson } from "@/actions/generate-trainer-quest"

// const startButton = ['Погнали!', 'Гоу!', 'Старт!', 'Поехали!', 'Поплыли!']

// type Props = {
//   t_lessonId: number,
//   t_lessonTitle: string,
//   questions1: QuestionType[],
//   userName: string,
// }

// export default function TQuiz({
//   t_lessonId,
//   t_lessonTitle, 
//   questions1,
//   userName,
// }: Props) {

//   const router = useRouter()
//   const searchParams = useSearchParams()
//   const fromQuest = searchParams.get('fromQuest') === 'true'
//   const tCourseId = searchParams.get('tCourseId') ? parseInt(searchParams.get('tCourseId')!) : null
  
//   const [streak, setStreak] = useState(0)
//   const [effect, setEffect] = useState<StreakEffect | null>(null)
//   const [randomStartLottie, setRandomStartLottie] = useState(LOTTIE_START_LIST[0])
//   const [randomStartButton, setRandomStartButton] = useState(startButton[0])
//   const [randomEmotionLottie, setRandomEmotionLottie] = useState(LOTTIE_EMOTION_RIGHT_LIST[0])
//   const [threeHearts, setThreeHearts] = useState(3)
//   const [quizStarted, setQuizStarted] = useState(true)
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
//   const [score, setScore] = useState(0)
//   const [quizCompleted, setQuizCompleted] = useState(false)
//   const [answeredQuestions, setAnsweredQuestions] = useState(0)
//   const { width, height } = useWindowSize()
  
//   // Флаг для предотвращения двойной обработки
//   const [isProcessing, setIsProcessing] = useState(false)
//   // useRef для отслеживания обработанных вопросов (особенно важно для таймаутов)
//   const processedQuestionsRef = useRef<Set<number>>(new Set())
//   // Флаг для предотвращения двойного воспроизведения финального звука
//   const hasPlayedFinishSoundRef = useRef(false)
//   // Флаг для отслеживания, был ли уже обновлен квест
//   const hasUpdatedQuestRef = useRef(false)
  
//   const [allQuestions, setAllQuestions] = useState(questions1)
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

//   const finishAudio = FINISH_AUDIO_SRC_LIST[Math.floor(Math.random() * FINISH_AUDIO_SRC_LIST.length)];
//   const { play: playAudio } = useQuizAudio(finishAudio)
//   const playCorrectSound = () => playAudio('correct')
//   const playIncorrectSound = () => playAudio('incorrect')
//   const playFinishSound = () => playAudio('finish')

//   // Воспроизведение финального звука только один раз
//   useEffect(() => {
//     if (quizCompleted && !hasPlayedFinishSoundRef.current) {
//       hasPlayedFinishSoundRef.current = true
//       playFinishSound()
//     }
//   }, [quizCompleted, playFinishSound])

//   useEffect(() => {
//     setRandomStartLottie(getRandomLottie(LOTTIE_START_LIST))
//     setRandomStartButton([...startButton].sort(() => 0.5 - Math.random())[0])
//   }, [])

//   useEffect(() => {
//     if (threeHearts == 0 && !quizCompleted) {
//       setQuizCompleted(true)
//       upsertTrainerLessonProgress(t_lessonId, 0, 0, score, questions.length - score)
//         .catch(() => toast.error('Что-то пошло не так! Результат не добавлен в базу данных.'))
//         .finally(() => {
//           // Обновляем квест, даже если не прошли урок
//           updateQuestProgress()
//         })
//     }
//   }, [threeHearts, t_lessonId, questions.length, score, quizCompleted])

  
  
  
  
//   // Функция для обновления прогресса квеста


//   // В TQuiz компоненте, функция updateQuestProgress:

//   const updateQuestProgress = async () => {
//     if (hasUpdatedQuestRef.current) return
//     if (!fromQuest || !tCourseId) return
    
//     hasUpdatedQuestRef.current = true
    
//     try {
//         const result = await completeTrainerQuestLesson(t_lessonId, tCourseId, '')
//         if (result && result.success) {
//             console.log('✅ Квест обновлен!', result.completedCount, '/', result.totalCount)
//             // Показать уведомление о прогрессе квеста
//             if (result.isCompleted) {
//                 toast.success('🎉 Квест выполнен! +1 к стрику!')
//             } else {
//                 toast.success(`📚 Прогресс квеста: ${result.completedCount}/${result.totalCount}`)
//             }
//         }
//     } catch (error) {
//         console.error('Ошибка обновления квеста:', error)
//     }
// }




//   // const updateQuestProgress = async () => {
//   //   if (hasUpdatedQuestRef.current) return
//   //   if (!fromQuest || !tCourseId) return
    
//   //   hasUpdatedQuestRef.current = true
    
//   //   try {
//   //     const result = await completeTrainerQuestLesson(t_lessonId, tCourseId, '')
//   //     if (result?.success) {
//   //       console.log('✅ Квест обновлен!')
//   //     }
//   //   } catch (error) {
//   //     console.error('Ошибка обновления квеста:', error)
//   //   }
//   // }






//   const startQuiz = () => {
//     setQuizStarted(true)
//     setCurrentQuestionIndex(0)
//     setScore(0)
//     setQuizCompleted(false)
//     setAnsweredQuestions(0)
//     setThreeHearts(3)
//     setStreak(0)
//     setIsRightList(initialState)
//     setFinishList([])
//     setIsProcessing(false)
//     processedQuestionsRef.current.clear()
//     hasPlayedFinishSoundRef.current = false
//     hasUpdatedQuestRef.current = false // Сбрасываем флаг обновления квеста
//   }

//   function sleep(ms: number): Promise<void> {
//     return new Promise((resolve) => setTimeout(resolve, ms))
//   }

//   // Общая функция для перехода к следующему вопросу
//   const goToNextQuestion = async () => {
//     if (currentQuestionIndex < questions.length - 1) {
//       setCurrentQuestionIndex(currentQuestionIndex + 1)
//     } else {
//       setQuizCompleted(true)
//       const doneRightPercent = Math.round(score / questions.length * 100)
//       await upsertTrainerLessonProgress(t_lessonId, doneRightPercent, 200, score, questions.length - score)
//         .catch(() => toast.error('Что-то пошло не так! Результат не добавлен в базу данных.'))
//       // Обновляем квест после завершения урока
//       // await updateQuestProgress()
//       updateQuestProgress()
//     }
//   }

//   const handleAnswer = async (answer: string) => {
//     // Защита от двойной обработки
//     if (isProcessing || quizCompleted) return
    
//     // Проверяем, не обработан ли уже этот вопрос
//     if (processedQuestionsRef.current.has(currentQuestionIndex)) return
//     processedQuestionsRef.current.add(currentQuestionIndex)
    
//     setIsProcessing(true)

//     try {
//       setAnsweredQuestions(prev => prev + 1)

//       let answerIsRight = false
//       questions[currentQuestionIndex].questionType == 'ASSIST'
//         ? answerIsRight = answer === questions[currentQuestionIndex].correctAnswer
//         : answerIsRight = answer === "right"

//       if (answerIsRight) {
//         playCorrectSound()
//         setIsRightPrevious(true)
//         setRandomEmotionLottie(getRandomLottie(LOTTIE_EMOTION_RIGHT_LIST))

//         setStreak(prev => {
//           const newStreak = prev + 1
//           if (newStreak === 3) {
//             setEffect(createEffect(newStreak))
//           }
//           return newStreak
//         })

//         const body = document.querySelector("body")
//         body?.classList.add("trainer-slide-up-transition")
//         await sleep(200)

//         setFinishList(oldArray => [...oldArray, {
//           question: questions[currentQuestionIndex].question,
//           answer: answer,
//           rightAnswer: questions[currentQuestionIndex].correctAnswer,
//           isRight: true,
//         }])

//         setScore(prev => prev + 1)

//         let newArr = [...isRightList]
//         newArr[currentQuestionIndex] = 1
//         if (currentQuestionIndex < questions.length - 1) {
//           newArr[currentQuestionIndex + 1] = 3
//         }
//         setIsRightList(newArr)
        
//         await sleep(200)
//         body?.classList.remove("trainer-slide-up-transition")
        
//         await goToNextQuestion()
//       } else {
//         playIncorrectSound()
//         setStreak(0)
        
//         // Уменьшаем сердечки
//         setThreeHearts(prev => prev - 1)
//         setIsRightPrevious(false)
//         setRandomEmotionLottie(getRandomLottie(LOTTIE_EMOTION_RIGHT_LIST))

//         const body = document.querySelector("body")
//         body?.classList.add("trainer-slide-down-transition")
//         await sleep(200)

//         setFinishList(oldArray => [...oldArray, {
//           question: questions[currentQuestionIndex].question,
//           answer: answer,
//           rightAnswer: questions[currentQuestionIndex].correctAnswer,
//           isRight: false,
//         }])

//         let newArr = [...isRightList]
//         newArr[currentQuestionIndex] = 2
//         if (currentQuestionIndex < questions.length - 1) {
//           newArr[currentQuestionIndex + 1] = 3
//         }
//         setIsRightList(newArr)

//         await sleep(200)
//         body?.classList.remove("trainer-slide-down-transition")
        
//         // Если сердечки не закончились, переходим к следующему вопросу
//         if (threeHearts > 1) {
//           await goToNextQuestion()
//         } else {
//           // Сердечки закончились, завершаем квиз
//           setQuizCompleted(true)
//           await upsertTrainerLessonProgress(t_lessonId, 0, 0, score, questions.length - score)
//             .catch(() => toast.error('Что-то пошло не так! Результат не добавлен в базу данных.'))
//           await updateQuestProgress()
//         }
//       }
//     } finally {
//       setIsProcessing(false)
//     }
//   }

//   const handleTimeout = async () => {
//     // Защита от двойной обработки
//     if (isProcessing || quizCompleted) return
    
//     // Проверяем, не обработан ли уже этот вопрос (ключевая защита для таймаутов)
//     if (processedQuestionsRef.current.has(currentQuestionIndex)) return
//     processedQuestionsRef.current.add(currentQuestionIndex)
    
//     setIsProcessing(true)

//     try {
//       playIncorrectSound()
      
//       setAnsweredQuestions(prev => prev + 1)
      
//       const newHearts = threeHearts - 1
//       setThreeHearts(newHearts)
      
//       setStreak(0)
//       setIsRightPrevious(false)
//       setRandomEmotionLottie(getRandomLottie(LOTTIE_EMOTION_RIGHT_LIST))

//       setFinishList(prev => [...prev, {
//         question: questions[currentQuestionIndex].question,
//         answer: "Время вышло",
//         rightAnswer: questions[currentQuestionIndex].correctAnswer,
//         isRight: false,
//       }])

//       const newArr = [...isRightList]
//       newArr[currentQuestionIndex] = 2
//       if (currentQuestionIndex < questions.length - 1) {
//         newArr[currentQuestionIndex + 1] = 3
//       }
//       setIsRightList(newArr)

//       // Если сердечки стали 0, завершаем квиз
//       if (newHearts <= 0) {
//         setQuizCompleted(true)
//         await upsertTrainerLessonProgress(t_lessonId, 0, 0, score, questions.length - score)
//           .catch(() => toast.error('Что-то пошло не так! Результат не добавлен в базу данных.'))
//         await updateQuestProgress()
//         return
//       }

//       // Переход к следующему вопросу
//       if (currentQuestionIndex < questions.length - 1) {
//         setCurrentQuestionIndex(prev => prev + 1)
//       } else {
//         setQuizCompleted(true)
//         const doneRightPercent = Math.round(score / questions.length * 100)
//         await upsertTrainerLessonProgress(t_lessonId, doneRightPercent, 200, score, questions.length - score)
//           .catch(() => toast.error('Что-то пошло не так! Результат не добавлен в базу данных.'))
//         await updateQuestProgress()
//       }
//     } finally {
//       setIsProcessing(false)
//     }
//   }

//   const handleFinishLesson = () => {
//     setQuizCompleted(true)
//     // Обновляем квест при принудительном завершении
//     updateQuestProgress()
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
//         <div className="text-center content-center mx-auto">
//           <h1 className="text-3xl font-bold mb-6">
//             {t_lessonTitle}
//           </h1>
//           <TgSendMsgCom message={message} />
//           <h2 className="text-2xl font-bold mb-4">Завершено!</h2>
//           {isPerfectScore && <Confetti width={width} height={height} />}
//           <p className={`text-xl ${isPerfectScore ? "text-green-600 font-bold" : ""}`}>
//             Правильно {score} из {questions.length}
//           </p>
//           <Lottie 
//             animationData={score / questions.length < 0.8 ? LottieTrainerSharkFailDNO : LottieTrainerSharkFinalWin} 
//             className="h-80 w-80 mx-auto"
//           />
//           <Button onClick={startQuiz} className="mt-4" variant='primary'>Давай по новой</Button>
//           <div>
//             <Button className='mt-4' variant='primaryOutline' onClick={handleFinishLesson}>Завершить</Button>
//           </div>
//           <div className="pt-8">
//             <Separator />
//           </div>
//           <FinishTrainerStat finishList={finishList} />
//         </div>
//       </>
//     )
//   }

//   return (
//     <>
//       <WinStreakModal effect={effect} onClose={() => setEffect(null)} />
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
//         <div className="mt-8">
//           <AnimatedHearts hearts={threeHearts} />
//         </div>
//         <div className="mt-4 text-center">
//           <Button 
//             variant='dangerOutline'
//             className="gap-2"
//             onClick={() => window.location.href = `/trainer`}
//           >
//             <X size='18' />
//             завершить
//           </Button>
//         </div>
//       </div>
//     </>
//   )
// }





// // "use client"

// // import React, { useEffect, useState, useRef } from "react"
// // import Confetti from "react-confetti"
// // import { useWindowSize } from "react-use"
// // import TrainerQuestion from "../../../components/trainer-question"
// // import { Button } from "../../../components/ui/button"
// // import Lottie from "lottie-react"
// // import LottieTrainerSharkFailDNO from '@/public/Lottie/trainer/LottieTrainerSharkFailDNO.json'
// // import LottieTrainerSharkFinalWin from '@/public/Lottie/trainer/LottieTrainerSharkFinalWin.json'
// // import WinStreakModal from "../../../components/win-streak-modal"
// // import { toast } from "sonner"
// // import { upsertTrainerLessonProgress } from "@/actions/user-progress"
// // import { Separator } from "../../../components/ui/separator"
// // import { FinishTrainerStat } from "../../../components/finish-trainer-stat"
// // import { TgSendMsgCom } from "../../../components/tg-send-msg-com"
// // import { QuestionType } from "@/app/t-lesson/[t_lessonId]/page"
// // import { createEffect, StreakEffect } from "@/lib/streakEffects"
// // import { useRouter } from 'next/navigation'
// // import { AnimatedHearts } from "@/components/AnimatedHearts"
// // import { FINISH_AUDIO_SRC_LIST } from "@/constants"
// // import { LOTTIE_START_LIST, LOTTIE_EMOTION_RIGHT_LIST, getRandomLottie } from '@/src/constants/lottieConstants'
// // import { X } from "lucide-react"
// // import { useQuizAudio } from "@/app/hooks/useQuizAudio"

// // const startButton = ['Погнали!', 'Гоу!', 'Старт!', 'Поехали!', 'Поплыли!']

// // type Props = {
// //   t_lessonId: number,
// //   t_lessonTitle: string,
// //   questions1: QuestionType[],
// //   userName: string,
// // }

// // export default function TQuiz({
// //   t_lessonId,
// //   t_lessonTitle, 
// //   questions1,
// //   userName,
// // }: Props) {

// //   const router = useRouter()
  
// //   const [streak, setStreak] = useState(0)
// //   const [effect, setEffect] = useState<StreakEffect | null>(null)
// //   const [randomStartLottie, setRandomStartLottie] = useState(LOTTIE_START_LIST[0])
// //   const [randomStartButton, setRandomStartButton] = useState(startButton[0])
// //   const [randomEmotionLottie, setRandomEmotionLottie] = useState(LOTTIE_EMOTION_RIGHT_LIST[0])
// //   const [threeHearts, setThreeHearts] = useState(3)
// //   const [quizStarted, setQuizStarted] = useState(true)
// //   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
// //   const [score, setScore] = useState(0)
// //   const [quizCompleted, setQuizCompleted] = useState(false)
// //   const [answeredQuestions, setAnsweredQuestions] = useState(0)
// //   const { width, height } = useWindowSize()
  
// //   // Флаг для предотвращения двойной обработки
// //   const [isProcessing, setIsProcessing] = useState(false)
// //   // useRef для отслеживания обработанных вопросов (особенно важно для таймаутов)
// //   const processedQuestionsRef = useRef<Set<number>>(new Set())
// //   // Флаг для предотвращения двойного воспроизведения финального звука
// //   const hasPlayedFinishSoundRef = useRef(false)
  
// //   const [allQuestions, setAllQuestions] = useState(questions1)
// //   const [numQuestionsButton, setNumQuestionsButton] = useState(0)
// //   const [isRightPrevious, setIsRightPrevious] = useState(true)
// //   const questions = allQuestions
  
// //   const initialState: number[] = questions.map((el, index) => index == 0 ? 3 : 0)
// //   const [isRightList, setIsRightList] = useState(initialState)
// //   const [finishList, setFinishList] = useState([{
// //     question: '',
// //     answer: '',
// //     rightAnswer: '',
// //     isRight: true,
// //   }])

// //   const finishAudio = FINISH_AUDIO_SRC_LIST[Math.floor(Math.random() * FINISH_AUDIO_SRC_LIST.length)];
// //   const { play: playAudio } = useQuizAudio(finishAudio)
// //   const playCorrectSound = () => playAudio('correct')
// //   const playIncorrectSound = () => playAudio('incorrect')
// //   const playFinishSound = () => playAudio('finish')

// //   // Воспроизведение финального звука только один раз
// //   useEffect(() => {
// //     if (quizCompleted && !hasPlayedFinishSoundRef.current) {
// //       hasPlayedFinishSoundRef.current = true
// //       playFinishSound()
// //     }
// //   }, [quizCompleted, playFinishSound])

// //   useEffect(() => {
// //     setRandomStartLottie(getRandomLottie(LOTTIE_START_LIST))
// //     setRandomStartButton([...startButton].sort(() => 0.5 - Math.random())[0])
// //   }, [])

// //   useEffect(() => {
// //     if (threeHearts == 0 && !quizCompleted) {
// //       setQuizCompleted(true)
// //       upsertTrainerLessonProgress(t_lessonId, 0, 0, score, questions.length - score)
// //         .catch(() => toast.error('Что-то пошло не так! Результат не добавлен в базу данных.'))
// //     }
// //   }, [threeHearts, t_lessonId, questions.length, score, quizCompleted])

// //   const startQuiz = () => {
// //     setQuizStarted(true)
// //     setCurrentQuestionIndex(0)
// //     setScore(0)
// //     setQuizCompleted(false)
// //     setAnsweredQuestions(0)
// //     setThreeHearts(3)
// //     setStreak(0)
// //     setIsRightList(initialState)
// //     setFinishList([])
// //     setIsProcessing(false)
// //     processedQuestionsRef.current.clear()
// //     hasPlayedFinishSoundRef.current = false // Сбрасываем флаг звука при рестарте
// //   }

// //   function sleep(ms: number): Promise<void> {
// //     return new Promise((resolve) => setTimeout(resolve, ms))
// //   }

// //   // Общая функция для перехода к следующему вопросу
// //   const goToNextQuestion = async () => {
// //     if (currentQuestionIndex < questions.length - 1) {
// //       setCurrentQuestionIndex(currentQuestionIndex + 1)
// //     } else {
// //       setQuizCompleted(true)
// //       const doneRightPercent = Math.round(score / questions.length * 100)
// //       upsertTrainerLessonProgress(t_lessonId, doneRightPercent, 200, score, questions.length - score)
// //         .catch(() => toast.error('Что-то пошло не так! Результат не добавлен в базу данных.'))
// //     }
// //   }

// //   const handleAnswer = async (answer: string) => {
// //     // Защита от двойной обработки
// //     if (isProcessing || quizCompleted) return
    
// //     // Проверяем, не обработан ли уже этот вопрос
// //     if (processedQuestionsRef.current.has(currentQuestionIndex)) return
// //     processedQuestionsRef.current.add(currentQuestionIndex)
    
// //     setIsProcessing(true)

// //     try {
// //       setAnsweredQuestions(prev => prev + 1)

// //       let answerIsRight = false
// //       questions[currentQuestionIndex].questionType == 'ASSIST'
// //         ? answerIsRight = answer === questions[currentQuestionIndex].correctAnswer
// //         : answerIsRight = answer === "right"

// //       if (answerIsRight) {
// //         playCorrectSound()
// //         setIsRightPrevious(true)
// //         setRandomEmotionLottie(getRandomLottie(LOTTIE_EMOTION_RIGHT_LIST))

// //         setStreak(prev => {
// //           const newStreak = prev + 1
// //           if (newStreak === 3) {
// //             setEffect(createEffect(newStreak))
// //           }
// //           return newStreak
// //         })

// //         const body = document.querySelector("body")
// //         body?.classList.add("trainer-slide-up-transition")
// //         await sleep(200)

// //         setFinishList(oldArray => [...oldArray, {
// //           question: questions[currentQuestionIndex].question,
// //           answer: answer,
// //           rightAnswer: questions[currentQuestionIndex].correctAnswer,
// //           isRight: true,
// //         }])

// //         setScore(prev => prev + 1)

// //         let newArr = [...isRightList]
// //         newArr[currentQuestionIndex] = 1
// //         if (currentQuestionIndex < questions.length - 1) {
// //           newArr[currentQuestionIndex + 1] = 3
// //         }
// //         setIsRightList(newArr)
        
// //         await sleep(200)
// //         body?.classList.remove("trainer-slide-up-transition")
        
// //         await goToNextQuestion()
// //       } else {
// //         playIncorrectSound()
// //         setStreak(0)
        
// //         // Уменьшаем сердечки
// //         setThreeHearts(prev => prev - 1)
// //         setIsRightPrevious(false)
// //         setRandomEmotionLottie(getRandomLottie(LOTTIE_EMOTION_RIGHT_LIST))

// //         const body = document.querySelector("body")
// //         body?.classList.add("trainer-slide-down-transition")
// //         await sleep(200)

// //         setFinishList(oldArray => [...oldArray, {
// //           question: questions[currentQuestionIndex].question,
// //           answer: answer,
// //           rightAnswer: questions[currentQuestionIndex].correctAnswer,
// //           isRight: false,
// //         }])

// //         let newArr = [...isRightList]
// //         newArr[currentQuestionIndex] = 2
// //         if (currentQuestionIndex < questions.length - 1) {
// //           newArr[currentQuestionIndex + 1] = 3
// //         }
// //         setIsRightList(newArr)

// //         await sleep(200)
// //         body?.classList.remove("trainer-slide-down-transition")
        
// //         // Если сердечки не закончились, переходим к следующему вопросу
// //         if (threeHearts > 1) {
// //           await goToNextQuestion()
// //         } else {
// //           // Сердечки закончились, завершаем квиз
// //           setQuizCompleted(true)
// //           upsertTrainerLessonProgress(t_lessonId, 0, 0, score, questions.length - score)
// //             .catch(() => toast.error('Что-то пошло не так! Результат не добавлен в базу данных.'))
// //         }
// //       }
// //     } finally {
// //       setIsProcessing(false)
// //     }
// //   }

// //   const handleTimeout = async () => {
// //     // Защита от двойной обработки
// //     if (isProcessing || quizCompleted) return
    
// //     // Проверяем, не обработан ли уже этот вопрос (ключевая защита для таймаутов)
// //     if (processedQuestionsRef.current.has(currentQuestionIndex)) return
// //     processedQuestionsRef.current.add(currentQuestionIndex)
    
// //     setIsProcessing(true)

// //     try {
// //       playIncorrectSound()
      
// //       setAnsweredQuestions(prev => prev + 1)
      
// //       const newHearts = threeHearts - 1
// //       setThreeHearts(newHearts)
      
// //       setStreak(0)
// //       setIsRightPrevious(false)
// //       setRandomEmotionLottie(getRandomLottie(LOTTIE_EMOTION_RIGHT_LIST))

// //       setFinishList(prev => [...prev, {
// //         question: questions[currentQuestionIndex].question,
// //         answer: "Время вышло",
// //         rightAnswer: questions[currentQuestionIndex].correctAnswer,
// //         isRight: false,
// //       }])

// //       const newArr = [...isRightList]
// //       newArr[currentQuestionIndex] = 2
// //       if (currentQuestionIndex < questions.length - 1) {
// //         newArr[currentQuestionIndex + 1] = 3
// //       }
// //       setIsRightList(newArr)

// //       // Если сердечки стали 0, завершаем квиз
// //       if (newHearts <= 0) {
// //         setQuizCompleted(true)
// //         upsertTrainerLessonProgress(t_lessonId, 0, 0, score, questions.length - score)
// //           .catch(() => toast.error('Что-то пошло не так! Результат не добавлен в базу данных.'))
// //         return
// //       }

// //       // Переход к следующему вопросу
// //       if (currentQuestionIndex < questions.length - 1) {
// //         setCurrentQuestionIndex(prev => prev + 1)
// //       } else {
// //         setQuizCompleted(true)
// //         const doneRightPercent = Math.round(score / questions.length * 100)
// //         upsertTrainerLessonProgress(t_lessonId, doneRightPercent, 200, score, questions.length - score)
// //           .catch(() => toast.error('Что-то пошло не так! Результат не добавлен в базу данных.'))
// //       }
// //     } finally {
// //       setIsProcessing(false)
// //     }
// //   }

// //   const handleFinishLesson = () => {
// //     setQuizCompleted(true)
// //     requestAnimationFrame(() => {
// //       requestAnimationFrame(() => {
// //         router.push('/trainer')
// //       })
// //     })
// //   }

// //   if (quizCompleted) {
// //     const isPerfectScore = score === questions.length
// //     const numQuestions = finishList.length
// //     const numQuestionsRight = finishList.filter(el => el.isRight).length
// //     const message = `✅ ${userName}  ${t_lessonTitle} ${numQuestionsRight - 1} / ${numQuestions - 1}`

// //     return (
// //       <>
// //         <div className="text-center content-center mx-auto">
// //           <h1 className="text-3xl font-bold mb-6">
// //             {t_lessonTitle}
// //           </h1>
// //           <TgSendMsgCom message={message} />
// //           <h2 className="text-2xl font-bold mb-4">Завершено!</h2>
// //           {isPerfectScore && <Confetti width={width} height={height} />}
// //           <p className={`text-xl ${isPerfectScore ? "text-green-600 font-bold" : ""}`}>
// //             Правильно {score} из {questions.length}
// //           </p>
// //           <Lottie 
// //             animationData={score / questions.length < 0.8 ? LottieTrainerSharkFailDNO : LottieTrainerSharkFinalWin} 
// //             className="h-80 w-80 mx-auto"
// //           />
// //           <Button onClick={startQuiz} className="mt-4" variant='primary'>Давай по новой</Button>
// //           <div>
// //             <Button className='mt-4' variant='primaryOutline' onClick={handleFinishLesson}>Завершить</Button>
// //           </div>
// //           <div className="pt-8">
// //             <Separator />
// //           </div>
// //           <FinishTrainerStat finishList={finishList} />
// //         </div>
// //       </>
// //     )
// //   }

// //   return (
// //     <>
// //       <WinStreakModal effect={effect} onClose={() => setEffect(null)} />
// //       <div className="w-full max-w-xl mx-auto text-center">
// //         <TrainerQuestion
// //           questions={questions}
// //           question={questions[currentQuestionIndex]} 
// //           onAnswer={handleAnswer} 
// //           onTimeout={handleTimeout} 
// //           isRightList={isRightList}
// //           isRightPrevious={isRightPrevious}
// //           randomEmotionLottie={randomEmotionLottie}
// //           setThreeHearts={setThreeHearts}
// //           threeHearts={threeHearts}
// //         />
// //         <div className="mt-8">
// //           <AnimatedHearts hearts={threeHearts} />
// //         </div>
// //         <div className="mt-4 text-center">
// //           <Button 
// //             variant='dangerOutline'
// //             className="gap-2"
// //             onClick={() => window.location.href = `/trainer`}
// //           >
// //             <X size='18' />
// //             завершить
// //           </Button>
// //         </div>
// //       </div>
// //     </>
// //   )
// // }
