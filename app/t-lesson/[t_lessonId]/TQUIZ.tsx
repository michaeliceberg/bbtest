// app/t-lesson/[t_lessonId]/TQUIZ.tsx

"use client"

import React, { useEffect, useState, useRef, useCallback } from "react"
import { motion } from "framer-motion"
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
import { isCorrectAnswer } from "@/usefulFunctions"
import { LOTTIE_START_LIST, LOTTIE_EMOTION_RIGHT_LIST, getRandomLottie } from '@/src/constants/lottieConstants'
import { X, PencilLine, Gift } from "lucide-react"
import { useQuizAudio } from "@/app/hooks/useQuizAudio"
import { completeTrainerQuestLesson, reportLessonQuestSignals } from "@/actions/generate-trainer-quest"
import { awardHotQuestionReward } from "@/actions/award-hot-question-reward"
import { ChestReward } from "@/components/ChestReward"
import { TrainerQuestRewardsScreen, QuestRewardsData } from "@/components/trainer-quest-rewards-screen"
import { useAchievementStore } from "@/store/use-achievement-store"
import { useStreakCelebrationStore } from "@/store/use-streak-celebration-store"

// "Горячий вопрос" (questionType 'HOT', см. type-hot.tsx) — факультативный,
// не входит в счёт/сердечки/работу над ошибками (см. handleAnswer). Везде,
// где "questions.length"/"questions1.length" использовался для решения
// "идеальный ли результат"/"сколько из скольки" — нужно считать БЕЗ него,
// иначе даже безупречный проход всех РЕАЛЬНЫХ вопросов не засчитывался бы
// как 100% (HOT никогда не увеличивает score, но раньше учитывался в
// знаменателе).
const scorableCount = (arr: QuestionType[]) => arr.filter((q) => q.questionType !== 'HOT').length

// Рубежи серии правильных ответов подряд, на которые показывается
// молния + полноэкранное поздравление (StreakLightning/
// StreakCelebrationScreen) — в отличие от ComboBanner (маленький
// баннер на x5/x10/...), которая не сбрасывает streak. Раньше был
// только один рубеж (3), и закрытие поздравления сбрасывало streak в
// 0 — из-за этого при непрерывной серии 6 подряд пользователь видел
// один и тот же экран "3 подряд" ДВАЖДЫ (на реальных 3-м и 6-м верных
// ответах), а не разные экраны на 3-м и 7-м. Теперь streak не
// сбрасывается на самом поздравлении (только на неверном ответе/
// таймауте), поэтому каждый рубеж встречается ровно один раз за
// непрерывную серию.
const STREAK_MILESTONES = [3, 7] as const

const startButton = ['Погнали!', 'Гоу!', 'Старт!', 'Поехали!', 'Поплыли!']

