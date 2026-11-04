# Команданте Мигель — персонаж ggege (черновик, 2026-10-27)

Гусь Мигель по прозвищу Команданте. Окончил физтех, сам прошёл ЕГЭ и помнит, как это страшно.
Готовит отряд гусиков к экзамену (с 2026-10-30: экзамен — не война и не «монстр», а важное событие, к которому готовимся спокойно, как к соревнованию; монстр остаётся только на логотипе). Уверенный, харизматичный, с самоиронией;
строгий к лени, тёплый к тому, кто ошибся. К ученикам — «боец», «новобранец», иногда по-испански «амиго». «Га-Га!» — боевой клич (это и
гусиный крик, и GG — good game).

Правки сюда — прямо в этот файл: вычёркивай, переписывай, добавляй. Потом перенесу в `lib/gagaVoice.ts`
и озвучу.

---

## Шаг 1. Стикеры (Leonardo)

**Основа выбрана (2026-10-27):** `public/miguel/miguel-base.webp` (стикер 512×512, прозрачный фон),
исходник от Leonardo — `docs/miguel/miguel-base-leonardo.jpg`. Длинная шея, хмурые брови и прищур,
чёрная фуражка с красной звездой, красная бандана, оливковая полевая куртка, крылья на поясе,
**карандаш в уголке клюва ластиком к щеке** (вместо сигары — фишка персонажа; дым и сигару не рисуем),
**золотой знак «GG» со звёздочкой на бандане** (нарисовал Leonardo, финальная основа 2026-10-27).

Как делать остальные эмоции: Leonardo → AI Creation → **Image Guidance** → загрузить исходник
`miguel-base-leonardo.jpg`, сила **0.5–0.6** (выше — копирует позу, ниже — теряет лицо). 4 варианта за раз.

Основа промпта (всегда в начале):

> Charismatic cartoon goose commander mascot sticker, same character as the reference image: long S-curved
> white neck, long orange goose beak, thick black angry eyebrows, tough squinting eyes, black military cap
> with a red star, plain red bandana scarf, olive green field jacket with rolled sleeves and a red star patch
> on the shoulder, orange webbed feet, a short yellow pencil with a pink eraser held in the back corner of the
> beak, thick clean black outline, flat cel shading, isolated on pure white background, no text, kid-friendly,
> high quality vector sticker

Negative (всегда):

> smoke, steam, cigarette, cigar, ash, duck, eyelashes, blush, makeup, girly, text on bandana, letters,
> writing, realistic, photo, 3d render, gore, blood, real weapon, extra limbs, multiple characters,
> watermark, logo, cropped

Позы (дописывать после основы через запятую). Где карандаш мешает позе — убрать из основы фразу про карандаш.

| Файл | Поза |
|---|---|
| `miguel-salute` | military salute with one wing at the cap, serious proud face, standing at attention (приветствие новобранца) |
| `miguel-point` | pointing straight at the viewer with one wing, stern look, "I want you" army poster pose |
| `miguel-happy` | big confident grin, one wing giving a thumbs up, eyes still a bit squinted |
| `miguel-proud` | chest out, chin up, wings on the hips, satisfied smirk, small golden medal with an atom symbol on the jacket |
| `miguel-oops` | facepalm with one wing, annoyed but not angry, small sweat drop |
| `miguel-rule` | holding a pointer stick at a small blackboard, one eyebrow raised, serious teacher look |
| `miguel-think` | holding chin with a wing, pencil in the other wing, thinking, one eye squinted |
| `miguel-fire` | wing raised like a fist, battle cry with open beak, orange fiery aura around |
| `miguel-boss` | furious determined face, leaning forward, ready to fight a monster, steam puffs from the head |
| `miguel-chest` | carrying a big wooden treasure chest with gold trim, proud grin |
| `miguel-sleep` | sleeping standing upright like a soldier on duty, cap over the eyes, small z bubbles |
| `miguel-march` | marching forward, one wing raised as if leading an army, small red flag with a star in the other wing |
| `miguel-binoculars` | looking through binoculars, scouting (сравнение с отрядом: «вижу, кто впереди») |

