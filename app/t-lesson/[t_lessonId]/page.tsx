// app/t-lesson/[t_lessonId]/page.tsx

import { getAllTLessonProgress, getAllUsersProgress, getTLesson, getUserProgress } from "@/db/queries"
import { redirect } from "next/navigation"
import { Shuffle2, ShuffleTS } from "@/usefulFunctions"
import TQuiz from "@/app/t-lesson/[t_lessonId]/TQUIZ"
import { allTypesCT } from "@/db/schema";

export type QuestionType = {
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
        t_lessonId: string  // ← может быть string из URL
    }
}

const LessonIdPage = async ({ params }: Props) => {
    const t_lessonId = parseInt(params.t_lessonId);
    
    if (isNaN(t_lessonId)) {
        redirect('/trainer');
    }

    const [
        t_lesson,
        userProgress,
        all_t_lessonProgress,
        allUsersProgress,
    ] = await Promise.all([
        getTLesson(t_lessonId),
        getUserProgress(),
        getAllTLessonProgress(),
        getAllUsersProgress(),
    ]);

    if (!t_lesson || !userProgress) {
        redirect('/trainer');
    }



    // В начале страницы, после получения t_lesson
    // console.log('t_lesson:', t_lesson);
    // console.log('t_lesson.t_challenges:', t_lesson?.t_challenges);
    // console.log('t_lesson.t_challenges length:', t_lesson?.t_challenges?.length);

    if (!t_lesson || !t_lesson.t_challenges || t_lesson.t_challenges.length === 0) {
    // console.log('Редирект на /trainer: нет challenges');
    redirect('/trainer');
}

    // Проверка, есть ли challenges
    if (!t_lesson.t_challenges || t_lesson.t_challenges.length === 0) {
        redirect('/trainer');
    }



    let questions: QuestionType[];

    function getRandomElements<T>(arr: T[], count: number): T[] {
        if (count > arr.length) {
            return arr; // возвращаем весь массив, если запрошено больше элементов
        }
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, count);
    }

    const ACStype = ['ASSIST', 'CONNECT'] as const;
    type ACStype = typeof ACStype[number];

    // Фильтруем только M_ASC типы
    const mAscChallenges = t_lesson.t_challenges.filter(t_ch => t_ch.type === "M_ASC");
    
    const randomTypeASC: ACStype[] = Array.from(
        { length: mAscChallenges.length },
        () => ACStype[Math.floor(Math.random() * ACStype.length)]
    );

    questions = t_lesson.t_challenges.map((t_challenge, index) => {
        if (t_challenge.type === 'M_ASC') {
            const randomASCtype = ACStype[Math.floor(Math.random() * ACStype.length)];

            if (randomASCtype === 'ASSIST') {
                const other5Questions = t_lesson.t_challenges.filter((el, i) => 
                    el.type === "M_ASC" && t_challenge.t_challengeOptions[0]?.text !== el.t_challengeOptions[0]?.text
                );
                const fiveQuestions = getRandomElements(other5Questions, 5);
                const fiveWrongOptions = fiveQuestions.map(el => el.t_challengeOptions[0]?.text || '');
                const fiveWrongOptionsPlusRight = [...fiveWrongOptions, t_challenge.t_challengeOptions[0]?.text || ''];

                return {
                    questionType: randomASCtype,
                    question: t_challenge.question,
                    imageSrc: t_challenge.imageSrc,
                    options: Shuffle2(fiveWrongOptionsPlusRight),
                    numRans: '1',
                    optionsQ: [],
                    optionsA: [],
                    optionsConstructRight: [],
                    difficulty: t_challenge.difficulty,
                    correctAnswer: t_challenge.t_challengeOptions[0]?.text || '',
                    timeLimit: 40,
                };
            } 
            else if (randomASCtype === 'CONNECT') {
                const otherQuestions = t_lesson.t_challenges.filter((el, i) => 
                    el.type === "M_ASC" && t_challenge.t_challengeOptions[0]?.text !== el.t_challengeOptions[0]?.text
                );
                const twoQuestions = getRandomElements(otherQuestions, 2);

                return {
                    questionType: randomASCtype,
                    question: "Соедините",
                    imageSrc: t_challenge.imageSrc,
                    options: [],
                    numRans: t_challenge.numRans,
                    optionsQ: ShuffleTS([
                        {
                            optQ: t_challenge.question,
                            pairId: 0,
                            id: t_challenge.t_challengeOptions[0]?.id || 0,
                        },
                        {
                            optQ: twoQuestions[0]?.question || '',
                            pairId: 1,
                            id: twoQuestions[0]?.t_challengeOptions[0]?.id || 0,
                        },
                        {
                            optQ: twoQuestions[1]?.question || '',
                            pairId: 2,
                            id: twoQuestions[1]?.t_challengeOptions[0]?.id || 0,
                        },
                    ]),
                    optionsA: ShuffleTS([
                        {
                            optA: t_challenge.t_challengeOptions[0]?.text || '',
                            pairId: 0,
                            id: t_challenge.t_challengeOptions[0]?.id || 0,
                        },
                        {
                            optA: twoQuestions[0]?.t_challengeOptions[0]?.text || '',
                            pairId: 1,
                            id: twoQuestions[0]?.t_challengeOptions[0]?.id || 0,
                        },
                        {
                            optA: twoQuestions[1]?.t_challengeOptions[0]?.text || '',
                            pairId: 2,
                            id: twoQuestions[1]?.t_challengeOptions[0]?.id || 0,
                        }
                    ]),
                    optionsConstructRight: [
                        t_challenge.t_challengeOptions[0]?.text || '',
                        t_challenge.t_challengeOptions[1]?.text || '',
                        t_challenge.t_challengeOptions[2]?.text || ''
                    ],
                    difficulty: t_challenge.difficulty,
                    correctAnswer: t_challenge.t_challengeOptions[0]?.text || '',
                    timeLimit: 45,
                };
            }
        } 
        else {
            // НЕ M_ASC
            return {
                questionType: t_challenge.type,
                question: t_challenge.question,
                imageSrc: t_challenge.imageSrc,
                options: Shuffle2(t_challenge.t_challengeOptions?.map(el => el.text) || []),
                numRans: t_challenge.numRans,
                optionsQ: ShuffleTS([
                    {
                        optQ: t_challenge.t_challengeOptions[0]?.text || '',
                        pairId: 0,
                        id: t_challenge.t_challengeOptions[0]?.id || 0,
                    },
                    {
                        optQ: t_challenge.t_challengeOptions[1]?.text || '',
                        pairId: 1,
                        id: t_challenge.t_challengeOptions[1]?.id || 0,
                    },
                    {
                        optQ: t_challenge.t_challengeOptions[2]?.text || '',
                        pairId: 2,
                        id: t_challenge.t_challengeOptions[2]?.id || 0,
                    },
                ]),
                optionsA: ShuffleTS([
                    {
                        optA: t_challenge.t_challengeOptions[3]?.text || '',
                        pairId: 0,
                        id: t_challenge.t_challengeOptions[3]?.id || 0,
                    },
                    {
                        optA: t_challenge.t_challengeOptions[4]?.text || '',
                        pairId: 1,
                        id: t_challenge.t_challengeOptions[4]?.id || 0,
                    },
                    {
                        optA: t_challenge.t_challengeOptions[5]?.text || '',
                        pairId: 2,
                        id: t_challenge.t_challengeOptions[5]?.id || 0,
                    }
                ]),
                optionsConstructRight: [
                    t_challenge.t_challengeOptions[0]?.text || '',
                    t_challenge.t_challengeOptions[1]?.text || '',
                    t_challenge.t_challengeOptions[2]?.text || ''
                ],
                difficulty: t_challenge.difficulty,
                correctAnswer: t_challenge.t_challengeOptions[0]?.text || '',
                timeLimit: 25,
            };
        }
    });

    // 🔥 ДОБАВЛЕНА ПРОВЕРКА: если questions пустой или первый вопрос undefined
    if (!questions || questions.length === 0 || !questions[0]) {
        redirect('/trainer');
    }

    // ЕСЛИ ТИП GEOSIN , то НЕ шафлим, а идем в порядке 
    if (questions[0].questionType !== 'GEOSIN') {
        questions = ShuffleTS(questions);
    }

    // СЧИТАЕМ Статистику правильно решенных задач
    const currentLessonProgress = all_t_lessonProgress?.filter(el => el.t_lessonId === t_lessonId) || [];
    const UniqueUserIds = Array.from(new Set(currentLessonProgress.map(el => el.userId)));

    const usersStat = UniqueUserIds.map(user_id => {
        const CLCUProgress = currentLessonProgress.filter(progress => progress.userId === user_id);
        const doneRight = CLCUProgress.reduce((total, elem) => total + elem.doneRight, 0);
        const doneWrong = CLCUProgress.reduce((total, elem) => total + elem.doneWrong, 0);
        const DRP = (doneRight + doneWrong) > 0 ? doneRight / (doneRight + doneWrong) : 0;
        const DR_DRP = doneRight * DRP;

        const user = allUsersProgress?.find(pr => pr.userId === user_id);
        return {
            DR_DRP: DR_DRP,
            user_id: user?.userId,
            user_name: user?.userName,
            user_imgSrc: user?.userImageSrc,
        };
    });

    usersStat.sort((a, b) => b.DR_DRP - a.DR_DRP);

    return (
        <TQuiz 
            t_lessonId={t_lesson.id} 
            t_lessonTitle={t_lesson.title} 
            questions1={questions}
            userName={userProgress.userName}
        />
    );
}

export default LessonIdPage;

