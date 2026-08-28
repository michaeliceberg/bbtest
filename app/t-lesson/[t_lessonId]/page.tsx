// app/t-lesson/[t_lessonId]/page.tsx

import { getAllTLessonProgress, getAllUsersProgress, getTLesson, getUserProgress } from "@/db/queries"
import { redirect } from "next/navigation"
import { Shuffle2, ShuffleTS } from "@/usefulFunctions"
import { pickInsertBlank } from "@/lib/formulaLetters"
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
    // Только для INSERT — формула с 1-2 пропущенными буквами
    // (\boxed{\phantom{1}}, \boxed{\phantom{2}}).
    blankedFormula?: string,
    // Только для INSERT — какие буквы верные (длина 1 или 2, порядок —
    // слева направо по пропускам в формуле). correctAnswer при этом —
    // отсортированный join через запятую этого же массива (см.
    // lib/formulaLetters.ts — при 2 пропусках порядок сомножителей
    // неважен, поэтому сравнение ответа идёт как множество, не позиционно).
    insertCorrectLetters?: string[],
    // Только для (отключённого) MEMORY — оставлено ради type-memory.tsx,
    // который не рендерится, но не удалён (может пригодиться позже).
    memoryCards?: { id: number; pairId: number; text: string }[],
    // Внутреннее поле для сортировки "от простого к сложному" (см. ниже
    // у ShuffleTS/.sort) — 0 = словарный вопрос (что такое/единица
    // измерения, обычный текст-ответ), 1 = формула (LaTeX-ответ). Не
    // используется рендер-компонентами, только порядком вопросов внутри
    // урока.
    contentTier?: number,
}

type Props = {
    params: {
        t_lessonId: string  // ← может быть string из URL
    }
    searchParams: {
        stage?: string
        boss?: string
    }
}

