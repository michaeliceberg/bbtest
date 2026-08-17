// app/lesson/quiz.tsx

'use client';

import { motion, AnimatePresence } from "framer-motion";
import { SuperType, challengeOptions, challengeProgress, challenges } from "@/db/schema";
import { useEffect, useState, useTransition, useRef } from "react";
import { Header } from "./header";
import { QuestionBubble } from "./question-bubble";
import { Challenge } from "./challenge";
import { Footer } from "./footer";
import { upsertChallengeProgress } from "@/actions/challenge-progress";
import { toast } from "sonner";
import { useWindowSize, useMount } from "react-use";

import Image from "next/image";
import { ResultCard } from "./result-card";
import { useRouter } from "next/navigation";
import Confetti from 'react-confetti'
import { useHeartsModal } from "@/store/use-hearts-modal";
import { usePracticeModal } from "@/store/use-practice-modal";
import { Button } from "@/components/ui/button";
import { useWrongAnswerModal } from "@/store/use-wronganswer-modal";
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
    hwChallengeIds?: number[]
    courseId: number
    unitColor: { button: string; bottom: string }
}

const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
};

// Анимационные варианты для контента
const contentVariants = {
    initial: (direction: number) => ({
        opacity: 0,
        x: direction > 0 ? 40 : -40,
        y: 0,
    }),
    animate: {
        opacity: 1,
        x: 0,
        y: 0,
        transition: {
            type: "tween",
            duration: 0.25,
            ease: "easeInOut"
        }
    },
    exit: (direction: number) => ({
        opacity: 0,
        x: direction > 0 ? -40 : 40,
        y: 0,
        transition: {
            duration: 0.2
        }
    })
};

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
    hwChallengeIds,
    courseId,
    unitColor,
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

    const finishAudioRef = useRef<HTMLAudioElement | null>(null)
    const correctAudioRef = useRef<HTMLAudioElement | null>(null)
    const incorrectAudioRef = useRef<HTMLAudioElement | null>(null)

    const [pending, startTransition] = useTransition()
    const [lessonId] = useState(initialLessonId)
    const [hearts, setHearts] = useState(initialHearts)
    const [percentage, setPercentage] = useState(() => {
        return initialPercentage === 100 ? 0 : initialPercentage
    })
    const [challenges] = useState(initialLessonChallenges)
    const [showMascotCorrect, setShowMascotCorrect] = useState(false)
    const [showMascotWrong, setShowMascotWrong] = useState(false)
    const [animationDirection, setAnimationDirection] = useState(1)

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
    const isHWChallenge = hwChallengeIds?.includes(challenge?.id) ?? false;

    // Инициализация аудио
    useEffect(() => {
        finishAudioRef.current = new Audio('/finish.wav')
        correctAudioRef.current = new Audio('/correct.wav')
        incorrectAudioRef.current = new Audio('/incorrect.wav')

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

    useEffect(() => {
        if (challenges.length === challengesDone.length) {
            playFinishSound()
        }
    }, [challenges.length, challengesDone.length])

    const onClickNumber = (num: number) => {
        const newIndex = num - 1;
        if (newIndex > activeIndex) {
            setAnimationDirection(1);
        } else if (newIndex < activeIndex) {
            setAnimationDirection(-1);
        }
        setActiveIndex(newIndex)
        setSelectedOption(undefined)
        setStatus('none')
        setIsDoneWrongChallenge(wrongChallengesId.includes(newIndex))
        setIsDoneChallenge(doneChallengesId.includes(newIndex))
        setDateLastDone(challengesDone.filter(el => el.challengeId === newIndex)
            [(challengesDone.filter(el => el.challengeId === newIndex)).length - 1]
            ?.dateDone)
        setTimesDone(doneChallengesId.filter(x => x == newIndex).length)
        setTimesDoneWrong(wrongChallengesId.filter(x => x == newIndex).length)

        let toShuffle = challenges.filter(el => el.id == newIndex)[0].challengeOptions
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
        setAnimationDirection(1);
        setActiveIndex((current) => current + 1)
        setShowMascotCorrect(false)
        setShowMascotWrong(false)
    }

    const onSelect = (id: number) => {
        if (status !== "none") return
        setSelectedOption(id)
    }

    // const onContinue = () => {
    //     if (!selectedOption) return

    //     if (status === 'wrong') {
    //         onNext()
    //         setStatus('none')
    //         setSelectedOption(undefined)
    //         return
    //     }

    //     if (status === 'correct') {
    //         onNext()
    //         setStatus('none')
    //         setSelectedOption(undefined)
    //         return
    //     }

    //     const correctOption = options.find((option) => option.correct)

    //     if (!correctOption) {
    //         return
    //     }

        
    //     if (correctOption && correctOption.id === selectedOption) {
    //         startTransition(() => {
    //             openRightModal()
    //             setShowMascotCorrect(true)
    //             setTimeout(() => setShowMascotCorrect(false), 1500)

    //             upsertChallengeProgress({
    //                 challengeId: challenge.id,
    //                 doneRight: true,
    //                 isPractice: isDoneChallenge,
    //             })
    //                 .then((response) => {
    //                     if (!response?.success) {
    //                         if (response?.message === 'hearts') {
    //                             openHeartsModal()
    //                         }
    //                         return
    //                     }

    //                     playCorrectSound()
    //                     setStatus('correct')
    //                     setPercentage((prev) => prev + 100 / challenges.length)

    //                     if (initialPercentage === 100) {
    //                         setHearts((prev) => Math.min(prev + 1, 5))
    //                     }
    //                 })
    //                 .catch(() => toast.error('Что-то пошло не так! Попробуйте ещё раз'))
    //         })
    //     } else {
    //         startTransition(() => {
    //             openWrongModal()
    //             setShowMascotWrong(true)
    //             setTimeout(() => setShowMascotWrong(false), 1500)

    //             upsertChallengeProgress({
    //                 challengeId: challenge.id,
    //                 doneRight: false,
    //                 isPractice: isDoneChallenge,
    //             })
    //                 .then((response) => {
    //                     if (!response?.success) {
    //                         if (response?.message === 'hearts') {
    //                             openHeartsModal()
    //                         }
    //                         return
    //                     }

    //                     playIncorrectSound()
    //                     setStatus('wrong')
    //                     setPercentage((prev) => prev + 100 / challenges.length)
    //                     setHearts((prev) => Math.max(prev - 1, 0))
    //                 })
    //                 .catch(() => toast.error('Что-то пошло не так! Попробуйте ещё раз'))
    //         })
    //     }
    // }


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
                // 🔥 Сначала отправляем запрос
                upsertChallengeProgress({
                    challengeId: challenge.id,
                    doneRight: true,
                    isPractice: isDoneChallenge,
                })
                    .then((response) => {
                        if (!response?.success) {
                            if (response?.message === 'hearts') {
                                openHeartsModal()
                            }
                            return
                        }

                        // 🔥 Получаем реальные очки из ответа
                        const earnedPoints = response?.pointsEarned || challenge.points;
                        const earnedGems = response?.gemsEarned || Math.floor(challenge.points / 10);
                        
                        // 🔥 Открываем модалку с фиксированными значениями
                        openRightModal(earnedPoints, earnedGems);
                        setShowMascotCorrect(true)
                        setTimeout(() => setShowMascotCorrect(false), 1500)

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
                // 🔥 Для неправильного ответа тоже можно передавать очки (0)
                upsertChallengeProgress({
                    challengeId: challenge.id,
                    doneRight: false,
                    isPractice: isDoneChallenge,
                })
                    .then((response) => {
                        if (!response?.success) {
                            if (response?.message === 'hearts') {
                                openHeartsModal()
                            }
                            return
                        }

                        playIncorrectSound()
                        setStatus('wrong')
                        setPercentage((prev) => prev + 100 / challenges.length)
                        setHearts((prev) => Math.max(prev - 1, 0))
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
                <motion.div 
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={pageVariants}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col gap-y-6 max-w-lg mx-auto text-center items-center justify-center min-h-[70vh] px-4"
                >
                    <Image
                        src='/finish.svg'
                        alt="Finish"
                        height={100}
                        width={100}
                        className="w-24 h-24 md:w-32 md:h-32"
                    />
                    <h1 className="text-2xl md:text-3xl font-bold text-neutral-700">
                        Отличная работа! 🎉
                    </h1>
                    <p className="text-[#9AA7B0]">Вы завершили урок</p>
                    <div className="flex items-center gap-4 w-full justify-center mt-4">
                        <ResultCard variant='points' value={challenges.length * 10} />
                        <ResultCard variant='hearts' value={hearts} />
                    </div>
                    <Button 
                        onClick={() => router.push('/learn')}
                        className="mt-6 px-8 py-3 text-base"
                        size="lg"
                    >
                        Продолжить
                    </Button>
                </motion.div>
            </>
        )
    }

    const title = challenge.type === "ASSIST"
        ? lessonTitle
        : challenge.question

    // Число колонок сетки меню — кнопки в неполном последнем ряду остаются
    // той же ширины, что и в предыдущих (grid, а не flex по рядам).
    const menuColumns = typeof window !== 'undefined' && window.innerWidth < 640 ? 5 : 8;

    return (
        <div className="min-h-screen bg-[#151F23] flex flex-col">
            <Header
                hearts={hearts}
                percentage={percentage}
                hasActiveSubscription={!!userSubscription?.isActive}
            />

            {/* Название урока */}
            <div className="max-w-xl mx-auto w-full px-4 pt-3 flex items-center gap-2">
                <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: unitColor.button }} />
                <h2 className="text-sm md:text-base font-bold text-[#F2F7FB] truncate">{lessonTitle}</h2>
            </div>

            {/* Меню выбора задачи */}
            <div className="max-w-xl mx-auto w-full px-4 pt-2 pb-3">
                <div
                    className="grid gap-1.5"
                    style={{ gridTemplateColumns: `repeat(${menuColumns}, minmax(0, 1fr))` }}
                >
                    {challenges.map((challengeItem) => {
                        const isHW = hwChallengeIds?.includes(challengeItem.id) ?? false;
                        const isDone = doneChallengesId.includes(challengeItem.id);
                        const isWrong = wrongChallengesId.includes(challengeItem.id);
                        const isActive = Number(activeIndex) === challengeItem.id;
                        const showDonut = isHW && !isDone;

                        const bg = isWrong ? 'rgba(244,63,94,0.14)' : isDone ? 'rgba(74,222,128,0.14)' : '#1A252B';
                        const color = isWrong ? '#fb7185' : isDone ? '#4ade80' : '#9AA7B0';

                        return (
                            <button
                                key={challengeItem.id}
                                onClick={() => onClickNumber(challengeItem.id + 1)}
                                className="relative h-9 rounded-lg text-xs font-semibold transition-colors"
                                style={{
                                    backgroundColor: isActive ? unitColor.button : bg,
                                    color: isActive ? '#151F23' : color,
                                }}
                            >
                                {challengeItem.id % 1000}

                                {showDonut && (
                                    <span className="absolute -top-1.5 -right-1 text-[10px]">🍩</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>



            {/* Основной контент */}
            <div className="flex-1 max-w-xl w-full mx-auto px-4 py-6 md:py-8">
                <div className="w-full">
                    {/* Для не-ASSIST типов (нет QuestionBubble) заголовок — это сам вопрос */}
                    {challenge.type !== "ASSIST" && (
                        <motion.div
                            key={`title-${activeIndex}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="mb-5 md:mb-7"
                        >
                            <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-[#F2F7FB] text-center md:text-left">
                                {title}
                            </h1>
                        </motion.div>
                    )}

                    {/* Question Bubble и Challenge с анимацией */}
                    <AnimatePresence mode="wait" custom={animationDirection}>
                        <motion.div
                            key={activeIndex}
                            custom={animationDirection}
                            variants={contentVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="space-y-6 md:space-y-8"
                        >
                            {challenge.type === "ASSIST" && (
                                <QuestionBubble
                                    unitColor={unitColor}
                                    question={challenge.question}
                                    pts={challenge.points}
                                    author={challenge.author}
                                    timesDoneWrong={timesDoneWrong}
                                    timesDone={timesDone}
                                    isHWChallenge={isHWChallenge}
                                    isCompleted={isDoneChallenge}
                                    isCorrect={showMascotCorrect}
                                    isWrong={showMascotWrong}
                                    challengeId={challenge.id}
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
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <Footer
                disabled={isDoneChallenge || pending || !selectedOption}
                status={status}
                onCheck={onContinue}
            />
        </div>
    )
}
