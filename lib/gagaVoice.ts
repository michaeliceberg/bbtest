// Банк реплик Команданте Мигеля (с 2026-10-28; раньше — Га-Га, его озвучка осталась в public/gaga-voice/).
// Тон — армия с юмором (docs/miguel/miguel.md). Короткие реакции — «гусиным» голосом (пометки [goose honk],
// [nasal], [honking laugh]; слово «Га-га» НЕ произносим — звучит нелепо, гогот только звуком), объяснения (правило, ошибка) — чётко, чтобы понять с первого раза.
// Каждая реплика озвучена заранее (scripts/genGagaVoice.ts → public/miguel-voice/<id>.mp3, голос ElevenLabs
// Chuck Miller HIGUfNOdjuWQwwapnTRW), в приложении звук не генерируется — проигрываем готовый файл.
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
    // «» и смех — не в каждой фразе и не на одном месте: иначе звучит заученно.
    ...L('start', [
        '[goose honk] [nasal, gruff] Отряд, подъём! Задание на сегодня получено. Выдвигаемся.',
        '[goose honk] [gruff] Разговорчики в строю! Открываем урок.',
        '[confident] Маньяна — главный враг революции. Поэтому сегодня. [short chuckle]',
        '[confident, nasal] Ещё один урок, ещё один шаг к ВУЗу. Шагаем.',
        '[gruff] Телефон в беззвучный, мысли в кучу. [goose honk] Начали.',
        '[nasal] Смирно, новобранец! Команданте Мигель на связи. [honking laugh]',
    ]),
    ...L('correct', [
        '[proud, nasal] Чётко! Вот это выправка. [honking laugh]',
        '[goose honk] Прямо в цель, боец.',
        '[gruff] Принято. Монстр ЕГЭ потерял ещё одну жизнь. [short chuckle]',
        '[proud] Это твой экстремум: производная ноль, ты на вершине.',
        '[honking laugh] Где-то Ньютон уронил ещё одно яблоко от восторга.',
        '[goose honk] [gruff, nasal] Так держать. Заношу в личное дело.',
        '[excited] ¡Excelente! Хорошо служишь. [goose honk]',
        '[proud] По-командирски. Следующий!',
    ]),
    ...L('wrong', [
        '[calm, gruff] Отставить панику. Ошибка — это разведка: теперь мы знаем, где враг.',
        '[nasal] Мимо. Перегруппировались и снова в бой.',
        '[honking laugh] Минус, штука обидчивая. Проверь его, боец.',
        '[serious] Не спеши. Солдат, который торопится, стреляет в молоко.',
        '[warmly] Бывает. Даже у Эйнштейна были ошибки. Ещё заход.',
        '[goose honk] [serious] Тут ловушка. Смотри внимательнее, ты справишься.',
    ]),
    ...L('rule', [
        '[serious] Внимание, отряд! Это записываем в боевой устав.',
        '[confident] Запомни, боец: это будет на экзамене. Проверено разведкой.',
        '[gruff] Это не обсуждается. Это заучивается.',
    ]),
    ...L('streak', [
        '[excited honk] Серия! Ты разогнался, как частица в коллайдере.',
        '[impressed] Тебя уже не остановить. [honking laugh]',
        '[gruff, nasal] Монстр ЕГЭ отступает. Наступаем! [goose honk]',
        '[goose honk] [proud] Вот это дисциплина. Ещё!',
    ]),
    ...L('chest', [
        '[proud, nasal] Трофей с фронта. Заслужил, боец. [goose honk]',
        '[goose honk] Сундук! Открывай, пока монстр не отобрал. [short chuckle]',
        '[goose honk] [gruff] Награда за службу. Посмотрим, что внутри.',
    ]),
    ...L('levelup', [
        '[proud] Поздравляю с повышением! Новое звание, носи с гордостью. [goose honk]',
        '[goose honk] [confident, nasal] Новое звание, боец. Не расслабляемся, до следующего рукой подать.',
    ]),
    ...L('done', [
        '[excited honk] Высота взята! ¡Hasta la victoria!',
        '[gruff, nasal] Задание выполнено. Отбой, заслужил. [goose honk]',
        '[honking laugh] Сегодня ты сделал не dx работы, а целый интеграл.',
        '[confident] Ещё один шаг к ВУЗу. Завтра следующий.',
    ]),
    ...L('boss', [
        '[gruff, serious] Тишина в строю. Перед нами босс.',
        '[confident, nasal] Все уроки были ради этого. В бой! [goose honk]',
        '[excited] ¡Adelante! Покажем монстру, кто тут командир! [goose honk]',
    ]),
    ...L('night', [
        '[gruff] Боец, день почти кончился, а задание не выполнено. Один короткий урок, и отбой.',
        '[honking laugh] Твоя серия стремится к нулю. Не дадим ей достичь предела!',
        '[low, raspy, nasal] Отбой, боец. Даже революционерам нужен сон. Завтра в строй.',
    ]),
]

// без пометок [..] — для показа текстом
export const gagaCaption = (text: string) => text.replace(/\[[^\]]*\]\s*/g, '').trim()
// Текст для озвучки: «ЕГЭ» большими буквами голос читает по буквам («е-гэ-э») — отдаём строчными, тогда читается слитно.
export const gagaSpeechText = (text: string) => text.replace(/ЕГЭ/g, 'егэ').replace(/ВУЗ/g, 'вуз')
export const gagaAudio = (id: string) => `/miguel-voice/${id}.mp3`
export const gagaLinesFor = (event: GagaEvent) => GAGA_LINES.filter((l) => l.event === event)
let lastId = ''
export const pickGagaLine = (event: GagaEvent): GagaLine => {
    const pool = gagaLinesFor(event)
    let l = pool[Math.floor(Math.random() * pool.length)]
    if (l.id === lastId && pool.length > 1) l = pool[(pool.indexOf(l) + 1) % pool.length]
    lastId = l.id
    return l
}
