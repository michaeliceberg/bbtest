// app/learn/unit.tsx

import { lessons, units } from "@/db/schema";
import { UnitBanner } from "./unit-banner";
import { LessonButton } from "./lesson-button";

interface lessonDone {
    lesson: number;
    done: number[];
}

type SimpleChallenge = {
    id: number;
    type: string;
    question: string;
    order: number;
    points: number;
    author: string;
    difficulty: string;
    imageSrc: string;
    lessonId: number;
}

type Props = {
    id: number;
    unitIndex: number;
    order: number;
    title: string;
    description: string;
    
    lessons: {
        completed: boolean;
        id: number;
        title: string;
        order: number;
        unitId: number;
        challenges: SimpleChallenge[]
    }[]

    activeLesson: typeof lessons.$inferSelect & {
        unit: typeof units.$inferSelect;
    } | undefined;
    lessonStat: Array<lessonDone>;
    imgSrc: string;
    percentageDone: number;
    RecomNumChallengesToday: number;
    bgSvgSrc: string,
    missedCIds: number[],
    dailyMissedCIds?: number[],
    homeworkStatusMap: Map<number, { homeworkId: number; status: string; dueDate: Date; correctCount: number; totalCount: number }>;
    
    // Новые пропсы от родителя
    isUnlocked?: boolean;
    isCompleted?: boolean;
    unitProgressPercent?: number;
    needMoreLessons?: number;
    isNextUnitUnlocked?: boolean;
    isAdmin?: boolean;
    lastTouchedLessonId?: number | null;
}

// Количество задач, необходимых для открытия следующего урока
const CHALLENGES_TO_UNLOCK_NEXT_LESSON = 4;

// ПИЛОТ (по просьбе пользователя, см. CLAUDE.md) — маленькая картинка/
// формула вместо абстрактной звезды/черепа на кружке урока, чтобы тема
// узнавалась визуально, а не только по тексту. Пока только на двух
// юнитах для проверки идеи: "6. Простейшие уравнения" (юнит 91 — короткий
// формульный глиф вручную по названию урока) и "1. Планиметрия" (юнит 92).
//
// Для юнита 92 ПЕРВАЯ версия пилота переиспользовала иллюстрацию первой
// задачи урока как есть (никаких новых ассетов) — но живая проверка
// показала, что настоящие иллюстрации задач (сетка, подписанные точки
// A/B/C/D, тонкие линии) при сжатии до ~40px превращаются в нечитаемое
// синее пятно, одинаковое на вид для любой фигуры. Заменено на набор
// простых силуэтных иконок без сетки/подписей (public/geometry/
// topic-icons/*.svg, жирный белый контур на прозрачном фоне — тот же
// ACTIVE_ICON_COLOR, что и у обычных Star/Crown) — они узнаются
// значительно лучше в размере кружка урока.
const TOPIC_GLYPH_BY_TITLE: Record<string, string> = {
    "Показательные уравнения": "aˣ",
    "Логарифмические уравнения": "log",
    "Иррациональные уравнения": "√x",
    "Линейные уравнения": "x",
    "Квадратные уравнения": "x²",
    "Уравнения вида (x+a)^n=b": "(x+a)ⁿ",
    "Рациональные уравнения": "⅟ₓ",
    "Тригонометрические уравнения": "sin",
};
const TOPIC_ICON_BY_TITLE: Record<string, string> = {
    "Прямоугольник: периметр, площадь, диагональ": "rectangle",
    "Параллелограмм и ромб: площадь через синус угла": "parallelogram",
    "Ромб: площадь и диагонали": "rhombus",
    "Углы и биссектрисы параллелограмма": "parallelogram",
    "Средняя линия и точки на сторонах: площадь части фигуры": "triangle_generic",
    "Центральные и вписанные углы": "circle_angles",
    "Касательная, хорда, секущая": "circle_tangent",
    "Трапеция": "trapezoid",
    "Прямоугольный треугольник: тригонометрические отношения": "right_triangle",
    "Прямоугольный треугольник: высота на гипотенузу": "right_triangle_altitude",
    "Прямоугольный треугольник: биссектриса, медиана, высота из прямого угла": "right_triangle_cevians",
    "Прямоугольный треугольник: площадь и углы": "right_triangle",
    "Равнобедренный треугольник: сторона по синусу/косинусу угла": "isosceles_triangle",
    "Треугольник: площадь, средняя линия, высоты — быстрые факты": "triangle_generic",
    "Внешний угол треугольника": "triangle_exterior",
    "Углы треугольника по отношению": "triangle_generic",
    "Вписанная окружность в четырёхугольник": "incircle_quad",
    "Вписанная окружность в треугольник": "incircle_triangle",
    "Вписанный четырёхугольник и углы, опирающиеся на дуги": "cyclic_quad",
};

