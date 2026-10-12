// lib/vuzList.ts
//
// Вузы для цели на ЕГЭ («Башня ЕГЭ», /learn и /path). avg — средний проходной балл ЕГЭ на бюджет
// (за один предмет) по всему вузу за 2024 год — последний год, открытый на postupi.online
// (2025 там скрыт). Это среднее по всем направлениям вуза: на сильные программы нужно больше.
// Обновлять раз в год: тот же адрес страницы, таблица «Средний балл ЕГЭ — Бюджет».

// logo — public/vuz-logos/<id>.png, 128×128: иконка с официального сайта вуза или файл логотипа из Википедии,
// приведённые к одному размеру. У КНИТУ-КАИ и ВОЕНМЕХ логотипа не нашлось — показываем значок-шапочку.
export type Vuz = { id: string; short: string; name: string; city: string; avg: number; url: string; logo?: string }

export const VUZ_DATA_YEAR = 2024

export const VUZ_LIST: Vuz[] = [
    { id: 'mfti', short: 'МФТИ', name: 'Московский физико-технический институт', city: 'Долгопрудный', avg: 98.1, url: 'https://dolgoprudniy.postupi.online/vuz/mfti/' , logo: '/vuz-logos/mfti.png' },
    { id: 'hse', short: 'ВШЭ', name: 'Высшая школа экономики', city: 'Москва', avg: 95.7, url: 'https://msk.postupi.online/vuz/niu-vshe/' , logo: '/vuz-logos/hse.png' },
    { id: 'ranepa', short: 'РАНХиГС', name: 'Российская академия народного хозяйства и госслужбы', city: 'Москва', avg: 95.3, url: 'https://msk.postupi.online/vuz/ranhigs/' , logo: '/vuz-logos/ranepa.png' },
    { id: 'itmo', short: 'ИТМО', name: 'Университет ИТМО', city: 'Санкт-Петербург', avg: 94.1, url: 'https://spb.postupi.online/vuz/universitet-itmo/' , logo: '/vuz-logos/itmo.png' },
    { id: 'mephi', short: 'МИФИ', name: 'Национальный исследовательский ядерный университет МИФИ', city: 'Москва', avg: 93.8, url: 'https://msk.postupi.online/vuz/niyau-mifi/' , logo: '/vuz-logos/mephi.png' },
    { id: 'fu', short: 'Финансовый университет', name: 'Финансовый университет при Правительстве РФ', city: 'Москва', avg: 90.9, url: 'https://msk.postupi.online/vuz/fu/' , logo: '/vuz-logos/fu.png' },
    { id: 'misis', short: 'МИСИС', name: 'Университет науки и технологий МИСИС', city: 'Москва', avg: 90.1, url: 'https://msk.postupi.online/vuz/misis/' , logo: '/vuz-logos/misis.png' },
    { id: 'spbu', short: 'СПбГУ', name: 'Санкт-Петербургский государственный университет', city: 'Санкт-Петербург', avg: 89.6, url: 'https://spb.postupi.online/vuz/spbgu/' , logo: '/vuz-logos/spbu.png' },
    { id: 'msu', short: 'МГУ', name: 'МГУ имени М. В. Ломоносова', city: 'Москва', avg: 89.4, url: 'https://msk.postupi.online/vuz/mgu/' , logo: '/vuz-logos/msu.png' },
    { id: 'rudn', short: 'РУДН', name: 'Российский университет дружбы народов', city: 'Москва', avg: 89.3, url: 'https://msk.postupi.online/vuz/rudn/' , logo: '/vuz-logos/rudn.png' },
    { id: 'reu', short: 'РЭУ им. Плеханова', name: 'Российский экономический университет им. Г. В. Плеханова', city: 'Москва', avg: 88.8, url: 'https://msk.postupi.online/vuz/reu-im-g-v-plehanova/' , logo: '/vuz-logos/reu.png' },
    { id: 'bmstu', short: 'МГТУ им. Баумана', name: 'МГТУ им. Н. Э. Баумана', city: 'Москва', avg: 84.4, url: 'https://msk.postupi.online/vuz/mgtu-im-n-e-baumana/' , logo: '/vuz-logos/bmstu.png' },
    { id: 'spbpu', short: 'Политех Петра Великого', name: 'Санкт-Петербургский политехнический университет Петра Великого', city: 'Санкт-Петербург', avg: 82.7, url: 'https://spb.postupi.online/vuz/spbpu/' , logo: '/vuz-logos/spbpu.png' },
    { id: 'guu', short: 'ГУУ', name: 'Государственный университет управления', city: 'Москва', avg: 81.9, url: 'https://msk.postupi.online/vuz/guu/' , logo: '/vuz-logos/guu.png' },
    { id: 'leti', short: 'ЛЭТИ', name: 'Санкт-Петербургский электротехнический университет ЛЭТИ', city: 'Санкт-Петербург', avg: 80.3, url: 'https://spb.postupi.online/vuz/spbgetu-leti/' , logo: '/vuz-logos/leti.png' },
    { id: 'miet', short: 'МИЭТ', name: 'Московский институт электронной техники', city: 'Зеленоград', avg: 80.1, url: 'https://msk.postupi.online/vuz/miet/' , logo: '/vuz-logos/miet.png' },
    { id: 'mai', short: 'МАИ', name: 'Московский авиационный институт', city: 'Москва', avg: 79.9, url: 'https://msk.postupi.online/vuz/mai-niu/' , logo: '/vuz-logos/mai.png' },
    { id: 'muctr', short: 'РХТУ им. Менделеева', name: 'Российский химико-технологический университет им. Д. И. Менделеева', city: 'Москва', avg: 78.1, url: 'https://msk.postupi.online/vuz/rhtu-im-d-i-mendeleeva/' , logo: '/vuz-logos/muctr.png' },
    { id: 'mtuci', short: 'МТУСИ', name: 'Московский технический университет связи и информатики', city: 'Москва', avg: 78.0, url: 'https://msk.postupi.online/vuz/mtusi/' , logo: '/vuz-logos/mtuci.png' },
    { id: 'kfu', short: 'КФУ', name: 'Казанский федеральный университет', city: 'Казань', avg: 77.9, url: 'https://kazan.postupi.online/vuz/kfu/' , logo: '/vuz-logos/kfu.png' },
    { id: 'mgsu', short: 'МГСУ', name: 'Московский государственный строительный университет', city: 'Москва', avg: 75.8, url: 'https://msk.postupi.online/vuz/niu-mgsu/' , logo: '/vuz-logos/mgsu.png' },
    { id: 'mpei', short: 'МЭИ', name: 'Национальный исследовательский университет МЭИ', city: 'Москва', avg: 75.7, url: 'https://msk.postupi.online/vuz/mei/' , logo: '/vuz-logos/mpei.png' },
    { id: 'mospolytech', short: 'Московский Политех', name: 'Московский политехнический университет', city: 'Москва', avg: 75.6, url: 'https://msk.postupi.online/vuz/moskovskij-politeh/' , logo: '/vuz-logos/mospolytech.png' },
    { id: 'urfu', short: 'УрФУ', name: 'Уральский федеральный университет', city: 'Екатеринбург', avg: 75.2, url: 'https://ekaterinburg.postupi.online/vuz/urfu-im-b-n-elcina/' , logo: '/vuz-logos/urfu.png' },
    { id: 'sut', short: 'СПбГУТ им. Бонч-Бруевича', name: 'Санкт-Петербургский университет телекоммуникаций', city: 'Санкт-Петербург', avg: 75.0, url: 'https://spb.postupi.online/vuz/spbgut-im-bonch-bruevicha/' , logo: '/vuz-logos/sut.png' },
    { id: 'stankin', short: 'СТАНКИН', name: 'МГТУ «СТАНКИН»', city: 'Москва', avg: 74.4, url: 'https://msk.postupi.online/vuz/stankin/' , logo: '/vuz-logos/stankin.png' },
    { id: 'tpu', short: 'ТПУ', name: 'Томский политехнический университет', city: 'Томск', avg: 73.2, url: 'https://tomsk.postupi.online/vuz/tpu/' , logo: '/vuz-logos/tpu.png' },
    { id: 'kai', short: 'КНИТУ-КАИ', name: 'Казанский национальный исследовательский технический университет', city: 'Казань', avg: 72.1, url: 'https://kazan.postupi.online/vuz/kai/' },
    { id: 'voenmeh', short: 'ВОЕНМЕХ', name: 'Балтийский технический университет «ВОЕНМЕХ»', city: 'Санкт-Петербург', avg: 70.5, url: 'https://spb.postupi.online/vuz/bgtu-voenmeh-im-ustinova/' },
    { id: 'miit', short: 'РУТ (МИИТ)', name: 'Российский университет транспорта', city: 'Москва', avg: 64.9, url: 'https://msk.postupi.online/vuz/mgups-miit/' , logo: '/vuz-logos/miit.png' },
]

export const getVuz = (id: string | null | undefined): Vuz | null => (id ? VUZ_LIST.find((v) => v.id === id) ?? null : null)

// Цель по математике для вуза: средний проходной, округлённый вверх.
export const vuzTargetScore = (v: Vuz) => Math.min(100, Math.ceil(v.avg))
