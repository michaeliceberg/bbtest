# Промпты Leonardo: прибор скорости подготовки

Цифры, стрелку и подпись кладём кодом, поэтому на картинке их быть не должно. Модель **FLUX.1 Kontext**, Add Image —
кусочек ангара как образец (`docs/hangar/bg-empty.jpg`), сила средняя. Фон пурпурный: так вырезается и светлый металл.
Remove Background в Leonardo не нужен. Присылай как есть, в `docs/hangar/leonardo/` с именем из заголовка.

## meter-round.jpg — круглый спидометр

```
A single round vintage aircraft cockpit gauge in the same art style as the reference image: cartoon illustration, thick uneven dark-brown outlines, muted dusty colours, flat cel shading with soft texture, slightly worn comic look. Heavy riveted brass bezel with scratches, dark empty dial face, a wide arc scale on the dial divided into three coloured zones from left to right: long muted red zone, short mustard yellow zone, short muted green zone. Small rectangular empty dark window at the bottom of the dial. No needle, no numbers. Front view, full view, centered, isolated on a flat solid pure magenta background #FF00FF, no shadow on the ground, no frame. Avoid: text, letters, digits, needle, watermark, signature, background scenery, multiple objects, cropped, blurry, photo, 3D render
```

## meter-needle.jpg — стрелка к нему

```
A single vintage gauge needle in the same art style as the reference image: cartoon illustration, thick uneven dark-brown outlines, muted dusty colours, flat cel shading. Long thin orange-red pointer with a round brass hub at the bottom end, pointing straight up, perfectly vertical. Front view, full view, centered, isolated on a flat solid pure magenta background #FF00FF, no shadow, no frame. Avoid: text, letters, digits, dial, watermark, multiple objects, cropped, blurry, photo, 3D render
```

## meter-linear.jpg — линейная шкала

```
A single long horizontal riveted metal instrument panel in the same art style as the reference image: cartoon illustration, thick uneven dark-brown outlines, muted dusty colours, flat cel shading with soft texture, slightly worn comic look. Worn dark steel plate with brass corner bolts, a recessed long horizontal scale divided into three coloured zones from left to right: long muted red zone, short mustard yellow zone, short muted green zone. Small empty dark rectangular window at the right end. No pointer, no numbers. Front view, full view, very wide aspect, centered, isolated on a flat solid pure magenta background #FF00FF, no shadow, no frame. Avoid: text, letters, digits, pointer, watermark, background scenery, multiple objects, cropped, blurry, photo, 3D render
```

## meter-thermo.jpg — термометр на стену ангара

```
A single vintage wall-mounted brass thermometer gauge in the same art style as the reference image: cartoon illustration, thick uneven dark-brown outlines, muted dusty colours, flat cel shading with soft texture, slightly worn comic look. Tall narrow riveted metal backplate, an empty glass tube with a round empty glass bulb at the bottom, small unlabeled tick marks. No liquid inside the tube, no numbers. Front view, full view, centered, isolated on a flat solid pure magenta background #FF00FF, no shadow, no frame. Avoid: text, letters, digits, liquid, watermark, background scenery, multiple objects, cropped, blurry, photo, 3D render
```

---

# Новый вид окна Баллометра (2026-11-06)

Окно уже нарисовано кодом (components/ballometer.tsx). Эти картинки заменят рисунок кода, цифры, стрелку, флажки с текстом и дорогу всё равно кладём кодом. Модель **FLUX.1 Kontext**, Add Image — `docs/hangar/bg-empty.jpg`, сила средняя. Имя файла — из заголовка, папка `docs/hangar/leonardo/`.

## meter-military.jpg — корпус прибора (пустой циферблат, зоны рисуем кодом)

```
A single round military field instrument gauge in the same art style as the reference image: cartoon illustration, thick uneven dark-brown outlines, muted dusty colours, flat cel shading with soft texture, slightly worn comic look. Heavy riveted brass bezel with scratches and eight large rivets, a small faded red star stamped on the top of the bezel, completely empty dark olive-green dial face with a worn matte surface, a soft glass reflection on the upper left. No scale, no arc, no ticks, no needle, no numbers. Front view, full view, centered, perfectly round, isolated on a flat solid pure magenta background #FF00FF, no shadow on the ground, no frame. Avoid: text, letters, digits, needle, scale, colored zones, watermark, signature, background scenery, multiple objects, cropped, blurry, photo, 3D render
```

## map-strip.jpg — полоска штабной карты

```
A single long horizontal strip of an old military field map in the same art style as the reference image: cartoon illustration, thick uneven dark-brown outlines, muted dusty colours, flat cel shading with soft texture, slightly worn comic look. Aged parchment paper with folded creases, faint square grid, faint brown topographic contour lines, small hills and tiny forest symbols in the corners, slightly torn edges, the middle band left clean and empty. No roads, no arrows, no flags, no markers. Top-down flat view, very wide aspect, full view, centered, isolated on a flat solid pure magenta background #FF00FF, no shadow, no frame. Avoid: text, letters, digits, numbers, compass labels, roads, arrows, watermark, signature, background scenery, cropped, blurry, photo, 3D render
```

## flag-plan.jpg — флажок плана (ярко-зелёный)

```
A single small military map marker flag in the same art style as the reference image: cartoon illustration, thick uneven dark-brown outlines, muted dusty colours, flat cel shading, slightly worn comic look. Thin wooden pole with a sharp metal pin at the bottom, a wide horizontal swallow-tail banner in saturated army green attached to the top of the pole and pointing right, a small white star at the very start of the banner next to the pole, the rest of the banner completely empty. Front view, full view, centered, isolated on a flat solid pure magenta background #FF00FF, no shadow, no frame. Avoid: text, letters, digits, watermark, signature, background scenery, multiple objects, cropped, blurry, photo, 3D render
```

## flag-forecast.jpg — флажок прогноза (бледный)

```
A single small military map marker flag in the same art style as the reference image: cartoon illustration, thick uneven dark-brown outlines, muted dusty colours, flat cel shading, slightly worn comic look. Thin wooden pole with a sharp metal pin at the bottom, a wide horizontal swallow-tail banner of faded pale pink worn cloth attached to the top of the pole and pointing right, the banner completely empty and slightly frayed. Front view, full view, centered, isolated on a flat solid pure magenta background #FF00FF, no shadow, no frame. Avoid: text, letters, digits, stars, watermark, signature, background scenery, multiple objects, cropped, blurry, photo, 3D render
```