**Готово (2026-10-28), `public/miguel/*.webp` 512×512** (исходники Leonardo — `docs/miguel/leonardo/`,
вырезаны `docs/miguel/tools/make_sticker.py`): `base`, `happy` (палец вверх), `sleep`, `oops` (честь + капля пота),
`fire`, `chest`, `march`, `binoculars`, `proud` (смотрит на нас, крылья на поясе), `salute`, `rule` (у доски),
`think`, `point` (тычет в зрителя), `megaphone`, `roulette`, `combo` (на молнии), `freeze`, `salute-stars`,
`victory` (на монстре EGE), `tank`, `bazooka`, `pro` (корона, VIP), `quest` (чек-лист), `pizza`, `comeback` (часы),
`coffee` (ночь), `trophy`, `homework` (стопка книг), `newrank` (пришивает звёздочку), `dance`, `bandage` (пластырь,
палец вверх — ошибка), `hearts` (кончились сердечки), `stopwatch` (время поджимает), `streak` (огонь серии),
`telegram` (телефон с самолётиком), `bullseye` (карандаш в яблочке). Всего 35.

**Сцены с предметами (весёлые, под события приложения; промпты целиком — в истории сессии 2026-10-28):**
`streak3` (показывает 3 пера-пальца, три звезды), `combo` (верхом на молнии), `roulette` (крутит барабан призов),
`tank` (едет на мультяшном танке на монстра EGE), `bazooka` (игрушечная базука стреляет конфетти и учебниками в монстра EGE —
оружие только игрушечное), `victory` (стоит на поверженном монстре), `pro` (корона поверх фуражки, золотая карта),
`telegram` (телефон, из него вылетает бумажный самолётик; без логотипа Telegram), `pizza` (огромный кусок пиццы),
`freeze` (заморозка серии: в шарфе, дрожит, сосулька на клюве), `comeback` (стучит по часам — «где пропадал?»),
`coffee` (ночь, огромная кружка кофе), `megaphone` (зовёт друга), `homework` (шатается под стопкой книг),
`newrank` (сам себе пришивает звёздочку на погон), `dance` (победный танец), `oops-bandage` (пластырь на лбу, улыбается).

Отдельно (после согласования): армия гусиков — `group of three small cartoon goslings in tiny military caps
marching behind a leader, same style`.

**Знак на бандане (2026-10-27):** в итоге Leonardo сам нарисовал «GG» со звёздочкой — он в основе. Ниже — ранний вариант: свой золотой знак в цвет пуговицы (`#E9C842`) — голова гуся, которая
складывается в букву «G» (GG), со звёздочкой; наклонён и вытянут вверх. Птицу МФТИ не рисуем даже «похожую»
(знак вуза, читается как «одобрено МФТИ»). Нарисован скриптом `docs/miguel/tools/emblem.py`
(параметры: центр 444 506, масштаб 1.15, наклон −22°, вытягивание 1.7), картинка со знаком —
`docs/miguel/miguel-base-emblem.jpg`. Для новых эмоций в Leonardo знак можно попросить словами (рисует криво),
надёжнее дорисовать этим скриптом на готовой картинке:

> a small golden emblem on the red bandana: a stylized goose head curled into the letter G with a tiny star,
> tilted and vertically stretched

Медаль — наш символ (атом + звезда), **не герб МФТИ**: чужая символика на платном приложении выглядит как
«одобрено вузом». Доверие даём словами: «Приложение создал выпускник МФТИ» на главной и в экране для родителей.


### Постер «Comandante Miguel» (ретро, кубинский плакат)

Отдельная картинка для главной, экрана загрузки и сторис — не стикер. Стиль — как классические
кубинские плакаты: две-три краски, высокий контраст, крупный план головы.

> Retro Cuban revolutionary poster style portrait of a cartoon goose commander, blocky cube-shaped white head,
> big orange beak, black beret tilted with a small red star, confident heroic look into the distance,
> high-contrast two-tone illustration, black ink on cream paper with red accents, bold vector shapes,
> screen-print texture, vintage 1960s propaganda poster, centered, plenty of empty space at the bottom,
> no text, kid-friendly

