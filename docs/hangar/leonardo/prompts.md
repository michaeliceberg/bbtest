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
