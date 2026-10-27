// Банк реплик Га-Га — доброго заботливого наставника (решение 2026-10-21, см. CLAUDE.md «Персонаж Га-Га»).
// Каждая реплика озвучена заранее (scripts/genGagaVoice.ts → public/gaga-voice/<id>.mp3, голос ElevenLabs
// dABPButoaSloTSZcHPof), в приложении звук не генерируется — проигрываем готовый файл.
// text — для озвучки (с пометками настроения ElevenLabs), caption — то же без пометок, для показа на экране.
// Новую реплику: дописать сюда и запустить генератор (уже озвученные пропускаются).

export type GagaEvent = 'start' | 'correct' | 'wrong' | 'rule' | 'streak' | 'chest' | 'levelup' | 'done' | 'boss' | 'night'

export type GagaLine = { id: string; event: GagaEvent; text: string }

// Стикеры — Команданте Мигель (public/miguel/, с 2026-10-28; старые стикеры Га-Га остались в public/gaga/).
export const GAGA_EMOTION: Record<GagaEvent, string> = {
    start: '/miguel/miguel-salute.webp',
    correct: '/miguel/miguel-happy.webp',
    wrong: '/miguel/miguel-bandage.webp',
    rule: '/miguel/miguel-rule.webp',
    streak: '/miguel/miguel-streak.webp',
    chest: '/miguel/miguel-chest.webp',
    levelup: '/miguel/miguel-newrank.webp',
    done: '/miguel/miguel-trophy.webp',
    boss: '/miguel/miguel-tank.webp',
    night: '/miguel/miguel-coffee.webp',
}

// Все варианты стикеров на событие — выбираем случайный, чтобы не приедалось (public/miguel/)
const G = (n: string) => `/miguel/miguel-${n}.webp`
export const GAGA_EMOTIONS: Record<GagaEvent, string[]> = {
    start: [G('salute'), G('point'), G('megaphone'), G('march')],
    correct: [G('happy'), G('bullseye'), G('dance'), G('proud')],
    wrong: [G('bandage'), G('oops'), G('think')],
    rule: [G('rule'), G('think')],
    streak: [G('streak'), G('combo'), G('fire')],
    chest: [G('chest'), G('roulette')],
    levelup: [G('newrank'), G('salute-stars'), G('trophy')],
    done: [G('trophy'), G('victory'), G('proud'), G('pizza'), G('dance')],
    boss: [G('tank'), G('bazooka'), G('fire')],
    night: [G('coffee'), G('stopwatch'), G('sleep')],
}

const L = (event: GagaEvent, list: string[]): GagaLine[] => list.map((text, i) => ({ id: `${event}-${i + 1}`, event, text }))

