import 'server-only'

// lib/photoTask.ts — «Сфоткай задачу»: фото задачи → какие уроки тренажёра пройти.
// Сначала Haiku 5.5 (дёшево). Если Haiku не прочитала фото, не уверена или не нашла ни урока, ни темы —
// то же фото разбирает Sonnet 5.5. Модель выбирает уроки ТОЛЬКО из нашего каталога (id проверяются на сервере).
// Ключ — ANTHROPIC_API_KEY в .env. С VPS в России api.anthropic.com недоступен: ANTHROPIC_BASE_URL — адрес
// Cloudflare Worker (cloudflare-worker/anthropic-proxy.js), SDK подхватывает его сам.

import Anthropic from '@anthropic-ai/sdk'
import { gzipSync } from 'zlib'
import { deletePhotoTmp, savePhotoTmp } from '@/lib/photoTmp'
import db from '@/db/drizzle'
import { HIDDEN_T_COURSE_IDS } from '@/lib/trainer-topic'

export const PHOTO_TASK_HAIKU = 'claude-haiku-5-5'
export const PHOTO_TASK_SONNET = 'claude-sonnet-5-5'
export const PHOTO_TASK_DAILY_LIMIT = 3

export const photoTaskConfigured = () => !!process.env.ANTHROPIC_API_KEY

export type CatalogLesson = { id: number; course: string; unit: string; lesson: string; badge: string | null }

// Каталог уроков видимых курсов тренажёра. Порядок стабильный (курс → юнит → урок): так текст каталога
// одинаковый от запроса к запросу и кэшируется.
export const getPhotoTaskCatalog = async (): Promise<CatalogLesson[]> => {
    const courses = await db.query.t_courses.findMany({
        orderBy: (c, { asc }) => asc(c.id),
        with: {
            t_units: {
                orderBy: (u, { asc }) => asc(u.order),
                with: { t_lessons: { orderBy: (l, { asc }) => asc(l.order) } },
            },
        },
    })
    const out: CatalogLesson[] = []
    for (const c of courses) {
        if (HIDDEN_T_COURSE_IDS.includes(c.id)) continue
        for (const u of c.t_units) {
            for (const l of u.t_lessons) {
                out.push({ id: l.id, course: c.title, unit: u.title, lesson: l.title, badge: (l as { badge?: string | null }).badge ?? null })
            }
        }
    }
    return out
}

const catalogText = (catalog: CatalogLesson[]) =>
    catalog.map((l) => `[${l.id}] ${l.course} / ${l.unit} / ${l.lesson}${l.badge ? ` (${l.badge})` : ''}`).join('\n')

const SYSTEM_RULES = `Ты помощник школьного тренажёра ggege (подготовка к ОГЭ/ЕГЭ по математике и физике).
Ученик присылает фото задачи из учебника или тетради. Твоя работа:
1. Прочитай условие задачи (и данные с чертежа, если он есть).
2. Мысленно наметь, КАК её решать, и какие знания для этого нужны. Тема из условия не всегда главная: «найдите площадь» может решаться через подобие.
3. Выбери из КАТАЛОГА УРОКОВ ниже от 1 до 3 уроков, которые нужно пройти, чтобы решить эту задачу. Самый важный — первым. Используй только id из каталога, ничего не придумывай. Если подходящего урока нет — не подбирай похожий наугад, а напиши недостающую тему в missing_topics.
4. bonus_lesson_ids — 0–2 урока из каталога по СОСЕДНЕЙ теме: не нужны прямо для этой задачи, но расширят понимание (например, к задаче на теорему Пифагора — подобие или синус). Не повторяй lesson_ids.
5. hint — одна короткая подсказка, с чего начать решение. НЕ пиши ответ и не решай задачу целиком.
6. confidence = "low", если фото плохо читается, задача необычная или ты не уверен в выборе уроков.
7. Если на фото не задача по математике/физике — readable = false.
Пиши по-русски, коротко, формулы — обычным текстом.

КАТАЛОГ УРОКОВ ([id] курс / раздел / урок):
`

const OUTPUT_SCHEMA = {
    type: 'object',
    properties: {
        readable: { type: 'boolean', description: 'Удалось прочитать задачу по математике или физике' },
        problem_text: { type: 'string', description: 'Условие задачи текстом' },
        topics: { type: 'array', items: { type: 'string' }, description: 'Какие знания нужны для решения' },
        lesson_ids: { type: 'array', items: { type: 'integer' }, description: 'До 3 id уроков из каталога, самый важный первым' },
        missing_topics: { type: 'array', items: { type: 'string' }, description: 'Нужные темы, которых нет в каталоге (коротко, 2-5 слов, например «теорема синусов»)' },
        bonus_lesson_ids: { type: 'array', items: { type: 'integer' }, description: '0-2 бонусных урока по соседней теме' },
        confidence: { type: 'string', enum: ['high', 'low'] },
        hint: { type: 'string', description: 'С чего начать решение, без ответа' },
    },
    required: ['readable', 'problem_text', 'topics', 'lesson_ids', 'missing_topics', 'bonus_lesson_ids', 'confidence', 'hint'],
    additionalProperties: false,
} as const

export type PhotoTaskAnswer = {
    readable: boolean
    problem_text: string
    topics: string[]
    lesson_ids: number[]
    missing_topics: string[]
    bonus_lesson_ids: number[]
    confidence: 'high' | 'low'
    hint: string
}
export type PhotoTaskRun = {
    answer: PhotoTaskAnswer
    model: string
    escalated: boolean
    inputTokens: number
    outputTokens: number
}

