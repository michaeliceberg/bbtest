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
4. Готовую картинку — **Remove Background** (Full, тень None). Сохрани в `docs/hangar/leonardo/` с именем из таблицы и
   пришли — я вырежу, уменьшу и подключу.

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
