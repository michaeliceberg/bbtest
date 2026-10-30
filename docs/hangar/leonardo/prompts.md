# Промпты Leonardo: вентилятор и кот в ангаре

Везде: **Create → FLUX.1 Kontext → Add Image** (образец), квадрат 1:1, потом **Remove Background** (Full, тень None).
Готовые файлы — в `~/Downloads/30oct/` (или пришлите в чат), имена — как в заголовках.

Хвост — дописывать в конец КАЖДОГО промпта:

```
Painted in exactly the same style as the input: muted dusty colors, soft painterly shading, thick rough dark brown outlines, simple cartoon shapes. Alone on a plain white background.
```

## Вентилятор (образец — `ref-ceiling.png`)

**fan-motor.png** — моторчик на штанге, не крутится:
```
Show only the motor of an old industrial ceiling fan: a short metal rod hanging straight down and a round metal motor housing at its bottom, seen slightly from below, without any blades.
```

**fan-blades.png** — лопасти. Образец — **моторчик** `ref-fan-motor.png` (тот же металл и обводка). Рисуем строго снизу, плоско — наклон в перспективу и вращение делает код:
```
Using the same grey metal, the same paint and the same thick dark brown outline as this fan motor, draw only the blades of a huge old industrial ceiling fan: four very long wide metal paddle blades attached to a small round central hub, seen exactly from directly below, perfectly flat orthographic top-down view like a blueprint, all four blades identical in shape and color, exactly 90 degrees apart, perfectly symmetric, centered, blades reaching almost to the edges of the square image, a few rivets at the root of each blade. No motor, no rod, no perspective, no shadow, no background details.
```

**fan-blades-broken.png** — образец: белая версия `fan-blades.png`:
```
Make these same fan blades broken: one blade bent and shorter, one blade missing, rust spots, dust and a cobweb between two blades. Same bottom view, same position and size.
```

## Кот (образец — `ref-floor.png`)

Сначала сделайте **cat-sit.png**. Остальные позы — с образцом `cat-sit.png` (белая версия), начиная промпт с «Make this same cat…» — так кот везде будет одинаковым.

**cat-sit.png**
```
On this same floor, add one cute chubby ginger cat sitting and looking at the viewer, wearing a tiny black beret with a red star, whole cat visible, low camera almost at floor level.
```

**cat-sleep.png**
```
Make this same cat in the same beret curled up asleep in a ball, eyes closed, peaceful. Same size and colors.
```

**cat-happy.png**
```
Make this same cat in the same beret sitting happily, tail up, eyes half closed, purring, small hearts above its head. Same size and colors.
```

**cat-hungry.png**
```
Make this same cat in the same beret sitting sadly with droopy ears, looking hungry and asking for food. Same size and colors.
```

**cat-eat.png**
```
Make this same cat in the same beret crouching and eating from a small metal bowl on the floor, seen from the side. Same size and colors.
```

**cat-jump.png**
```
Make this same cat in the same beret jumping happily high in the air, paws spread, very joyful. Same size and colors.
```

**cat-hunt.png** — ловит мышей:
```
Make this same cat in the same beret crouching low, ready to pounce, tail twitching, focused hunter eyes. Same size and colors.
```

## Миска, мышь, норка

**bowl-empty.png** (образец `ref-floor.png`)
```
On this same floor, add one small empty dented metal cat bowl.
```

**bowl-milk.png** (образец — белая версия `bowl-empty.png`)
```
Make this same bowl full of white milk. Same size, same angle.
```

**mouse.png** (образец `ref-floor.png`)
```
On this same floor, add one small cute grey mouse running sideways to the right, carrying a gold coin in its mouth.
```

**mouse-hole.png** (образец `ref-wall.png`)
```
At the bottom of this same wall, add one small arched dark mouse hole in the wall with a few gold coins piled inside. Show only the hole and a little of the wall around it.
```

## Домики кота (образец `ref-floor.png`, все с одной камеры)

Хвост дописать ещё: `Low camera almost at floor level, three-quarter view, same size for every house.`

| Файл | Промпт |
|---|---|
| cat-house-1.png | `On this same floor, add a flattened old cardboard sheet lying on the floor, used as a cat bed.` |
| cat-house-2.png | `On this same floor, add a cardboard box lying on its side with a round entrance hole cut in it.` |
| cat-house-3.png | `On this same floor, add a woven wicker cat basket with a soft red cushion.` |
| cat-house-4.png | `On this same floor, add a small wooden cat house with a pointed roof and a round door.` |
| cat-house-5.png | `On this same floor, add a tall cat tree tower with platforms, a scratching post and a little hammock.` |
| cat-house-6.png | `On this same floor, add a small toy rocket shaped cat house, white with a red star and red fins, with a round door at the bottom.` |

## Угощения (образец `ref-floor.png`)

| Файл | Промпт |
|---|---|
| treat-cream.png | `On this same floor, add one small bowl of thick cream.` |
| treat-fish.png | `On this same floor, add one small fresh fish.` |
| treat-sausage.png | `On this same floor, add one sausage.` |
| treat-shrimp.png | `On this same floor, add one cooked pink shrimp.` |
| treat-cake.png | `On this same floor, add one small cat cake decorated with a fish and one candle.` |

## Если не получается
- Кот выходит разным → всегда берите образцом `cat-sit.png`, а не пол.
- Лопасти не строго снизу → допишите `orthographic top-down view, like a blueprint`.
- Фон не белый → сначала Remove Background, белый фон не важен.

