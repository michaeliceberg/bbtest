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
    guideAxis?: 'sin' | 'cos'
    guideValue?: number
    guideValueLabel?: string
}

// ===== LOCATE — простые (угол уже в [0, 2π), другая запись той же
// величины, чем на магните — \dfrac вместо "/", чтобы не давать просто
// вычитывать ответ по совпадению текста) =====
const LOCATE_SIMPLE: { disp: string; val: number }[] = [
    { disp: "\\dfrac{\\pi}{6}", val: Math.PI / 6 },
    { disp: "-\\dfrac{\\pi}{6}", val: -Math.PI / 6 }, // → 11π/6
    { disp: "\\dfrac{\\pi}{3}", val: Math.PI / 3 },
    { disp: "\\dfrac{\\pi}{2}", val: Math.PI / 2 },
    { disp: "\\dfrac{2\\pi}{3}", val: (2 * Math.PI) / 3 },
    { disp: "\\dfrac{5\\pi}{6}", val: (5 * Math.PI) / 6 },
    { disp: "\\pi", val: Math.PI },
    { disp: "\\dfrac{7\\pi}{6}", val: (7 * Math.PI) / 6 },
    { disp: "\\dfrac{5\\pi}{4}", val: (5 * Math.PI) / 4 },
    { disp: "\\dfrac{5\\pi}{3}", val: (5 * Math.PI) / 3 },
]

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

// ===== SELECT — tg x = a (у тангенса нет "направляющей" на самой
// окружности — оставлен старым multi-select режимом) =====
const TG_EQUATIONS: { disp: string; val: number }[] = [
    { disp: "tg(x) = 1", val: 1 },
    { disp: "tg(x) = -1", val: -1 },
    { disp: "tg(x) = \\sqrt{3}", val: Math.sqrt(3) },
    { disp: "tg(x) = -\\sqrt{3}", val: -Math.sqrt(3) },
    { disp: "tg(x) = \\dfrac{\\sqrt{3}}{3}", val: Math.sqrt(3) / 3 },
    { disp: "tg(x) = -\\dfrac{\\sqrt{3}}{3}", val: -Math.sqrt(3) / 3 },
    { disp: "tg(x) = 0", val: 0 },
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
const selectQuestion = (disp: string) => `Отметь все точки, где $${disp}$`
// "Укажи углы" вместо "Отметь точки" — по прямой просьбе пользователя
// (2026-09-09): в этом режиме отвечаем не кликом по точке (она уже
// подсвечена направляющей заранее), а выбором подписи угла снизу —
// формулировка "отметь точки" была не по смыслу самого взаимодействия.
const labelQuestion = (axis: 'sin' | 'cos', disp: string) => `Укажи углы, где $\\${axis} x = ${disp}$`

function buildLocate(items: { disp: string; val: number }[]): Challenge[] {
    return items.map(({ disp, val }) => ({
        question: locateQuestion(disp),
        mode: 'locate' as const,
        correctIndices: [findSinglePointIndex(val)],
    }))
}

function buildSelect(items: { disp: string; val: number }[], fn: (a: number) => number): Challenge[] {
    return items.map(({ disp, val }) => ({
        question: selectQuestion(disp),
        mode: 'select' as const,
        correctIndices: findAllMatchingIndices(fn, val),
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

type LessonSpec = { title: string; challenges: Challenge[] }

function buildLessons(): LessonSpec[] {
    const lessons: LessonSpec[] = []

    chunkBalanced(buildLocate(LOCATE_SIMPLE), 3).forEach((group, i) => {
        lessons.push({ title: `Найди точку — простые углы ${i + 1}`, challenges: group })
    })
    chunkBalanced(buildLocate(LOCATE_AXES), 3).forEach((group, i) => {
        lessons.push({ title: `Найди точку — оси и отрицательные углы ${i + 1}`, challenges: group })
    })
    chunkBalanced(buildLocate(LOCATE_Q1Q4), 3).forEach((group, i) => {
        lessons.push({ title: `Найди точку — простые Q1/Q4 ${i + 1}`, challenges: group })
    })
    chunkBalanced(buildLocate(LOCATE_Q2Q3), 3).forEach((group, i) => {
        lessons.push({ title: `Найди точку — Q2/Q3 ${i + 1}`, challenges: group })
    })
    chunkBalanced(buildLabel(SIN_LABEL_TARGETS, 'sin', Math.sin), 3).forEach((group, i) => {
        lessons.push({ title: `sin x = a — подпиши точки ${i + 1}`, challenges: group })
    })
    chunkBalanced(buildLabel(COS_LABEL_TARGETS, 'cos', Math.cos), 3).forEach((group, i) => {
        lessons.push({ title: `cos x = a — подпиши точки ${i + 1}`, challenges: group })
    })
    chunkBalanced(buildSelect(TG_EQUATIONS, Math.tan), 3).forEach((group, i) => {
        lessons.push({ title: `tg x = a — отметь корни ${i + 1}`, challenges: group })
    })

    // Контрольная — мини-босс (isReviewStage триггерится по слову
    // "контрольн" в названии, см. trainer-grade-tree.tsx) — микс всех
    // режимов.
    lessons.push({
        title: "Контрольная — весь круг",
        challenges: [
            ...buildLocate([{ disp: "-\\dfrac{3\\pi}{4}", val: (-3 * Math.PI) / 4 }]), // → 5π/4
            ...buildLabel([{ disp: "\\dfrac{\\sqrt{3}}{2}", val: Math.sqrt(3) / 2 }], 'sin', Math.sin),
            ...buildLabel([{ disp: "-\\dfrac{1}{2}", val: -0.5 }], 'cos', Math.cos),
            ...buildSelect([{ disp: "tg(x) = -1", val: -1 }], Math.tan),
        ],
    })

    return lessons
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

    // Вводные уроки "Радианы и градусы" — ПЕРЕД самим кругом (по прямой
    // просьбе пользователя, "в первые уроки этой темы"), order 1..N —
    // остальные уроки темы сдвигаются на освободившееся место через
    // orderOffset ниже.
    const vocabGroups = chunkBalanced(DEGREE_VOCAB, 3)
    let orderOffset = 0
    for (let gi = 0; gi < vocabGroups.length; gi++) {
        const group = vocabGroups[gi]
        const title = vocabGroups.length > 1 ? `Радианы и градусы ${gi + 1}` : "Радианы и градусы"
        const [lesson] = await db.insert(t_lessons).values({
            title,
            t_unitId: unit.id,
            order: gi + 1,
        }).returning({ id: t_lessons.id })
        for (let i = 0; i < group.length; i++) {
            await insertVocabChallenge(lesson.id, i + 1, group[i].question, group[i].answer)
        }
        console.log(`Урок "${title}" создан: id=${lesson.id}, задач=${group.length}`)
        orderOffset++
    }

    const lessons = buildLessons()

    for (let li = 0; li < lessons.length; li++) {
        const lessonSpec = lessons[li]
        const [lesson] = await db.insert(t_lessons).values({
            title: lessonSpec.title,
            t_unitId: unit.id,
            order: orderOffset + li + 1,
        }).returning({ id: t_lessons.id })

        for (let i = 0; i < lessonSpec.challenges.length; i++) {
            const ch = lessonSpec.challenges[i]
            await db.insert(t_challenges).values({
                t_lessonId: lesson.id,
                type: 'UNITCIRCLE' as any,
                question: ch.question,
                order: i + 1,
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
        console.log(`Урок "${lessonSpec.title}" создан: id=${lesson.id}, задач=${lessonSpec.challenges.length}`)
    }

    console.log("\nГотово.")
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