Надпись **на картинку не просим** — Leonardo пишет буквы криво. Надпись «Comandante Miguel» / «Команданте
Мигель» накладываем сами шрифтом **Lobster** (Google Fonts, есть кириллица, ретро-рукописный, как на
пин-ап плакатах): «Comandante» — чёрным, «Miguel» — красным, наискосок, как на образце.

Важно: делаем **свой** гусиный портрет «в духе» плаката, не перерисовку знаменитой фотографии Че Гевары
(у снимка есть автор и права) и без лица Че.

Вырезать фон — как раньше (Vision + заливка белого от углов), 512×512 WebP, в `public/miguel/`.

---

## Шаг 1б. Новый голос (ElevenLabs → Voices → Create a voice → Voice Design)

Ссылка: https://elevenlabs.io/app/voice-lab (кнопка «Create a voice» → «Voice Design»).

**Голос — вариант 1 (выбран 2026-10-28):** библиотечный голос ElevenLabs **Chuck Miller** (Deep, Raspy, American),
Voice ID `HIGUfNOdjuWQwwapnTRW` — тот же, что купили для Garaggio. Модель `eleven_v4`, `stability: 0`.
Пробы: `docs/miguel/voice-sample-chuck-miller.mp3` (обычные пометки настроения) и
`docs/miguel/voice-sample-chuck-raspy.mp3` (пометки `[gruff, raspy voice]`, `[gravelly]`, `[hoarse]`, `[raspy laugh]`
и `similarity_boost: 0.95` — хрипотцы больше). Параметр `speed` модель v4 игнорирует.
Описание ниже — запасной путь, если понадобится свой голос.

Описание голоса (обновлено 2026-10-28 под армейский тон: строгий командир, но с юмором):

> A confident, commanding middle-aged male voice of a cartoon goose army commander who trains teenagers for
> their math and physics exams. Firm, clear, slightly raspy drill-sergeant delivery with short punchy phrases,
> but with a hidden smile and dry humor, a light playful Spanish accent on Spanish words, and a short warm laugh.
> Speaks Russian naturally. Sounds like a strict but beloved army instructor: demanding and disciplined,
> never mean, proud of his soldiers.

Пример текста (вставить в поле «Text», с пометками настроения):

> [confident] Смирно, новобранец! Говорит Команданте Мигель. [serious] Каждый день — боевое задание.
> Увольнительных не выдаём. [laughing] Ньютон тоже начинал с простых задач — только без яблока по голове.
> [proud] Чётко! Вот это выправка. [serious] Отставить панику: ошибка — это разведка. [excited] ¡Adelante!
> Покажем монстру, кто тут командир! [softly] Отбой, боец. Завтра — в строй.

Послушай 3 варианта, выбери, сохрани и пришли мне Voice ID.

---

## Шаг 2. Фразы (по событиям)

Тон (решение пользователя 2026-10-27): **учёба — как служба в армии**. Дисциплина, чёткие задачи, без слабины,
но с юмором и без грубости: строгий, но свой командир. Как спортзал: дома тоже можно, но в зале видишь, что все
вокруг трудятся, — поэтому иногда сравниваем с отрядом («есть на кого равняться»). Главная надежда: ежедневные
задания → баллы ЕГЭ → поступление.

Пометки в скобках — для озвучки, на экране их не видно. `{…}` — подставляется из данных.

Расчёт званий (lib/rank.ts, lib/xp.ts): урок тренажёра = 50 XP, уровень = 100 XP, значит **уровень = 2 урока**.
От Новобранца: Гусёнок — 2 урока, Рядовой гусик — 4, Связной — 8, Разведчик — 12, Сапёр формул — 16,
**Ефрейтор — 22**, Сержант — 28, Старшина — 34, Лейтенант — 50. (Задачи задачника тоже дают XP — так быстрее.)

### Приветствие новобранца (onboarding, первый вход; озвучка + стикер `miguel-salute`)
1. [confident] Смирно, новобранец! Говорит Команданте Мигель. С этой минуты ты в моём отряде.
2. [serious] Каждый день — боевое задание: уроки тренажёра и задачи ЕГЭ. Увольнительных не выдаём.
3. [warmly] Выполняешь задания — растут баллы. Растут баллы — сдаёшь ЕГЭ и поступаешь туда, куда мечтаешь. Вот и вся стратегия.
4. [laughing] Ньютон тоже начинал с простых задач. А потом яблоко, тяготение, слава. У тебя будет так же — только без яблока по голове.
5. [confident] Халявы не будет. Но и одного тебя в бою никто не бросит — я рядом.
6. [proud] Принимаю тебя в отряд. Звание — Новобранец. До Рядового гусика — 4 урока. Шагом марш!

