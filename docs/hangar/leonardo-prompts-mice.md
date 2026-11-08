# Промпты Leonardo: мыши, норка и сундук с богатством (2026-11-09)

Задумка: котика давно не кормили — из норки выбегают мыши, бегут к сундуку с богатством, вытаскивают монету /
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