type ImageType = 'image/jpeg' | 'image/png' | 'image/webp'

const parseAnswer = (msg: Anthropic.Message): PhotoTaskAnswer | null => {
    if (msg.stop_reason === 'refusal') return null
    const text = msg.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
    try { return JSON.parse(text) as PhotoTaskAnswer } catch { return null }
}

type ImageSource = Anthropic.ImageBlockParam['source']

// Через прокси (прод, сервер в России) тело запроса больше ~30 КБ обрывается — поэтому там фото идёт
// ссылкой (lib/photoTmp.ts), а JSON запроса сжимается gzip (прокси-воркер распаковывает, заголовок x-gz).
const viaProxy = () => !!process.env.ANTHROPIC_BASE_URL
const PHOTO_PUBLIC_BASE = process.env.PHOTO_TMP_PUBLIC_URL || 'https://ggege.ru'

const gzipFetch: typeof fetch = async (input, init) => {
    if (init?.body && typeof init.body === 'string') {
        const headers = new Headers(init.headers)
        headers.set('x-gz', '1')
        headers.delete('content-length')
        return fetch(input, { ...init, headers, body: gzipSync(Buffer.from(init.body)) })
    }
    return fetch(input, init)
}

const ask = async (client: Anthropic, model: string, catalog: CatalogLesson[], image: ImageSource) => {
    const system: Anthropic.TextBlockParam[] = [{ type: 'text', text: SYSTEM_RULES + catalogText(catalog), cache_control: { type: 'ephemeral' } }]
    const content: Anthropic.ContentBlockParam[] = [
        { type: 'image', source: image },
        { type: 'text', text: 'Вот фото задачи. Какие уроки пройти?' },
    ]
    const output_config: Anthropic.OutputConfig = { effort: 'medium', format: { type: 'json_schema', schema: OUTPUT_SCHEMA as unknown as Record<string, unknown> } }
    if (model === PHOTO_TASK_SONNET) {
        // Sonnet: при отказе по правилам безопасности сервер сам переспросит другую модель.
        const msg = await client.beta.messages.create({
            model, max_tokens: 4000, system, output_config, messages: [{ role: 'user', content }],
            betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
        })
        return { answer: parseAnswer(msg as unknown as Anthropic.Message), usage: msg.usage }
    }
    const msg = await client.messages.create({ model, max_tokens: 4000, system, output_config, messages: [{ role: 'user', content }] })
    return { answer: parseAnswer(msg), usage: msg.usage }
}

const needsSonnet = (a: PhotoTaskAnswer | null, validIds: number[]) =>
    !a || !a.readable || a.confidence === 'low' || (validIds.length === 0 && a.missing_topics.length === 0)

export const runPhotoTask = async (imageB64: string, mediaType: ImageType): Promise<PhotoTaskRun> => {
    const client = viaProxy() ? new Anthropic({ fetch: gzipFetch }) : new Anthropic()
    let tmpId: string | null = null
    let image: ImageSource = { type: 'base64', media_type: mediaType, data: imageB64 }
    if (viaProxy()) {
        tmpId = await savePhotoTmp(imageB64, mediaType)
        image = { type: 'url', url: `${PHOTO_PUBLIC_BASE}/api/photo-tmp/${tmpId}` }
    }
    try {
        return await runWith(client, image)
    } finally {
        if (tmpId) await deletePhotoTmp(tmpId).catch(() => {})
    }
}

const runWith = async (client: Anthropic, image: ImageSource): Promise<PhotoTaskRun> => {
    const catalog = await getPhotoTaskCatalog()
    const ids = new Set(catalog.map((l) => l.id))
    const clean = (a: PhotoTaskAnswer | null) => {
        if (!a) return null
        const main = a.lesson_ids.filter((id) => ids.has(id)).slice(0, 3)
        const bonus = (a.bonus_lesson_ids ?? []).filter((id) => ids.has(id) && !main.includes(id)).slice(0, 2)
        return { ...a, lesson_ids: main, bonus_lesson_ids: bonus }
    }

    let inputTokens = 0, outputTokens = 0
    let first: PhotoTaskAnswer | null = null
    try {
        const r = await ask(client, PHOTO_TASK_HAIKU, catalog, image)
        first = clean(r.answer)
        inputTokens += r.usage.input_tokens + (r.usage.cache_read_input_tokens ?? 0) + (r.usage.cache_creation_input_tokens ?? 0)
        outputTokens += r.usage.output_tokens
    } catch (e) {
        console.error('photoTask haiku', e)
    }
    if (first && !needsSonnet(first, first.lesson_ids)) {
        return { answer: first, model: PHOTO_TASK_HAIKU, escalated: false, inputTokens, outputTokens }
    }
    const r = await ask(client, PHOTO_TASK_SONNET, catalog, image)
    const second = clean(r.answer)
    inputTokens += r.usage.input_tokens + (r.usage.cache_read_input_tokens ?? 0) + (r.usage.cache_creation_input_tokens ?? 0)
    outputTokens += r.usage.output_tokens
    const answer = second ?? first
    if (!answer) throw new Error('no answer')
    return { answer, model: second ? PHOTO_TASK_SONNET : PHOTO_TASK_HAIKU, escalated: true, inputTokens, outputTokens }
}
