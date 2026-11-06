# Промпты Leonardo: «жизнь» в ангаре

Сейчас жук, птицы, кукурузник, транспарант и паучки нарисованы кодом (components/hangar-life.tsx). Чтобы они были
в стиле самого ангара, рисуем их в Leonardo и заменяем картинками. Анимация (полёт, бег, пружина на нити) остаётся
в коде — от картинки нужен только сам объект.

## Как генерировать (как делали предметы ангара)

1. Create → модель **FLUX.1 Kontext** → **Add Image**: кусочек ангара как образец стиля
   (например `docs/hangar/bg-empty.jpg` или любой `public/hangar/NN-before.webp`). Сила образца — средняя.
2. Промпт ниже + общий хвост стиля (вставлять в конец каждого промпта):

   > in the same art style as the reference image: cartoon illustration, thick uneven dark-brown outlines,
   > muted dusty colours, flat cel shading with soft texture, slightly worn comic look, single object, full view,
   > centered, isolated on pure white background, no text, no letters, no shadow on the ground, no frame

3. В конце промпта — `Avoid: text, letters, watermark, signature, background scenery, multiple objects, cropped, blurry, photo, 3D render`.
4. **Remove Background в Leonardo НЕ нужен** (это ещё ~40 токенов на картинку). Присылай как есть, на белом фоне —
   фон уберу бесплатно скриптом `python3 docs/hangar/tools/cut_white.py вход.jpg выход.png` (заливка белого от краёв,
   белое внутри предмета — блики, табличка — остаётся). Поэтому в промпте важно «isolated on pure white background».
   Сохрани в `docs/hangar/leonardo/` с именем из таблицы и пришли файлом — я вырежу, уменьшу и подключу.

## Объекты

| Файл | Промпт (перед хвостом стиля) | Заметки |
|---|---|---|
| `life-spider-ceiling-1.jpg`, `-2.jpg`, `-3.jpg` | small cute cartoon spider seen strictly from below, as if walking upside down on a ceiling, round dark body, 8 thin jointed legs spread out, two tiny white eye dots, view from directly underneath | 3 кадра ходьбы: в промпт кадра 2 добавить «left legs forward, right legs back», кадра 3 — «right legs forward, left legs back». Один размер и ракурс у всех трёх |
| `life-spider-hanging.jpg` | small cute cartoon spider hanging upside down on a single silk thread, seen from the front, legs slightly curled, two tiny white eye dots, a short piece of thread going up from its back, slightly worried funny face | Нить дорисую кодом — от картинки нужен паучок с коротким кусочком нити |
| `life-beetle-1.jpg`, `-2.jpg` | small cartoon brown beetle crawling, seen from above at a slight angle, glossy shell with a line down the middle, six short legs, tiny antennae, facing right | 2 кадра: ножки в разных положениях («left legs forward» / «right legs forward») |
| `life-bird-up.jpg`, `life-bird-down.jpg` | small cartoon swallow bird in flight, side view, facing right, dark grey-blue body with lighter belly, wings raised up / wings pushed down | Два кадра взмаха; в небе их будет 2–3 штуки разного размера |
| `life-biplane.jpg` | flat 2D side profile of a small old yellow crop-duster biplane, seen exactly from the side at 90 degrees like a technical side elevation, nose pointing to the right, flying horizontally and level, both wings stacked one above the other and seen edge-on as thin horizontal strips, vertical struts between them, propeller on the right seen edge-on as a thin vertical blade, landing gear below, tail fin on the left, red star on the fuselage side, short rope with a hook trailing from the tail to the left | **Строго сбоку.** В Avoid добавить: `three-quarter view, perspective, angled view, front view, flying towards the viewer, foreshortening, visible top of the wings`. Можно взять прошлый самолёт как образец стиля (Image Guidance, сила 0.3–0.4) — цвета и контуры у него отличные, нужен только ракурс |
| `life-banner.jpg` | long empty fabric banner waving in the wind, cream-coloured canvas with a thin red border, slightly torn and stitched edges, gentle waves along its length, rope loops on the left end, horizontal, very wide and short (about 5:1) | **Пустой, без надписи** — Leonardo пишет буквы криво, лозунги наложу кодом поверх. Формат картинки 16:9, сам транспарант вытянутый |
| `life-paper.jpg` | crumpled sheet of exam paper with handwritten math formulas and a red circled grade "5", slightly torn corner, seen flat from above | Если цифра выйдет криво — без неё, «5!» допишу кодом |

