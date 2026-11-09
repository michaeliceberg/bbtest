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
| `mouse-run-1.png`, `-2.png`, `-3.png` | small cute cartoon grey mouse running on the floor, side view, facing right, big round pink ears, long thin pink tail, tiny black eyes, sneaky mischievous grin | Кадр 2 — добавить «front legs stretched forward, back legs pushed back», кадр 3 — «all four legs tucked under the body». Один размер и ракурс у всех трёх |
| `mouse-carry.png` | small cute cartoon grey mouse running, side view, facing right, both front paws raised up above its head as if carrying something heavy on its head, empty paws, proud cheeky face, long pink tail | Добычу (монету, гем, пиццу) положу над головой кодом — так одна картинка на всё |
| `mouse-peek.png` | small cartoon grey mouse peeking out, only the head and front paws visible, big pink ears, looking around suspiciously, seen from the front | Выглядывает из норки перед набегом |
| `mouse-hole.png` | small arched mouse hole at the bottom of an old wooden wall plank, dark inside, a few splinters and gnawed edges around it, a tiny crumb next to it, seen from the front | Норка в плинтусе левой стены. Если в Kontext выйдет кусок стены целиком — пришли, вырежу арку |
| `loot-chest-closed.png` | old wooden treasure chest with iron bands and a big padlock, slightly worn, small gold coins and a pink gem peeking out from under the lid, seen from the front at a slight angle from above | Сундук с богатством ученика |
| `loot-chest-open.png` | the same old wooden treasure chest with the lid open, full of gold coins, pink gems and a few pizza slices on top, warm glow from inside, seen from the front at a slight angle from above | Тот же ракурс, что у закрытого: Image Guidance закрытым сундуком, сила 0.5 |
| `loot-chest-robbed.png` | the same old wooden treasure chest with the lid open and broken padlock hanging, only a few coins left inside, tiny mouse footprints on the lid, seen from the front at a slight angle from above | После набега |
| `cat-pounce.png` | the same orange cartoon cat from the reference mid-jump pouncing forward, side view, facing right, front paws stretched out, ears back, playful hunting face | Образец — `public/hangar/life/cat-jump.webp` (Image Guidance 0.5), чтобы котик был тот же |
| `cat-caught-mouse.png` | the same orange cartoon cat sitting proudly, side view, facing right, gently holding a small grey mouse by the tail in its paw, the mouse hangs upside down looking embarrassed but unharmed | Котик поймал. Образец — `public/hangar/life/cat-sit.webp` |
| `mouse-scared.png` | small cartoon grey mouse running away in panic, side view, facing left, ears flat, sweat drops flying, empty paws, tail straight back | Отпущенная мышка улепётывает в норку без добычи |

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