## Белый вентилятор «как лопасти вертолёта» (2026-10-30)

Образец перспективы — `ref-fan-perspective.png` (ангар со старым тёмным вентилятором в правильном наклоне:
ближняя лопасть выше, дальняя ниже, смотрим снизу). Делаем в 3 шага.

**Шаг 1 — fan-white-scene.png** (посмотреть, как будет выглядеть; образец `ref-fan-perspective.png`, хвост НЕ нужен):
```
Replace the dark ceiling fan in this hangar with a big beautiful white ceiling fan that looks like helicopter rotor blades: four very long, wide, slightly tapered white blades with rounded tips, a thin red stripe near each tip, a few rivets at the roots, a small white-and-grey round motor housing on a short rod hanging from the ceiling beam. Keep exactly the same position, size, perspective and tilt as the old fan: seen from below, the blade closest to us is higher in the picture, the far blade lower. Keep everything else in the image exactly the same. Same painted style as the hangar: muted dusty colors, soft painterly shading, thick rough dark brown outlines, simple cartoon shapes. The white is slightly dusty and warm, not glowing.
```

**Шаг 2 — fan-blades.png** (образец — `fan-white-scene.png` из шага 1; лопасти рисуем плоско снизу, наклон и вращение делает код):
```
Using exactly the same white blades as the ceiling fan in this picture (same color, red tip stripes, rivets, outlines), draw only the blades: four very long wide helicopter-style blades on a small round central hub, seen exactly from directly below, perfectly flat orthographic top-down view like a blueprint, all four blades identical, exactly 90 degrees apart, perfectly symmetric, centered, blade tips almost touching the edges of the square image. No motor, no rod, no perspective, no shadow, no background details.
```

**Шаг 3 — fan-motor.png** (образец — `fan-white-scene.png`):
```
Show only the motor of this same white ceiling fan: the short rod and the round motor housing, seen slightly from below, without any blades. Same colors and outlines.
```

После шагов 2 и 3 — Remove Background (Full, тень None) и прислать оба файла в чат.

**Шаг 1б — правка fan-white-scene.png** (первый результат висел слишком низко, был крупный и ярко-белый; образец — сам этот результат):
```
Move this ceiling fan up so it hangs right under the ceiling: a very short rod, the motor housing almost touching the top ceiling beam, the blades just below the ceiling beams in the top part of the picture, not hanging in the middle of the hangar. Make the whole fan about 25% smaller. Make the blades not bright white but a muted dusty grey-blue, close to the dark ceiling color, only slightly lighter than the ceiling so they still read; keep the thin red stripes near the tips, but dull and faded. Keep the same shape of blades, the same tilt and perspective (seen from below, the near blade higher, the far blade lower), and keep everything else in the image exactly the same. Same painted style: muted dusty colors, soft painterly shading, thick rough dark brown outlines.
```
Добавки при необходимости: «The fan is mounted flush to the ceiling, almost no rod at all.» / «The blades are almost the same color as the ceiling.»

Kontext не двигает предмет внутри картинки (шаг 1б перерисовал на том же уровне). Положение, длину штанги и размер
задаёт код (`FAN` в components/hangar-fan.tsx), поэтому из сцены берём только цвет и форму → сразу шаги 2 и 3.
Для шага 3 вместо «short metal rod» — «mounted flush to the ceiling: a very short stubby rod, almost none».

## Портрет Фейнмана на левой стене (2026-10-30)

Холст в рамке просим **ярко-зелёный** (как хромакей): портрет вставляю в него сам, по углам зелёного пятна, с перспективой —
так лицо не исказится и в «до», и в «после» будет один и тот же.

**Шаг 1 — feynman-painted.png** (образец — фото `feynman-photo-src.webp`, без хвоста):
```
Repaint this photo as a painted cartoon portrait in a cozy lo-fi game style: same man, same smile, same pose, same tweed jacket and dark tie, same chalkboard with formulas behind him, but painted with muted dusty warm colors, soft painterly shading, thick rough dark brown outlines, simple shapes. Keep the face recognizable. Square, no frame, no text.
```

**Шаг 2 — feynman-after.png** (образец — `ref-left-wall.png`, левая стена ангара):
```
On this left wall of the hangar, hang one neat rectangular wooden picture frame (portrait orientation) on the big wall panel in the middle, drawn in correct perspective along the wall: the frame recedes toward the round gate, its near (left) edge taller than its far (right) edge. The canvas inside the frame is filled with a perfectly flat, uniform bright green color #00FF00, nothing painted on it, no texture. Above the frame, a small brass picture lamp on a short arm, switched on, casting a soft warm cone of light down onto the frame. Clean and tidy, frame hanging perfectly straight. Keep the wall, windows and everything else exactly the same.
```

**Шаг 3 — feynman-before.png** (образец — `feynman-after.png` из шага 2):
```
Make this same scene neglected and broken: the picture frame hangs crooked, tilted about 12 degrees, one corner lower, the wood dusty and a little chipped; the small picture lamp is switched off, broken and hanging down from its wire; thick dusty cobwebs in the corners of the frame and around the lamp, but NOT over the green canvas. The canvas stays perfectly flat uniform bright green #00FF00. Keep the wall, windows, frame size and perspective the same.
```
Шаги 2 и 3 — без Remove Background (нужна стена целиком: вырежу сам). Пришлите все три картинки.