export const GAGA_LINES: GagaLine[] = [
    ...L('start', [
        '[laughing] Га-га! Привет, дружище. [warmly] Ну что, позанимаемся немножко?',
        '[happy] О, ты пришёл! Я как раз тебя ждал. Начнём потихоньку.',
        '[warmly] Привет-привет! Сегодня разберёмся с новым — я рядом.',
        '[happy] Га-га! Готов? Не спеши, у нас всё получится.',
        '[laughing] Га-га! Кто тут пришёл качать мозги?',
        '[happy] О, привет! Монстр ЕГЭ уже нервничает.',
        '[warmly] Заходи, устраивайся поудобнее. Начинаем!',
        '[excited] Погнали! Сегодня будет интересно, обещаю.',
        '[laughing] Я разогрел крылья, ты разогревай мозги!',
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
        '[laughing] Га-га-гениально!',
        '[excited] Мозг включён на максимум!',
        '[laughing] Ты что, подсмотрел ответ? [warmly] Шучу, ты просто умный.',
        '[happy] Легко и красиво — как гусь по озеру.',
        '[excited] Бах! Прямо в цель!',
        '[laughing] Где-то сейчас заплакал один монстр ЕГЭ.',
        '[happy] Изи! Давай следующий.',
        '[warmly] Вот это я понимаю — учёба!',
    ]),
    ...L('wrong', [
        '[gentle] Ничего страшного, бывает со всеми. Давай ещё разок.',
        '[thoughtful] Почти! Посмотри внимательнее — ты справишься.',
        '[gentle] Ошибся? Это нормально. Разберёмся вместе.',
        '[warmly] Не переживай. Ошибки — это тоже учёба.',
        '[gentle] Не торопись. Подумай ещё чуть-чуть.',
        '[thoughtful] Хм, не совсем. Попробуем по-другому?',
        '[laughing] Упс! Даже я иногда путаю лапы. Попробуй ещё.',
        '[gentle] Мимо, но тепло-тепло! Ещё попытка.',
        '[warmly] Ошибка — это просто подсказка, куда смотреть.',
        '[laughing] Ничего, гуси тоже не сразу летать научились.',
        '[gentle] Ой. Ну ничего — перезагружаемся и пробуем снова.',
    ]),
    ...L('rule', [
        '[surprised] Ого… а вот это важно. [serious] Запомни, пригодится.',
        '[serious] Внимание! Это правило ещё не раз нас выручит.',
        '[surprised] Смотри, какая штука! Давай запомним.',
        '[serious] Стоп. Вот тут самое главное.',
        '[surprised] О-о-о! Это в тетрадку, а лучше — сразу в голову.',
        '[serious] Ставлю этой штуке три восклицательных знака.',
        '[whispers] Это секрет отличников. Только никому!',
    ]),
    ...L('streak', [
        '[excited] Три подряд! Ты в ударе!',
        '[excited] Вот это серия! Га-га!',
        '[laughing] Да ты сегодня горишь!',
        '[excited] Ещё один — и ещё один! Не останавливайся.',
        '[excited] Комбо! Ты разогнался!',
        '[laughing] Тормоза отказали — одни правильные ответы!',
        '[excited] Огонь-огонь! Пожарных не вызываем!',
        '[laughing] Ты так быстро решаешь, что я не успеваю гоготать!',
    ]),
    ...L('chest', [
        '[excited] Смотри, что я тебе притащил — сундук! Открывай, ты его заслужил.',
        '[happy] Фух, тяжёлый! [laughing] Это тебе. Открывай!',
        '[warmly] Держи сундук — за старание.',
        '[excited] Сундук! Интересно, что там внутри?',
        '[laughing] Тук-тук! Доставка сундуков. Курьер Га-Га на месте!',
        '[excited] Я этот сундук три километра нёс. [laughing] Шучу, два. Открывай!',
        '[happy] Сундук прибыл! Чур, пиццу пополам. [laughing] Шучу — всё тебе.',
        '[whispers] Тсс… Я подсмотрел, что внутри. [laughing] Но не скажу!',
        '[excited] Внимание, сундук! И нет, там не учебник. Честное гусиное!',
        '[laughing] Лапы устали, но ради тебя донёс. Открывай скорее!',
        '[happy] Я с подарочком! Ты его честно заслужил.',
        '[excited] Барабанная дробь… Сундук! Крути!',
        '[laughing] Говорят, в сундуках бывает пицца. Проверим?',
        '[warmly] Учишься ты, а сундуки таскаю я. Честная сделка!',
    ]),
    ...L('levelup', [
        '[excited] Новый уровень! [warmly] Я знал, что у тебя получится.',
        '[happy] Ты поднялся выше! Горжусь тобой, дружище.',
        '[laughing] Га-га! Уровень вверх!',
        '[excited] Апнулся! Красавчик!',
        '[laughing] Новый уровень — новые проблемы для монстра ЕГЭ.',
        '[happy] Растёшь прямо на глазах!',
    ]),
    ...L('done', [
        '[warmly] Урок пройден! Ты сегодня отлично поработал.',
        '[happy] Готово! Отдохни немножко — ты заслужил.',
        '[warmly] Вот и всё. Шаг за шагом — и ЕГЭ нам не страшен.',
        '[happy] Молодец! Завтра продолжим, я буду ждать.',
        '[laughing] Урок закрыт! Можно станцевать победный танец.',
        '[happy] Минус урок, плюс балл. Отличная сделка!',
        '[warmly] Сегодня ты сделал больше, чем вчера. Это и есть успех.',
    ]),
    ...L('boss', [
        '[serious] Монстр ЕГЭ рядом. [warmly] Не бойся — мы готовы. Вперёд!',
        '[serious] Это босс-экзамен. Соберись — ты всё это уже знаешь.',
        '[excited] Га-га! Покажем этому монстру!',
        '[serious] Я беру ружьё, ты бери знания. Вперёд!',
        '[excited] Время показать монстру, кто тут главный!',
    ]),
    ...L('night', [
        '[softly] Уже поздно. [sighs] Монстр ЕГЭ до утра не нападёт, а тебе пора спать.',
        '[softly] Серию я сберегу в гнезде. Спокойной ночи, дружище.',
        '[softly] Мозгу тоже нужен отдых. Завтра продолжим.',
        '[softly] Совы ещё не спят, а гусям пора. И тебе тоже.',
        '[softly] Ты молодец. Засыпай, а я посторожу серию.',
    ]),
]

// без пометок [..] — для показа текстом
export const gagaCaption = (text: string) => text.replace(/\[[^\]]*\]\s*/g, '').trim()
// Текст для озвучки: «ЕГЭ» большими буквами голос читает по буквам («е-гэ-э») — отдаём строчными, тогда читается слитно.
export const gagaSpeechText = (text: string) => text.replace(/ЕГЭ/g, 'егэ')
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
