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
    // Курс "ЕГЭ Физика" (courseId=12) — уроки после разбиения по формуле/
    // методу решения (см. CLAUDE.md) получают короткий физический глиф там,
    // где урок реально сводится к одной формуле; для навыков без единой
    // формулы (чтение графика, сложение векторов и т.п.) — силуэтная
    // иконка, см. TOPIC_ICON_BY_TITLE ниже.
    "Ускорение по графику скорости": "Δv/Δt",
    "Скорость по графику координаты": "Δx/Δt",
    "Равноускоренное движение — формулы": "v₀+at",
    "Второй закон Ньютона: пропорции F, m, a": "F=ma",
    "Сила и ускорение через равнодействующую": "F=ma",
    "Вес тела в лифте": "m(g±a)",
    "Сила трения скольжения": "μN",
    "Сила упругости и закон Гука": "F=kx",
    "Закон всемирного тяготения": "Gm/r²",
    "Сила тяжести F=mg": "F=mg",
    // Юниты 3-4 "Законы сохранения" / "Статика. Колебания и волны"
    "Кинетическая энергия": "Eк=mv²/2",
    "Потенциальная энергия пружины": "E=kx²/2",
    "Энергия при свободном падении и вертикальном броске": "mgh=mv²/2",
    "Работа силы и превращения энергии": "A=ΔE",
    "Работа силы": "A=Fscosα",
    "Мощность": "N=A/t",
    "Импульс тела": "p=mv",
    "Изменение импульса под действием силы": "Δp=FΔt",
    "Закон сохранения импульса": "Σp=const",
    "Давление жидкости": "P=ρgh",
    "Сила Архимеда": "F=ρgV",
    "Период колебаний маятников": "T=2π√(l/g)",
    "Энергия колебаний": "E=Eк+Eп",
    // Юниты 5-8 "Механика 1/2" / "МКТ, Изопроцессы"
    "Закон Гука: упругая сила пружины": "F=kx",
    "Гидростатика: сила Архимеда и плавание тел": "F=ρgV",
    "Механические колебания: пружинный и математический маятник": "T=2π√(l/g)",
    "Давление через концентрацию и энергию": "p=⅔nĒ",
    "Совместное уравнение p=nkT": "p=nkT",
    "Энергия молекул и температура": "Ē=³⁄₂kT",
    "Сравнение газов: скорость молекул, плотность, молярная масса": "√(3kT/m)",
    "Переход состояния газа: пропорция p₁V₁/T₁=p₂V₂/T₂": "pV/T=const",
    "Числовые расчёты по уравнению Менделеева-Клапейрона": "pV=νRT",
    "Изопроцессы идеального газа": "pV/T=const",
    // Юниты 8-9 "ПНТ, Теплоемкость, КПД" / "Газ. Графики"
    "Первое начало термодинамики: ΔU=Q+A (без графика)": "ΔU=Q+A",
    "Внутренняя энергия идеального газа": "U=³⁄₂νRT",
    "Прямая формула Q=cmΔt / Q=λm (без графика)": "Q=cmΔt",
    "КПД тепловой машины — прямая формула": "η=A/Q₁",
    "Максимальный КПД (цикл Карно)": "η=1-T₂/T₁",
    // Юниты 10-11 "Установите соответствие" / "Электричество"
    "КПД тепловых двигателей (цикл Карно)": "η=A/Q₁",
    "КПД теплового двигателя (цикл Карно)": "η=A/Q₁",
    "Формулы МКТ, изопроцессов и физических величин (без диаграмм)": "p=nkT",
    "МКТ и изопроцессы идеального газа (адиабата/изотерма/изохора, смесь газов)": "pV=νRT",
    "Изопроцессы, смеси газов и КПД: качественный анализ без диаграмм": "pV=const",
    "Изопроцессы газа и КПД теплового двигателя: качественный анализ": "pVᵞ=const",
    "Закон Кулона: масштабирование заряда и расстояния": "kq₁q₂/r²",
    "Заряд и сила тока: q=I·t": "q=It",
    "Закон Ома для полной цепи: ЭДС и внутреннее сопротивление": "ε=I(R+r)",
    "Полная цепь с ЭДС и внутренним сопротивлением": "ε=I(R+r)",
    "Мощность и работа тока: P=UI, A=Pt": "P=UI",
    "Электрические цепи из резисторов: мощность и теплота на участке": "Q=I²Rt",
    "Удельное сопротивление и геометрия проводника": "R=ρL/S",
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
    // Курс "ЕГЭ Физика" — уроки Кинематики/Динамики без единой формулы
    // (см. TOPIC_GLYPH_BY_TITLE выше — там формульные уроки этих же юнитов)
    "Путь и координата по графику скорости": "vt_area",
    "Путь по графику скорости": "vt_area",
    "Относительное движение (два тела)": "two_bodies_meet",
    "Относительная скорость (сложение скоростей)": "vector_triangle",
    "Средняя скорость и перемещение": "displacement_path",
    "Квадратичный закон координаты x(t)": "parabola_tangent",
    "Второй закон Ньютона по графику": "step_graph_point",
    "Наклонная плоскость и конический маятник": "conical_pendulum",
    "Равнодействующая сил (сложение векторов)": "force_parallelogram",
    "Трение покоя и особые случаи": "static_friction_limit",
    "Системы из нескольких пружин": "two_springs_block",
    "Закон сохранения энергии на наклонной плоскости": "incline_energy",
    "Звуковые волны": "loudspeaker_waves",
    "Фаза колебаний: моменты min/max энергии": "sine_extrema",
    "Графики и уравнения колебаний": "sine_amplitude_graph",
    "Кинематика: движение по графикам и таблицам": "step_graph_point",
    "Динамика: силы, трение, движение по окружности и спутники": "force_on_block",
    "Законы сохранения: энергия, импульс, колебания": "collision_before_after",
    "Баллистика: свободное падение и бросок под углом к горизонту": "trajectory_arc",
    "Гравитация и спутники: движение по круговым орбитам": "satellite_orbit",
    "Динамика: силы, трение, наклонная плоскость, рычаг": "static_friction_limit",
    "Разное: импульс, работа крана, звуковая волна, давление": "checklist_ticks",
    "Смешивание газов и закон Дальтона": "two_vessels_valve",
    "Работа газа — площадь под графиком p-V": "vt_area",
    "Циклические процессы: тип участка (изохора/изобара/изотерма)": "pv_cycle_4pts",
    "Теплоёмкость и фазовые переходы по графику t(Q)": "heating_plateau_graph",
    "График t(Q): удельная теплоёмкость и теплота фазового перехода": "heating_plateau_graph",
    "Мощность нагревателя и график t(время)": "heater_clock",
    "Отношения теплоёмкостей и масс при одинаковом Q": "balance_scale_blocks",
    "Калориметрия: тепловой баланс при смешивании": "calorimeter_mix",
    "Циклические процессы на pV/pρ-диаграммах": "pv_cycle_4pts",
    "Многоточечные, сравнительные и табличные процессы": "multipoint_table_process",
    "Влажность воздуха и насыщенный пар": "thermometer_drop",
    "Смеси и диффузия газов через перегородку": "two_vessels_valve",
    "Теплообмен и сравнение параметров разных газов": "two_vessels_valve",
    "Циклические процессы на диаграммах (pV, pT, VT, UV)": "pv_cycle_4pts",
    "Теплообмен и фазовые переходы (графики и таблицы)": "heating_plateau_graph",
    "Сравнение и теплообмен между разными газами": "two_vessels_valve",
    "Некруговые процессы и таблицы состояний": "process_3pts_graph",
    "Сравнение графиков двух процессов (А/Б)": "two_graphs_compare",
    "Циклы и многоступенчатые процессы: работа/ΔU по участкам": "pv_cycle_4pts",
    "Графики нагревания и фазовых переходов": "heating_plateau_graph",
    "Газ под подвижным поршнем: изобарный процесс": "piston_weight",
    "Диаграммы процесса 1-2-3: сравнение величин по графику": "process_3pts_graph",
    "Диаграммы состояния идеального газа: чтение графиков": "process_3pts_graph",
    "Диаграммы состояния газа: чтение графиков": "process_3pts_graph",
    "Теплообмен, калориметрия и влажность воздуха": "thermometer_drop",
    "Влажный воздух и водяной пар (график насыщения, конденсация)": "saturation_curve_point",
    "Фазовые переходы, калориметрия и влажный воздух": "melting_ice_thermometer",
    "Закон Кулона + сохранение заряда при соприкосновении шариков": "charge_conservation_touch",
    "Закон Ома для участка цепи: сопротивление по графику I(U)": "iu_graph_linear",
    "График I(U) лампы накаливания: работа и мощность тока": "iu_graph_nonlinear_area",
    "Эквивалентное сопротивление резисторной сети": "resistor_network_switch",
    "Ток и напряжение в участке сети резисторов": "circuit_ammeter_voltmeter",
    "Реальные фотографии схем: пересчёт показаний": "circuit_photo",
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


