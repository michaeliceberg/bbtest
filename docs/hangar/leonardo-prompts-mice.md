# Промпты Leonardo: мыши, норка и сундук с богатством (2026-11-09)

Задумка: котик сыт — мыши выглядывают, котик прыгает и ловит мышку (держит за хвост, мышка смущена и убегает в норку без
добычи, никто не страдает). Котика давно не кормили — из норки выбегают мыши, бегут к сундуку с богатством, вытаскивают монету /
гем / кусочек пиццы и уносят в норку, добыча у них над головой. Бег, перенос добычи и открытие сундука — кодом,
от картинок нужны только кадры.

Как генерировать: Create → FLUX.1 Kontext → Add Image с кусочком ангара (`docs/hangar/bg-empty.jpg`) как образцом
стиля, сила средняя. В конце каждого промпта — хвост стиля и Avoid ниже. Фон пурпурный, Remove Background не нужен:
вырежу сам (`docs/hangar/tools/cut_food.py`). Файлы класть в `docs/hangar/leonardo/` с именами из таблицы.

Хвост стиля:
> in the same art style as the reference image: cartoon illustration, thick uneven dark-brown outlines, muted dusty
> colours, flat cel shading with soft texture, slightly worn comic look, single object, full view, centered,
> isolated on a flat solid pure magenta background #FF00FF, no text, no letters, no shadow on the ground, no frame

Avoid: `text, letters, watermark, signature, background scenery, multiple objects, cropped, blurry, photo, 3D render, magenta on the object`

| Файл | Промпт (перед хвостом стиля) | Заметки |
|---|---|---|
| `mouse-run-1.png` | small cute cartoon grey mouse running on the floor, side view, facing right, big round pink ears, long thin pink tail, tiny black eyes, sneaky mischievous grin | Готово. Это ОБРАЗЕЦ мыши для всех остальных мышиных картинок (раздел ниже). Кадры 2 и 3 — тоже ниже |
| `mouse-hole.png` | small arched mouse hole at the bottom of an old wooden wall plank, dark inside, a few splinters and gnawed edges around it, a tiny crumb next to it, seen from the front | Норка в плинтусе левой стены. Если в Kontext выйдет кусок стены целиком — пришли, вырежу арку |
| `loot-chest-closed.png` | old wooden treasure chest with iron bands and a big padlock, slightly worn, small gold coins and a pink gem peeking out from under the lid, seen from the front at a slight angle from above | Сундук с богатством ученика |
| `loot-chest-open.png` | the same old wooden treasure chest with the lid open, full of gold coins, pink gems and a few pizza slices on top, warm glow from inside, seen from the front at a slight angle from above | Тот же ракурс, что у закрытого: Image Guidance закрытым сундуком, сила 0.5 |
| `loot-chest-robbed.png` | the same old wooden treasure chest with the lid open and broken padlock hanging, only a few coins left inside, tiny mouse footprints on the lid, seen from the front at a slight angle from above | После набега |
| `cat-pounce.png` | the same orange cartoon cat from the reference mid-jump pouncing forward, side view, facing right, front paws stretched out, ears back, playful hunting face | Образец — `public/hangar/life/cat-jump.webp` (Image Guidance 0.5), чтобы котик был тот же |

## Кадры бега мыши: правка готовой мыши (2026-11-09)

Делать НЕ с нуля, а из готового кадра 1 (`mouse-run-1.png`): Create → FLUX.1 Kontext → Add Image = кадр 1, промпт —
команда правки «поменяй только лапы». Иначе Kontext рисует другую мышь или возвращает ту же позу. Если поза почти не
поменялась — сила образца 0.3–0.4. Цикл: кадр 1 (лапы врозь) → 2 (в прыжке) → 3 (собрались), по 120–150 мс.

Кадр 2 — в прыжке (`mouse-run-2.png`, готов):
> The pose must be clearly different from the reference. Change only the legs and tail of this mouse, keep everything else exactly the same (same mouse, same head, same face, same ears, same size, same facing right, same colours and outlines): the mouse is flying through the air in a big jump, all four legs fully off the ground and folded tightly against the belly, paws not visible below the body, body long and stretched like a torpedo, tail raised high in an S-curve
>
> keep the same art style: cartoon illustration, thick uneven dark-brown outlines, muted dusty colours, flat cel shading with soft texture, slightly worn comic look, single object, full view, centered, flat solid pure magenta background #FF00FF, no text, no shadow on the ground, no frame
>
> Avoid: same pose as reference, legs stretched forward or backward, legs touching the ground, different mouse, changed face, changed ears, facing left, extra legs, background scenery, text, letters, shadow, blurry, 3D render, magenta on the object