## Небо в окне (на будущее)

Небо в круглом окне нарисовано в самом фоне ангара. Поверх него плывут облака (сейчас кодом). Для них и солнца — отдельные
картинки на прозрачном фоне, движение сделаю кодом.

| Файл | Промпт (перед хвостом стиля) | Заметки |
|---|---|---|
| `life-cloud-1.jpg`, `-2.jpg`, `-3.jpg` | single fluffy cartoon cumulus cloud, flat side view, soft pale mint-white top and slightly darker teal-grey underside, simple rounded puffs, soft edges, horizontal and wide | 3 разных облака: «small and round», «long and flat», «big with three puffs». Цвета — как облака в окне ангара (бледно-мятные), не ярко-белые |
| `life-sun.jpg` | simple cartoon sun, soft warm yellow disc with a gentle orange glow around it, a few short soft rays, calm and friendly, no face | Будет медленно светиться; вечером опускаться и краснеть, ночью — луна (отдельно, позже) |
| `life-moon.jpg` | simple cartoon crescent moon, pale cream colour with a soft glow, a few tiny stars around | На ночь |

В Avoid для неба: `sky background, blue background, landscape, horizon, multiple clouds, text`.

## Табличка «Наш ангар» (шапка окна ангара)

Сейчас табличка нарисована CSS (components/wood-sign.tsx) и выглядит «чужой» рядом с картинкой ангара. Нужна пустая
доска в стиле ангара, надпись «НАШ АНГАР» наложу кодом (Leonardo пишет буквы криво).

| Файл | Промпт (перед хвостом стиля) | Заметки |
|---|---|---|
| `sign-board.jpg` | old empty wooden sign board nailed together from two horizontal planks, seen straight from the front, wide and short (about 4:1), warm muted brown wood with visible grain, small knots and scratches, slightly chipped corners, four dark iron nails at the ends of the planks, a thin darker wooden frame, worn and dusty like in an old military hangar, flat and level, not tilted | **Пустая, без букв.** Формат картинки 16:9, сама доска вытянутая. В Avoid добавить: `perspective, angled view, sign post, hanging chains, ropes, paint, carved letters`. Образец стиля — `docs/hangar/bg-empty.jpg` (сила средняя). Цвет дерева — как балки под потолком ангара |

### Вариант 2: технологичная вывеска (2026-10-30, предпочтительнее)

Не просто доска, а самодельная «табличка-прибор», собранная механиками ангара. Надпись по-прежнему накладываем кодом,
искры и мигание добавим кодом позже — в промпте их нет.

| Файл | Промпт (перед хвостом стиля) | Заметки |
|---|---|---|
| `sign-tech.jpg` | handmade workshop sign plate for an old military aircraft hangar, seen straight from the front, wide and short (about 4:1), a dark riveted metal plate with a worn wooden frame, an empty recessed panel in the middle for text, small round indicator lamps and toggle switches on both ends, a little analog gauge in one corner, thick black cables and coloured wires coming out of the sides and hanging down in loops, a few cable ties and electrical tape patches, bolts in the corners, slightly rusty and dusty, cosy diy engineering look, muted olive, brown and brass colours, flat and level, not tilted | **Середина пустая, без букв и цифр.** Формат 16:9. В Avoid добавить: `text, letters, numbers, sparks, lightning, glow, neon, perspective, angled view, chains, sign post`. Образец стиля — `docs/hangar/bg-empty.jpg` или любой `public/hangar/NN-after.webp` (сила средняя) |

## Что сделаю после

