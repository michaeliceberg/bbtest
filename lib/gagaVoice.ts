// Банк реплик Га-Га — доброго заботливого наставника (решение 2026-10-21, см. CLAUDE.md «Персонаж Га-Га»).
// Каждая реплика озвучена заранее (scripts/genGagaVoice.ts → public/gaga-voice/<id>.mp3, голос ElevenLabs
// dABPButoaSloTSZcHPof), в приложении звук не генерируется — проигрываем готовый файл.
// text — для озвучки (с пометками настроения ElevenLabs), caption — то же без пометок, для показа на экране.
// Новую реплику: дописать сюда и запустить генератор (уже озвученные пропускаются).

export type GagaEvent = 'start' | 'correct' | 'wrong' | 'rule' | 'streak' | 'chest' | 'levelup' | 'done' | 'boss' | 'night'

export type GagaLine = { id: string; event: GagaEvent; text: string }

export const GAGA_EMOTION: Record<GagaEvent, string> = {
    start: '/gaga/gaga-happy-2.webp',
    correct: '/gaga/gaga-happy-2.webp',
    wrong: '/gaga/gaga-oops-4.webp',
    rule: '/gaga/gaga-shock.webp',
    streak: '/gaga/gaga-fire.webp',
    chest: '/gaga/gaga-chest.webp',
    levelup: '/gaga/gaga-happy-2.webp',
    done: '/gaga/gaga-happy-2.webp',
    boss: '/gaga/gaga-angry.webp',
    night: '/gaga/gaga-sleep.webp',
}

// Все варианты стикеров на событие — выбираем случайный, чтобы не приедалось (public/gaga/)
const G = (n: string) => `/gaga/gaga-${n}.webp`
export const GAGA_EMOTIONS: Record<GagaEvent, string[]> = {
    start: [G('wave'), G('wave-2'), G('teacher'), G('teacher-2')],
    correct: [G('happy-2'), G('happy-3'), G('proud-2'), G('gun'), G('gun')],
    wrong: [G('oops-3'), G('oops-4'), G('sad')],
    rule: [G('shock'), G('shock-2'), G('teacher'), G('teacher-2')],
    streak: [G('fire'), G('fire-2'), G('fire-3'), G('gun')],
    chest: [G('chest')],
    levelup: [G('proud-2'), G('happy-2')],
    done: [G('proud-2'), G('happy-3'), G('pizza'), G('pizza-3'), G('gun')],
    boss: [G('angry'), G('angry-2'), G('gun')],
    night: [G('sleep')],
}

const L = (event: GagaEvent, list: string[]): GagaLine[] => list.map((text, i) => ({ id: `${event}-${i + 1}`, event, text }))

export const GAGA_LINES: GagaLine[] = [
    ...L('start', [
        '[laughing] Га-га! Привет, дружище. [warmly] Ну что, позанимаемся немножко?',
        '[happy] О, ты пришёл! Я как раз тебя ждал. Начнём потихоньку.',
        '[warmly] Привет-привет! Сегодня разберёмся с новым — я рядом.',
        '[happy] Га-га! Готов? Не спеши, у нас всё получится.',
    ]),
    ...L('correct', [
        '[happy] Вот это да — правильно!',
        '[warmly] Умница! Я тобой горжусь.',
        '[laughing] Га-га! В точку!',
        '[happy] Видишь, у тебя получается!',
        '[warmly] Отлично. Так держать.',
        '[happy] Верно! Ты молодец.',
        '[warmly] Именно так. Здорово соображаешь.',
        '[laughing] Ого, красиво решил!',
    ]),
    ...L('wrong', [
        '[gentle] Ничего страшного, бывает со всеми. Давай ещё разок.',
        '[thoughtful] Почти! Посмотри внимательнее — ты справишься.',
        '[gentle] Ошибся? Это нормально. Разберёмся вместе.',
        '[warmly] Не переживай. Ошибки — это тоже учёба.',
        '[gentle] Не торопись. Подумай ещё чуть-чуть.',
        '[thoughtful] Хм, не совсем. Попробуем по-другому?',
    ]),
    ...L('rule', [
        '[surprised] Ого… а вот это важно. [serious] Запомни, пригодится.',
        '[serious] Внимание! Это правило ещё не раз нас выручит.',
        '[surprised] Смотри, какая штука! Давай запомним.',
        '[serious] Стоп. Вот тут самое главное.',
    ]),
    ...L('streak', [
        '[excited] Три подряд! Ты в ударе!',
        '[excited] Вот это серия! Га-га!',
        '[laughing] Да ты сегодня горишь!',
        '[excited] Ещё один — и ещё один! Не останавливайся.',
    ]),
    ...L('chest', [
        '[excited] Смотри, что я тебе притащил — сундук! Открывай, ты его заслужил.',
        '[happy] Фух, тяжёлый! [laughing] Это тебе. Открывай!',
        '[warmly] Держи сундук — за старание.',
        '[excited] Сундук! Интересно, что там внутри?',
    ]),
    ...L('levelup', [
        '[excited] Новый уровень! [warmly] Я знал, что у тебя получится.',
        '[happy] Ты поднялся выше! Горжусь тобой, дружище.',
        '[laughing] Га-га! Уровень вверх!',
    ]),
    ...L('done', [
        '[warmly] Урок пройден! Ты сегодня отлично поработал.',
        '[happy] Готово! Отдохни немножко — ты заслужил.',
        '[warmly] Вот и всё. Шаг за шагом — и ЕГЭ нам не страшен.',
        '[happy] Молодец! Завтра продолжим, я буду ждать.',
    ]),
    ...L('boss', [
        '[serious] Монстр ЕГЭ рядом. [warmly] Не бойся — мы готовы. Вперёд!',
        '[serious] Это босс-экзамен. Соберись — ты всё это уже знаешь.',
        '[excited] Га-га! Покажем этому монстру!',
    ]),
    ...L('night', [
        '[softly] Уже поздно. [sighs] Монстр ЕГЭ до утра не нападёт, а тебе пора спать.',
        '[softly] Серию я сберегу в гнезде. Спокойной ночи, дружище.',
        '[softly] Мозгу тоже нужен отдых. Завтра продолжим.',
    ]),
]

// без пометок [..] — для показа текстом
export const gagaCaption = (text: string) => text.replace(/\[[^\]]*\]\s*/g, '').trim()
export const gagaAudio = (id: string) => `/gaga-voice/${id}.mp3`
export const gagaLinesFor = (event: GagaEvent) => GAGA_LINES.filter((l) => l.event === event)
let lastId = ''
export const pickGagaLine = (event: GagaEvent): GagaLine => {
    const pool = gagaLinesFor(event)
    let l = pool[Math.floor(Math.random() * pool.length)]
    if (l.id === lastId && pool.length > 1) l = pool[(pool.indexOf(l) + 1) % pool.length]
    lastId = l.id
    return l
}