Кадр 3 — лапы собраны (`mouse-run-3.png`):
> The pose must be clearly different from the reference. Change only the legs and tail of this mouse, keep everything else exactly the same (same mouse, same head, same face, same ears, same size, same facing right, same colours and outlines): the mouse is landing and gathering for the next jump, body bunched up short and round like a ball, back arched upward, front paws pulled back under the chest and touching the ground, back paws brought far forward under the belly so all four paws are close together in the middle, tail low and wavy behind, close to the ground
>
> keep the same art style: cartoon illustration, thick uneven dark-brown outlines, muted dusty colours, flat cel shading with soft texture, slightly worn comic look, single object, full view, centered, flat solid pure magenta background #FF00FF, no text, no shadow on the ground, no frame
>
> Avoid: same pose as reference, legs stretched forward or backward, long stretched body, tail raised high, different mouse, changed face, changed ears, facing left, extra legs, background scenery, text, letters, shadow, blurry, 3D render, magenta on the object


## Остальные мышиные картинки — по образцу первой мыши (2026-11-09)

Все делать правкой готовой мыши, а не с нуля, иначе каждая картинка — новая мышь. Create → FLUX.1 Kontext → Add Image =
`docs/hangar/leonardo/mouse-run-1.jpg` (кадр 1), сила 0.5; если поза почти не меняется — 0.3–0.4. Промпт вставлять целиком.

Общий конец для всех четырёх (уже вставлен в каждый промпт ниже):
> keep the same art style: cartoon illustration, thick uneven dark-brown outlines, muted dusty colours, flat cel shading with soft texture, slightly worn comic look, single object, full view, centered, flat solid pure magenta background #FF00FF, no text, no shadow on the ground, no frame

`mouse-carry.png` — несёт добычу над головой (добычу кладу кодом, лапы пустые):
> The pose must be clearly different from the reference. Keep exactly the same mouse (same head, same face, same ears, same grey fur, same pink tail, same size, same colours and outlines), still side view facing right, but change the pose: the mouse is running on its back legs, both front paws raised straight up above its head with open empty palms, as if carrying something heavy on top of its head, chest pushed out, proud cheeky grin, tail curled behind
>
> keep the same art style: cartoon illustration, thick uneven dark-brown outlines, muted dusty colours, flat cel shading with soft texture, slightly worn comic look, single object, full view, centered, flat solid pure magenta background #FF00FF, no text, no shadow on the ground, no frame
>
> Avoid: same pose as reference, object in paws, coin, food, different mouse, changed face, changed ears, facing left, extra legs, extra arms, background scenery, text, letters, shadow, blurry, 3D render, magenta on the object

`mouse-peek.png` — выглядывает из норки (вид спереди, только голова и лапки):
> Keep exactly the same mouse (same face, same big pink ears, same grey fur, same eyes and nose, same colours and outlines), but now seen from the front: only the head and the two tiny front paws are visible, as if peeking out of a hole, the paws resting on the bottom edge, the lower body cut off by a straight horizontal line, eyes looking sideways suspiciously, sneaky little grin
>
> keep the same art style: cartoon illustration, thick uneven dark-brown outlines, muted dusty colours, flat cel shading with soft texture, slightly worn comic look, single object, full view, centered, flat solid pure magenta background #FF00FF, no text, no shadow on the ground, no frame
>
> Avoid: full body, tail visible, side view, hole drawn, wall, different mouse, changed ears, extra paws, background scenery, text, letters, shadow, blurry, 3D render, magenta on the object

`mouse-scared.png` — улепётывает в панике (смотрит влево, к норке):
> The pose must be clearly different from the reference. Keep exactly the same mouse (same head shape, same grey fur, same pink ears, same pink tail, same size, same colours and outlines), but now it is running away in panic facing LEFT: side view, legs a blur of fast running, ears pressed flat back, eyes wide open with fear, mouth open in a small scream, three little sweat drops flying off its head, tail stretched straight back, empty paws
>
> keep the same art style: cartoon illustration, thick uneven dark-brown outlines, muted dusty colours, flat cel shading with soft texture, slightly worn comic look, single object, full view, centered, flat solid pure magenta background #FF00FF, no text, no shadow on the ground, no frame
>
> Avoid: facing right, smiling, calm face, different mouse, extra legs, blood, injury, background scenery, text, letters, shadow, blurry, 3D render, magenta on the object

