// scripts/seedUnitCircleTrainer.ts
//
// Новый тип UNITCIRCLE (тригонометрический круг с точками-"магнитами",
// см. type-unitcircle.tsx) — по прямой просьбе пользователя: тренажёр на
// расположение корней тригонометрических уравнений на окружности, часть
// б) задания №13 ЕГЭ.
//
// Раунд 2 (2026-09-08) — по прямой просьбе пользователя:
// 1) "избыточные" locate-примеры с многовитковым приведением (15π/4,
//    17π/6 и т.п.) убраны целиком — заменены тремя чёткими уровнями:
//    оси (π/2,π,3π/2,2π + их отрицательные формы), простые Q1/Q4
//    (π/3,π/6,π/4 + отрицательные), Q2/Q3 (3π/4,2π/3,5π/6 + отрицательные).
// 2) Новый режим 'label' (см. UnitCircleData в page.tsx) — вместо
//    "отметь ВСЕ точки среди всех 16" теперь пунктирная направляющая
//    (горизонтальная для sin x=a, вертикальная для cos x=a) заранее
//    выделяет 1-2 точки-кандидата, и для КАЖДОЙ из них нужно выбрать
//    правильную подпись угла из небольшого списка вариантов — заменяет
//    старые sin/cos 'select'-уроки (tg остался как был, у тангенса нет
//    естественной "направляющей" на самой окружности).
//
// Раунд 3 (2026-09-10) — по прямой просьбе пользователя: было слишком
// много уроков (~25) по 2-3 задачи каждый — перегруппировано в 10 уроков
// по 6-9 задач, организованных строго по темам (см. buildLessons() ниже):
// 1) радианы/градусы, 2) оси круга, 3) простые Q1/Q4, 4) Q2/Q3,
// [Контрольная 1], 5) sin/cos = 0/±1, 6-7) sin/cos = дробь, 8) tg(x)=a,
// [Контрольная 2 — весь круг]. Мини-боссы (isReviewStage по слову
// "контрольная", см. trainer-grade-tree.tsx) стоят каждые ~4 урока и
// смешивают выборку из ВСЕХ предыдущих категорий, а не только соседних.
// Старый LOCATE_SIMPLE (10 избыточных "простых углов", дублировавших
// подмножества LOCATE_AXES/Q1Q4/Q2Q3 без чёткой категоризации — наследие
// ДО раунда 2, так и не убранное тогда) удалён целиком — все его значения
// уже покрыты (с добавлением отрицательных форм) тремя чёткими группами.
//
// Наполняем тот же t_course "Математика-11" (id=5, courseId=11 "ЕГЭ
// Математика Профиль") — юнит "Тригонометрический круг", order=4.
//
// Корректность ответов НЕ вбивается руками — каждый target/equation
// проверяется программно против фиксированного набора 16 точек круга,
// скрипт падает с ошибкой при малейшем расхождении, до того как это
// попадёт в БД.

import db from "@/db/drizzle"
import { eq } from "drizzle-orm"
import { t_units, t_lessons, t_challenges, t_challengeOptions } from "@/db/schema"

const MATH11_TCOURSE_ID = 5
const UNIT_TITLE = "Тригонометрический круг"

// 16 стандартных точек тригонометрического круга — кратные 30° (12) +
// нечётные кратные 45° (4). label — слитная (без \dfrac) запись угла
// через "/" — компактнее для кружка-магнита (см. type-unitcircle.tsx).
const POINTS: { label: string; angle: number }[] = [
    { label: "0", angle: 0 },
    { label: "\\pi/6", angle: Math.PI / 6 },
    { label: "\\pi/4", angle: Math.PI / 4 },
    { label: "\\pi/3", angle: Math.PI / 3 },
    { label: "\\pi/2", angle: Math.PI / 2 },
    { label: "2\\pi/3", angle: (2 * Math.PI) / 3 },
    { label: "3\\pi/4", angle: (3 * Math.PI) / 4 },
    { label: "5\\pi/6", angle: (5 * Math.PI) / 6 },
    { label: "\\pi", angle: Math.PI },
    { label: "7\\pi/6", angle: (7 * Math.PI) / 6 },
    { label: "5\\pi/4", angle: (5 * Math.PI) / 4 },
    { label: "4\\pi/3", angle: (4 * Math.PI) / 3 },
    { label: "3\\pi/2", angle: (3 * Math.PI) / 2 },
    { label: "5\\pi/3", angle: (5 * Math.PI) / 3 },
    { label: "7\\pi/4", angle: (7 * Math.PI) / 4 },
    { label: "11\\pi/6", angle: (11 * Math.PI) / 6 },
]