### Начало урока (start)
1. [confident] Отряд, подъём! Задание на сегодня получено. Выдвигаемся.
2. [serious] Разговорчики в строю! Открываем урок.
3. [laughing] Маньяна — главный враг революции. Поэтому — сегодня.
4. [confident] Один урок — один шаг к поступлению. Шагаем.
5. [laughing] Лень — это когда производная желания учиться отрицательная. Исправляем.
6. [serious] Телефон в беззвучный, мысли в кучу. Начали.

### Верный ответ (correct)
7. [proud] Чётко! Вот это выправка.
8. [laughing] Га-Га! Прямо в цель, боец.
9. [confident] Принято. Ещё один балл в копилку к экзамену.
10. [proud] Это твой экстремум: производная — ноль, ты на вершине.
11. [laughing] Где-то Ньютон уронил ещё одно яблоко от восторга.
12. [confident] Так держать. Я заношу это в личное дело.
13. [happy] ¡Excelente! Хорошо служишь.
14. [proud] По-командирски. Следующий!

### Ошибка (wrong)
15. [serious] Отставить панику. Ошибка — это разведка: теперь мы знаем, где враг.
16. [confident] Мимо. Перегруппировались — и снова в бой.
17. [laughing] Минус — штука обидчивая. Проверь его, боец.
18. [serious] Не спеши. Солдат, который торопится, стреляет в молоко.
19. [warmly] Бывает. Даже у Эйнштейна были ошибки. Ещё заход.
20. [confident] Тут ловушка. Смотри внимательнее — ты справишься.

### Правило / ЗАПОМНИ (rule)
21. [serious] Внимание, отряд! Это записываем в боевой устав.
22. [confident] Запомни, боец: это будет на экзамене. Проверено разведкой.
23. [serious] Это не обсуждается. Это заучивается.

### Серия ответов (streak)
24. [excited] Серия! Ты разогнался, как частица в коллайдере.
25. [laughing] Га-Га-Га! Тебя уже не остановить.
26. [proud] Вот это форма! К экзамену готовишься как чемпион.
27. [confident] Вот это дисциплина. Ещё!

### Сундук (chest)
28. [proud] Трофей с фронта. Заслужил, боец.
29. [laughing] Сундук! Открывай, пока не убежал.
30. [confident] Награда за службу. Посмотрим, что внутри.

### Новый уровень / звание (levelup) — `{rank}` новое звание, `{next}` следующее, `{n}` уроков до него
31. [proud] Поздравляю с повышением! Теперь ты — {rank}.
32. [confident] Новое звание: {rank}. До звания «{next}» — {n} уроков. Не расслабляемся.

### Урок пройден (done)
33. [proud] Высота взята! ¡Hasta la victoria!
34. [confident] Задание выполнено. Отбой — заслужил.
35. [laughing] Сегодня ты сделал не dx работы, а целый интеграл.
36. [confident] Ещё один шаг к поступлению. Завтра — следующий.

### Сравнение с отрядом (после урока или на /trainer, раз в день; стикер `miguel-binoculars`)
37. [confident] Отряд за неделю прошёл в среднем {avg} уроков. Ты — {mine}. {выше: «Ты впереди строя, так держать!» / ниже: «Подтягивайся, боец».}
38. [serious] Сегодня уже {active} бойцов на задании. Где ты, новобранец?
39. [proud] Ты в первой десятке отряда по урокам за неделю. Остальные равняются на тебя.
40. [laughing] Лучший боец недели прошёл {top} уроков. Это не человек — это танк. Догоняй.
41. [confident] Ты сейчас — средний боец взвода. Средний — это не про тебя. Ещё урок?

### Босс-экзамен (boss)
42. [serious] Тишина в строю. Перед нами босс.
43. [confident] Все уроки были ради этого. В бой!
44. [excited] ¡Adelante! Это генеральная репетиция экзамена. Покажем класс!