// Отдельный подарок ПОСЛЕ всего урока за угаданный "горячий вопрос" (см.
// type-hot.tsx) — награда начисляется здесь, в момент показа финального
// экрана, а не сразу в самом вопросе (по просьбе пользователя). Ref-guard
// внутри самого себя (не в родителе) — этот компонент монтируется РОВНО
// один раз за показ финального экрана, повторный awardHotQuestionReward()
// при случайном re-render (в т.ч. React StrictMode double-invoke) не
// нужен.
function HotBonusPanel() {
  const [gems, setGems] = useState<number | null>(null)
  const awardedRef = useRef(false)

  useEffect(() => {
    if (awardedRef.current) return
    awardedRef.current = true
    awardHotQuestionReward()
      .then((res) => { if (res.success) setGems(res.gems ?? 0) })
      .catch(() => {})
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="flex items-center justify-center gap-2 mx-auto mt-4 mb-2 w-fit px-4 py-2 rounded-full bg-[#3A2A1B] border border-[#EF9F27]"
    >
      <Gift className="w-5 h-5 text-[#EF9F27]" />
      <span className="text-sm font-bold text-[#EF9F27]">
        Бонус за горячий вопрос{gems !== null ? `: +${gems} монет` : '…'}
      </span>
    </motion.div>
  )
}

type Props = {
  t_lessonId: number,
  t_lessonTitle: string,
  questions1: QuestionType[],
  userName: string,
  stage?: number | null,
  isBossStage?: boolean,
}

export default function TQuiz({
  t_lessonId,
  t_lessonTitle,
  questions1,
  userName,
  stage,
  isBossStage,
}: Props) {

  const router = useRouter()
  const searchParams = useSearchParams()
  const showAchievement = useAchievementStore((state) => state.showAchievement)
  // Название с префиксом "daily" не просто так — showStreakCelebration/
  // setShowStreakCelebration (state ниже) уже заняты СОВСЕМ другим
  // понятием: внутриурочная серия "3/7 ПОДРЯД" (STREAK_MILESTONES), а
  // это — курсовый ударный режим по ДНЯМ (см. lib/streak.ts). Разные
  // механики, случайно совпавшее название переменной.
  const triggerDailyStreakToast = useStreakCelebrationStore((state) => state.showStreakCelebration)
  const fromQuest = searchParams.get('fromQuest') === 'true'
  const tCourseId = searchParams.get('tCourseId') ? parseInt(searchParams.get('tCourseId')!) : null
  
  const [streak, setStreak] = useState(0)
  const [effect, setEffect] = useState<StreakEffect | null>(null)
  const [combo, setCombo] = useState<number | null>(null)
  const [showLightning, setShowLightning] = useState(false)
  const [showStreakCelebration, setShowStreakCelebration] = useState(false)
  // Какой именно рубеж серии сейчас празднуем — 3 или 7 (см.
  // STREAK_MILESTONES ниже). Молния/экран поздравления — общие
  // компоненты на оба рубежа, отличается только текст/акцентный цвет.
  const [celebrationMilestone, setCelebrationMilestone] = useState(3)
  const [randomStartLottie, setRandomStartLottie] = useState(LOTTIE_START_LIST[0])
  const [randomStartButton, setRandomStartButton] = useState(startButton[0])
  const [randomEmotionLottie, setRandomEmotionLottie] = useState(LOTTIE_EMOTION_RIGHT_LIST[0])
  const [threeHearts, setThreeHearts] = useState(3)
  const [quizStarted, setQuizStarted] = useState(true)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [showChestReward, setShowChestReward] = useState(false)
  // Промежуточный экран "ближайших наград" (components/trainer-quest-
  // rewards-screen.tsx) — показывается ПЕРЕД showChestReward на идеальном
  // результате, см. goToNextQuestion.
  const [showQuestRewardsScreen, setShowQuestRewardsScreen] = useState(false)
  const [questRewardsData, setQuestRewardsData] = useState<QuestRewardsData>(null)
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
  // Ref-дубликат score: goToNextQuestion вызывается из handleAnswer сразу
  // после setScore(prev => prev+1) в той же самой async-функции (после
  // await sleep) — замыкание goToNextQuestion в этот момент ещё держит
  // старое значение score (React не подменяет его посреди уже запущенного
  // вызова). Ref обновляется синхронно вместе с setScore, поэтому всегда
  // актуален на момент чтения.
  const scoreRef = useRef(0)
  // Наибольшая серия подряд верных ответов ВНУТРИ этой попытки — нужна для
  // квеста "5 подряд в 2 уроках" на экране ближайших наград (см.
  // reportLessonQuestSignals). Отдельно от trainerStreaks (стрик по ДНЯМ) и
  // от streak (текущая, сбрасываемая серия) — именно МАКСИМУМ за попытку.
  const maxStreakRef = useRef(0)

  // "Работа над ошибками" — по завершении обычного прохода, если были
  // неверные ответы, урок не заканчивается, а повторяет именно эти
  // вопросы новым раундом, пока пользователь не ответит на все верно
  // (см. goToNextQuestion). mistakeQueueRef собирает ошибки ТЕКУЩЕГО
  // раунда (первого прохода или уже раунда повтора) — очищается и снова
  // наполняется на каждом новом раунде. Только ref (не state) — сама
  // очередь нигде не рендерится, важно только актуальное значение сразу
  // после handleAnswer/handleTimeout, до следующего рендера (тот же
  // паттерн, что уже применяется для isRightListRef/scoreRef).
  const [isReviewRound, setIsReviewRound] = useState(false)
  const isReviewRoundRef = useRef(false)
  const mistakeQueueRef = useRef<QuestionType[]>([])
  // Номер раунда (0 = основной проход, 1+ = раунды повтора) — прокидывается
  // в TrainerQuestion как roundKey: каждый раунд начинается заново с
  // currentQuestionIndex=0, а questions.indexOf(question) в самом
  // TrainerQuestion — это позиция в массиве, не identity вопроса, поэтому
  // без roundKey два РАЗНЫХ вопроса на одной позиции в соседних раундах
  // получили бы один и тот же remount-key.
  const [roundNumber, setRoundNumber] = useState(0)

  // "Горячий вопрос" — угадал реальную величину с точностью до 50% (см.
  // type-hot.tsx) → отдельный подарок ПОСЛЕ всего урока (не сразу), см.
  // экран "Завершено!" ниже. Ref — тот же паттерн, что и у mistakeQueueRef
  // (goToNextQuestion читает актуальное значение сразу после handleAnswer).
  const [hotQuestionWon, setHotQuestionWon] = useState(false)
  const hotQuestionWonRef = useRef(false)

  const [allQuestions, setAllQuestions] = useState(questions1)
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

  // Меняем маскота при смене вопроса
  useEffect(() => {
    setRandomEmotionLottie(getRandomLottie(LOTTIE_EMOTION_RIGHT_LIST))
  }, [currentQuestionIndex])

  useEffect(() => {
    if (threeHearts == 0 && !quizCompleted) {
      setQuizCompleted(true)
      upsertTrainerLessonProgress(t_lessonId, 0, 0, score, scorableCount(questions) - score, stage)
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
    scoreRef.current = 0
    setQuizCompleted(false)
    setShowChestReward(false)
    setShowQuestRewardsScreen(false)
    setQuestRewardsData(null)
    maxStreakRef.current = 0
    setAnsweredQuestions(0)
    setThreeHearts(3)
    setStreak(0)
    // allQuestions мог остаться на "работе над ошибками" (укороченный
    // набор только неверных вопросов) — рестарт должен идти с ПОЛНОГО
    // исходного набора урока, не с этого остатка. isRightList считаем от
    // questions1.length напрямую (initialState в этот момент ещё
    // высчитан от старого/укороченного allQuestions).
    setAllQuestions(questions1)
    setIsRightList(questions1.map((el, index) => index === 0 ? 3 : 0))
    setIsReviewRound(false)
    isReviewRoundRef.current = false
    mistakeQueueRef.current = []
    setRoundNumber(0)
    setFinishList([])
    setIsProcessing(false)
    processedQuestionsRef.current.clear()
    hasPlayedFinishSoundRef.current = false
    hasUpdatedQuestRef.current = false
    setHotQuestionWon(false)
    hotQuestionWonRef.current = false
  }, [questions1])

  // Сбрасываем isRightPrevious при смене вопроса
  useEffect(() => {
    setIsRightPrevious(null)
  }, [currentQuestionIndex])

  const sleep = useCallback((ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }, [])

  // Начинает новый раунд "работы над ошибками" из накопленных за только
  // что законченный раунд неверных ответов — общая логика для конца
  // первого прохода и конца КАЖДОГО следующего раунда повтора.
  const startMistakeReviewRound = useCallback(() => {
    const nextRoundQuestions = mistakeQueueRef.current
    mistakeQueueRef.current = []
    setAllQuestions(nextRoundQuestions)
    setCurrentQuestionIndex(0)
    setIsRightList(nextRoundQuestions.map((el, index) => index === 0 ? 3 : 0))
    setIsReviewRound(true)
    isReviewRoundRef.current = true
    setRoundNumber(prev => prev + 1)
    processedQuestionsRef.current.clear()
  }, [])

  const goToNextQuestion = useCallback(async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      return
    }

    // Конец текущего раунда. DB-запись и решение "сундук/не сундук"
    // считаются ТОЛЬКО по итогам первого (основного) прохода —
    // score/finishList дальше в раундах "работы над ошибками" не
    // трогаются (см. handleAnswer/handleTimeout), поэтому это решение
    // корректно независимо от того, потребуется ли ещё повтор.
    if (!isReviewRoundRef.current) {
      const finalScore = scoreRef.current
      const total = scorableCount(questions)
      console.log('🏁 Основной проход завершён! score:', finalScore, 'total (без HOT):', total)
      const doneRightPercent = Math.round(finalScore / total * 100)

      const progressResult = await upsertTrainerLessonProgress(t_lessonId, doneRightPercent, 200, finalScore, total - finalScore, stage)
        .catch(() => {
          toast.error('Что-то пошло не так! Результат не добавлен в базу данных.')
          return null
        })
      if (progressResult?.leveledUp) {
        const gemsPart = progressResult.levelUpGems ? ` +${progressResult.levelUpGems}💎` : ''
        toast.success(`🎊 Новый уровень! Теперь ты на Ур. ${progressResult.newLevel}${gemsPart}`, { duration: 4000 })
      }
      // Урок тренажёра продлевает ТОТ ЖЕ курсовый стрик, что и задачи в
      // задачнике (см. lib/streak.ts) — streakExtended==true только если
      // это первый успех за сегодня, продливший серию на новый день.
      if (progressResult?.streakExtended && progressResult.newStreak) {
        triggerDailyStreakToast(progressResult.newStreak)
      }
      progressResult?.newAchievements?.forEach((ach) => showAchievement(ach))
      await updateQuestProgress()

      // Идеальный результат — mistakeQueue по построению пуст (ни одной
      // ошибки не было). Перед сундуком — экран ближайших наград
      // (см. components/trainer-quest-rewards-screen.tsx); сам сундук
      // открывается по клику на его кнопке (см. onOpenChest ниже).
      if (finalScore === total) {
        console.log('✅ Идеальный результат — показываем экран наград')
        const rewards = await reportLessonQuestSignals(t_lessonId, maxStreakRef.current).catch(() => null)
        setQuestRewardsData(rewards)
        setShowQuestRewardsScreen(true)
        return
      }
    }

    // Остались невыученные ошибки за только что законченный раунд —
    // "работа над ошибками" вместо завершения урока.
    if (mistakeQueueRef.current.length > 0) {
      console.log('📝 Работа над ошибками:', mistakeQueueRef.current.length, 'вопрос(ов)')
      startMistakeReviewRound()
      return
    }

    // Ошибок для повтора больше нет (либо их не было вовсе, либо "работа
    // над ошибками" только что успешно закончилась) — финальный экран.
    setQuizCompleted(true)
  }, [currentQuestionIndex, questions.length, t_lessonId, updateQuestProgress, startMistakeReviewRound])

  const handleAnswer = useCallback(async (answer: string) => {
    // Для ASSIST: если это "next", просто переходим к следующему вопросу
    if (answer === "next") {
      await goToNextQuestion()
      return
    }

    if (isProcessing || quizCompleted) return
    if (processedQuestionsRef.current.has(currentQuestionIndex)) return
    processedQuestionsRef.current.add(currentQuestionIndex)

    // "Горячий вопрос" — факультативный, НЕ входит в счёт/сердечки/
    // finishList/работу над ошибками (см. type-hot.tsx: сам компонент уже
    // показал пользователю результат — верно/неверно, правильный ответ,
    // конфетти — прежде чем вызвать onAnswer). Здесь только запоминаем
    // успех (для подарка на экране "Завершено!", см. ниже) и переходим
    // дальше отдельной, короткой веткой — ничего из основной логики ниже
    // не должно её касаться.
    if (questions[currentQuestionIndex].questionType === 'HOT') {
      setIsProcessing(true)
      if (answer === 'right') {
        setHotQuestionWon(true)
        hotQuestionWonRef.current = true
      }
      await goToNextQuestion()
      setIsProcessing(false)
      return
    }

    setIsProcessing(true)

    try {
      setAnsweredQuestions(prev => prev + 1)

      // ASSIST и INSERT — двухшаговый флоу (выбор варианта, потом
      // отдельный клик "далее"/"понятно"), ответ сравнивается с
      // correctAnswer. Остальные типы (CONNECT и т.д.) шлют "right"/"wrong"
      // напрямую и переходят к следующему вопросу автоматически.
      const isSelectThenSubmitType = questions[currentQuestionIndex].questionType === 'ASSIST'
        || questions[currentQuestionIndex].questionType === 'INSERT'
        || questions[currentQuestionIndex].questionType === 'SCROLL'

      // INSERT сравнивается ровно (answer — отсортированный набор букв,
      // все обязательны, см. type-insert.tsx) — множественный "|"-ответ
      // (см. usefulFunctions.isCorrectAnswer) для него не применим и не
      // используется. Остальные select-then-submit типы (ASSIST/SCROLL) —
      // через isCorrectAnswer, чтобы принимать любой из нескольких верных
      // синонимов (например, "Дж" — и работа, и энергия).
      let answerIsRight = false
      isSelectThenSubmitType
        ? answerIsRight = questions[currentQuestionIndex].questionType === 'INSERT'
          ? answer === questions[currentQuestionIndex].correctAnswer
          : isCorrectAnswer(answer, questions[currentQuestionIndex].correctAnswer)
        : answerIsRight = answer === "right"

      if (answerIsRight) {
        // Для CONNECT звук и анимация уже были в handleAllPairsMatched
        if (questions[currentQuestionIndex].questionType !== 'CONNECT') {
          playCorrectSound()
          setIsRightPrevious(true)
        }
        setRandomEmotionLottie(getRandomLottie(LOTTIE_EMOTION_RIGHT_LIST))

        setStreak(prev => {
          const newStreak = prev + 1
          if (newStreak > maxStreakRef.current) maxStreakRef.current = newStreak
          if ((STREAK_MILESTONES as readonly number[]).includes(newStreak)) {
            setCelebrationMilestone(newStreak)
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

        // finishList/score — только результат ОСНОВНОГО прохода (см.
        // "Работа над ошибками" выше): в раундах повтора не трогаем, иначе
        // повторно верный ответ на уже проваленный вопрос задвоил бы счёт
        // и историю первого прохода.
        if (!isReviewRoundRef.current) {
          setFinishList(oldArray => [...oldArray, {
            question: questions[currentQuestionIndex].question,
            answer: answer,
            rightAnswer: questions[currentQuestionIndex].correctAnswer,
            isRight: true,
          }])

          setScore(prev => prev + 1)
          scoreRef.current += 1
        }

        let newArr = [...(isRightListRef.current || isRightList)]
        newArr[currentQuestionIndex] = 1
        if (currentQuestionIndex < questions.length - 1) {
          newArr[currentQuestionIndex + 1] = 3
        }
        setIsRightList(newArr)
        isRightListRef.current = newArr

        await sleep(400)

        // Для ASSIST/INSERT не переходим автоматически - ждем клика на кнопку "далее"
        if (!isSelectThenSubmitType) {
          await goToNextQuestion()
        }
      } else {
        playIncorrectSound()
        setStreak(0)

        // Вопрос уходит в очередь "работы над ошибками" ВСЕГДА (и в
        // основном проходе, и уже внутри самого раунда повтора — так
        // повторно проваленный вопрос снова встанет в очередь следующего
        // раунда, а не потеряется).
        mistakeQueueRef.current = [...mistakeQueueRef.current, questions[currentQuestionIndex]]

        // Сердечки и история (finishList) — только на основном проходе.
        // В раунде повтора жизни специально не тратятся (иначе пришлось
        // бы отдельно разбираться, что значит "закончились жизни во время
        // работы над ошибками" — сама механика жизней тут не нужна,
        // достаточно продолжать до чистого результата).
        if (!isReviewRoundRef.current) {
          setThreeHearts(prev => prev - 1)
          setFinishList(oldArray => [...oldArray, {
            question: questions[currentQuestionIndex].question,
            answer: answer,
            rightAnswer: questions[currentQuestionIndex].correctAnswer,
            isRight: false,
          }])
        }
        setIsRightPrevious(false)
        setRandomEmotionLottie(getRandomLottie(LOTTIE_EMOTION_RIGHT_LIST))

        let newArr = [...(isRightListRef.current || isRightList)]
        newArr[currentQuestionIndex] = 2
        if (currentQuestionIndex < questions.length - 1) {
          newArr[currentQuestionIndex + 1] = 3
        }
        setIsRightList(newArr)
        isRightListRef.current = newArr

        await sleep(400)

        // Для ASSIST/INSERT не переходим автоматически - ждем клика на кнопку "понятно"
        if (!isSelectThenSubmitType) {
          if (isReviewRoundRef.current || threeHearts > 1) {
            await goToNextQuestion()
          } else {
            setQuizCompleted(true)
          }
        } else {
          // Для ASSIST/INSERT - если жизней осталось 0, завершаем (не в
          // раунде повтора — там жизни не тратятся и не проверяются).
          if (!isReviewRoundRef.current && threeHearts <= 1) {
            setQuizCompleted(true)
            await upsertTrainerLessonProgress(t_lessonId, 0, 0, score, questions.length - score, stage)
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

      // Таймаут — тот же "неверный ответ", вопрос уходит в очередь
      // "работы над ошибками" (см. handleAnswer выше).
      mistakeQueueRef.current = [...mistakeQueueRef.current, questions[currentQuestionIndex]]

      // Жизни/finishList — только на основном проходе, не в раунде
      // повтора (та же логика, что в handleAnswer).
      let newHearts = threeHearts
      if (!isReviewRoundRef.current) {
        newHearts = threeHearts - 1
        setThreeHearts(newHearts)
        setFinishList(prev => [...prev, {
          question: questions[currentQuestionIndex].question,
          answer: "Время вышло",
          rightAnswer: questions[currentQuestionIndex].correctAnswer,
          isRight: false,
        }])
      }

      setStreak(0)
      setIsRightPrevious(false)
      setRandomEmotionLottie(getRandomLottie(LOTTIE_EMOTION_RIGHT_LIST))

      const newArr = [...isRightList]
      newArr[currentQuestionIndex] = 2
      if (currentQuestionIndex < questions.length - 1) {
        newArr[currentQuestionIndex + 1] = 3
      }
      setIsRightList(newArr)
      isRightListRef.current = newArr

      if (!isReviewRoundRef.current && newHearts <= 0) {
        setQuizCompleted(true)
        await upsertTrainerLessonProgress(t_lessonId, 0, 0, score, questions.length - score, stage)
          .catch(() => toast.error('Что-то пошло не так! Результат не добавлен в базу данных.'))
        await updateQuestProgress()
        return
      }

      // Дальше — та же логика "конец раунда" (переход к следующему
      // вопросу / DB-запись / работа над ошибками / завершение), что и
      // после явного неверного ответа — см. goToNextQuestion.
      await goToNextQuestion()
    } finally {
      setIsProcessing(false)
    }
  }, [
    isProcessing, quizCompleted, currentQuestionIndex, questions,
    playIncorrectSound, threeHearts, score, t_lessonId, updateQuestProgress, goToNextQuestion, isRightList
  ])

  const handleFinishLesson = useCallback(() => {
    setQuizCompleted(true)
    setShowChestReward(false)
    updateQuestProgress()
    requestAnimationFrame(() => {
      router.push('/trainer')
    })
  }, [updateQuestProgress, router])

  const handleChestOpened = useCallback(() => {
    setShowChestReward(false)
    // После клика на сундук - показываем финальный экран
    setQuizCompleted(true)
  }, [])

  console.log('Рендер: quizCompleted:', quizCompleted, 'showChestReward:', showChestReward)

  if (showQuestRewardsScreen) {
    return (
      <TrainerQuestRewardsScreen
        data={questRewardsData}
        onOpenChest={() => {
          setShowQuestRewardsScreen(false)
          setShowChestReward(true)
        }}
      />
    )
  }

  if (showChestReward) {
    console.log('🎁 Показываем сундук! showChestReward:', showChestReward)
    return (
      <div className="w-full max-w-xl mx-auto py-8">
        <ChestReward
          onChestClicked={handleChestOpened}
        />
      </div>
    )
  }

  if (quizCompleted) {
    console.log('📊 Показываем финальный экран')
    // score/finishList заморожены на результатах ОСНОВНОГО прохода (см.
    // "Работа над ошибками" выше) — но questions/questions.length к этому
    // моменту могут указывать на последний (укороченный) раунд повтора,
    // не на исходный набор урока. Для итогового счёта берём questions1
    // (стабильный проп, всегда полный исходный список) БЕЗ "горячего
    // вопроса" — он не входит в счёт, см. scorableCount выше.
    const totalScorable = scorableCount(questions1)
    const isPerfectScore = score === totalScorable
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
          {(isPerfectScore || hotQuestionWon) && <Confetti width={width} height={height} />}
          <p className={`text-xl ${isPerfectScore ? "text-green-600 font-bold" : ""}`}>
            Правильно {score} из {totalScorable}
          </p>
          {hotQuestionWon && <HotBonusPanel />}
          <Lottie
            animationData={score / totalScorable < 0.8 ? LottieTrainerSharkFailDNO : LottieTrainerSharkFinalWin}
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
        count={celebrationMilestone}
      />
      <ComboBanner combo={combo} onDone={() => setCombo(null)} />

      {showStreakCelebration ? (
        <StreakCelebrationScreen
          animationData={LottiePaperFly}
          milestone={celebrationMilestone}
          onNext={async () => {
            setShowStreakCelebration(false)
            // Streak НЕ сбрасываем здесь — см. STREAK_MILESTONES выше:
            // иначе следующий рубеж (7) никогда не наступит, серия
            // сбрасывается только на неверном ответе/таймауте.
            await goToNextQuestion()
          }}
        />
      ) : (
        <div className="w-full max-w-xl mx-auto text-center">
          {isReviewRound && (
            // Раньше — синяя овальная "таблетка" (rounded-full). По просьбе
            // пользователя ("не овальная, более премиально, не синий цвет")
            // — форма ленты-медали (clip-path с заострёнными краями вместо
            // rounded-full) + бронзово-золотой градиент вместо синего.
            // Лёгкий блик (shine), пробегающий один раз при появлении —
            // тот самый "премиальный" акцент, тот же приём анимации, что
            // уже используется в проекте (motion.div поверх статичного
            // фона, не требует AnimatePresence).
            <motion.div
              key={isReviewRound ? 'review-banner' : 'no-banner'}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative mb-4 mx-auto w-fit overflow-hidden"
              style={{
                clipPath: 'polygon(14px 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0 50%)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
              }}
            >
              <div
                className="flex items-center justify-center gap-2 py-2.5 px-8"
                style={{ background: 'linear-gradient(135deg, #8A5A28 0%, #E0B563 45%, #8A5A28 100%)' }}
              >
                <PencilLine className="w-4 h-4 text-[#3A2410] relative z-10" />
                <span className="text-sm font-black text-[#3A2410] uppercase tracking-wide relative z-10">
                  Работа над ошибками
                </span>
              </div>
              <motion.div
                className="absolute inset-y-0 w-1/3 pointer-events-none"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)' }}
                initial={{ x: '-120%' }}
                animate={{ x: '320%' }}
                transition={{ duration: 1.1, delay: 0.3, ease: 'easeInOut' }}
              />
            </motion.div>
          )}
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
            score={score}
            isBossStage={isBossStage}
            roundKey={roundNumber}
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
//       upsertTrainerLessonProgress(t_lessonId, 0, 0, score, questions.length - score, stage)
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
//       await upsertTrainerLessonProgress(t_lessonId, doneRightPercent, 200, score, questions.length - score, stage)
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
//           await upsertTrainerLessonProgress(t_lessonId, 0, 0, score, questions.length - score, stage)
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
//         await upsertTrainerLessonProgress(t_lessonId, 0, 0, score, questions.length - score, stage)
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
//         await upsertTrainerLessonProgress(t_lessonId, doneRightPercent, 200, score, questions.length - score, stage)
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
// //       upsertTrainerLessonProgress(t_lessonId, 0, 0, score, questions.length - score, stage)
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
// //       upsertTrainerLessonProgress(t_lessonId, doneRightPercent, 200, score, questions.length - score, stage)
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
// //           upsertTrainerLessonProgress(t_lessonId, 0, 0, score, questions.length - score, stage)
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
// //         upsertTrainerLessonProgress(t_lessonId, 0, 0, score, questions.length - score, stage)
// //           .catch(() => toast.error('Что-то пошло не так! Результат не добавлен в базу данных.'))
// //         return
// //       }

// //       // Переход к следующему вопросу
// //       if (currentQuestionIndex < questions.length - 1) {
// //         setCurrentQuestionIndex(prev => prev + 1)
// //       } else {
// //         setQuizCompleted(true)
// //         const doneRightPercent = Math.round(score / questions.length * 100)
// //         upsertTrainerLessonProgress(t_lessonId, doneRightPercent, 200, score, questions.length - score, stage)
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