const TWO_PI = 2 * Math.PI
const TOL = 1e-6

const normalizeAngle = (a: number): number => {
    let x = a % TWO_PI
    if (x < 0) x += TWO_PI
    return x
}

// 'locate' — ровно один угол, приведённый по модулю 2π, ДОЛЖЕН попасть
// точно в одну из 16 точек, иначе бросаем ошибку (защита от опечатки в
// значении угла).
function findSinglePointIndex(value: number): number {
    const norm = normalizeAngle(value)
    const idx = POINTS.findIndex((p) => Math.abs(p.angle - norm) < TOL || Math.abs(p.angle - norm - TWO_PI) < TOL)
    if (idx === -1) {
        throw new Error(`findSinglePointIndex: угол ${value} (норм. ${norm}) не совпал ни с одной из 16 точек`)
    }
    return idx
}

// 'select'/'label' — все точки, где sin/cos совпадает с value (с допуском).
function findAllMatchingIndices(fn: (angle: number) => number, value: number): number[] {
    const out: number[] = []
    POINTS.forEach((p, idx) => {
        if (Math.abs(fn(p.angle) - value) < 1e-9) out.push(idx)
    })
    if (out.length === 0) {
        throw new Error(`findAllMatchingIndices: значение ${value} не совпало ни с одной из 16 точек`)
    }
    return out
}