### Ночь / серия под угрозой (night)
45. [serious] Боец, день почти кончился, а задание не выполнено. Один короткий урок — и отбой.
46. [laughing] Твоя серия стремится к нулю. Не дадим ей достичь предела!
47. [softly] Отбой, боец. Даже революционерам нужен сон. Завтра — в строй.

### Для экрана загрузки и кнопки «Дальше» (без озвучки)
- Энергия не берётся из ниоткуда. Кроме твоей после трёх уроков подряд.
- Ускорение — это когда ты понял, что экзамен через месяц.
- Сила трения — это то, что мешает тебе встать с дивана.
- ∞ уроков завтра < 1 урока сегодня.
- Девушек на физтехе — dx. Предел стремится к нулю, но мы их очень любим.
- Кнопки «Дальше»: «Есть!», «Так точно!», «Принято, команданте», «¡Vamos!», «Вперёд!».

---


## Шаг 3. Байки и карточки учёных

Карточка: имя, годы жизни, «за что знаменит» в одну строку, одна байка, «связь с ЕГЭ» (к какой теме).
Рисуем своим стилизованным рисунком, **не фотографией**. Имя и облик Эйнштейна охраняются как товарный знак,
поэтому его карточку лучше делать без портрета (например, скрипка и E = mc²).

Пометка «правда» — описано самим учёным или документами; «легенда» — пересказывают, но доказательств нет.

| Учёный | За что знаменит | Байка | Тема ЕГЭ |
|---|---|---|---|
| Ричард Фейнман (1918–1988) | Квантовая электродинамика, Нобелевская премия 1965 | **Правда (по его книге «Вы, конечно, шутите, мистер Фейнман»):** в столовой Корнелла кто-то подбросил тарелку с медальоном университета. Фейнман заметил, что тарелка покачивается вдвое быстрее, чем крутится, и вывел уравнения просто ради удовольствия. Позже, по его словам, это привело к работе, за которую он получил Нобелевскую премию. Ещё: в Лос-Аламосе он ради шутки вскрывал сейфы с секретными документами. | Вращение, колебания |
| Альберт Эйнштейн (1879–1955) | Теория относительности | **Правда:** Нобелевскую премию он получил не за относительность, а за объяснение фотоэффекта (1921). Любил играть на скрипке. Стишок из физтех-методички: «Мудрец Эйнштейн играть на скрипке мог, но славу принесло ему другое. Его теории могли понять лишь двое: он сам — и временами Бог» (студенческий фольклор, автор неизвестен). | Фотоэффект, кванты |
| Нильс Бор (1885–1962) | Модель атома, Нобелевская премия 1922 | **Правда:** придумал, что электрон «прыгает» между орбитами и при этом излучает свет. **Легенда:** над его дверью висела подкова. На вопрос «Вы что, верите?» он ответил: «Нет, но говорят, она помогает и тем, кто не верит». | Атом, фотоны |
| Пётр Капица (1894–1984) | Сверхтекучесть гелия, Нобелевская премия 1978, один из основателей физтеха | **Правда:** настоял, чтобы студенты физтеха с первых курсов работали в настоящих научных институтах, а не только сидели на лекциях. Это и есть «система физтеха». | Газ, температура |
| Лев Ландау (1908–1968) | Теоретическая физика, Нобелевская премия 1962 | **Правда:** придумал «теорминимум» — экзамены, которые надо было сдать ему лично, чтобы попасть в его школу. За много лет их сдали всего несколько десятков человек. | Механика, всё подряд |
| Виталий Гинзбург (1916–2009) | Сверхпроводимость, Нобелевская премия 2003 | **Правда:** читал лекции и вёл кафедру на физтехе. Нобелевскую премию получил в 87 лет — никогда не поздно. | Электричество |
| Андрей Сахаров (1921–1989) | Физик, Нобелевская премия мира 1975 | **Правда:** один из создателей советской водородной бомбы, а потом — правозащитник, который всю жизнь выступал за мир. | Ядерная физика |
| Исаак Ньютон (1643–1727) | Законы механики, всемирное тяготение, анализ | **Легенда, но со слов самого Ньютона (записал его друг Стьюкли):** мысль о тяготении пришла, когда он смотрел, как падает яблоко. Голову оно не задело. | Законы Ньютона, производная |
| Карл Гаусс (1777–1855) | «Король математиков» | **Легенда:** в школе учитель велел сложить числа от 1 до 100, чтобы класс замолчал надолго. Маленький Гаусс почти сразу ответил: 5050 — сложил пары 1+100, 2+99… | Арифметическая прогрессия |
| Архимед (≈287–212 до н. э.) | Закон Архимеда, рычаг | **Легенда:** понял, как проверить корону на подделку, сидя в ванне, и выбежал на улицу с криком «Эврика!». | Сила Архимеда |