- Уберу из `docs/hangar/leonardo/` фон, приведу кадры к одному размеру и выравниванию (как кадры гуся на /trainer).
- Положу в `public/hangar/life/*.webp`, заменю SVG в `components/hangar-life.tsx` на картинки; кадры ходьбы паучка,
  жука и взмахи птиц — сменой кадров (как у Мигеля на дорожке), движение по экрану — как сейчас.

## Котик (2026-10-30)

Порядок: сначала `cat-sit.jpg`, выбрать лучший — и дальше он идёт **Image Guidance** (сила 0.45–0.5) для всех остальных
поз, чтобы котик был один и тот же (как делали Мигеля). Общее описание котика вставлять в начало каждого промпта:

> small scruffy ginger tabby kitten, a stray from the street, big round green eyes, white paws and white chest,
> one ear slightly bent, thin tail with a white tip, a little dusty fur, cute and a bit shy

| Файл | Промпт (после описания котика, перед хвостом стиля) | Заметки |
|---|---|---|
| `cat-sit.jpg` | sitting upright, seen from the side at three-quarter view, facing right, tail wrapped around the paws, curious look | Основа для всех остальных |
| `cat-peek.jpg` | peeking from behind the edge of a wall on the left, only the head, both front paws and a bit of the chest visible, ears up, mouth open as if meowing, shy hopeful eyes | Выглядывает из арки ангара; край стены слева — тот же цвет, что ворота ангара, его потом обрежу |
| `cat-walk-1.jpg`, `cat-walk-2.jpg` | walking, strict side view, facing right, tail up; frame 1: left front paw and right back paw forward; frame 2: right front paw and left back paw forward | Один размер и ракурс у обоих кадров |
| `cat-meow.jpg` | sitting, head raised, mouth wide open meowing, eyes squinted | Для облачка «Мяу?» |
| `cat-pet.jpg` | sitting, eyes closed in a happy smile, head tilted, ears flat, purring, small hearts are NOT needed | Когда гладят (сердечки дорисую кодом) |
| `cat-sniff.jpg` | stretching its neck forward and sniffing, nose up, tail up, eager | Учуял колбаску |
| `cat-sleep.jpg` | sleeping curled up in a tight ball, seen from the side, tail covering the nose, eyes closed, calm | Zzz допишу кодом |
| `cat-eat.jpg` | crouching and lapping from a bowl (bowl not drawn), strict side view, facing right, head down | Миску положу отдельной картинкой под мордочку |
| `cat-loaf.jpg` | sitting as a "loaf" with paws tucked under the body, eyes half-closed, cosy | Сидит на картонке днём |

В Avoid для котика: `text, collar, clothes, human, multiple cats, realistic photo, 3D render, background scenery, cropped ears`.

### Вещи котика

| Файл | Промпт (перед хвостом стиля) | Заметки |
|---|---|---|
| `cat-cardboard.jpg` | flattened old cardboard box lying flat on the floor, seen from a slight angle above, worn corners, a faded stamp shape without letters, a little dusty | Лежит у левой стены |
| `cat-bowl-empty.jpg`, `cat-bowl-milk.jpg` | small round metal pet bowl on the floor, seen from a slight angle above, dented rim; empty / filled with white milk | Два состояния |
| `cat-milk.jpg` | small cardboard milk carton, white and blue, no letters, standing | |
| `cat-sausage.jpg` | one pink boiled sausage with a string knot at the end, slightly bent | Для кнопки «Подманить колбаской» и полёта к котику |
| `cat-fridge.jpg` | small old rounded retro mini fridge, cream colour with a chrome handle on the right side of the door, a few small magnets, an EMPTY white paper label taped on the door, standing on the floor, **three-quarter view from the front-left and slightly from above, the left side panel of the fridge clearly visible, the top surface slightly visible, same perspective as the hangar floor in the reference** | Табличку «для Мурзика» наложу кодом. Первая версия вышла строго спереди (лежит в `cat-fridge-front.png`) — для ракурса добавь Image Guidance с предметом ангара в перспективе, например `public/hangar/07-after.webp` (компьютер), сила 0.3–0.4 (только ракурс, не форма). В Avoid: `front view, flat, orthographic, symmetrical` |

