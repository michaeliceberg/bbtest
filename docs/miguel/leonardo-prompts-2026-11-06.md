# Новые картинки — промпты Leonardo (2026-11-06)

В Leonardo вставлять **только английский текст** из таблиц — русские пометки он рисует надписями.
Готовые картинки присылайте в чат (или кладите в `docs/miguel/leonardo/`) — вырежу фон и подключу.

---

## 1. Новые стикеры Команданте Мигеля

Как всегда: Leonardo → Image Guidance → исходник `docs/miguel/miguel-base-leonardo.jpg`, сила **0.5**, 1:1, 4 варианта.
В начале — **основа промпта** (из `docs/miguel/miguel.md`, «Шаг 1»), потом поза из таблицы. Негатив — обычный, тоже из «Шаг 1».
Вырезка: `python3 docs/miguel/tools/make_sticker_v2.py вход.jpg public/miguel/miguel-<имя>.webp`. Remove Background в Leonardo
не нужен — присылайте картинку на пурпурном фоне, вырежу сам.

Основа (для удобства, копировать целиком перед позой):

> Charismatic cartoon goose commander mascot character, same character as the reference image: long S-curved white neck, long orange goose beak, thick black angry eyebrows, tough squinting eyes, black military cap with a red star, plain red bandana scarf, olive green field jacket with rolled sleeves and a red star patch on the shoulder, orange webbed feet, a short yellow pencil with a pink eraser held in the back corner of the beak, thick clean black outline, flat cel shading, cartoon character illustration, full body, isolated on a flat solid pure magenta background #FF00FF, no white border, no outline around the whole image, no text, kid-friendly

Негатив:

> sticker, die-cut, white border, white outline around the character, white frame, border, frame, badge, smoke, steam, cigarette, cigar, ash, duck, eyelashes, blush, makeup, girly, text on bandana, letters, writing, realistic, photo, 3d render, gore, blood, real weapon, extra limbs, multiple characters, watermark, logo, cropped

**Почему так (2026-11-06):** слово «sticker» Leonardo понимает как вырезанную наклейку и сам рисует белую рамку вокруг.
Поэтому «sticker» убрано из основы и добавлено в негатив, а фон — пурпурный: на белом фоне белая рамка сливается
с фоном и её не видно в негативе, а на пурпурном Leonardo реже её рисует, и вырезать фон проще.

### «Мой путь» (общая картина: где ты, куда идёшь, какой вуз)

| Файл | Где | Поза |
|---|---|---|
| `miguel-path` | шапка «Моего пути» | standing on a winding mountain trail next to a wooden signpost with three blank arrow signs, holding an unfolded paper map in one wing and pointing up the road with the other, a small flag with a red star planted on the distant peak, determined confident look |
| `miguel-summit` | цель достигнута / балл вырос | standing on top of a small mountain peak, planting a flag with a red star, wings raised in victory, small clouds below, proud grin |
| `miguel-university` | выбор вуза | standing in front of a small classical university building with columns and steps (no readable text), saluting toward it, hopeful proud look |
| `miguel-compass` | «следующий ход» | holding a big brass compass in both wings, studying it with one eyebrow raised, the compass needle glowing |

### Диагностика («Узнай свой балл за 15 минут»)

| Файл | Где | Поза |
|---|---|---|
| `miguel-checkup` | вступление | army field doctor pose: a stethoscope around the neck over the jacket, holding a clipboard with a blank checklist, friendly confident wink, ready to examine |
| `miguel-stopwatch-go` | отсчёт 3-2-1 | holding a big silver stopwatch high in one wing, other wing pointing forward like a starting signal, energetic shout, motion lines |
| `miguel-scan` | итог / «строим план» | looking through a pair of binoculars at a glowing holographic bar chart floating in the air, impressed face |
| `miguel-thumbs` | «Верно!» в диагностике | giving a big confident thumbs-up with one wing (feathers shaped like a thumb), wide proud grin, small sparkle |

### Рэмбо (режим «смесь тренажёра и задачника, по кругу»)