export const Unit = ({
    id,
    unitIndex,
    order,
    title,
    description,
    lessons,
    activeLesson,
    lessonStat,
    imgSrc,
    percentageDone,
    RecomNumChallengesToday,
    bgSvgSrc,
    missedCIds,
    dailyMissedCIds = [],
    homeworkStatusMap,
    isUnlocked = true,
    isCompleted = false,
    unitProgressPercent = 0,
    needMoreLessons = 0,
    isNextUnitUnlocked = false,
    isAdmin = false,
    lastTouchedLessonId = null,
}: Props) => {
    // Если юнит заблокирован и не завершён — все уроки locked
    // (админам разрешён доступ к любому уроку без прохождения предыдущих)
    const isUnitLocked = !isAdmin && !isUnlocked && !isCompleted;
    
    // Вычисляем, сколько задач решено в каждом уроке
    const getLessonProgress = (lessonId: number): { correct: number; total: number } => {
        const stat = lessonStat.find(ls => ls.lesson === lessonId);
        if (!stat) return { correct: 0, total: 0 };
        return {
            correct: stat.done[1], // doneRight
            total: stat.done[0],
        };
    };
    
    // Определяем, открыт ли урок
    const isLessonUnlocked = (index: number): boolean => {
        // Админ видит и может открыть любой урок без прохождения предыдущих
        if (isAdmin) return true;

        if (isUnitLocked) return false;

        // Первый урок всегда открыт
        if (index === 0) return true;
        
        // Проверяем предыдущий урок
        const prevLesson = lessons[index - 1];
        if (!prevLesson) return true;
        
        const progress = getLessonProgress(prevLesson.id);
        // Следующий урок открывается, если решено 4 задачи в предыдущем
        return progress.correct >= CHALLENGES_TO_UNLOCK_NEXT_LESSON;
    };
    
    return (
        <>
            <UnitBanner
                title={title}
                description={description}
                imgSrc={imgSrc}
                id={id}
                unitIndex={unitIndex}
                percentageDone={percentageDone}
                bgSvgSrc={bgSvgSrc}
                isUnlocked={isUnlocked}
                isCompleted={isCompleted}
                unitProgressPercent={unitProgressPercent}
                needMoreLessons={needMoreLessons}
                isNextUnitUnlocked={isNextUnitUnlocked}
            />
            {/* pb-16: маскот на экстремуме змейки центрируется по высоте СВОЕЙ
                строки (top:50%) и на широком экране может быть выше самой
                строки (до 150px против ~102px) — вылезает вниз. Если это
                последняя строка юнита (например, юнит ровно из 3 уроков),
                без запаса снизу вылезание выходит за пределы контейнера и
                добавляет вертикальный скроллбар странице. */}
            <div data-zigzag-container className="flex items-center flex-col relative overflow-x-hidden pb-16">
                {lessons.map((lesson, index) => {
                    const isCurrent = lesson.id === activeLesson?.id;
                    const lessonProgress = getLessonProgress(lesson.id);
                    const isLessonCompleted = lessonProgress.correct >= lessonProgress.total && lessonProgress.total > 0;
                    const isUnlocked = isLessonUnlocked(index);
                    




                    // Убери проверку || lesson.completed из isLessonLocked:
                    // const isLessonLocked = isUnitLocked || !isUnlocked;
                    // // без проверки на completed, чтобы пройденные уроки были доступны


                    // Урок заблокирован, если:
                    // 1. Юнит заблокирован
                    // 2. ИЛИ урок не открыт по логике последовательности
                    // 3. ИЛИ урок уже пройден (можно сделать опциональным для повторения)
                    const isLessonLocked = isUnitLocked || !isUnlocked;
                    
                    // Для повторения: пройденные уроки тоже можно открыть, но сделаем их серыми
                    const isCompletedLesson = isLessonCompleted;

                    // Самое срочное активное задание среди задач этого урока (если есть).
                    const lessonChallengeIds = lesson.challenges.map(el => el.id);
                    const lessonHomeworkStatuses = lessonChallengeIds
                        .map(cid => homeworkStatusMap.get(cid))
                        .filter((hw): hw is NonNullable<typeof hw> => !!hw);
                    const homeworkStatus = lessonHomeworkStatuses.sort(
                        (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
                    )[0] ?? null;

                    const topicGlyph = TOPIC_GLYPH_BY_TITLE[lesson.title] ?? null;
                    const topicIconKey = TOPIC_ICON_BY_TITLE[lesson.title];
                    const topicIconSrc = topicIconKey ? `/geometry/topic-icons/${topicIconKey}.svg` : null;

                    return (
                        <LessonButton
                            key={lesson.id}
                            id={lesson.id}
                            unitIndex={unitIndex}
                            index={index}
                            totalCount={lessons.length - 1}
                            current={isCurrent}
                            locked={isLessonLocked}
                            title={lesson.title}
                            topicGlyph={topicGlyph}
                            topicIconSrc={topicIconSrc}
                            lessonStat={lessonStat}
                            missedCIds={missedCIds}
                            dailyMissedCIds={dailyMissedCIds}
                            challengeIdsInLesson={lessonChallengeIds}
                            homeworkStatus={homeworkStatus}
                            completed={isCompletedLesson}
                            // Дополнительные пропсы для отображения прогресса
                            needMore={CHALLENGES_TO_UNLOCK_NEXT_LESSON - lessonProgress.correct}
                            totalChallenges={lessonProgress.total}
                            correctChallenges={lessonProgress.correct}
                            challengesNeeded={CHALLENGES_TO_UNLOCK_NEXT_LESSON}
                            isLastTouched={lesson.id === lastTouchedLessonId}
                        />
                    );
                })}
            </div>
        </>
    )
}