`cat-caught-mouse.png` — котик держит мышку за хвост. Тут две картинки сразу: Add Image = `public/hangar/life/cat-sit.webp`
(котик) и вторым образцом `docs/hangar/leonardo/mouse-run-1.jpg` (мышь), сила 0.5 у обеих:
> The same orange cartoon cat from the first reference sitting proudly, side view, facing right, gently holding by the tail in its raised front paw the same small grey mouse from the second reference, the mouse hangs upside down looking embarrassed and blushing but unharmed, the cat looks pleased with itself, keep the cat and the mouse exactly as in their references (same faces, same colours, same outlines)
>
> keep the same art style: cartoon illustration, thick uneven dark-brown outlines, muted dusty colours, flat cel shading with soft texture, slightly worn comic look, full view, centered, flat solid pure magenta background #FF00FF, no text, no shadow on the ground, no frame
>
> Avoid: different cat, different mouse, mouse in mouth, biting, blood, injury, scared crying mouse, extra animals, background scenery, text, letters, shadow, blurry, 3D render, magenta on the objects

Норка, сундуки и `cat-pounce` — по таблице выше, без мыши-образца.

## Сундук и норка — правкой готовых картинок (2026-11-09)

Закрытый сундук готов: `docs/hangar/leonardo/loot-chest-closed.jpg` (монеты и гем в щели). Варианты с пиццей, торчащей
из-под крышки, не подошли: выглядят как ящик с пиццей. Открытый и ограбленный сундук делать ИЗ закрытого, тогда ракурс и
размер совпадут: Kontext → Add Image = `loot-chest-closed.jpg`, сила 0.5.

`loot-chest-open.png`:
> The lid must be clearly open. Keep exactly the same treasure chest (same wood, same iron bands, same rivets, same size, same position, same angle, same colours and outlines), but now the lid is swung wide open and tilted back, the padlock hangs open on the hasp, the chest is filled to the top with a pile of shiny gold coins, a few pink gems and two pizza slices lying on top of the coins, soft warm golden glow rising from inside
>
> keep the same art style: cartoon illustration, thick uneven dark-brown outlines, muted dusty colours, flat cel shading with soft texture, slightly worn comic look, single object, full view, centered, flat solid pure magenta background #FF00FF, no text, no shadow on the ground, no frame
>
> Avoid: closed lid, different chest, different angle, coins on the floor, pizza dripping over the edge, background scenery, text, letters, shadow, blurry, 3D render, magenta on the object

`loot-chest-robbed.png` (Add Image = готовый открытый сундук):
> Keep exactly the same open treasure chest (same wood, same iron bands, same lid position, same size, same angle, same colours and outlines), but it has been robbed: almost empty inside, only three or four gold coins left at the bottom, no gems, no pizza, the padlock is broken and hangs crooked, tiny mouse footprints on the lid and on the front, no glow
>
> keep the same art style: cartoon illustration, thick uneven dark-brown outlines, muted dusty colours, flat cel shading with soft texture, slightly worn comic look, single object, full view, centered, flat solid pure magenta background #FF00FF, no text, no shadow on the ground, no frame
>
> Avoid: full of coins, pizza, gems, closed lid, different chest, mice, background scenery, text, letters, shadow, blurry, 3D render, magenta on the object

`mouse-hole.png` — НЕ отдельной картинкой на пурпурном фоне (вид спереди не встаёт в наклонную стену ангара), а прямо в
кусок ангара. Add Image = `docs/hangar/leonardo/ref-left-wall-base.png` (низ левой стены из `bg-empty.jpg`, x 0–400,
y 400–800), сила 0.7–0.8. Я потом вырежу из результата квадратик с норкой и положу его на то же место ангара — перспектива
совпадёт сама. Фон НЕ менять на пурпурный.
> Keep this image exactly the same, change nothing else: add one small arched mouse hole gnawed into the bottom wooden beam of the left wall, right where the wall meets the floor, between the second and third vertical wooden post from the left, the hole follows the perspective of the wall (seen at the same angle as the wall, slightly squashed), dark inside, gnawed jagged edges, a few wood splinters and a tiny cheese crumb on the floor in front of it
>
> same art style as the image: cartoon illustration, thick uneven dark-brown outlines, muted dusty colours, flat cel shading, slightly worn comic look
>
> Avoid: changing the wall, changing the floor, changing colours, moving the posts, extra holes, mouse, text, letters, magenta, blurry, 3D render