Не просим конкретного киногероя и не пишем имя — свой «боец-коммандос» по мотивам: красная повязка на лбу вместо
фуражки, полосы маскировочной краски на щеках, на груди — лента с карандашами вместо патронов. Оружия нет.
Для этих поз из основы **убрать** «black military cap with a red star» и вписать то, что в таблице.

| Файл | Где | Поза |
|---|---|---|
| `miguel-commando` | шапка экрана Рэмбо | wearing a long red headband tied on the forehead instead of the cap, two stripes of green camouflage face paint on the cheeks, a bandolier of yellow pencils across the chest instead of bullets, fierce focused squint, crouching ready pose, wings clenched like fists |
| `miguel-commando-win` | клетка пройдена | wearing a long red headband tied on the forehead, camouflage face paint stripes, bandolier of pencils across the chest, roaring in triumph with both wings raised, headband tails flying, small explosion of confetti behind |
| `miguel-commando-again` | клетка не пройдена, «ещё раз» | wearing a long red headband tied on the forehead, camouflage face paint stripes, bandolier of pencils, wiping sweat from the forehead with a wing, tired but determined smirk, rolling up a sleeve to go again |

---

## 2. Столы сета по уровню колокольчика

Сейчас у всех уровней один зелёный армейский стол (`public/set-tablecloth/cloth-green.webp`). Идея: чем выше колокольчик
(1-й сет за день → 4-й), тем наряднее стол. Делать **правкой текущего стола**, чтобы вид сверху, размер и пустой центр
совпали: FLUX.1 Kontext → Add Image `docs/set-table/leonardo/table-green.png` → команда из таблицы. Соотношение то же,
что у исходника (16:9). Remove Background в Leonardo НЕ делать — фон вырежу сам (пурпурный фон для этого).

Общее начало команды (копировать перед каждой):

> Edit this image: keep the exact same strict top-down view from directly above, the same table size and shape, the same cartoon style and thick dark-brown outlines, and keep the center of the table completely empty and flat (three dishes will be placed there later).

Общий конец:

> Flat solid pure magenta background #FF00FF around the table, nothing else around it, no white border. Avoid: sticker, die-cut, white border, frame, perspective, side view, room, walls, floor, sky, people, hands, text, letters, numbers, logos, food in the center, cluttered center.

| Файл | Колокольчик | Что поменять (вставить между началом и концом) |
|---|---|---|
| `cloth-lvl1` | 1-й сет (серебряный) | оставить как есть — текущий зелёный армейский стол |
| `cloth-lvl2` | 2-й сет (синий, редкий) | Replace the olive tablecloth with a deep navy-blue tablecloth with a thin silver embroidered border and small silver stars scattered near the edges. Replace the tin cans with a small silver candle holder with two lit candles. Add a few small blue ribbons hanging from the table edges. |
| `cloth-lvl3` | 3-й сет (фиолетовый, мифический) | Replace the tablecloth with a rich purple velvet tablecloth with a golden fringe and golden tassels at the corners. Put a golden three-arm candelabra with lit candles in the top-left corner, a small bowl of glowing purple grapes in the top-right corner, and tiny magical sparkles floating along the edges. |
| `cloth-lvl4` | 4-й сет и дальше (огненный золотой) | Turn it into a royal victory feast table: a shiny golden-yellow silk tablecloth with a red border and red star pattern, a small golden trophy cup in the top-left corner, a crown lying in the top-right corner, colorful confetti and streamers scattered along the edges, warm golden glow around the table edges. |

Подключение: положить в `public/set-tablecloth/cloth-lvl1..4.webp` (ширина ~900px). В `components/set-bar.tsx`
`SET_TABLECLOTH` станет выбором по уровню колокольчика (как уже выбираются `SET_BELLS`); рамку блюд подгоню под пустой центр.

---

## 3. Предметы ангара на экране раздела

Отдельные картинки не нужны: предмет теперь стоит на светлом круге цвета пола ангара (`ItemBadge` в
`components/learn-section-header.tsx`) — тёмные провода и бочка читаются на тёмном сайте.