### Сломанный холодильник (2026-10-31)

Делать **правкой готового** `docs/hangar/leonardo/freezer.png`: FLUX.1 Kontext → Add Image = freezer.png, сила высокая
(0.75–0.85), чтобы ракурс, форма и размер совпали с целым (при починке картинка просто меняется на месте).
Фон не убирать — вырежу сам. Сохранить как `docs/hangar/leonardo/cat-fridge-broken.png`.

> the same small retro mini fridge, exactly the same shape, angle, size and position, but old and broken: the door hangs
> slightly open and crooked on one hinge, one hinge is loose, the chrome handle is bent and half fallen off, dents and
> scratches on the side, rust spots and dirty stains, faded and yellowed cream paint, a strip of grey duct tape over a
> crack, a tangled power cord with an unplugged plug lying on the floor, a few magnets missing, the paper note is gone,
> a small puddle of water under it, dusty, cartoon illustration, thick uneven dark-brown outlines, muted dusty colours,
> flat cel shading with soft texture, isolated on pure white background, no text, no letters

Avoid: `different angle, front view, new fridge, open food inside, text, letters, fire, smoke, explosion, background scenery, multiple objects`

## Небо, погода, облака (2026-10-30)

Небо в окне сейчас нарисовано прямо в фоне ангара. Чтобы оно менялось, сделаем отдельную «плиту неба» под окном
(обрежу кругом окна, лежит под облаками, солнцем и самолётом). Время суток берём по часам ученика (уже есть), погоду —
случайную на день (позже можно настоящую по городу).

**Плиты неба** — формат 1:1, только небо, без земли и объектов:

| Файл | Промпт (перед хвостом стиля, НО без «single object / isolated on white») |
|---|---|
| `sky-day.jpg` | plain cartoon sky texture filling the whole image, soft gradient from pale mint-blue at the bottom to calm blue at the top, subtle painted brush texture, no clouds, no sun, no objects |
| `sky-overcast.jpg` | same, but grey-blue overcast sky, flat layered grey clouds filling the whole image, muted and calm |
| `sky-sunset.jpg` | same, but sunset gradient: warm peach and orange at the bottom, pink in the middle, dusty violet at the top, no sun disc |
| `sky-dawn.jpg` | same, but early morning: pale lemon yellow at the bottom, soft pink, light blue at the top |
| `sky-night.jpg` | same, but night sky: deep navy blue to dark indigo, many tiny soft stars of different sizes, a faint milky way band |
| `sky-storm.jpg` | same, but dark stormy sky: heavy slate-grey and purple clouds, dramatic but cartoon, no lightning |

Avoid для плит: `ground, horizon, landscape, buildings, trees, sun, moon, birds, planes, text, frame, vignette`.

**Погода и облака** — отдельные объекты на белом (обычный хвост стиля):

| Файл | Промпт | Заметки |
|---|---|---|
| `cloud-small.jpg`, `cloud-long.jpg`, `cloud-big.jpg` | single fluffy cartoon cumulus cloud, flat side view; small and round / long and flat / big with three puffs; pale cream-white top, soft grey-blue underside | Добавятся к уже готовому cloud.webp — будет разнообразнее |
| `cloud-sunset.jpg` | single fluffy cartoon cloud lit by sunset from below, peach and pink underside, cream top | Вечером вместо белых |
| `cloud-night.jpg` | single cartoon cloud at night, dark blue-grey with a pale silver edge lit by moonlight | Ночью |
| `cloud-rain.jpg` | single heavy dark grey cartoon rain cloud, flat bottom, a few short rain streaks falling from it | Дождь сам — кодом, это туча |
| `cloud-storm.jpg` | single dark purple-grey storm cloud with a small yellow cartoon lightning bolt coming out of the bottom | Молнию буду вспыхивать кодом |
| `rain-streaks.jpg` | many thin slanted light-blue rain streaks on white, evenly spread, seamless pattern | Плитка дождя, двигаю кодом |
| `snowflakes.jpg` | many small soft white-blue cartoon snowflakes and dots of different sizes on a light grey background, seamless pattern | Зимой (декабрь–февраль) |
| `raindrops-glass.jpg` | water droplets running down a window glass, a few big drops with little trails, transparent look, cartoon | Капли на стекле окна в дождь |
| `rainbow.jpg` | soft pastel cartoon rainbow arc, muted colours, slightly faded ends | После дождя |
| `fog.jpg` | soft horizontal band of pale grey fog, wispy edges, wide and short | Утром туман у горизонта |
| `kite.jpg` | small cartoon diamond-shaped kite, red and yellow, with a long wavy tail of bows, flying, string going down-left | Иногда в ясный ветреный день |
| `balloon.jpg` | small cartoon hot-air balloon, striped muted red and cream, little basket below, side view | Редкий гость в небе |

