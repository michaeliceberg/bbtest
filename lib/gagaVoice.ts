// Банк реплик Команданте Мигеля (с 2026-10-28; раньше — Га-Га, его озвучка осталась в public/gaga-voice/).
// Тон — армия с юмором (docs/miguel/miguel.md). Короткие реакции — «гусиным» голосом (пометки [goose honk],
// [nasal, honking voice], «Га-га!»), объяснения (правило, ошибка) — чётко, чтобы понять с первого раза.
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
    ...L('start', [
        '[goose honk] Га-га! [nasal, honking voice] Отряд, подъём! Задание на сегодня получено. Выдвигаемся. [honking laugh] Га-га-га!',
        '[goose honk] Га! [gruff, nasal] Разговорчики в строю! Открываем урок. [honking laugh] Га-га-га!',
        '[honking laugh] Га-га! Маньяна — главный враг революции. Поэтому — сегодня. [honking laugh] Га-га-га!',
        '[goose honk] Га! [confident, nasal] Один урок — один шаг к поступлению. Шагаем. [honking laugh] Га-га-га!',
        '[goose honk] Га! [gruff] Телефон в беззвучный, мысли в кучу. Начали. [honking laugh] Га-га-га!',
        '[goose honk] Га! [nasal, honking voice] Смирно, новобранец! Команданте Мигель на связи. [honking laugh] Га-га-га!',
    ]),
    ...L('correct', [
        '[goose honk] Га-га! [proud, nasal] Чётко! Вот это выправка. [honking laugh] Га-га-га!',
        '[honking laugh] Га-га! Прямо в цель, боец. [honking laugh] Га-га-га!',
        '[goose honk] Га! [gruff, nasal] Принято. Монстр ЕГЭ потерял ещё одну жизнь. [honking laugh] Га-га-га!',
        '[goose honk] Га! [proud, nasal] Это твой экстремум: производная — ноль, ты на вершине. [honking laugh] Га-га-га!',
        '[goose honk] Га! [honking laugh] Где-то Ньютон уронил ещё одно яблоко от восторга. [honking laugh] Га-га-га!',
        '[goose honk] Га! [gruff, nasal] Так держать. Заношу в личное дело. [honking laugh] Га-га-га!',
        '[goose honk] Га! [excited honk] ¡Excelente! Хорошо служишь. [honking laugh] Га-га-га!',
        '[goose honk] Га! [proud] По-командирски. Следующий! [honking laugh] Га-га-га!',
    ]),
    ...L('wrong', [
        '[goose honk] Га! [gruff] Отставить панику. Ошибка — это разведка: теперь мы знаем, где враг.',
        '[goose honk] Га! [gruff, nasal] Мимо. Перегруппировались — и снова в бой.',
        '[honking laugh] Га-га! Минус — штука обидчивая. Проверь его, боец.',
        '[goose honk] Га! [serious] Не спеши. Солдат, который торопится, стреляет в молоко.',
        '[goose honk] Га! [warmly, nasal] Бывает. Даже у Эйнштейна были ошибки. Ещё заход.',
        '[goose honk] Га! [serious] Тут ловушка. Смотри внимательнее — ты справишься.',
    ]),
    ...L('rule', [
        '[goose honk] Га! [serious] Внимание, отряд! Это записываем в боевой устав.',
        '[goose honk] Га! [confident] Запомни, боец: это будет на экзамене. Проверено разведкой.',
        '[goose honk] Га! [gruff] Это не обсуждается. Это заучивается.',
    ]),
    ...L('streak', [
        '[excited honk] Га-га-га! Серия! Ты разогнался, как частица в коллайдере.',
        '[honking laugh] Га-га! Тебя уже не остановить. [honking laugh] Га-га-га!',
        '[goose honk] Га! [gruff, nasal] Монстр ЕГЭ отступает. Наступаем! [honking laugh] Га-га-га!',
        '[goose honk] Га! [proud] Вот это дисциплина. Ещё! [honking laugh] Га-га-га!',
    ]),
    ...L('chest', [
        '[goose honk] Га-га! [proud, nasal] Трофей с фронта. Заслужил, боец. [honking laugh] Га-га-га!',
        '[goose honk] Га! [honking laugh] Сундук! Открывай, пока монстр не отобрал. [honking laugh] Га-га-га!',
        '[goose honk] Га! [gruff, nasal] Награда за службу. Посмотрим, что внутри. [honking laugh] Га-га-га!',
    ]),
    ...L('levelup', [
        '[goose honk] Га-га! [proud] Поздравляю с повышением! Новое звание — носи с гордостью. [honking laugh] Га-га-га!',
        '[goose honk] Га! [confident, nasal] Новое звание, боец. Не расслабляемся — до следующего рукой подать. [honking laugh] Га-га-га!',
    ]),
    ...L('done', [
        '[excited honk] Га-га! Высота взята! ¡Hasta la victoria! [honking laugh] Га-га-га!',
        '[goose honk] Га! [gruff, nasal] Задание выполнено. Отбой — заслужил. [honking laugh] Га-га-га!',
        '[goose honk] Га! [honking laugh] Сегодня ты сделал не dx работы, а целый интеграл. [honking laugh] Га-га-га!',
        '[goose honk] Га! [confident] Ещё один шаг к поступлению. Завтра — следующий. [honking laugh] Га-га-га!',
    ]),
    ...L('boss', [
        '[goose honk] Га! [gruff, serious] Тишина в строю. Перед нами босс.',
        '[goose honk] Га! [confident, nasal] Все уроки были ради этого. В бой!',
        '[excited honk] Га-га! ¡Adelante! Покажем монстру, кто тут командир!',
    ]),
    ...L('night', [
        '[goose honk] Га! [gruff] Боец, день почти кончился, а задание не выполнено. Один короткий урок — и отбой.',
        '[goose honk] Га! [honking laugh] Твоя серия стремится к нулю. Не дадим ей достичь предела!',
        '[goose honk] Га! [low, raspy, nasal] Отбой, боец. Даже революционерам нужен сон. Завтра — в строй.',
    ]),
]

// без пометок [..] — для показа текстом
export const gagaCaption = (text: string) => text.replace(/\[[^\]]*\]\s*/g, '').trim()
// Текст для озвучки: «ЕГЭ» большими буквами голос читает по буквам («е-гэ-э») — отдаём строчными, тогда читается слитно.
export const gagaSpeechText = (text: string) => text.replace(/ЕГЭ/g, 'егэ')
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
