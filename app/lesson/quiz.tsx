// app/lesson/quiz.tsx

'use client';

import { motion, AnimatePresence } from "framer-motion";
import { SuperType, challengeOptions, challengeProgress, challenges } from "@/db/schema";
import { useEffect, useState, useTransition, useRef } from "react";
import { Header } from "./header";
import { QuestionBubble } from "./question-bubble";
import { Challenge } from "./challenge";
import { KeyboardInput } from "./keyboard-input";
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
import { ChallengeNav } from "./challenge-nav";
import { vibrate } from "@/lib/haptics";
import { useAchievementStore } from "@/store/use-achievement-store";
import { useStreakCelebrationStore } from "@/store/use-streak-celebration-store";

// Доля заданий ASSIST с числовым ответом, которые показываем как KEYBOARD
// вместо сетки вариантов — для разнообразия UI. Сам тип в БД не меняется.
const KEYBOARD_RATIO_PERCENT = 30

type Props = {
    initialPercentage: number
    initialHearts: number
    initialLessonId: number
    initialLessonChallenges: (typeof challenges.$inferSelect & {
        completed: boolean
        challengeOptions: typeof challengeOptions.$inferSelect[]
        skillTags: { id: number; title: string; percentage: number }[]
    })[]
    userSubscription: any
    challengeProgress: typeof challengeProgress.$inferSelect[] 
    lessonTitle: string
    oldCourseProgress: SuperType
    activeCourseTitle: string
    hwChallengeIds?: number[]
    dailyChallengeIds?: number[]
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
    dailyChallengeIds,
    courseId,
    unitColor,
}: Props) => {
    const { open: openHeartsModal } = useHeartsModal()
    const { open: openPracticeModal } = usePracticeModal()
    const { open: openWrongModal } = useWrongAnswerModal()
    const { openR: openRightModal } = useRightAnswerModal()
    const showAchievement = useAchievementStore((state) => state.showAchievement)
    const showStreakCelebration = useStreakCelebrationStore((state) => state.showStreakCelebration)

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
    // Множественный выбор (тип SELECT — "выберите N верных утверждений"):
    // отдельный стейт-набор id, не трогаем selectedOption, чтобы не задеть
    // остальные типы заданий.
    const [selectedOptions, setSelectedOptions] = useState<Set<number>>(new Set())
    // Тип CONSTRUCT ("определите характер изменения") — выбор по одному
    // варианту на каждую физическую величину, ключ — имя величины
    // (закодировано в тексте опции как "величина::вариант").
    const [characterSelections, setCharacterSelections] = useState<Record<string, number>>({})
    const [typedAnswer, setTypedAnswer] = useState('')
    const [status, setStatus] = useState<"correct" | "wrong" | "none">('none')
    const [options, setOptions] = useState<typeof challengeOptions.$inferSelect[]>([])

    let [challenge] = challenges.filter(el => el.id == activeIndex)
    const isHWChallenge = hwChallengeIds?.includes(challenge?.id) ?? false;

    // Задача, уже отвеченная (верно или нет), блокируется на 24 часа — та же
    // логика, что открывает/прячет сетку вариантов в Challenge. Без этого
    // кнопка "Ответить" оставалась задизейбленной навсегда даже после того,
    // как Challenge уже открывал варианты для пересдачи.
    const canSolve = !dateLastDone || (new Date().getTime() - new Date(dateLastDone).getTime()) > 24 * 60 * 60 * 1000

    // Часть заданий ASSIST показываем как KEYBOARD — не переписываем тип в
    // БД (дистракторы остаются на месте для обычного вида), а решаем на
    // лету, детерминированно по id задачи, чтобы при пересдаче вид не
    // менялся. Годится только если ответ — просто число (клавиатура не
    // умеет вводить текст/единицы измерения).
    const effectiveType = (() => {
        if (challenge?.type !== 'ASSIST') return challenge?.type
        const correctText = challenge.challengeOptions?.find((o) => o.correct)?.text?.trim()
        if (!correctText || !/^-?\d+([.,]\d+)?$/.test(correctText)) return challenge.type
        const roll = ((challenge.id * 2654435761) >>> 0) % 100
        return roll < KEYBOARD_RATIO_PERCENT ? 'KEYBOARD' : challenge.type
    })()

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
        setSelectedOptions(new Set())
        setCharacterSelections({})
        setTypedAnswer('')
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

    const isMultiSelect = challenge?.type === 'SELECT'
    const isCharacterChange = challenge?.type === 'CONSTRUCT'

    const onSelect = (id: number) => {
        if (status !== "none") return
        if (isMultiSelect) {
            setSelectedOptions((prev) => {
                const next = new Set(prev)
                if (next.has(id)) {
                    next.delete(id)
                } else {
                    next.add(id)
                }
                return next
            })
            return
        }
        setSelectedOption(id)
    }

    const onSelectCharacter = (quantity: string, optionId: number) => {
        if (status !== "none") return
        setCharacterSelections((prev) => ({ ...prev, [quantity]: optionId }))
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


        const isKeyboardChallenge = effectiveType === 'KEYBOARD'

        const characterGroupNames = isCharacterChange
            ? [...new Set(options.map((o) => o.text.split('::')[0]))]
            : []
        const characterAllAnswered = characterGroupNames.every((name) => characterSelections[name] !== undefined)

        const onContinue = () => {
        if (isCharacterChange ? !characterAllAnswered : isMultiSelect ? selectedOptions.size === 0 : (isKeyboardChallenge ? !typedAnswer : !selectedOption)) return

        if (status === 'wrong') {
            onNext()
            setStatus('none')
            setSelectedOption(undefined)
            setSelectedOptions(new Set())
            setCharacterSelections({})
            setTypedAnswer('')
            return
        }

        if (status === 'correct') {
            onNext()
            setStatus('none')
            setSelectedOption(undefined)
            setSelectedOptions(new Set())
            setCharacterSelections({})
            setTypedAnswer('')
            return
        }

        const correctOption = options.find((option) => option.correct)

        if (!correctOption) {
            return
        }

        const normalizeAnswer = (s: string) => s.trim().replace(/\./g, ',').replace(/\s+/g, '')
        const isAnswerCorrect = isCharacterChange
            ? characterGroupNames.every((name) => {
                const picked = characterSelections[name]
                return options.find((o) => o.id === picked)?.correct === true
            })
            : isMultiSelect
            ? (() => {
                const correctIds = new Set(options.filter((o) => o.correct).map((o) => o.id))
                return correctIds.size === selectedOptions.size
                    && [...selectedOptions].every((id) => correctIds.has(id))
            })()
            : isKeyboardChallenge
                ? normalizeAnswer(typedAnswer) === normalizeAnswer(correctOption.text)
                : correctOption.id === selectedOption

        if (isAnswerCorrect) {
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
                        vibrate('success')
                        setStatus('correct')
                        if (!isDoneChallenge) {
                            setPercentage((prev) => prev + 100 / challenges.length)
                        }

                        if (initialPercentage === 100) {
                            setHearts((prev) => Math.min(prev + 1, 5))
                        }

                        if (response?.leveledUp) {
                            const gemsPart = response.levelUpGems ? ` +${response.levelUpGems}💎` : ''
                            toast.success(`🎊 Новый уровень! Теперь ты на Ур. ${response.newLevel}${gemsPart}`, { duration: 4000 })
                        }
                        // streakExtended — true только на ПЕРВЫЙ верный ответ,
                        // продливший серию на новый день (см. lib/streak.ts) —
                        // не показываем анимацию на каждый последующий верный
                        // ответ в тот же день.
                        if (response?.streakExtended && response.newStreak) {
                            showStreakCelebration(response.newStreak)
                        }
                        response?.newAchievements?.forEach((ach) => showAchievement(ach))
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
                        vibrate('error')
                        setStatus('wrong')
                        if (!isDoneChallenge) {
                            setPercentage((prev) => prev + 100 / challenges.length)
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

    const hasQuestionBubble = effectiveType === "ASSIST" || effectiveType === "KEYBOARD" || effectiveType === "SELECT" || effectiveType === "CONSTRUCT"

    const title = hasQuestionBubble
        ? lessonTitle
        : challenge.question

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
            <div className="max-w-xl mx-auto w-full px-4 pt-1 pb-2">
                <ChallengeNav
                    challenges={challenges}
                    activeId={Number(activeIndex)}
                    doneChallengesId={doneChallengesId}
                    wrongChallengesId={wrongChallengesId}
                    dailyChallengeIds={dailyChallengeIds}
                    hwChallengeIds={hwChallengeIds}
                    unitColor={unitColor}
                    onClickNumber={onClickNumber}
                />
            </div>



            {/* Основной контент */}
            <div className="flex-1 max-w-xl w-full mx-auto px-4 py-3 md:py-4">
                <div className="w-full">
                    {/* Для типов без QuestionBubble заголовок — это сам вопрос */}
                    {!hasQuestionBubble && (
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
                            className="space-y-3 md:space-y-4"
                        >
                            {hasQuestionBubble && (
                                <QuestionBubble
                                    unitColor={unitColor}
                                    question={challenge.question}
                                    imageSrc={challenge.imageSrc}
                                    pts={challenge.points}
                                    author={challenge.author}
                                    timesDoneWrong={timesDoneWrong}
                                    timesDone={timesDone}
                                    isHWChallenge={isHWChallenge}
                                    isCompleted={isDoneChallenge}
                                    isCorrect={showMascotCorrect}
                                    isWrong={showMascotWrong}
                                    challengeId={challenge.id}
                                    isMultiSelect={isMultiSelect}
                                    options={options}
                                    skillTags={challenge.skillTags}
                                />
                            )}

                            {isKeyboardChallenge ? (
                                <KeyboardInput
                                    value={typedAnswer}
                                    onChange={setTypedAnswer}
                                    disabled={pending || status !== 'none'}
                                />
                            ) : (
                            <Challenge
                                options={options}
                                onSelect={onSelect}
                                status={status}
                                selectedOption={selectedOption}
                                selectedOptions={selectedOptions}
                                characterSelections={characterSelections}
                                onSelectCharacter={onSelectCharacter}
                                disabled={pending}
                                type={challenge.type}
                                isDoneWrongChallenge={isDoneWrongChallenge}
                                isDoneChallenge={isDoneChallenge}
                                dateLastDone={dateLastDone}
                                challengeId={challenge.id}
                                unitColor={unitColor}
                            />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <Footer
                disabled={(isDoneChallenge && !canSolve) || pending || (isCharacterChange ? !characterAllAnswered : isMultiSelect ? selectedOptions.size === 0 : (isKeyboardChallenge ? !typedAnswer : !selectedOption))}
                status={status}
                onCheck={onContinue}
            />
        </div>
    )
}