Как используем:
- **Байка дня** на экране загрузки урока.
- **«Как это открыли»** — короткая сцена в начале пошагового разбора на эту тему.
- **Коллекция карточек** — выпадают из кейсов (как банд-стикеры).

Преподавателей МФТИ (Шабунин, Козел) — только с согласия их или их семей, лучше как тёплую историю
«от создателя» в разделе «О нас», а не как персонажей.


## Стикеры v2 (2026-11-04)
Все стикеры `public/miguel/` без белой обводки, с мягкой тенью и тенью под ногами, запечёнными в картинку: `python3 docs/miguel/tools/make_sticker_v2.py вход.jpg public/miguel/miguel-<имя>.webp`. Старые с белой обводкой — `docs/miguel/white-outline/`.

## Логотип: промпты Leonardo для чистой вырезки (2026-11-04)
Модель FLUX.1 Kontext, Image Guidance с рефом (сила 0.4–0.5), 1:1. Фон — сплошной ядовитый цвет, а не белый: белый гусь с белого фона вырезается плохо.
Рефы: гусь — `docs/miguel/leonardo/logo-goose-bazooka.jpg`, монстр — `docs/miguel/leonardo/logo-monster-ref.png`.

Гусь: Same cartoon goose character as the reference, same pose: side view, running to the right, firing a bazooka aimed to the right and slightly up, both feet visible, black cap with red star, olive jacket, red bandana, pencil in the beak with the pink eraser end sticking out. Keep the thick clean black contour line around the whole character, closed and unbroken. NO white outline, no sticker border, no die-cut edge. No muzzle flash, no smoke, no ground, no shadow. Full body, nothing cropped. Flat solid pure magenta background #FF00FF, the same magenta everywhere. Avoid: white border, white halo, sticker outline, gradient background, shadow, text, watermark.

Монстр: Same cartoon blocky monster as the reference, same pose: dark purple cube body, arms raised with fists, small purple horns, yellow X eyes, purple letters EGE on the chest. Keep the thick clean black contour line around the whole character, closed and unbroken. NO white outline, no sticker border, no die-cut edge. No ground, no shadow. Full body, nothing cropped. Flat solid pure bright green background #00FF00, the same green everywhere. Avoid: white border, white halo, sticker outline, gradient background, shadow, watermark, extra text.