### Моргание котика (2026-10-30)

Основа — `docs/hangar/leonardo/cat-sit.webp` (котик сидит анфас). Моргание = 3 кадра: открыты (основа) → полуприкрыты →
закрыты → обратно. Делать **правкой этой же картинки** во FLUX.1 Kontext (Add Image = cat-sit, сила высокая 0.8–0.9),
чтобы поза и контуры не сдвинулись — иначе котик «дёргается» между кадрами. Если Leonardo всё равно меняет позу —
не страшно: веки нарисую кодом поверх основы (полоски цвета шерсти, сжимаются по вертикали).

| Файл | Промпт |
|---|---|
| `cat-sit-blink-half.jpg` | the same kitten, exactly the same pose, same lines, same colours, same size and position; only change the eyes: eyelids half closed, sleepy, the top half of each green eye covered by ginger fur eyelids |
| `cat-sit-blink-closed.jpg` | the same kitten, exactly the same pose, same lines, same colours, same size and position; only change the eyes: eyes fully closed, two soft curved dark-brown lines like happy closed eyes |
| `cat-sit-ear.jpg` | the same kitten, exactly the same pose; only the left ear (on the viewer's right) twitched and turned slightly sideways | Подёргивание уха, редко |

Avoid: `different pose, different angle, moved, resized, new background, text, extra cats`.
Моргать буду кодом раз в 3–6 с (иногда двойное моргание), кадры по 60–80 мс.

## Табличка «Наш ангар» — живая, не просто доска (2026-10-31)

> Сейчас в шапке — одна доска, вырезанная из `sign-planks.webp` (Leonardo нарисовал три доски на фоне ангара):
> `public/hangar/life/sign-plank.webp`. Если просить заново — писать «a single long wooden plank», иначе рисует щит из досок.

**Табличка растягивается кодом под любую длину названия** («по трём кускам»: края с верёвками и гвоздями
не искажаются, тянется середина). Поэтому длинная картинка не нужна — нужна доска с ОДНОРОДНОЙ серединой (без сучков,
трещин и гвоздей посередине, иначе при растяжении они вытянутся). Сейчас стоит `sign-plank-long.jpg` (вторая из
присланных — подходит).

**Промпт для доски под растяжение** (`docs/hangar/leonardo/sign-plank.png`, FLUX.1 Kontext, Image Guidance
`docs/hangar/bg-empty.jpg` сила 0.3, формат 16:9, фон не удалять):

> a single long horizontal wooden plank sign, ONE plank only, seen straight from the front, flat and level, very wide
> and short (about 6:1), filling almost the whole width of the image; all decoration ONLY at the two ends: a short rope
> loop and one rusty round nail head near each end, slightly chipped corners; the whole middle part of the plank is
> plain and even: simple straight horizontal wood grain lines running along the plank, no knots, no cracks, no nails,
> no spots in the middle; warm light-brown weathered wood, cartoon illustration, thick uneven dark-brown outlines,
> muted dusty colours, flat cel shading with soft texture, single object, centered, isolated on pure white background,
> no text, no letters, no shadow on the ground, no frame

Avoid: `multiple planks, several boards, board stack, knots in the middle, cracks in the middle, nails in the middle, text, letters, numbers, perspective, angled view, tilted, background scenery, hangar, window, sky, cropped`

Модель FLUX.1 Kontext, Image Guidance — `docs/hangar/bg-empty.jpg` (сила 0.3, только стиль). Формат 16:9, на белом фоне,
фон не удалять. Буквы НЕ просим — надпись положу кодом (Leonardo пишет криво). Сохранить `docs/hangar/leonardo/sign-hangar.png`.

> a cosy handmade workshop sign for an old aircraft hangar, seen straight from the front, wide and short (about 3.5:1):
> a riveted olive-green metal plate inside a worn wooden frame, an EMPTY smooth cream panel in the middle for text;
> on the left end a small cartoon rocket nose sticking out of the frame, on the right end a little propeller that looks
> like it could spin; a row of tiny warm light bulbs along the top edge like a marquee, two hanging on a loose wire;
> a brass gear and a wrench bolted on as decoration, a red star sticker in one corner, a few coloured wires and cable ties,
> small rust spots and scratches, two chains on top going up out of frame, cartoon illustration, thick uneven dark-brown
> outlines, muted dusty colours, flat cel shading with soft texture, isolated on pure white background, no text, no letters

Avoid: `text, letters, numbers, logo, perspective, angled view, sparks, neon, glow, background scenery, multiple signs, cropped`

Лампочки потом буду зажигать по очереди кодом (как гирлянду), пропеллер — крутить.

## Небо в окне ангара (2026-10-31)

Плиты неба — формат 1:1, только небо (без земли и предметов), на весь кадр. Хвост стиля **без** «isolated on white».
Сохранять `docs/hangar/leonardo/sky-<имя>.png`.

| Файл | Промпт |
|---|---|
| `sky-night.png` | cartoon night sky texture filling the whole image, deep navy blue at the top fading to soft violet and a faint warm glow near the bottom edge, a gentle milky way band going diagonally, many tiny cream stars of different sizes, a few bigger four-pointed sparkling stars, painted brush texture, calm and magical, not gloomy |
| `sky-day.png` | cartoon daytime sky texture filling the whole image, soft gradient from pale mint-blue at the bottom to calm cornflower blue at the top, light painted brush texture, a couple of faint high wispy streaks, no clouds, no sun |
| `sky-sunset.png` | cartoon sunset sky texture filling the whole image, warm peach and orange at the bottom, pink in the middle, dusty violet at the top, soft painted brush texture, no sun disc |

Хвост стиля для плит: `in the same art style as the reference image: cartoon illustration, muted dusty colours, flat cel shading with soft texture, slightly worn comic look, no text, no frame`.
Avoid: `ground, horizon, landscape, mountains, buildings, trees, sun, moon, birds, planes, text, frame, vignette`

## Ещё облака (2026-10-31)

**Облака — БЕЗ чёрной/коричневой обводки** (первая попытка вышла с толстым чёрным контуром — в небе ангара смотрится
наклейкой). Поэтому для облаков свой хвост стиля, без «thick outlines». И фон — **ровный голубой, не белый**: облако
кремово-белое, на белом фоне его не отделить; голубой уберу сам по цвету.

Хвост для облаков (вместо общего):
> in the same art style as the reference image: soft painted cartoon cloud, NO outline, no black or dark contour lines,
> edges defined only by colour and soft shading, muted dusty colours, gentle cel shading, single cloud, centered,
> isolated on a flat solid light sky-blue background (#8EC9E8), no gradient, no text, no frame

Avoid: `outline, black outline, dark contour, line art, stroke, border, sticker, gradient background, white background, sun, birds, multiple clouds`

Сохранять `docs/hangar/leonardo/cloud-<имя>.png`.

| Файл | Промпт (перед хвостом для облаков) |
|---|---|
| `cloud-puffy.png` | single fluffy cartoon cumulus cloud shaped like a big round cauliflower, four soft puffs on top, flat bottom, cream-white top with soft grey-blue shading underneath, side view |
| `cloud-wisp.png` | single long thin cartoon cloud stretched horizontally, wispy and soft, three small puffs in a row, pale cream with light lavender shading underneath, side view |
| `cloud-little.png` | two tiny round cartoon cloud puffs drifting together, one slightly bigger, cream-white with pale blue shading, side view |

## Пульт под ангаром: стрелки и кнопка «к ракете» (2026-11-01)

Сейчас под ангаром на телефоне три кнопки из доски: ← · 🚀 · →. Нужен технологичный «гаражный» пульт вместо деревяшек:
металл, заклёпки, лампочки, но в том же мультяшном стиле, что ангар. Генерировать ТРИ отдельные кнопки (одним
изображением с тремя кнопками ряд не годится — разрежу криво). Модель FLUX.1 Kontext, образец стиля — `docs/hangar/bg-empty.jpg`.
Стрелку рисуем только одну (вправо) — влево отражу кодом. **Иконку на кнопке не просим** (её рисую сверху кодом: шеврон,
ракета) — так кнопки одинаковые по стилю и иконка чёткая.

| файл | промпт (+ общий хвост стиля выше) |
|---|---|
| `panel-arrow.png` | A wide horizontal arrow-shaped control button pointing RIGHT, made of riveted dark-olive steel plate with a worn brushed-metal face, bolted brass rivets along the edge, a thin glowing amber LED strip along the top edge, scratches and oil smudges, chunky sci-fi garage control panel style, front view, empty center area (no icon, no symbol) |
| `panel-square.png` | A square chunky control button for a garage machine panel: riveted dark-olive steel frame with four brass corner bolts, a recessed slightly convex face of worn grey metal, a small amber indicator lamp in the top-left corner, scratches and oil smudges, sci-fi garage control panel style, front view, empty center (no icon, no symbol) |

Avoid (в конце каждого): `text, letters, numbers, icon, symbol, arrow drawn on the face, rocket, watermark, background scenery, multiple objects, perspective view, cropped, blurry, photo, 3D render, glossy plastic`.

Что сделаю после: вырежу фон, положу в `public/hangar/life/panel-*.webp`, нажатие — по стандарту (тень-грань исчезает),
нерабочая стрелка у края — лампочка гаснет.

## Брезент над предметами, к которым не пройдены тренажёры (2026-11-01)

Сейчас брезент нарисован кодом (`Tarp` в components/hangar-scene.tsx) и одинаковый на всех предметах. Нужны 4
картинки разной формы — под каждый предмет возьму ближайшую по пропорциям и растяну. **Замок рисую кодом** (одинаковый
везде), поэтому на брезенте его нет. Брезент — **пустой, без предмета под ним видимого**: только форма ткани.

Как всегда: FLUX.1 Kontext, образец стиля — `public/hangar/03-before.webp` или кусок `docs/hangar/bg-empty.jpg`, общий
хвост стиля и Avoid из начала файла. Формат картинки — как в колонке «Формат».

| Файл | Под что | Формат | Промпт (перед хвостом стиля) |
|---|---|---|---|
| `tarp-square.jpg` | ящик, генератор, компьютер на столе, робот | 1:1 | old heavy olive-green canvas tarpaulin thrown over a bulky square object about as wide as it is tall, the cloth hangs down on all sides in deep soft folds and touches the floor, slightly dusty, a few patches and stitched seams, frayed bottom edge, a rough rope tied around it once with a knot, brass grommets along the hem, three-quarter view from slightly above, the object under it is completely hidden |
| `tarp-wide.jpg` | провода, флаг на полу, шуруповёрт, огнетушитель, бочка | 16:9 | old heavy olive-green canvas tarpaulin thrown over a long low object lying on the floor, wide and flat shape about three times wider than tall, the cloth drapes over it and spreads on the floor around the edges in loose folds, slightly dusty, a couple of patches, frayed edge, a rope across the middle with a knot, three-quarter view from slightly above, the object under it is completely hidden |
| `tarp-tall.jpg` | стремянка, высокие вещи | 2:3 | old heavy olive-green canvas tarpaulin thrown over a tall narrow object standing upright, about twice as tall as wide, the cloth hangs straight down in long vertical folds and pools a little on the floor, slightly dusty, patches and stitched seams, frayed bottom edge, a rope wrapped around it twice, three-quarter view, the object under it is completely hidden |
| `tarp-wall.jpg` | лампа и портрет на стене | 3:4 | old olive-green canvas cloth hanging flat on a wall, pinned at the two top corners with nails, covering a picture frame behind it, the cloth sags slightly in the middle with soft vertical folds, frayed bottom edge, a few patches, seen straight from the front, the thing under it is completely hidden |

В Avoid к этим четырём добавить: `padlock, lock, chain, visible object under the cloth, person, hands, plastic wrap, shiny vinyl, bright green`.
Если выйдет слишком ярко-зелёным — допиши в промпт «muted khaki-olive, faded by the sun».

## Выезжающий лоток ракеты (кнопки 14–20) — в стиле пульта (2026-11-02)
Модель FLUX.1 Kontext, Add Image → `public/hangar/ui/panel2-plate.webp` (тот же металл, винты, обводка).
Кнопки 14…20 рисуем кодом поверх гнёзд, поэтому гнёзда — пустые.

```
Using the attached control panel as the exact style reference, draw a matching slide-out metal tray for the same panel.
Same dark gunmetal grey plate, same thick uneven dark-brown cartoon outline, same worn scratches and rust specks,
same round screws in the corners, same flat cel shading and muted dusty colours.
The tray is a wide horizontal plate (about 4:1), front view, perfectly straight, no perspective.
On it, one row of 7 identical empty rectangular sockets with rounded corners, evenly spaced, dark and recessed,
each with a thin raised rim — no buttons inside, no numbers, no text.
Above the row, a thin empty engraved label strip across the plate (blank, no letters) with one small green indicator lamp at its left end.
Along the bottom edge — two small slide rails / runners, as if the tray slides out from under the panel.
Isolated on pure white background, no shadow.
Avoid: text, letters, numbers, buttons inside sockets, perspective, tilt, extra knobs, gauges, cables, glow, background, shadow.
```
Потом: Remove Background (Full, тень None), прислать картинку — вырежу и подставлю под кнопки 14–20.

### Лоток ракеты, v2 — узкий (2026-11-02)
Первая версия вышла слишком высокой (верхняя часть с длинной табличкой лишняя). Kontext, Add Image → та картинка лотка
(или снова panel2-plate.webp), команда правки:

```
Edit the attached metal tray: make it a much shorter, narrow horizontal strip (about 6:1, wide and low), front view, perfectly straight.
Remove the big upper part and the long top bar completely.
Keep only: the row of 7 identical empty rectangular sockets (same dark recessed sockets with raised rims, evenly spaced, centred vertically),
and directly above the row a slim band (about one quarter of the height) containing a small green indicator lamp on the left
and, right next to it, a short blank engraved label plate (empty, no letters) for a title.
Same dark gunmetal grey metal, same thick uneven dark-brown cartoon outline, rounded corners, a few round screws at the ends,
light scratches and rust specks, flat cel shading, muted dusty colours. Keep the two small slide rails under the bottom edge.
Isolated on pure white background, no shadow.
Avoid: text, letters, numbers, buttons inside sockets, tall plate, top bar, perspective, tilt, extra knobs, gauges, cables, glow, shadow.
```
Название «ВТОРАЯ ЧАСТЬ ЕГЭ» на табличку и кнопки 14–20 в гнёзда кладём кодом.

## Новая еда котика (2026-11-06, картинок ещё нет)
Как остальные предметы: FLUX.1 Kontext + образец стиля ангара, хвост стиля — из начала файла.

| Файл | Промпт | Зачем |
|---|---|---|
| `cat-sourcream.jpg` | small glass jar of white sour cream with a blue foil lid, no letters, standing | Банка рядом с миской |
| `cat-fish.jpg` | one small silver fish lying on its side, slightly bent, cute | Лежит в миске, откусывается как колбаска |
