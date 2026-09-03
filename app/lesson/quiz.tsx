// app/lesson/quiz.tsx

'use client';

import { motion } from "framer-motion";
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
import { useLevelUpStore } from "@/store/use-level-up-store";
import { useQuestCompleteStore } from "@/store/use-quest-complete-store";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ChevronRight } from "lucide-react";
import { LOTTIE_SKILL_ASK_LIST, getRandomLottie } from "@/src/constants/lottieConstants";
import { getSkillTier, SKILL_PRACTICING_COLOR, SKILL_READY_GRADIENT, SKILL_READY_BORDER } from "@/lib/skillTier";
import { detectPanelOrientation, PanelOrientation } from "@/lib/graphPanel";
import { SolveModeChoice } from "@/components/geometry/SolveModeChoice";
import { TrapezoidWalkthrough } from "@/components/geometry/TrapezoidWalkthrough";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

// Бейдж-ссылка на тему тренажёра, привязанную к текущей задаче — раньше
// жил внизу карточки задачи (app/lesson/question-bubble.tsx), пользователь
// попросил перенести его наверх, рядом с названием урока, и сделать явную
// кнопку-переход, а не кликабельную, но неочевидную пилюлю. Процент и
// сама кнопка "Перейти в тренажёр" — два отдельных визуальных элемента
// (по просьбе пользователя "85% обособленно, а правее кнопка"), но обе
// части одной ссылки — клик по любой из них ведёт в тренажёр.
const TrainerHeaderLink = ({ tag, unitColor }: { tag: { id: number; title: string; percentage: number }; unitColor: { button: string; bottom: string } }) => {
    const tier = getSkillTier(tag.percentage);
    const [askAnimation] = useState(() => getRandomLottie(LOTTIE_SKILL_ASK_LIST));

    if (tier === 'locked') {
        return (
            <Link
                href={`/t-lesson/${tag.id}`}
                title={`Скилл тренажёра: ${tag.title}`}
                className="flex items-center gap-1.5 shrink-0 pl-0.5 pr-2.5 py-0.5 rounded-xl border-2 border-b-4 active:border-b-2 transition-colors"
                style={{ backgroundColor: `${unitColor.button}14`, borderColor: `${unitColor.button}55`, color: unitColor.button }}
            >
                <Lottie className="w-6 h-6 shrink-0" animationData={askAnimation} loop />
                <span className="text-xs font-medium">Пройди тренажёр</span>
            </Link>
        );
    }

    const isReady = tier === 'ready';
    const dividerColor = isReady ? 'rgba(245, 240, 255, 0.35)' : `${SKILL_PRACTICING_COLOR}55`;
    const buttonStyle = isReady
        ? {
            background: SKILL_READY_GRADIENT,
            borderColor: SKILL_READY_BORDER,
            color: '#F5F0FF',
            boxShadow: '0 0 10px -3px rgba(167, 139, 250, 0.55)',
        }
        : {
            backgroundColor: `${SKILL_PRACTICING_COLOR}1F`,
            borderColor: `${SKILL_PRACTICING_COLOR}66`,
            color: SKILL_PRACTICING_COLOR,
        };

    // Процент и переход — раньше два отдельных элемента (число само по
    // себе + рядом кнопка), пользователь попросил объединить в одну
    // кнопку вида "( 85% | Перейти в тренажёр › )" — разделитель-палочка
    // между числом и текстом вместо раздельных блоков. Форма — та же
    // "псевдо-3D" кнопка, что у клавиш KEYBOARD (rounded-xl, border-2
    // border-b-4/active:border-b-2), а не пилюля.
    return (
        <Link
            href={`/t-lesson/${tag.id}`}
            title={`Скилл тренажёра: ${tag.title}${isReady ? ' — готов' : ' — нужна практика'}`}
            className="flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-xl border-2 border-b-4 active:border-b-2 text-xs font-semibold shrink-0 transition-colors"
            style={buttonStyle}
        >
            <span className="font-extrabold">{tag.percentage}%</span>
            <span className="w-px self-stretch" style={{ backgroundColor: dividerColor }} />
            <span className="flex items-center gap-1">
                Перейти в тренажёр
                <ChevronRight className="w-3.5 h-3.5" />
            </span>
        </Link>
    );
};

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
    const showLevelUp = useLevelUpStore((state) => state.showLevelUp)
    const showQuestComplete = useQuestCompleteStore((state) => state.showQuestComplete)

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
    // Прототип "интерактивного разбора по шагам" (см. components/geometry/
    // TrapezoidWalkthrough.tsx) — привязан к ОДНОЙ конкретной задаче
    // (courseId=11, challengeId=1679, "Трапеция" — по просьбе пользователя),
    // не общий механизм пока. null = ещё не выбрано (показываем экран
    // выбора режима), 'self'/'guided' — выбранный режим на ЭТУ попытку.
    const WALKTHROUGH_CHALLENGE_ID = 1679
    const [walkthroughMode, setWalkthroughMode] = useState<'self' | 'guided' | null>(null)
    // Флаг "подставили верный ответ программно, надо засчитать" — сам вызов
    // onContinue() отложен в useEffect (ниже, после его определения), а не
    // сразу после setSelectedOption/setTypedAnswer: React не обновляет
    // состояние синхронно, вызов onContinue() в том же тике замкнулся бы на
    // ЕЩЁ СТАРОЕ значение (typedAnswer/selectedOption) — тот же класс
    // stale-closure бага, что уже не раз ловили в этом проекте.
    const [pendingWalkthroughSubmit, setPendingWalkthroughSubmit] = useState(false)

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
        setWalkthroughMode(null)
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

    // matching-задачи (CONSTRUCT, Unit 10 физики) с композитной картинкой из
    // N панелей (см. lib/graphPanel.ts) показывают её ВЫРЕЗКАМИ по группам
    // внутри самого задания (app/lesson/character-change.tsx) — общую
    // иллюстрацию над условием в этом случае нужно СПРЯТАТЬ, иначе тот же
    // график будет виден дважды. Считаем один раз здесь (а не внутри
    // character-change.tsx) — тот же результат нужен ОБОИМ местам рендера
    // (иллюстрация сверху / вырезки внутри), два независимых распознавания
    // рисковали бы разъехаться.
    const characterGroupCountForPanelCheck = challenge?.type === 'CONSTRUCT'
        ? new Set((challenge.challengeOptions ?? []).map((o) => o.text.split('::')[0])).size
        : 0
    const [panelOrientation, setPanelOrientation] = useState<PanelOrientation | null>(null)
    useEffect(() => {
        setPanelOrientation(null)
        const src = challenge?.imageSrc
        if (challenge?.type !== 'CONSTRUCT' || !src || characterGroupCountForPanelCheck < 2) return
        let cancelled = false
        const img = new window.Image()
        img.onload = () => {
            if (!cancelled) setPanelOrientation(detectPanelOrientation(img.naturalWidth, img.naturalHeight, characterGroupCountForPanelCheck))
        }
        img.src = src
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [challenge?.type, challenge?.imageSrc, characterGroupCountForPanelCheck])
    const isGraphPanelMode = panelOrientation !== null

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

                        if (response?.leveledUp && response.newLevel) {
                            const gained = response.levelsGained ?? 1
                            showLevelUp(response.newLevel - gained, response.newLevel, response.levelUpGems ?? 0)
                        }
                        // streakExtended — true только на ПЕРВЫЙ верный ответ,
                        // продливший серию на новый день (см. lib/streak.ts) —
                        // не показываем анимацию на каждый последующий верный
                        // ответ в тот же день.
                        if (response?.streakExtended && response.newStreak) {
                            showStreakCelebration(response.newStreak)
                        }
                        response?.newAchievements?.forEach((ach) => showAchievement(ach))
                        // Квест дня мог закрыться именно этим ответом (второй
                        // из двух пунктов, "реши задачу курса") — модалка,
                        // как при повышении уровня, а не тихий тост.
                        if (response?.questJustCompleted && response.questStreak) {
                            showQuestComplete(response.questStreak, response.questPointsReward ?? 0)
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

    // См. комментарий у pendingWalkthroughSubmit выше — вызываем onContinue
    // только ПОСЛЕ того, как React зафиксировал новое значение
    // selectedOption/typedAnswer (эффект гарантированно видит свежее
    // состояние, в отличие от прямого вызова в том же обработчике).
    useEffect(() => {
        if (!pendingWalkthroughSubmit) return
        setPendingWalkthroughSubmit(false)
        onContinue()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingWalkthroughSubmit])

    const handleWalkthroughComplete = (allCorrect: boolean) => {
        // Разбор по шагам сам по себе не требует "правильно с первого
        // раза" — оценка идёт по факту прохождения (тот же принцип, что
        // и у MULTISTEP в тренажёре): подставляем настоящий правильный
        // ответ задачи и подтверждаем его через уже существующий onContinue
        // (та же логика очков/сердечек/ачивок/XP, что и у обычного ответа —
        // не дублируем её здесь).
        const correctOption = options.find((o) => o.correct)
        if (!correctOption) return
        if (effectiveType === 'KEYBOARD') {
            setTypedAnswer(correctOption.text)
        } else {
            setSelectedOption(correctOption.id)
        }
        setPendingWalkthroughSubmit(true)
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

    // Прототип "интерактивного разбора по шагам" — см. комментарий у
    // WALKTHROUGH_CHALLENGE_ID выше. Отдельный ранний return (не встроено
    // внутрь обычного JSX ниже) — сознательно, чтобы не трогать основную,
    // и так сложную разметку карточки/футера для остальных типов заданий.
    const isWalkthroughChallenge = challenge.id === WALKTHROUGH_CHALLENGE_ID
    if (isWalkthroughChallenge && walkthroughMode !== 'self' && !isDoneChallenge) {
        return (
            <div className="min-h-screen bg-[#151F23] flex flex-col">
                <Header
                    hearts={hearts}
                    percentage={percentage}
                    hasActiveSubscription={!!userSubscription?.isActive}
                />
                <div className="max-w-xl mx-auto w-full px-4 pt-3 flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: unitColor.button }} />
                    <h2 className="text-sm md:text-base font-bold text-[#F2F7FB] truncate">{lessonTitle}</h2>
                </div>
                <div className="flex-1 max-w-xl w-full mx-auto px-4 py-4">
                    {walkthroughMode === 'guided' ? (
                        <TrapezoidWalkthrough
                            onComplete={(allCorrect) => {
                                handleWalkthroughComplete(allCorrect)
                                // Переключаем на обычный экран СРАЗУ — верный
                                // ответ уже подставлен (см. handleWalkthroughComplete),
                                // дальше это обычный поток "ответ засчитан",
                                // тот же, что и без разбора по шагам.
                                setWalkthroughMode('self')
                            }}
                        />
                    ) : (
                        <SolveModeChoice onChoose={setWalkthroughMode} />
                    )}
                </div>
            </div>
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

            {/* Название урока + (если у активной задачи есть тег скила)
                ссылка на соответствующую тему тренажёра — раньше стояла
                внизу карточки задачи, перенесена сюда по просьбе
                пользователя: видна сразу, ещё до того как читать условие. */}
            <div className="max-w-xl mx-auto w-full px-4 pt-3 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: unitColor.button }} />
                    <h2 className="text-sm md:text-base font-bold text-[#F2F7FB] truncate">{lessonTitle}</h2>
                </div>
                {challenge.skillTags && challenge.skillTags.length > 0 && (
                    <div className="flex items-center gap-3 flex-wrap">
                        {challenge.skillTags.map((tag) => (
                            <TrainerHeaderLink key={tag.id} tag={tag} unitColor={unitColor} />
                        ))}
                    </div>
                )}
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

                    {/* Question Bubble и Challenge с анимацией — key-ремаунт
                        без AnimatePresence/mode="wait": та же причина, что и
                        в остальных местах проекта (см. CLAUDE.md, баги
                        "TypeAssist"/"trainer-question.tsx") — mode="wait"
                        держит новый контент невидимым, пока не отыграет exit
                        предыдущего, а framer-motion не всегда честно
                        вызывает колбэк завершения exit — особенно при
                        быстрых переходах через клик по номеру в
                        ChallengeNav (не через обычную кнопку "Далее"), что и
                        давало полностью пустой экран на некоторых задачах. */}
                        <motion.div
                            key={activeIndex}
                            custom={animationDirection}
                            variants={contentVariants}
                            initial="initial"
                            animate="animate"
                            className="space-y-3 md:space-y-4"
                        >
                            {hasQuestionBubble && (
                                <QuestionBubble
                                    unitColor={unitColor}
                                    question={challenge.question}
                                    imageSrc={isGraphPanelMode ? undefined : challenge.imageSrc}
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
                                    hasOptions={!isKeyboardChallenge}
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
                                imageSrc={challenge.imageSrc}
                                panelOrientation={panelOrientation}
                            />
                            )}
                        </motion.div>
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
