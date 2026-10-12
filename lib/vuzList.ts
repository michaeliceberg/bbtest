// lib/vuzList.ts
//
// Вузы для цели на ЕГЭ («Башня ЕГЭ», /learn и /path). avg — средний проходной балл ЕГЭ на бюджет
// (за один предмет) по всему вузу за 2024 год — последний год, открытый на postupi.online
// (2025 там скрыт). Это среднее по всем направлениям вуза: на сильные программы нужно больше.
// Обновлять раз в год: тот же адрес страницы, таблица «Средний балл ЕГЭ — Бюджет».

export type Vuz = { id: string; short: string; name: string; city: string; avg: number; url: string }

export const VUZ_DATA_YEAR = 2024

export const VUZ_LIST: Vuz[] = [
    { id: 'mfti', short: 'МФТИ', name: 'Московский физико-технический институт', city: 'Долгопрудный', avg: 98.1, url: 'https://dolgoprudniy.postupi.online/vuz/mfti/' },
    { id: 'hse', short: 'ВШЭ', name: 'Высшая школа экономики', city: 'Москва', avg: 95.7, url: 'https://msk.postupi.online/vuz/niu-vshe/' },
    { id: 'ranepa', short: 'РАНХиГС', name: 'Российская академия народного хозяйства и госслужбы', city: 'Москва', avg: 95.3, url: 'https://msk.postupi.online/vuz/ranhigs/' },
    { id: 'itmo', short: 'ИТМО', name: 'Университет ИТМО', city: 'Санкт-Петербург', avg: 94.1, url: 'https://spb.postupi.online/vuz/universitet-itmo/' },
    { id: 'mephi', short: 'МИФИ', name: 'Национальный исследовательский ядерный университет МИФИ', city: 'Москва', avg: 93.8, url: 'https://msk.postupi.online/vuz/niyau-mifi/' },
    { id: 'fu', short: 'Финансовый университет', name: 'Финансовый университет при Правительстве РФ', city: 'Москва', avg: 90.9, url: 'https://msk.postupi.online/vuz/fu/' },
    { id: 'misis', short: 'МИСИС', name: 'Университет науки и технологий МИСИС', city: 'Москва', avg: 90.1, url: 'https://msk.postupi.online/vuz/misis/' },
    { id: 'spbu', short: 'СПбГУ', name: 'Санкт-Петербургский государственный университет', city: 'Санкт-Петербург', avg: 89.6, url: 'https://spb.postupi.online/vuz/spbgu/' },
    { id: 'msu', short: 'МГУ', name: 'МГУ имени М. В. Ломоносова', city: 'Москва', avg: 89.4, url: 'https://msk.postupi.online/vuz/mgu/' },
    { id: 'rudn', short: 'РУДН', name: 'Российский университет дружбы народов', city: 'Москва', avg: 89.3, url: 'https://msk.postupi.online/vuz/rudn/' },
    { id: 'reu', short: 'РЭУ им. Плеханова', name: 'Российский экономический университет им. Г. В. Плеханова', city: 'Москва', avg: 88.8, url: 'https://msk.postupi.online/vuz/reu-im-g-v-plehanova/' },
    { id: 'bmstu', short: 'МГТУ им. Баумана', name: 'МГТУ им. Н. Э. Баумана', city: 'Москва', avg: 84.4, url: 'https://msk.postupi.online/vuz/mgtu-im-n-e-baumana/' },
    { id: 'spbpu', short: 'Политех Петра Великого', name: 'Санкт-Петербургский политехнический университет Петра Великого', city: 'Санкт-Петербург', avg: 82.7, url: 'https://spb.postupi.online/vuz/spbpu/' },
    { id: 'guu', short: 'ГУУ', name: 'Государственный университет управления', city: 'Москва', avg: 81.9, url: 'https://msk.postupi.online/vuz/guu/' },
    { id: 'leti', short: 'ЛЭТИ', name: 'Санкт-Петербургский электротехнический университет ЛЭТИ', city: 'Санкт-Петербург', avg: 80.3, url: 'https://spb.postupi.online/vuz/spbgetu-leti/' },
    { id: 'miet', short: 'МИЭТ', name: 'Московский институт электронной техники', city: 'Зеленоград', avg: 80.1, url: 'https://msk.postupi.online/vuz/miet/' },
    { id: 'mai', short: 'МАИ', name: 'Московский авиационный институт', city: 'Москва', avg: 79.9, url: 'https://msk.postupi.online/vuz/mai-niu/' },
    { id: 'muctr', short: 'РХТУ им. Менделеева', name: 'Российский химико-технологический университет им. Д. И. Менделеева', city: 'Москва', avg: 78.1, url: 'https://msk.postupi.online/vuz/rhtu-im-d-i-mendeleeva/' },
    { id: 'mtuci', short: 'МТУСИ', name: 'Московский технический университет связи и информатики', city: 'Москва', avg: 78.0, url: 'https://msk.postupi.online/vuz/mtusi/' },
    { id: 'kfu', short: 'КФУ', name: 'Казанский федеральный университет', city: 'Казань', avg: 77.9, url: 'https://kazan.postupi.online/vuz/kfu/' },
    { id: 'mgsu', short: 'МГСУ', name: 'Московский государственный строительный университет', city: 'Москва', avg: 75.8, url: 'https://msk.postupi.online/vuz/niu-mgsu/' },
    { id: 'mpei', short: 'МЭИ', name: 'Национальный исследовательский университет МЭИ', city: 'Москва', avg: 75.7, url: 'https://msk.postupi.online/vuz/mei/' },
    { id: 'mospolytech', short: 'Московский Политех', name: 'Московский политехнический университет', city: 'Москва', avg: 75.6, url: 'https://msk.postupi.online/vuz/moskovskij-politeh/' },
    { id: 'urfu', short: 'УрФУ', name: 'Уральский федеральный университет', city: 'Екатеринбург', avg: 75.2, url: 'https://ekaterinburg.postupi.online/vuz/urfu-im-b-n-elcina/' },
    { id: 'sut', short: 'СПбГУТ им. Бонч-Бруевича', name: 'Санкт-Петербургский университет телекоммуникаций', city: 'Санкт-Петербург', avg: 75.0, url: 'https://spb.postupi.online/vuz/spbgut-im-bonch-bruevicha/' },
    { id: 'stankin', short: 'СТАНКИН', name: 'МГТУ «СТАНКИН»', city: 'Москва', avg: 74.4, url: 'https://msk.postupi.online/vuz/stankin/' },
    { id: 'tpu', short: 'ТПУ', name: 'Томский политехнический университет', city: 'Томск', avg: 73.2, url: 'https://tomsk.postupi.online/vuz/tpu/' },
    { id: 'kai', short: 'КНИТУ-КАИ', name: 'Казанский национальный исследовательский технический университет', city: 'Казань', avg: 72.1, url: 'https://kazan.postupi.online/vuz/kai/' },
    { id: 'voenmeh', short: 'ВОЕНМЕХ', name: 'Балтийский технический университет «ВОЕНМЕХ»', city: 'Санкт-Петербург', avg: 70.5, url: 'https://spb.postupi.online/vuz/bgtu-voenmeh-im-ustinova/' },
    { id: 'miit', short: 'РУТ (МИИТ)', name: 'Российский университет транспорта', city: 'Москва', avg: 64.9, url: 'https://msk.postupi.online/vuz/mgups-miit/' },
]

export const getVuz = (id: string | null | undefined): Vuz | null => (id ? VUZ_LIST.find((v) => v.id === id) ?? null : null)

// Цель по математике для вуза: средний проходной, округлённый вверх.
export const vuzTargetScore = (v: Vuz) => Math.min(100, Math.ceil(v.avg))