const LessonIdPage = async ({ params, searchParams }: Props) => {
    const t_lessonId = parseInt(params.t_lessonId);

    if (isNaN(t_lessonId)) {
        redirect('/trainer');
    }

    // Этап (1-4) внутри темы — приходит явно через ?stage=N со страницы
    // выбора темы. Без параметра (старые ссылки, математический тренажёр
    // без этапов) — берём ВСЕ задачи темы, как было раньше.
    const stageParam = searchParams?.stage ? parseInt(searchParams.stage) : null;
    // Финальный ("корона") этап темы — приходит явно через ?boss=1 со
    // страницы карты скиллов (trainer-grade-tree.tsx уже точно знает,
    // какой этап последний). Чисто визуальный флаг, HP-босс не заменяет
    // существующие 3 сердечка игрока.
    const isBossStage = searchParams?.boss === '1';

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

    const lessonChallenges = stageParam
        ? t_lesson.t_challenges.filter(t_ch => t_ch.stage === stageParam)
        : t_lesson.t_challenges;

    if (lessonChallenges.length === 0) {
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

    const ACStype = ['ASSIST', 'CONNECT', 'INSERT', 'SWIPE', 'SCROLL'] as const;
    type ACStype = typeof ACStype[number];

    // INSERT (вписать букву) — по явной просьбе пользователя должен
    // выпадать чаще остальных стилей. Отдельный ВЗВЕШЕННЫЙ пул только для
    // случайного выбора ниже — сам ACStype (типовые проверки/isMAscLike)
    // не трогаем. INSERT вдвое чаще ASSIST/CONNECT/SWIPE/SCROLL (2/6 ≈ 33%
    // вместо базовых 20%); если конкретной формуле не хватает букв/обманок
    // — pickInsertBlank всё равно тихо откатится на ASSIST (см. ниже),
    // так что более высокий вес не может ничего сломать, только чаще
    // пробовать.
    const WEIGHTED_ASC_POOL: ACStype[] = ['ASSIST', 'CONNECT', 'INSERT', 'INSERT', 'SWIPE', 'SCROLL'];

    // "M_ASC-подобные" типы — задачи с одной формулой-ответом, отрисовываемые
    // одним из 5 рендер-стилей (ASSIST/CONNECT/INSERT/SWIPE/SCROLL). Для
    // M_ASC стиль выбирается случайно (см. randomASCtype ниже); задачу можно
    // сохранить сразу с ЗАФИКСИРОВАННЫМ стилем (type = 'ASSIST' и т.п.
    // напрямую в БД) — тогда она всегда рендерится этим одним стилем, без
    // рандома. Оба варианта конструируются идентично, поэтому и как
    // источник обманок/пар друг для друга (see фильтры el.type ниже)
    // задачи с любым из этих типов равноценны.
    const isMAscLike = (type: string): boolean => type === 'M_ASC' || (ACStype as readonly string[]).includes(type);

    // Уровень сложности рендер-стиля — используется ниже, чтобы урок шёл
    // от простого к сложному (см. комментарий у ShuffleTS/.sort). ASSIST/
    // CONNECT — узнать среди готовых вариантов, проще всего; SWIPE/SCROLL —
    // тоже узнавание, но с непривычным взаимодействием; INSERT — самому
    // вспомнить и вписать букву, сложнее всего. Типы не из этого списка
    // (WORKBOOK, RUSSIANDICTANT и т.п.) — по умолчанию "средний" уровень.
    const RENDER_DIFFICULTY_TIER: Record<string, number> = {
        ASSIST: 0, CONNECT: 0,
        SWIPE: 1, SCROLL: 1,
        INSERT: 2,
    };

    // Обычно у M_ASC-задачи ровно один t_challengeOptions (сам correct
    // не проверяется — по конвенции это единственная строка). Но когда
    // единица измерения/название неоднозначны (Дж = и работа, и энергия),
    // на задачу может быть НЕСКОЛЬКО строк с correct=true — тогда все они
    // склеиваются через "|" (см. usefulFunctions.isCorrectAnswer) и любая
    // засчитывается верной. Кнопкой-опцией среди вариантов всё равно
    // показывается только ОДНА (каноничная, [0]) — склеенный список нужен
    // только для самой проверки правильности.
    const getCorrectAnswerText = (t_challenge: { t_challengeOptions: { text: string; correct: boolean }[] }): string => {
        const correctOnes = t_challenge.t_challengeOptions.filter((o) => o.correct).map((o) => o.text);
        return (correctOnes.length > 0 ? correctOnes.join('|') : t_challenge.t_challengeOptions[0]?.text) || '';
    };

    // С появлением словарных вопросов (Что такое X? / В чём измеряется X?)
    // в одном уроке с формулами — простые кандидаты в обманки "любой
    // другой M_ASC-сосед урока" стали смешивать жанры: формула-LaTeX могла
    // всплыть как вариант ответа у вопроса с обычным текстовым ответом
    // (и наоборот). Единственный непохожий по виду вариант среди остальных
    // угадывается без решения задачи — тот же класс проблемы, что уже
    // чинили для числовых дистракторов (см. fixDistractorsEGEPhysics.ts).
    // Простая эвристика по наличию `$` (LaTeX-формула vs обычный текст)
    // ограничивает пул обманок вопросами того же "жанра".
    const looksLikeFormula = (text: string): boolean => text.includes('$');
    const sameAnswerGenre = (a: string, b: string): boolean => looksLikeFormula(a) === looksLikeFormula(b);

    // Разные challenges МОГУТ случайно иметь одинаковый текст ответа
    // (например "Что такое F_тяж?" → "сила тяжести" и "Что измеряется в
    // Н?" → "сила тяжести" как канонический [0] — два РАЗНЫХ challenge с
    // одинаковым отображаемым текстом). Без дедупликации оба могли попасть
    // в один и тот же пул обманок и показать пользователю один и тот же
    // вариант ответа дважды в списке кнопок.
    const dedupeByAnswerText = <T extends { t_challengeOptions: { text: string }[] }>(items: T[]): T[] => {
        const seen = new Set<string>();
        return items.filter((el) => {
            const text = el.t_challengeOptions[0]?.text || '';
            if (seen.has(text)) return false;
            seen.add(text);
            return true;
        });
    };

    // Общий рендер ASSIST-варианта (переиспользуется и как основной тип,
    // и как fallback для INSERT, когда в формуле нет подходящей буквы —
    // см. lib/formulaLetters.ts).
    const buildAssistQuestion = (t_challenge: typeof lessonChallenges[number]): QuestionType => {
        const other5Questions = dedupeByAnswerText(t_lesson.t_challenges.filter((el) =>
            isMAscLike(el.type)
            && t_challenge.t_challengeOptions[0]?.text !== el.t_challengeOptions[0]?.text
            && sameAnswerGenre(t_challenge.t_challengeOptions[0]?.text || '', el.t_challengeOptions[0]?.text || '')
        ));
        const fiveQuestions = getRandomElements(other5Questions, 5);
        const fiveWrongOptions = fiveQuestions.map(el => el.t_challengeOptions[0]?.text || '');
        const fiveWrongOptionsPlusRight = [...fiveWrongOptions, t_challenge.t_challengeOptions[0]?.text || ''];

        return {
            questionType: 'ASSIST' as const,
            question: t_challenge.question,
            imageSrc: t_challenge.imageSrc,
            options: Shuffle2(fiveWrongOptionsPlusRight),
            numRans: '1',
            optionsQ: [],
            optionsA: [],
            optionsConstructRight: [],
            difficulty: t_challenge.difficulty,
            correctAnswer: getCorrectAnswerText(t_challenge),
            timeLimit: 40,
        };
    };

    // Индекс-выровненный со lessonChallenges массив — 0 = словарный вопрос
    // (обычный текст-ответ), 1 = формула (LaTeX-ответ). Считается ДО
    // основного .map() по тому же принципу, что sameAnswerGenre/
    // looksLikeFormula выше, и приклеивается к готовым QuestionType вторым
    // .map() после (см. ниже) — так не пришлось трогать ни одну из веток
    // ASSIST/INSERT/SWIPE/SCROLL/CONNECT ниже.
    const contentTiers = lessonChallenges.map((c) => looksLikeFormula(c.t_challengeOptions[0]?.text || '') ? 1 : 0);

    // Гарантированный INSERT — раньше стиль рендера выбирался чисто
    // случайно (WEIGHTED_ASC_POOL) НЕЗАВИСИМО для каждой задачи, поэтому
    // при 2 формулах в уроке и ~33% на INSERT шанс не увидеть его вообще
    // ни разу за урок был больше 40% — пользователь поймал это живьём
    // ("прошёл lesson 1, ни одной INSERT"). Явно выбираем ОДНУ
    // формула-задачу (не словарную — INSERT для них откатывается на
    // ASSIST, см. ниже) и принудительно рендерим её как INSERT; для
    // остальных M_ASC-задач стиль по-прежнему случайный (в т.ч. тоже
    // может выпасть INSERT — лишние вхождения не проблема). Если в уроке
    // вообще нет формул (чисто словарный урок) — null, никого не форсим.
    const formulaMAscChallengeIds = lessonChallenges
        .filter((c) => c.type === 'M_ASC' && looksLikeFormula(c.t_challengeOptions[0]?.text || ''))
        .map((c) => c.id);
    const guaranteedInsertChallengeId = formulaMAscChallengeIds.length > 0
        ? formulaMAscChallengeIds[Math.floor(Math.random() * formulaMAscChallengeIds.length)]
        : null;

    questions = lessonChallenges.map((t_challenge, index): QuestionType | undefined => {
        if (isMAscLike(t_challenge.type)) {
            // M_ASC — случайный стиль рендера (кроме той ОДНОЙ задачи,
            // которой гарантирован INSERT — см. guaranteedInsertChallengeId
            // выше); зафиксированный тип (сам t_challenge.type равен одному
            // из ACStype) — всегда этот стиль.
            const randomASCtype: ACStype = t_challenge.type === 'M_ASC'
                ? (t_challenge.id === guaranteedInsertChallengeId
                    ? 'INSERT'
                    : WEIGHTED_ASC_POOL[Math.floor(Math.random() * WEIGHTED_ASC_POOL.length)])
                : t_challenge.type as ACStype;

            if (randomASCtype === 'ASSIST' as const) {
                return buildAssistQuestion(t_challenge);
            }
            else if (randomASCtype === 'INSERT' as const) {
                // INSERT имеет смысл только для формул (LaTeX-ответ,
                // содержит "$") — словарный ответ вроде "Н" тоже может
                // выглядеть как "изолированная буква" для pickInsertBlank
                // (см. lib/formulaLetters.ts), но у него нет "$"-обёртки,
                // и результат (\color{...}{\underset{...}{...}}) рендерится
                // как СЫРОЙ LaTeX-текст вместо формулы — react-latex-next
                // конвертирует в KaTeX только то, что внутри "$...$"
                // делимитеров, а blankedFormula для такого ответа их не
                // содержит. Баг найден пользователем живьём (испорченный
                // текст вместо "Н" на "В чём измеряется F_тяж?"). Откат на
                // ASSIST — тот же путь, что уже используется, когда в
                // формуле вообще нет подходящей буквы.
                if (!looksLikeFormula(t_challenge.t_challengeOptions[0]?.text || '')) {
                    return buildAssistQuestion(t_challenge);
                }

                const siblingChallenges = t_lesson.t_challenges.filter((el) =>
                    isMAscLike(el.type) && el.id !== t_challenge.id
                    && sameAnswerGenre(t_challenge.t_challengeOptions[0]?.text || '', el.t_challengeOptions[0]?.text || '')
                );
                // Усложнённая версия (2 пропуска вместо 1) — примерно
                // в 40% случаев; pickInsertBlank сам тихо откатится на 1
                // пропуск, если в формуле нет подходящего слитного
                // произведения из ≥2 букв или не хватает обманок под 2.
                const wantDoubleBlank = Math.random() < 0.4;
                const insertBlank = pickInsertBlank(t_challenge, siblingChallenges, wantDoubleBlank);

                // Формула без подходящей буквы или без обманок в уроке —
                // откатываемся на обычный ASSIST для этой задачи.
                if (!insertBlank) {
                    return buildAssistQuestion(t_challenge);
                }

                return {
                    questionType: 'INSERT' as const,
                    question: t_challenge.question,
                    imageSrc: t_challenge.imageSrc,
                    options: Shuffle2([...insertBlank.correctLetters, ...insertBlank.distractorLetters]),
                    numRans: '1',
                    optionsQ: [],
                    optionsA: [],
                    optionsConstructRight: [],
                    difficulty: t_challenge.difficulty,
                    // Отсортированный join, а не позиционное сравнение — 2
                    // загаданные буквы всегда из одного произведения, порядок
                    // сомножителей не важен (mgh = hgm).
                    correctAnswer: [...insertBlank.correctLetters].sort().join(','),
                    blankedFormula: insertBlank.blankedFormula,
                    insertCorrectLetters: insertBlank.correctLetters,
                    timeLimit: 40,
                };
            }
            else if (randomASCtype === 'SWIPE' as const) {
                const otherQuestionsForSwipe = dedupeByAnswerText(t_lesson.t_challenges.filter((el) =>
                    isMAscLike(el.type)
                    && t_challenge.t_challengeOptions[0]?.text !== el.t_challengeOptions[0]?.text
                    && sameAnswerGenre(t_challenge.t_challengeOptions[0]?.text || '', el.t_challengeOptions[0]?.text || '')
                ));
                const oneWrongQuestion = getRandomElements(otherQuestionsForSwipe, 1);

                // Нет с чем сравнить (единственная M_ASC-задача урока) —
                // откатываемся на ASSIST.
                if (oneWrongQuestion.length === 0) {
                    return buildAssistQuestion(t_challenge);
                }

                return {
                    questionType: 'SWIPE' as const,
                    question: t_challenge.question,
                    imageSrc: t_challenge.imageSrc,
                    options: Shuffle2([
                        t_challenge.t_challengeOptions[0]?.text || '',
                        oneWrongQuestion[0].t_challengeOptions[0]?.text || '',
                    ]),
                    numRans: '1',
                    optionsQ: [],
                    optionsA: [],
                    optionsConstructRight: [],
                    difficulty: t_challenge.difficulty,
                    correctAnswer: getCorrectAnswerText(t_challenge),
                    timeLimit: 30,
                };
            }
            else if (randomASCtype === 'SCROLL' as const) {
                const otherQuestionsForScroll = dedupeByAnswerText(t_lesson.t_challenges.filter((el) =>
                    isMAscLike(el.type)
                    && t_challenge.t_challengeOptions[0]?.text !== el.t_challengeOptions[0]?.text
                    && sameAnswerGenre(t_challenge.t_challengeOptions[0]?.text || '', el.t_challengeOptions[0]?.text || '')
                ));
                const twoWrongQuestions = getRandomElements(otherQuestionsForScroll, 2);

                // Меньше 2 обманок в уроке — откатываемся на ASSIST.
                if (twoWrongQuestions.length < 2) {
                    return buildAssistQuestion(t_challenge);
                }

                return {
                    questionType: 'SCROLL' as const,
                    question: t_challenge.question,
                    imageSrc: t_challenge.imageSrc,
                    options: Shuffle2([
                        t_challenge.t_challengeOptions[0]?.text || '',
                        twoWrongQuestions[0].t_challengeOptions[0]?.text || '',
                        twoWrongQuestions[1].t_challengeOptions[0]?.text || '',
                    ]),
                    numRans: '1',
                    optionsQ: [],
                    optionsA: [],
                    optionsConstructRight: [],
                    difficulty: t_challenge.difficulty,
                    correctAnswer: getCorrectAnswerText(t_challenge),
                    timeLimit: 30,
                };
            }
            else {
                // randomASCtype === 'CONNECT'
                const otherQuestions = dedupeByAnswerText(t_lesson.t_challenges.filter((el, i) =>
                    isMAscLike(el.type)
                    && t_challenge.t_challengeOptions[0]?.text !== el.t_challengeOptions[0]?.text
                    && sameAnswerGenre(t_challenge.t_challengeOptions[0]?.text || '', el.t_challengeOptions[0]?.text || '')
                ));
                const twoQuestions = getRandomElements(otherQuestions, 2);

                return {
                    questionType: 'CONNECT' as const,
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
                    correctAnswer: getCorrectAnswerText(t_challenge),
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
    }).map((q, idx): QuestionType | undefined => q ? { ...q, contentTier: contentTiers[idx] } : q)
      .filter((q): q is QuestionType => q !== undefined);

    // 🔥 ДОБАВЛЕНА ПРОВЕРКА: если questions пустой или первый вопрос undefined
    if (!questions || questions.length === 0 || !questions[0]) {
        redirect('/trainer');
    }

    // ЕСЛИ ТИП GEOSIN , то НЕ шафлим, а идем в порядке
    if (questions[0].questionType !== 'GEOSIN') {
        // Сложность по возрастанию по ДВУМ осям: сначала тип КОНТЕНТА
        // (contentTier — словарный вопрос раньше формулы, "что такое
        // сила" раньше "F=?"), и уже ВНУТРИ каждого из них — сложность
        // РЕНДЕРА (RENDER_DIFFICULTY_TIER — ASSIST/CONNECT проще, SWIPE/
        // SCROLL средне, INSERT сложнее всего). contentTier — старший
        // разряд (умножен на 10, с большим запасом над макс. рендер-
        // тиром 2), поэтому ЛЮБОЙ словарный вопрос идёт раньше ЛЮБОГО
        // формульного, а INSERT (всегда формула на практике, см.
        // lib/formulaLetters.ts) естественно оказывается в самом конце —
        // никакого спецкейса под него не потребовалось. Сортировка после
        // шаффла (Array.sort стабильна) — порядок уровней зафиксирован, а
        // порядок вопросов ВНУТРИ одного уровня всё ещё случайный при
        // каждом заходе в урок.
        const combinedTier = (q: QuestionType) => (q.contentTier ?? 0) * 10 + (RENDER_DIFFICULTY_TIER[q.questionType] ?? 1);
        questions = ShuffleTS(questions)
            .sort((a, b) => combinedTier(a) - combinedTier(b));
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
            stage={stageParam}
            isBossStage={isBossStage}
        />
    );
}

export default LessonIdPage;