// Отвлекающие подписи для 'label' — соседние (по индексу в 16-точечном
// цикле, не по физической близости) точки, гарантированно НЕ являются
// точкой pointIndex самой; count всегда выполним (8 разных смещений на
// 16 точек с лихвой хватает и на count=2, и на count=3).
function pickNearbyLabels(pointIndex: number, count: number): string[] {
    const offsets = [1, -1, 2, -2, 3, -3, 4, -4]
    const out: string[] = []
    for (const off of offsets) {
        if (out.length >= count) break
        const idx = (((pointIndex + off) % 16) + 16) % 16
        out.push(POINTS[idx].label)
    }
    return out
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

type LabelTarget = { pointIndex: number; options: string[] }
type Challenge = {
    question: string
    mode: 'locate' | 'select' | 'label'
    correctIndices: number[]
    labelTargets?: LabelTarget[]
    guideAxis?: 'sin' | 'cos' | 'tan'
    guideValue?: number
    guideValueLabel?: string
}

// ===== LOCATE, уровень 2 — оси (π/2, π, 3π/2, 2π=0) в прямой и
// отрицательной форме. По прямой просьбе пользователя — заменяет
// прежний набор с многовитковым приведением (15π/4 и т.п.), который был
// признан "неинтересным, только тратить время". =====
const LOCATE_AXES: { disp: string; val: number }[] = [
    { disp: "\\dfrac{\\pi}{2}", val: Math.PI / 2 },
    { disp: "\\pi", val: Math.PI },
    { disp: "\\dfrac{3\\pi}{2}", val: (3 * Math.PI) / 2 },
    { disp: "2\\pi", val: 2 * Math.PI }, // → 0
    { disp: "-\\dfrac{\\pi}{2}", val: -Math.PI / 2 }, // → 3π/2
    { disp: "-\\pi", val: -Math.PI }, // → π
    { disp: "-\\dfrac{3\\pi}{2}", val: (-3 * Math.PI) / 2 }, // → π/2
    { disp: "-2\\pi", val: -2 * Math.PI }, // → 0
]

// ===== LOCATE, уровень 3 — простые Q1-углы и их отрицательные (→ Q4)
// зеркала =====
const LOCATE_Q1Q4: { disp: string; val: number }[] = [
    { disp: "\\dfrac{\\pi}{3}", val: Math.PI / 3 },
    { disp: "\\dfrac{\\pi}{6}", val: Math.PI / 6 },
    { disp: "\\dfrac{\\pi}{4}", val: Math.PI / 4 },
    { disp: "-\\dfrac{\\pi}{3}", val: -Math.PI / 3 }, // → 5π/3
    { disp: "-\\dfrac{\\pi}{6}", val: -Math.PI / 6 }, // → 11π/6
    { disp: "-\\dfrac{\\pi}{4}", val: -Math.PI / 4 }, // → 7π/4
]

// ===== LOCATE, уровень 4 — Q2-углы и их отрицательные (→ Q3) зеркала =====
const LOCATE_Q2Q3: { disp: string; val: number }[] = [
    { disp: "\\dfrac{3\\pi}{4}", val: (3 * Math.PI) / 4 },
    { disp: "\\dfrac{2\\pi}{3}", val: (2 * Math.PI) / 3 },
    { disp: "\\dfrac{5\\pi}{6}", val: (5 * Math.PI) / 6 },
    { disp: "-\\dfrac{3\\pi}{4}", val: (-3 * Math.PI) / 4 }, // → 5π/4
    { disp: "-\\dfrac{2\\pi}{3}", val: (-2 * Math.PI) / 3 }, // → 4π/3
    { disp: "-\\dfrac{5\\pi}{6}", val: (-5 * Math.PI) / 6 }, // → 7π/6
]

// ===== SELECT — tg x = a. Точки по-прежнему выбираются кликом (не через
// подписи снизу, как у 'label') — но теперь у тангенса ЕСТЬ собственная
// направляющая: вертикальная "ось тангенса" рядом с кругом (касательная
// справа), см. type-unitcircle.tsx. label — короткая метка риски на этой
// оси (БЕЗ "tg(x) = "-префикса, который есть в disp для текста вопроса). =====
const TG_EQUATIONS: { disp: string; val: number; label: string }[] = [
    { disp: "tg(x) = 1", val: 1, label: "1" },
    { disp: "tg(x) = -1", val: -1, label: "-1" },
    { disp: "tg(x) = \\sqrt{3}", val: Math.sqrt(3), label: "\\sqrt{3}" },
    { disp: "tg(x) = -\\sqrt{3}", val: -Math.sqrt(3), label: "-\\sqrt{3}" },
    { disp: "tg(x) = \\dfrac{\\sqrt{3}}{3}", val: Math.sqrt(3) / 3, label: "\\dfrac{\\sqrt{3}}{3}" },
    { disp: "tg(x) = -\\dfrac{\\sqrt{3}}{3}", val: -Math.sqrt(3) / 3, label: "-\\dfrac{\\sqrt{3}}{3}" },
    { disp: "tg(x) = 0", val: 0, label: "0" },
]

// ===== LABEL — sin x = a / cos x = a: пунктирная направляющая заранее
// выделяет 1-2 точки, для каждой выбирается верная подпись угла из
// нескольких вариантов (не общий multi-select по всем 16). =====
const SIN_LABEL_TARGETS: { disp: string; val: number }[] = [
    { disp: "\\dfrac{1}{2}", val: 0.5 },
    { disp: "-\\dfrac{1}{2}", val: -0.5 },
    { disp: "\\dfrac{\\sqrt{2}}{2}", val: Math.SQRT1_2 },
    { disp: "-\\dfrac{\\sqrt{2}}{2}", val: -Math.SQRT1_2 },
    { disp: "\\dfrac{\\sqrt{3}}{2}", val: Math.sqrt(3) / 2 },
    { disp: "-\\dfrac{\\sqrt{3}}{2}", val: -Math.sqrt(3) / 2 },
    { disp: "0", val: 0 },
    { disp: "1", val: 1 },
    { disp: "-1", val: -1 },
]
const COS_LABEL_TARGETS: { disp: string; val: number }[] = [
    { disp: "\\dfrac{1}{2}", val: 0.5 },
    { disp: "-\\dfrac{1}{2}", val: -0.5 },
    { disp: "\\dfrac{\\sqrt{2}}{2}", val: Math.SQRT1_2 },
    { disp: "-\\dfrac{\\sqrt{2}}{2}", val: -Math.SQRT1_2 },
    { disp: "\\dfrac{\\sqrt{3}}{2}", val: Math.sqrt(3) / 2 },
    { disp: "-\\dfrac{\\sqrt{3}}{2}", val: -Math.sqrt(3) / 2 },
    { disp: "0", val: 0 },
    { disp: "1", val: 1 },
    { disp: "-1", val: -1 },
]

const locateQuestion = (disp: string) => `Где находится $${disp}$?`
// "Укажи углы" вместо "Отметь точки" — по прямой просьбе пользователя
// (изначально 2026-09-09 для labelQuestion/'label'-режима: там кликают не
// по точке напрямую, а выбирают подпись угла снизу; 2026-09-10 — та же
// формулировка распространена и на selectQuestion/'select'-режим tg, по
// той же логике — "отметь точки" не по смыслу самого взаимодействия,
// когда результат — набор УГЛОВ, а не произвольных точек на плоскости).
const selectQuestion = (disp: string) => `Укажи углы, где $${disp}$`
const labelQuestion = (axis: 'sin' | 'cos', disp: string) => `Укажи углы, где $\\${axis} x = ${disp}$`

function buildLocate(items: { disp: string; val: number }[]): Challenge[] {
    return items.map(({ disp, val }) => ({
        question: locateQuestion(disp),
        mode: 'locate' as const,
        correctIndices: [findSinglePointIndex(val)],
    }))
}

function buildSelect(items: { disp: string; val: number; label?: string }[], fn: (a: number) => number): Challenge[] {
    return items.map(({ disp, val, label }) => ({
        question: selectQuestion(disp),
        mode: 'select' as const,
        correctIndices: findAllMatchingIndices(fn, val),
        // label задан только у TG_EQUATIONS — единственный текущий
        // потребитель buildSelect с направляющей (см. комментарий там же).
        guideAxis: label !== undefined ? ('tan' as const) : undefined,
        guideValue: label !== undefined ? val : undefined,
        guideValueLabel: label,
    }))
}

function buildLabel(items: { disp: string; val: number }[], axis: 'sin' | 'cos', fn: (a: number) => number): Challenge[] {
    return items.map(({ disp, val }) => {
        const matches = findAllMatchingIndices(fn, val)
        const labelTargets: LabelTarget[] = matches.map((pointIndex) => {
            const distractors = pickNearbyLabels(pointIndex, 2)
            const options = shuffle([POINTS[pointIndex].label, ...distractors])
            return { pointIndex, options }
        })
        return {
            question: labelQuestion(axis, disp),
            mode: 'label' as const,
            correctIndices: matches,
            labelTargets,
            guideAxis: axis,
            guideValue: val,
            guideValueLabel: disp,
        }
    })
}

// Сбалансированное деление — не даёт "огрызок" из 1 задачи.
function chunkBalanced<T>(items: T[], targetSize: number): T[][] {
    if (items.length === 0) return []
    const numGroups = Math.max(1, Math.ceil(items.length / targetSize))
    const baseSize = Math.floor(items.length / numGroups)
    const remainder = items.length % numGroups
    const out: T[][] = []
    let idx = 0
    for (let g = 0; g < numGroups; g++) {
        const size = baseSize + (g < remainder ? 1 : 0)
        out.push(items.slice(idx, idx + size))
        idx += size
    }
    return out
}

// ===== Радианы ↔ градусы — по прямой просьбе пользователя, "в первые
// уроки этой темы": прежде чем работать с точками на круге, полезно
// закрепить сам перевод единиц. Обычный M_ASC-словарь (как формулы
// физики, см. insertVocabChallenge в seedDynamicsVocabPilot.ts) — ответ
// хранится в t_challengeOptions, а НЕ в unitCircleData: дистракторы
// ("π это? 180°/360°/90°") собираются динамически из СОСЕДНИХ задач
// этого же урока самим рендер-пайплайном (page.tsx), специально
// подбирать 3 конкретных варианта на каждый вопрос не нужно — сама эта
// подборка (другие градусные/радианные значения урока) и даёт ровно
// такой набор обманок, какой пользователь привёл примером. =====
const DEGREE_VOCAB: { question: string; answer: string }[] = [
    { question: '$\\pi$ это', answer: '$180°$' },
    { question: '$2\\pi$ это', answer: '$360°$' },
    { question: '$\\dfrac{\\pi}{2}$ это', answer: '$90°$' },
    { question: '$\\dfrac{\\pi}{3}$ это', answer: '$60°$' },
    { question: '$\\dfrac{\\pi}{4}$ это', answer: '$45°$' },
    { question: '$\\dfrac{\\pi}{6}$ это', answer: '$30°$' },
    { question: '$180°$ это', answer: '$\\pi$' },
    { question: '$360°$ это', answer: '$2\\pi$' },
    { question: '$90°$ это', answer: '$\\dfrac{\\pi}{2}$' },
]

async function insertVocabChallenge(lessonId: number, order: number, question: string, answer: string) {
    const [ch] = await db.insert(t_challenges).values({
        t_lessonId: lessonId,
        type: 'M_ASC',
        question,
        order,
        points: 10,
        author: "ЕГЭ Математика Профиль",
        numRans: '1',
        difficulty: '1',
        imageSrc: '0',
    }).returning({ id: t_challenges.id })

    await db.insert(t_challengeOptions).values({ t_challengeId: ch.id, text: answer, correct: true })
}

async function insertCircleChallenge(lessonId: number, order: number, ch: Challenge) {
    await db.insert(t_challenges).values({
        t_lessonId: lessonId,
        type: 'UNITCIRCLE' as any,
        question: ch.question,
        order,
        points: 10,
        author: "ЕГЭ Математика Профиль",
        numRans: String(ch.mode === 'label' ? (ch.labelTargets?.length ?? 1) : ch.correctIndices.length),
        difficulty: '',
        imageSrc: '',
        unitCircleData: JSON.stringify({
            mode: ch.mode,
            points: POINTS,
            correctIndices: ch.correctIndices,
            labelTargets: ch.labelTargets,
            guideAxis: ch.guideAxis,
            guideValue: ch.guideValue,
            guideValueLabel: ch.guideValueLabel,
        }),
    })
}

// Единый элемент урока — вокаб (M_ASC, радианы/градусы) ИЛИ задача на
// круге (UNITCIRCLE) — раньше это были два полностью раздельных пути
// вставки (вокаб-уроки создавались ДО buildLessons(), остальные — после,
// с ручным orderOffset), из-за чего "контрольная"-урок в принципе не мог
// смешать вокаб с точками на круге. Теперь один и тот же список может
// содержать оба вида вперемешку — нужно именно для Контрольной 2 ниже
// ("смесь ВСЕХ предыдущих категорий", включая радианы/градусы).
type MixedItem =
    | { kind: 'vocab'; question: string; answer: string }
    | { kind: 'circle'; challenge: Challenge }

const vocabItem = (v: { question: string; answer: string }): MixedItem => ({ kind: 'vocab', question: v.question, answer: v.answer })
const circleItem = (c: Challenge): MixedItem => ({ kind: 'circle', challenge: c })

type LessonSpec = { title: string; items: MixedItem[] }

// "0"/"1"/"-1" — оси (углы кратные π/2), остальные — дробные (1/2, √2/2,
// √3/2) — по прямой просьбе пользователя эти две категории теперь
// отдельные уроки, а sin и cos внутри каждой категории смешаны вместе
// (было — sin и cos всегда раздельными уроками, дробные вперемешку с
// осевыми внутри каждого).
const isAxisVal = (disp: string) => disp === '0' || disp === '1' || disp === '-1'

function buildLessons(): LessonSpec[] {
    const sinAxisTargets = SIN_LABEL_TARGETS.filter((t) => isAxisVal(t.disp))
    const sinFracTargets = SIN_LABEL_TARGETS.filter((t) => !isAxisVal(t.disp))
    const cosAxisTargets = COS_LABEL_TARGETS.filter((t) => isAxisVal(t.disp))
    const cosFracTargets = COS_LABEL_TARGETS.filter((t) => !isAxisVal(t.disp))

    const sinCosAxisChallenges = shuffle([
        ...buildLabel(sinAxisTargets, 'sin', Math.sin),
        ...buildLabel(cosAxisTargets, 'cos', Math.cos),
    ])
    const sinCosFracChallenges = shuffle([
        ...buildLabel(sinFracTargets, 'sin', Math.sin),
        ...buildLabel(cosFracTargets, 'cos', Math.cos),
    ])
    // 12 штук (6 sin + 6 cos) — 2 урока по 6, ближе к целевым 7-9, чем
    // один урок из 12 или совсем мелкие уроки по 3, как было раньше.
    const fracGroups = chunkBalanced(sinCosFracChallenges, 7)

    const lessons: LessonSpec[] = []

    lessons.push({ title: "Радианы и градусы", items: DEGREE_VOCAB.map(vocabItem) })
    lessons.push({ title: "Точки на окружности: оси", items: buildLocate(LOCATE_AXES).map(circleItem) })
    lessons.push({ title: "Точки на окружности: π/6, π/4, π/3", items: buildLocate(LOCATE_Q1Q4).map(circleItem) })
    lessons.push({ title: "Точки на окружности: 2π/3, 5π/6", items: buildLocate(LOCATE_Q2Q3).map(circleItem) })

    // Контрольная — мини-босс (isReviewStage триггерится по слову
    // "контрольн" в названии, см. trainer-grade-tree.tsx) каждые ~4 урока
    // — микс выборки из ВСЕХ уже пройденных к этому моменту категорий, не
    // просто повтор последнего урока.
    lessons.push({
        title: "Контрольная 1",
        items: [
            vocabItem(DEGREE_VOCAB[0]), vocabItem(DEGREE_VOCAB[6]),
            ...buildLocate([LOCATE_AXES[0], LOCATE_AXES[4]]).map(circleItem),
            ...buildLocate([LOCATE_Q1Q4[0], LOCATE_Q1Q4[3]]).map(circleItem),
            ...buildLocate([LOCATE_Q2Q3[0], LOCATE_Q2Q3[3]]).map(circleItem),
        ],
    })

    lessons.push({ title: "Углы: sin/cos = 0, ±1", items: sinCosAxisChallenges.map(circleItem) })
    fracGroups.forEach((group, i) => {
        lessons.push({ title: `Углы: sin/cos = дробь ${i + 1}`, items: group.map(circleItem) })
    })
    lessons.push({ title: "Углы: tg(x) = a", items: buildSelect(TG_EQUATIONS, Math.tan).map(circleItem) })

    lessons.push({
        title: "Контрольная 2 — весь круг",
        items: [
            vocabItem(DEGREE_VOCAB[2]),
            ...buildLocate([LOCATE_AXES[1]]).map(circleItem),
            ...buildLocate([LOCATE_Q1Q4[1]]).map(circleItem),
            ...buildLocate([LOCATE_Q2Q3[2]]).map(circleItem),
            ...buildLabel([{ disp: "0", val: 0 }], 'sin', Math.sin).map(circleItem),
            ...buildLabel([{ disp: "1", val: 1 }], 'cos', Math.cos).map(circleItem),
            ...buildLabel([{ disp: "\\dfrac{1}{2}", val: 0.5 }], 'sin', Math.sin).map(circleItem),
            ...buildLabel([{ disp: "-\\dfrac{\\sqrt{2}}{2}", val: -Math.SQRT1_2 }], 'cos', Math.cos).map(circleItem),
            ...buildSelect([{ disp: "tg(x) = -1", val: -1, label: "-1" }], Math.tan).map(circleItem),
        ],
    })

    return lessons
}

async function createLesson(unitId: number, title: string, order: number, items: MixedItem[]) {
    const [lesson] = await db.insert(t_lessons).values({
        title,
        t_unitId: unitId,
        order,
    }).returning({ id: t_lessons.id })

    for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.kind === 'vocab') {
            await insertVocabChallenge(lesson.id, i + 1, item.question, item.answer)
        } else {
            await insertCircleChallenge(lesson.id, i + 1, item.challenge)
        }
    }
    console.log(`Урок "${title}" создан: id=${lesson.id}, задач=${items.length}`)
}

async function main() {
    const existing = await db.query.t_units.findFirst({
        where: (u, { and, eq }) => and(eq(u.t_courseId, MATH11_TCOURSE_ID), eq(u.title, UNIT_TITLE)),
    })
    if (existing) {
        await db.delete(t_units).where(eq(t_units.id, existing.id))
        console.log(`Старый юнит "${UNIT_TITLE}" (id=${existing.id}) удалён — пересоздаём`)
    }

    const [unit] = await db.insert(t_units).values({
        title: UNIT_TITLE,
        t_courseId: MATH11_TCOURSE_ID,
        order: 4,
        description: "",
        imageSrc: "",
    }).returning({ id: t_units.id })
    console.log(`Юнит "${UNIT_TITLE}" создан: id=${unit.id}`)

    const lessons = buildLessons()
    for (let i = 0; i < lessons.length; i++) {
        await createLesson(unit.id, lessons[i].title, i + 1, lessons[i].items)
    }

    console.log("\nГотово.")
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