## Новые стикеры для «Сета» и эмоций (промпты Leonardo, 2026-11-05)
Как раньше: Leonardo → Image Guidance → исходник `docs/miguel/miguel-base-leonardo.jpg`, сила **0.5**, 1:1, 4 варианта.
В начале — основа промпта (см. «Шаг 1» выше), затем поза. Фон белый (make_sticker_v2.py вырезает белый фон;
если белые детали — тарелка, клош — слипнутся с фоном, повторить с фоном «flat solid pure magenta background #FF00FF»).
Готовую картинку: `python3 docs/miguel/tools/make_sticker_v2.py вход.jpg public/miguel/miguel-<имя>.webp`.

Негатив к сценам с едой дописывать: `real alcohol, wine, beer, knife, raw meat, messy food, gross`.

| Файл | Поза |
|---|---|
| `miguel-cloche` (главный для сета) | proud waiter pose: one wing lifts a shiny silver restaurant cloche dome up and to the side, revealing a silver serving tray held in the other wing, on the tray three small beautiful dishes in a row — a tiny appetizer plate with a green leaf, a steaming bowl of main course, a small cupcake dessert with a cherry, golden sparkles above the food, confident smirk, looking at the viewer, napkin over the forearm |
| `miguel-chef` | wearing a tall white chef hat over the black military cap, holding a ladle like a baton, tasting from it with a satisfied face, small chef kiss gesture |
| `miguel-tray-chest` | carrying a silver serving tray, on the tray instead of food a small wooden treasure chest with gold trim glowing, sly proud grin (десерт сета — сундук) |
| `miguel-bell` | pressing a shiny silver reception desk bell with one wing, «order up» moment, small sound lines around the bell, cheerful shout |
| `miguel-full` | patting a round full belly with both wings, eyes closed in bliss, tiny crumbs on the jacket, napkin tied around the neck (экран «всё съедено») |
| `miguel-menu` | holding an open restaurant menu card with three lines drawn on it (no readable text), pointing at it with the pencil, waiter pose |
| `miguel-hungry` | holding an empty plate and a fork, puppy eyes, hopeful hungry look, stomach growl lines (ученик давно не заходил) |
| `miguel-shocked` | huge shocked face, eyes wide, beak wide open, wings up, cap jumping off the head (неожиданный мифический сундук) |
| `miguel-laugh` | laughing hard, holding the belly, tears of joy, leaning back |
| `miguel-cool` | wearing black aviator sunglasses, arms crossed, cool smirk, leaning on a wall |
| `miguel-love` | holding a big red heart with both wings, shy warm smile (спасибо за оценку / друг пришёл) |
| `miguel-sad-rain` | standing under a tiny rain cloud, cap drooping, sad but still holding a small flag (серия прервалась) |
| `miguel-detective` | holding a big magnifying glass to the eye, one eye huge through the glass, curious (ИИ-помощник разбирает фото) |
| `miguel-scientist` | in a white lab coat over the jacket, holding a bubbling test tube, safety goggles on the cap (физика) |
| `miguel-mathboard` | writing a formula with chalk on a green chalkboard, chalk dust, focused (математика; без читаемого текста) |

## Колокольчики уровня сета и еда блюд (промпты Leonardo, 2026-11-05)
Не персонаж — иконки предметов. Image Guidance со стилем: `public/miguel/miguel-cloche.webp` (или любой стикер Мигеля),
сила **0.3–0.35** (берём только стиль: толстый чёрный контур, плоская заливка). 1:1. Фон — сплошной ядовитый
`flat solid pure magenta background #FF00FF` (серебро и белое с белого фона вырезаются плохо). Положить в
`public/set-bells/bell-1..4.webp` и `public/set-food/fries|burger|donut.webp` — подключу (`SET_BELLS`, `SET_DISH_ICONS`
в components/set-bar.tsx).

Основа иконки (в начало каждого):
> Cartoon game item icon, single object centered, slight 3/4 front view, thick clean black outline, flat cel shading with one soft highlight, bold saturated colors, kid-friendly mobile game style, flat solid pure magenta background #FF00FF, no text, no characters, no hands

Негатив: `text, letters, numbers, watermark, logo, hands, person, animal, goose, realistic, photo, 3d render, gradient background, white border, sticker outline, shadow on background, multiple objects`

Колокольчики (уровень = какой сет за день):
| Файл | Предмет |
|---|---|
| `bell-1` (1-й сет, обычный) | simple silver hotel reception desk bell on a round black base, small push button on top, plain and shiny |
| `bell-2` (2-й, редкий) | reception desk bell made of polished blue metal with silver trim, glowing light blue rim, small sparkles around |
| `bell-3` (3-й, мифический) | ornate purple and gold reception desk bell, engraved star pattern, glowing violet aura, magic sparkles flying around |
| `bell-4` (на будущее, МЕГА) | legendary golden reception desk bell with a small red star on the button, flames of golden light around it, rays behind, epic treasure look |

Еда (блюда сета):
| Файл | Предмет |
|---|---|
| `fries` (закуска) | red paper carton of golden french fries, a few fries sticking out, tiny ketchup drop |
| `burger` (основное) | tall juicy cheeseburger with sesame bun, lettuce, tomato, melted cheese dripping, a tiny toothpick flag with a red star on top |
| `donut` (десерт) | pink glazed donut with colorful sprinkles, glossy icing, one bite missing |
